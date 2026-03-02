import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ThreadService } from '../kernel/thread/thread.service';
import { OwnershipType } from '../types';

@Injectable()
export class AISuppressionGuard implements CanActivate {
    constructor(private readonly threadService: ThreadService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const threadId = request.body.thread_id || request.params.id;

        if (!threadId) return true; // Let validation handle missing ID

        const thread = await this.threadService.getThread(threadId);

        // AI Suppression Rule: If ownership != 'AI' OR is_locked == true: abort processing.
        if (thread.ownership !== OwnershipType.AI || thread.is_locked) {
            throw new ForbiddenException('AI processing suppressed: Thread is locked or owned by HUMAN');
        }

        return true;
    }
}
