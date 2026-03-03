import { Test, TestingModule } from '@nestjs/testing';
import { ThreadService } from './thread.service';
import { ThreadRepository } from '../../infrastructure/repositories/thread.repository';
import { MessageRepository } from '../../infrastructure/repositories/message.repository';
import { AuditService } from '../audit/audit.service';
import { MetricsService } from '../metrics/metrics.service';
import { ThreadStatus } from '../../types';

describe('ThreadService', () => {
    let service: ThreadService;
    let threadRepo: any;
    let messageRepo: any;
    let auditService: any;
    let metricsService: any;

    beforeEach(async () => {
        threadRepo = {
            create: jest.fn().mockResolvedValue({ id: 'thread-1', status: ThreadStatus.OPEN, version: 1 }),
            findById: jest.fn().mockResolvedValue({ id: 'thread-1', status: ThreadStatus.OPEN, version: 1 }),
            updateAtomic: jest.fn().mockResolvedValue({ id: 'thread-1', status: ThreadStatus.RED }),
            appendMessage: jest.fn().mockResolvedValue(undefined),
        };
        messageRepo = {
            create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
        };
        auditService = {
            append: jest.fn().mockResolvedValue(undefined),
        };
        metricsService = {
            incrementConcurrencyConflictCount: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ThreadService,
                { provide: ThreadRepository, useValue: threadRepo },
                { provide: MessageRepository, useValue: messageRepo },
                { provide: AuditService, useValue: auditService },
                { provide: MetricsService, useValue: metricsService },
            ],
        }).compile();

        service = module.get<ThreadService>(ThreadService);
    });

    it('should initialize a thread', async () => {
        const dto = { domain: 'healthcare', user_id: 'user-1', channel: 'WHATSAPP' as any };
        const result = await service.initializeThread(dto);

        expect(result.id).toBe('thread-1');
        expect(threadRepo.create).toHaveBeenCalled();
        expect(auditService.append).toHaveBeenCalled();
    });

    it('should append a message', async () => {
        const dto = {
            sender_id: 'user-1',
            sender_type: 'USER' as any,
            content: 'Hello'
        };
        const result = await service.appendMessage('thread-1', dto);

        expect(result.id).toBe('msg-1');
        expect(messageRepo.create).toHaveBeenCalled();
        expect(auditService.append).toHaveBeenCalled();
    });

    it('should update status with version check', async () => {
        await service.updateThreadStatusWithVersionCheck('thread-1', ThreadStatus.RED, 1);
        expect(threadRepo.updateAtomic).toHaveBeenCalledWith('thread-1', 1, { status: ThreadStatus.RED });
        expect(auditService.append).toHaveBeenCalled();
    });
});
