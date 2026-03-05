import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuScopePolicy } from './JanmasethuScopePolicy';
import { JanmasethuSlaWorker } from './janmasethu.sla';
import { JanmasethuUserContext, JanmasethuRole, JanmasethuUserRole } from './janmasethu.types';
import { OwnershipType } from '../../types';

@Injectable()
export class JanmasethuAssignmentService {
    private readonly logger = new Logger(JanmasethuAssignmentService.name);

    constructor(
        private readonly repository: JanmasethuRepository,
        private readonly policy: JanmasethuScopePolicy,
        private readonly slaWorker: JanmasethuSlaWorker,
    ) { }

    /**
     * CRO ASSIGNMENT LOGIC
     * - Only CRO allowed
     * - Status-Role check (RED->DOC, YELLOW->NURSE)
     * - Suppress AI
     * - SLA for RED + Doctor ID
     */
    async assignThread(
        threadId: string,
        targetUserId: string | null,
        targetRole: JanmasethuRole,
        performedBy: JanmasethuUserContext
    ) {
        // 1. Authorization
        if (performedBy.role !== JanmasethuUserRole.CRO) {
            throw new ForbiddenException('Only CROs can assign threads');
        }

        const thread = await this.repository.findThreadById(threadId);
        if (!thread) throw new Error('Thread not found');

        const threadStatus = thread.status as string;

        // 2. Policy-driven Validation
        if (!this.policy.validateAssignment(targetRole, threadStatus)) {
            this.logger.warn(`Invalid assignment attempt: ${targetRole} to ${threadStatus} thread.`);
            throw new ForbiddenException(`Assignment invalid: ${targetRole} cannot be assigned to a ${threadStatus} thread.`);
        }

        // 3. Idempotency Check
        if (thread.assigned_user_id === targetUserId && thread.assigned_role === targetRole) {
            this.logger.log(`Thread ${threadId} already assigned. No changes needed.`);
            return;
        }

        // 4. Reset previous state if reassigned
        await this.slaWorker.cancelSla(threadId);

        // 5. Update Thread (Separated from Takeover)
        await this.repository.updateThreadAtomic(threadId, thread.version, {
            assigned_user_id: targetUserId || undefined,
            assigned_role: targetRole,
            // Per Requirement: "Assignment: ownership remains AI, is_locked remains false"
            ownership: OwnershipType.AI,
            is_locked: false,
        });

        // 6. Start SLA ONLY when RED thread assigned to specific doctor
        const updatedThread = await this.repository.findThreadById(threadId);
        if (updatedThread && this.policy.shouldStartSLA(updatedThread)) {
            await this.slaWorker.scheduleSla(threadId);
        }

        // 7. Audit & Logs
        await this.repository.insertAuditLog({
            thread_id: threadId,
            actor_id: performedBy.id,
            actor_type: 'HUMAN',
            action: 'THREAD_ASSIGNED',
            payload: { targetUserId, targetRole, status: threadStatus },
        });

        await this.repository.insertRoutingEvent({
            thread_id: threadId,
            actor_id: performedBy.id,
            target_role: targetRole,
            reason: 'CRO_ASSIGNMENT',
        });

        this.logger.log(`Thread ${threadId} assigned to ${targetUserId} by ${performedBy.id}`);
    }
}
