import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Pool } from 'pg';
import { SupabasePgAdapter } from './helpers/supabase-pg.adapter';

export class IntegrationTestSetup {
    private pgContainer: StartedPostgreSqlContainer;
    private redisContainer: StartedRedisContainer;
    private pgPool: Pool;
    public adapter: SupabasePgAdapter;
    private app: INestApplication;

    async start() {
        // ----------------------------------------------------------------
        // 1. Start infrastructure containers
        // ----------------------------------------------------------------
        this.pgContainer = await new PostgreSqlContainer('postgres:15-bookworm')
            .withDatabase('control_tower_test')
            .withUsername('test')
            .withPassword('test')
            .start();

        this.redisContainer = await new RedisContainer('redis:7-bookworm').start();

        // ----------------------------------------------------------------
        // 2. Set env vars (picked up by ConfigModule in AppModule)
        // ----------------------------------------------------------------
        process.env.REDIS_HOST = this.redisContainer.getHost();
        process.env.REDIS_PORT = this.redisContainer.getMappedPort(6379).toString();
        process.env.NODE_ENV = 'test';
        // These keep DatabaseModule happy (won't be used; we override SUPABASE_CLIENT below)
        process.env.SUPABASE_URL = 'https://dummy.supabase.co';
        process.env.SUPABASE_KEY = 'dummy-key';

        // ----------------------------------------------------------------
        // 3. Create pg pool and apply schema via SupabasePgAdapter
        // ----------------------------------------------------------------
        this.pgPool = new Pool({ connectionString: this.pgContainer.getConnectionUri() });
        this.adapter = new SupabasePgAdapter(this.pgPool);
        await this.adapter.applySchema();

        // ----------------------------------------------------------------
        // 4. Bootstrap NestJS, overriding SUPABASE_CLIENT with real adapter
        // ----------------------------------------------------------------
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider('SUPABASE_CLIENT')
            .useValue(this.adapter)
            .compile();

        this.app = moduleFixture.createNestApplication();
        this.app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
        await this.app.init();

        return {
            app: this.app,
            adapter: this.adapter,
            pgContainer: this.pgContainer,
            redisContainer: this.redisContainer,
        };
    }

    async stop() {
        if (this.app) await this.app.close();
        if (this.pgPool) await this.pgPool.end();
        if (this.pgContainer) await this.pgContainer.stop();
        if (this.redisContainer) await this.redisContainer.stop();
    }
}
