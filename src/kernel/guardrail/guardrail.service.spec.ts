import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GuardrailService } from './guardrail.service';
import { RoutingService } from '../routing/routing.service';
import { AuditService } from '../audit/audit.service';
import { ThreadService } from '../thread/thread.service';

describe('GuardrailService', () => {
    let service: GuardrailService;
    let threadService: any;
    let configService: any;
    let routingService: any;
    let auditService: any;
    let supabase: any;

    beforeEach(async () => {
        threadService = {
            getThread: jest.fn().mockResolvedValue({ id: 'thread-1', domain: 'healthcare' }),
        };
        configService = {
            get: jest.fn().mockReturnValue({
                guardrailPolicy: {
                    blockedKeywords: ['scam', 'ssh'],
                    escalateOnKeyword: true,
                },
            }),
        };
        routingService = {
            routeToHuman: jest.fn().mockResolvedValue(undefined),
        };
        auditService = {
            append: jest.fn().mockResolvedValue(undefined),
        };
        supabase = {
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GuardrailService,
                { provide: ThreadService, useValue: threadService },
                { provide: ConfigService, useValue: configService },
                { provide: RoutingService, useValue: routingService },
                { provide: AuditService, useValue: auditService },
                { provide: 'SUPABASE_CLIENT', useValue: supabase },
            ],
        }).compile();

        service = module.get<GuardrailService>(GuardrailService);
    });

    it('should identify safe content', async () => {
        const result = await service.evaluate('thread-1', 'Hello world');
        expect(result.status).toBe('safe');
        expect(supabase.insert).not.toHaveBeenCalled();
    });

    it('should escalate on blocked keywords', async () => {
        const result = await service.evaluate('thread-1', 'This is a scam');
        expect(result.status).toBe('escalate');
        expect(result.triggeredRule).toBe('scam');
        expect(supabase.from).toHaveBeenCalledWith('guardrail_evaluations');
        expect(supabase.insert).toHaveBeenCalled();
        expect(routingService.routeToHuman).toHaveBeenCalled();
        expect(auditService.append).toHaveBeenCalled();
    });
});
