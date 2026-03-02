import { Module, DynamicModule, Global, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ThreadService } from './thread/thread.service';
import { OwnershipService } from './ownership/ownership.service';
import { RoutingService } from './routing/routing.service';
import { SentimentService } from './sentiment/sentiment.service';
import { AuditModule } from './audit/audit.module';
import { RoutingWorker } from './routing/routing.worker';
import { GuardrailModule } from './guardrail/guardrail.module';
import { MetricsModule } from './metrics/metrics.module';
import { ThreadRepository } from '../infrastructure/repositories/thread.repository';
import { MessageRepository } from '../infrastructure/repositories/message.repository';
import { SentimentRepository } from '../infrastructure/repositories/sentiment.repository';
import { RoutingRepository } from '../infrastructure/repositories/routing.repository';
import { DeadLetterRepository } from '../infrastructure/repositories/dead-letter.repository';
import { RateLimiterService } from './rate-limiter.service';
import type { SentimentProvider, EscalationPolicy, DomainNotifier } from '../contracts';

export interface ControlTowerOptions {
    sentimentProvider: SentimentProvider;
    escalationPolicy: EscalationPolicy;
    domainNotifier: DomainNotifier;
}

@Global()
@Module({
    imports: [
        ConfigModule,
        AuditModule,
        GuardrailModule,
        MetricsModule
    ],
    providers: [
        ThreadService,
        OwnershipService,
        RoutingService,
        SentimentService,
        RoutingWorker,
        ThreadRepository,
        MessageRepository,
        SentimentRepository,
        RoutingRepository,
        DeadLetterRepository,
        RateLimiterService,
    ],
    exports: [
        ThreadService,
        OwnershipService,
        RoutingService,
        SentimentService,
        GuardrailModule,
        MetricsModule,
        RateLimiterService,
    ],
})
export class KernelModule implements OnModuleInit {
    private readonly logger = new Logger(KernelModule.name);

    constructor(
        @Inject('SENTIMENT_PROVIDER') private readonly sentimentProvider: SentimentProvider,
        @Inject('ESCALATION_POLICY') private readonly escalationPolicy: EscalationPolicy,
        @Inject('DOMAIN_NOTIFIER') private readonly domainNotifier: DomainNotifier,
        private readonly configService: ConfigService,
    ) { }

    onModuleInit() {
        this.logger.log('Kernel Bootstrap: Validating Governance...');

        if (!this.sentimentProvider || !this.escalationPolicy || !this.domainNotifier) {
            throw new Error('Kernel Bootstrap Failure: Required contracts are missing.');
        }

        // 2. Validate Config
        const domains = this.configService.get('app.domains');
        if (!domains || !domains.default) {
            throw new Error('Kernel Bootstrap Failure: Default domain configuration is missing.');
        }

        this.logger.log('Kernel Bootstrap: Governance Validated.');
    }

    static register(options: ControlTowerOptions): DynamicModule {
        return {
            module: KernelModule,
            providers: [
                { provide: 'SENTIMENT_PROVIDER', useValue: options.sentimentProvider },
                { provide: 'ESCALATION_POLICY', useValue: options.escalationPolicy },
                { provide: 'DOMAIN_NOTIFIER', useValue: options.domainNotifier },
            ],
            exports: [
                'SENTIMENT_PROVIDER',
                'ESCALATION_POLICY',
                'DOMAIN_NOTIFIER',
            ],
        };
    }
}
