import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { OwnershipType } from '../../types';
import { OwnershipService } from '../ownership/ownership.service';
import type { EscalationPolicy } from '../../contracts';
import { RoutingRepository, RoutingStatus } from '../../infrastructure/repositories/routing.repository';
import { MetricsService } from '../metrics/metrics.service';


@Injectable()
export class RoutingService implements OnModuleInit {
    private readonly logger = new Logger(RoutingService.name);

    constructor(
        @InjectQueue('routing_queue') private readonly routingQueue: Queue,
        private readonly ownershipService: OwnershipService,
        @Inject('ESCALATION_POLICY') private readonly escalationPolicy: EscalationPolicy,
        private readonly routingRepository: RoutingRepository,
        private readonly metricsService: MetricsService,
        private readonly configService: ConfigService,
    ) { }

    async onModuleInit() {
        const staleTimeout = this.configService.get<number>('hardening.routingStaleTimeout') || 600000;
        this.logger.log(`Starting stale routing recovery scan (timeout: ${staleTimeout}ms)...`);

        const staleJobs = await this.routingRepository.findStaleAssigned(staleTimeout);
        for (const job of staleJobs) {
            this.logger.warn(`Recovering stale routing job ${job.id} for thread ${job.thread_id}`);
            await this.enqueueRoutingJob(job.id, job.thread_id, job.required_role);
        }
    }

    async routeToHuman(threadId: string, actorId: string): Promise<void> {
        const requiredRole = await this.escalationPolicy.getRequiredRole({ id: threadId } as any);

        // 1. Idempotent Update/Create routing_queue
        const { entry, isNew } = await this.routingRepository.createIdempotent({
            thread_id: threadId,
            required_role: requiredRole,
        });

        if (!isNew) {
            this.logger.log(`Escalation already in progress for thread ${threadId}. Skipping duplicate enqueue.`);
            return;
        }

        // 2. Enqueue BullMQ job
        await this.enqueueRoutingJob(entry.id, threadId, requiredRole);

        this.metricsService.incrementEscalationCount(threadId);

        // 3. Switch ownership to HUMAN
        await this.ownershipService.switchOwnership(threadId, OwnershipType.HUMAN, actorId, {
            assignedRole: requiredRole,
        });
    }

    private async enqueueRoutingJob(id: string, threadId: string, requiredRole: string) {
        const retryAttempts = this.configService.get<number>('hardening.workerRetryAttempts') || 3;

        await this.routingQueue.add('process_escalation', {
            id,
            threadId,
            requiredRole,
        }, {
            attempts: retryAttempts,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
    }
}
