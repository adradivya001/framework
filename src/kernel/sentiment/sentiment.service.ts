import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SentimentEvaluation, ThreadStatus } from '../../types';
import { SentimentRepository } from '../../infrastructure/repositories/sentiment.repository';
import { ThreadService } from '../thread/thread.service';
import { RoutingService } from '../routing/routing.service';
import { ProviderRegistry } from '../services/provider-registry.service';

@Injectable()
export class SentimentService {
    private readonly logger = new Logger(SentimentService.name);

    constructor(
        private readonly threadService: ThreadService,
        private readonly routingService: RoutingService,
        private readonly sentimentRepository: SentimentRepository,
        private readonly providerRegistry: ProviderRegistry,
    ) { }

    async evaluateThreadSentiment(threadId: string, messageId: string, content: string, domain: string): Promise<void> {
        const plugins = this.providerRegistry.getPlugins(domain);
        if (!plugins) {
            this.logger.error(`SentimentEngine: No plugins for domain [${domain}]`);
            return;
        }

        const evaluation = await plugins.sentimentProvider.evaluate(content);

        // Store evaluation
        await this.sentimentRepository.create({
            thread_id: threadId,
            message_id: messageId,
            score: evaluation.score,
            label: evaluation.label,
            provider: `DOMAIN_SPECIFIC_${domain.toUpperCase()}`,
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
                provider: `DOMAIN_SPECIFIC_${domain.toUpperCase()}`,
                created_at: new Date(),
            };

            const shouldEscalate = await plugins.escalationPolicy.shouldEscalate(thread, sentimentEval);
            if (shouldEscalate) {
                await this.routingService.routeToHuman(threadId, 'SENTIMENT_ENGINE');
            }
        }
    }
}
