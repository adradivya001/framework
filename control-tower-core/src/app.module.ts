import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { KernelModule } from './kernel/kernel.module';
import { ThreadController } from './api/thread.controller';
import { HealthController } from './api/health.controller';
import { DatabaseModule } from './infrastructure/database.module';
import { QueueModule } from './infrastructure/queue.module';
import { JanmasethuModule } from './domains/janmasethu/janmasethu.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env/development.env'],
    }),
    TerminusModule,
    DatabaseModule,
    QueueModule,
    JanmasethuModule,
    // Register a 'test' domain to verify the framework is working
    KernelModule.register({
      sentimentProvider: {
        evaluate: async (text: string) => ({ score: 0.5, label: 'neutral' })
      },
      escalationPolicy: {
        shouldEscalate: async () => false,
        getRequiredRole: () => 'AGENT'
      },
      domainNotifier: {
        notifyOwnershipSwitch: async () => { },
        notifyStatusChange: async () => { }
      }
    }),
  ],
  controllers: [ThreadController, HealthController],
  providers: [],
})
export class AppModule { }
