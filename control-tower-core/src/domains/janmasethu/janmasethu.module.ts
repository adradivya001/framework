import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JanmasethuHandler } from './janmasethu.handler';
import { JanmasethuRepository } from './janmasethu.repository';
import { JanmasethuPolicy } from './janmasethu.policy';
import { JanmasethuScopePolicy } from './JanmasethuScopePolicy';
import { JanmasethuSlaWorker } from './janmasethu.sla';
import { JanmasethuContextService } from './janmasethu.context';
import { JanmasethuTakeoverService } from './janmasethu.takeover';
import { JanmasethuAssignmentService } from './janmasethu.assignment';
import { JanmasethuController } from './janmasethu.controller';
import { JanmasethuRiskService } from './risk-engine/janmasethu-risk.service';
import { JanmasethuChannelService } from './channel/janmasethu-channel.service';
import { JanmasethuDispatchService } from './channel/janmasethu-dispatch.service';
import { JanmasethuChannelController } from './channel/janmasethu-channel.controller';
import { ProviderRegistry } from '../../kernel/services/provider-registry.service';
import { JANMASETHU_DOMAIN } from './janmasethu.types';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'janmasethu_sla_queue',
        }),
    ],
    providers: [
        JanmasethuHandler,
        JanmasethuRepository,
        JanmasethuPolicy,
        JanmasethuScopePolicy,
        JanmasethuSlaWorker,
        JanmasethuContextService,
        JanmasethuTakeoverService,
        JanmasethuAssignmentService,
        JanmasethuRiskService,
        JanmasethuChannelService,
        JanmasethuDispatchService,
    ],
    controllers: [
        JanmasethuController,
        JanmasethuChannelController
    ],
    exports: [
        JanmasethuHandler,
        JanmasethuAssignmentService,
        JanmasethuTakeoverService,
        JanmasethuScopePolicy,
        JanmasethuContextService,
        JanmasethuChannelService,
        JanmasethuDispatchService,
    ],
})
export class JanmasethuModule implements OnModuleInit {
    private readonly logger = new Logger(JanmasethuModule.name);

    constructor(
        private readonly providerRegistry: ProviderRegistry,
        private readonly riskService: JanmasethuRiskService,
        private readonly escalationPolicy: JanmasethuPolicy,
    ) { }

    onModuleInit() {
        this.logger.log(`Initializing Janmasethu Domain Module (Centralized Policy Refactor)...`);

        this.providerRegistry.register(JANMASETHU_DOMAIN, {
            sentimentProvider: this.riskService,
            escalationPolicy: this.escalationPolicy,
            domainNotifier: {
                notifyOwnershipSwitch: async (thread, actorId) => {
                    this.logger.log(`Janmasethu: Ownership switch notified for thread ${thread.id}`);
                },
                notifyStatusChange: async (thread, previousStatus) => {
                    this.logger.log(`Janmasethu: Status change notified for thread ${thread.id}: ${previousStatus} -> ${thread.status}`);
                }
            }
        });

        this.logger.log(`Janmasethu Domain registered successfully.`);
    }
}
