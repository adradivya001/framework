import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database.module';
import { QueueModule } from './infrastructure/queue.module';
import { KernelModule } from './kernel/kernel.module';
import { ThreadController } from './api/thread.controller';
import configuration from './config/configuration';

// Mock Plugin Implementations (Domain Layer)
const mockSentimentProvider = {
  evaluate: async (text: string) => ({
    score: text.includes('help') ? 0.2 : 0.8,
    label: text.includes('help') ? 'red' : 'green'
  }),
};

const mockEscalationPolicy = {
  shouldEscalate: async () => true,
  getRequiredRole: () => 'SUPPORT_AGENT',
};

const mockDomainNotifier = {
  notifyOwnershipSwitch: async (thread: any, actorId: string) => {
    console.log(`[Domain] Thread ${thread.id} ownership switched by ${actorId}`);
  },
  notifyStatusChange: async (thread: any, prev: string) => {
    console.log(`[Domain] Thread ${thread.id} status changed from ${prev} to ${thread.status}`);
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env/development.env'],
    }),
    DatabaseModule,
    QueueModule,
    KernelModule.register({
      sentimentProvider: mockSentimentProvider,
      escalationPolicy: mockEscalationPolicy,
      domainNotifier: mockDomainNotifier,
    }),
  ],
  controllers: [ThreadController],
  providers: [],
})
export class AppModule { }
