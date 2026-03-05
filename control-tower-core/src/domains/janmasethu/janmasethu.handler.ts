import { Injectable, Logger } from '@nestjs/common';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuScopePolicy } from './JanmasethuScopePolicy';
import { JanmasethuSlaWorker } from './janmasethu.sla';
import { SentimentService } from '../../kernel/sentiment/sentiment.service';
import { RoutingService } from '../../kernel/routing/routing.service';
import { JANMASETHU_DOMAIN } from './janmasethu.types';
import { ThreadStatus, OwnershipType } from '../../types';

@Injectable()
export class JanmasethuHandler {
    private readonly logger = new Logger(JanmasethuHandler.name);

    constructor(
        private readonly repository: JanmasethuRepository,
        private readonly policy: JanmasethuScopePolicy,
        private readonly slaWorker: JanmasethuSlaWorker,
        private readonly sentimentService: SentimentService,
        private readonly routingService: RoutingService,
    ) { }

    /**
     * MAIN EVENT HANDLER
     * - Handle Message Ingestion
     * - Trigger Sentiment
     * - Orchestrate State Transitions
     */
    async handleMessageCreated(event: any) {
        const { thread_id, message_id, user_id, message, domain } = event;

        if (domain !== JANMASETHU_DOMAIN) return;

        // 1. Idempotency Check
        const existingMsg = await this.repository.findMessageById(message_id);
        if (existingMsg) {
            this.logger.log(`Message ${message_id} already processed. Skipping.`);
            return;
        }

        // 2. Fetch Thread & Track Previous State
        let thread = await this.repository.findThreadById(thread_id);
        const previousStatus = thread?.status || 'green';

        if (!thread) {
            this.logger.log(`Creating new GREEN thread for Janmasethu: ${thread_id}`);
            thread = await this.repository.createThread({
                id: thread_id,
                user_id,
                status: ThreadStatus.GREEN,
                ownership: OwnershipType.AI,
                version: 1,
            });
        }

        // 3. Append Message
        const senderType = event.sender_type || 'USER';
        const msg = await this.repository.createMessage({
            id: message_id,
            thread_id,
            sender_id: user_id,
            sender_type: senderType,
            content: message,
        });

        // SLA Cancellation on Human Reply
        if (senderType === 'HUMAN') {
            await this.slaWorker.cancelSla(thread_id);
        }

        // 4. Trigger Sentiment Evaluation (Triggers Escalation Policy in Core)
        await this.sentimentService.evaluateThreadSentiment(thread_id, msg.id, message, JANMASETHU_DOMAIN);

        // 5. Orchestrate Transitions via Policy Engine
        const updatedThread = await this.repository.findThreadById(thread_id);
        if (!updatedThread) return;

        const currentStatus = updatedThread.status as string;
        const transition = this.policy.getTransitionActions(previousStatus as string, currentStatus);

        if (transition) {
            this.logger.log(`Janmasethu: Executing transition ${previousStatus} -> ${currentStatus} for ${thread_id}`);

            // Re-fetch to handle atomic version correctly
            const activeThread = await this.repository.findThreadById(thread_id);
            if (!activeThread) return;

            await this.repository.updateThreadAtomic(thread_id, activeThread.version, {
                assigned_user_id: transition.clearAssignment ? undefined : activeThread.assigned_user_id,
                assigned_role: transition.targetRole || activeThread.assigned_role,
                ownership: transition.unlockThread ? OwnershipType.AI : activeThread.ownership,
                is_locked: transition.unlockThread ? false : activeThread.is_locked,
            });

            if (transition.cancelSla) {
                await this.slaWorker.cancelSla(thread_id);
            }

            if (transition.notifyCRO) {
                // Determine target roles for notifications
                const targetRole = currentStatus === 'red' ? 'DOCTOR' : 'NURSE';

                await this.repository.insertRoutingEvent({
                    thread_id,
                    actor_id: 'SYSTEM',
                    target_role: 'CRO', // Always notify CRO
                    reason: `SEVERITY_${currentStatus.toUpperCase()}_ALERT`,
                });

                await this.repository.insertRoutingEvent({
                    thread_id,
                    actor_id: 'SYSTEM',
                    target_role: targetRole,
                    reason: `NEW_${currentStatus.toUpperCase()}_ASSIGNMENT_AVAILBLE`,
                });
            }

            if (transition.clearAlerts) {
                await this.repository.insertRoutingEvent({
                    thread_id,
                    actor_id: 'SYSTEM',
                    action: 'CLEAR_ALERTS',
                    reason: 'THREAD_RESOLVED_TO_GREEN',
                });
            }

            await this.repository.insertAuditLog({
                thread_id,
                actor_id: 'SYSTEM',
                actor_type: 'SYSTEM',
                action: 'STATE_TRANSITION',
                payload: { from: previousStatus, to: currentStatus, actions: transition },
            });
        }

        // 6. SLA Linkage (Only if status is RED and a Doctor is already assigned - usually via AssignmentService)
        // Note: Transitions don't auto-assign doctors, so SLA won't start in transitions per requirement.
    }
}
