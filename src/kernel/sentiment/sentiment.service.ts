import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import type { SentimentProvider, EscalationPolicy } from '../../contracts';
import { ThreadStatus, SentimentEvaluation } from '../../types';
import { SentimentRepository } from '../../infrastructure/repositories/sentiment.repository';
import { ThreadService } from '../thread/thread.service';
import { RoutingService } from '../routing/routing.service';


@Injectable()
export class SentimentService {
    constructor(
        @Inject('SENTIMENT_PROVIDER') private readonly sentimentProvider: SentimentProvider,
        @Inject('ESCALATION_POLICY') private readonly escalationPolicy: EscalationPolicy,
        private readonly threadService: ThreadService,
        private readonly routingService: RoutingService,
        private readonly sentimentRepository: SentimentRepository,
    ) { }

    async evaluateThreadSentiment(threadId: string, messageId: string, content: string): Promise<void> {
        const evaluation = await this.sentimentProvider.evaluate(content);

        // Store evaluation
        await this.sentimentRepository.create({
            thread_id: threadId,
            message_id: messageId,
            score: evaluation.score,
            label: evaluation.label,
            provider: 'CONTRACT_IMPLEMENTATION',
        });

        const thread = await this.threadService.getThread(threadId);

        // If red, trigger status update and potentially routing
        if (evaluation.label === 'red') {
            await this.threadService.updateThreadStatusWithVersionCheck(threadId, ThreadStatus.RED, thread.version);

            const sentimentEval: SentimentEvaluation = {
                ...evaluation,
                thread_id: threadId,
                message_id: messageId,
                id: '',
                provider: 'CONTRACT_IMPLEMENTATION',
                created_at: new Date(),
            };

            const shouldEscalate = await this.escalationPolicy.shouldEscalate(thread, sentimentEval);
            if (shouldEscalate) {
                await this.routingService.routeToHuman(threadId, 'SENTIMENT_ENGINE');
            }
        }

    }

}
