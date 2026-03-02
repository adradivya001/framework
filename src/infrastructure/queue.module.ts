import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('app.redis.host'),
                    port: configService.get<number>('app.redis.port'),
                },
            }),
        }),
        BullModule.registerQueue({
            name: 'routing_queue',
        }),
    ],
    exports: [BullModule],
})
export class QueueModule { }
