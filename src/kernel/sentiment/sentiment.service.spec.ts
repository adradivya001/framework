import { Test, TestingModule } from '@nestjs/testing';
import { SentimentService } from './sentiment.service';
import { ThreadService } from '../thread/thread.service';
import { RoutingService } from '../routing/routing.service';
import { SentimentRepository } from '../../infrastructure/repositories/sentiment.repository';
import { ProviderRegistry } from '../services/provider-registry.service';
import { ThreadStatus } from '../../types';

describe('SentimentService', () => {
    let service: SentimentService;
    let threadService: any;
    let routingService: any;
    let sentimentRepository: any;
    let providerRegistry: any;

    beforeEach(async () => {
        threadService = {
            getThread: jest.fn().mockResolvedValue({ id: 'thread-1', version: 1 }),
            updateThreadStatusWithVersionCheck: jest.fn().mockResolvedValue(undefined),
        };
        routingService = {
            routeToHuman: jest.fn().mockResolvedValue(undefined),
        };
        sentimentRepository = {
            create: jest.fn().mockResolvedValue({ id: 'sent-1' }),
        };
        providerRegistry = {
            getPlugins: jest.fn().mockReturnValue({
                sentimentProvider: {
                    evaluate: jest.fn().mockResolvedValue({ score: 0.1, label: 'red' }),
                },
                escalationPolicy: {
                    shouldEscalate: jest.fn().mockResolvedValue(true),
                },
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SentimentService,
                { provide: ThreadService, useValue: threadService },
                { provide: RoutingService, useValue: routingService },
                { provide: SentimentRepository, useValue: sentimentRepository },
                { provide: ProviderRegistry, useValue: providerRegistry },
            ],
        }).compile();

        service = module.get<SentimentService>(SentimentService);
    });

    it('should process sentiment and trigger escalation on red label', async () => {
        await service.evaluateThreadSentiment('thread-1', 'msg-1', 'Negative content', 'healthcare');

        expect(sentimentRepository.create).toHaveBeenCalled();
        expect(threadService.updateThreadStatusWithVersionCheck).toHaveBeenCalledWith('thread-1', ThreadStatus.RED, 1);
        expect(routingService.routeToHuman).toHaveBeenCalledWith('thread-1', 'SENTIMENT_ENGINE');
    });

    it('should not escalate on green label', async () => {
        providerRegistry.getPlugins.mockReturnValue({
            sentimentProvider: {
                evaluate: jest.fn().mockResolvedValue({ score: 0.9, label: 'green' }),
            },
            escalationPolicy: {
                shouldEscalate: jest.fn().mockResolvedValue(false),
            },
        });

        await service.evaluateThreadSentiment('thread-1', 'msg-1', 'Positive content', 'healthcare');

        expect(sentimentRepository.create).toHaveBeenCalled();
        expect(threadService.updateThreadStatusWithVersionCheck).not.toHaveBeenCalled();
        expect(routingService.routeToHuman).not.toHaveBeenCalled();
    });
});
