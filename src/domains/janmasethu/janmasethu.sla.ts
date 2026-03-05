import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { JanmasethuRepository } from './janmasethu.repository';
import { ThreadStatus, OwnershipType } from '../../types';
import { JANMASETHU_DOMAIN } from './janmasethu.types';

@Injectable()
export class JanmasethuSlaWorker {
    private readonly logger = new Logger(JanmasethuSlaWorker.name);
    private queue: Queue;

    constructor(private readonly repository: JanmasethuRepository) {
        this.queue = new Queue('janmasethu_sla_queue', {
            connection: { host: 'localhost', port: 6379 } // In prod, use environment variables
        });

        new Worker('janmasethu_sla_queue', this.processSla.bind(this), {
            connection: { host: 'localhost', port: 6379 }
        });
    }

    /**
     * SCHEDULE SLA
     * - Triggered on Doctor Assignment to RED thread
     */
    async scheduleSla(threadId: string) {
        this.logger.log(`Scheduling 5-minute SLA for thread ${threadId}`);
        // JobId = threadId for idempotency and easy cancellation
        await this.queue.add('check_sla', { threadId }, {
            delay: 5 * 60 * 1000,
            jobId: threadId,
            removeOnComplete: true,
        });
    }

    /**
     * CANCEL SLA
     * - Triggered on Reassignment, Release control, or Resolution to GREEN
     */
    async cancelSla(threadId: string) {
        const job = await this.queue.getJob(threadId);
        if (job) {
            await job.remove();
            this.logger.log(`Cancelled existing SLA for thread ${threadId}`);
        }
    }

    /**
     * PROCESS SLA BREACH & STALE LOCK CLEANUP
     * - Hardened Behavior: Keep RED status (Silence AI), Move to DOCTOR_QUEUE
     */
    private async processSla(job: Job) {
        const { threadId } = job.data;
        const thread = await this.repository.findThreadById(threadId);

        if (!thread || thread.domain !== JANMASETHU_DOMAIN) {
            return;
        }

        // REVALIDATE STATE
        const isStillRed = thread.status === 'red';
        const isStillAssigned = !!thread.assigned_user_id;
        const isHumanLocked = thread.ownership === OwnershipType.HUMAN && thread.is_locked;

        /**
         * 1. SLA BREACH: Assigned to doctor but no reply in window.
         * 2. FORCED UNLOCK: Human in control but no reply in window (Stale lock).
         */
        if (isStillRed && (isStillAssigned || isHumanLocked)) {
            this.logger.warn(`SLA BREACH / STALE LOCK detected for RED thread ${threadId}. Processing recovery.`);

            /**
             * FINAL HARDENED ACTIONS:
             * - status remains 'red' (Ensures AI stays suppressed via Policy)
             * - assigned_user_id = null
             * - ownership = AI
             * - is_locked = false
             * - assigned_role = DOCTOR_QUEUE
             */
            await this.repository.updateThreadAtomic(threadId, thread.version, {
                assigned_user_id: undefined,
                ownership: OwnershipType.AI,
                is_locked: false,
                assigned_role: 'DOCTOR_QUEUE',
            });

            await this.repository.insertAuditLog({
                thread_id: threadId,
                actor_id: 'SLA_SYSTEM',
                actor_type: 'SYSTEM',
                action: isHumanLocked ? 'FORCED_UNLOCK' : 'SLA_BREACH',
                payload: { previousAssignee: thread.assigned_user_id, previousOwnership: thread.ownership },
            });

            await this.repository.insertRoutingEvent({
                thread_id: threadId,
                actor_id: 'SLA_SYSTEM',
                target_role: 'CRO',
                reason: isHumanLocked ? 'STALE_HUMAN_CONTROL_FAILURE' : 'SLA_RESPONSE_TIMEOUT',
            });

            this.logger.log(`Hardened Recovery handled for ${threadId}. Thread reverted to DOCTOR_QUEUE. AI remain suppressed.`);
        } else {
            this.logger.log(`SLA check: Thread ${threadId} is safe or already resolved.`);
        }
    }
}
