import * as request from 'supertest';
const superRequest = (request as any).default || request;
import { IntegrationTestSetup } from './integration-test.setup';
import { INestApplication } from '@nestjs/common';
import { SupabasePgAdapter } from './helpers/supabase-pg.adapter';
import { v4 as uuidv4 } from 'uuid';

describe('Concurrency Collision Verification', () => {
    let setup: IntegrationTestSetup;
    let app: INestApplication;
    let adapter: SupabasePgAdapter;

    const TEST_USER = uuidv4();

    beforeAll(async () => {
        setup = new IntegrationTestSetup();
        const started = await setup.start();
        app = started.app;
        adapter = started.adapter;
    }, 120_000);

    afterAll(async () => {
        await setup.stop();
    });

    it('should prevent data loss — only 1 of N simultaneous ownership switches succeeds (ConcurrencyException)', async () => {
        // 1. Create a fresh thread (version = 1, ownership = AI)
        const initRes = await superRequest(app.getHttpServer())
            .post('/thread/init')
            .send({ domain: 'healthcare', user_id: TEST_USER, channel: 'web' })
            .expect(201);

        const threadId = initRes.body.id;

        // 2. Fire 5 simultaneous ownership switches — all reading version=1
        // Only the first DB commit should succeed; the rest see a stale version and get 409
        const N = 5;
        const updates = Array.from({ length: N }).map(() =>
            superRequest(app.getHttpServer())
                .post('/thread/ownership/switch')
                .send({
                    thread_id: threadId,
                    ownership: 'HUMAN',
                    actor_id: 'agent-' + Math.random().toString(36).slice(2),
                })
        );

        const results = await Promise.allSettled(updates);

        const successes = results.filter(
            r => r.status === 'fulfilled' && (r as any).value.status === 201
        ).length;
        const conflicts = results.filter(
            r => r.status === 'fulfilled' && (r as any).value.status === 409
        ).length;

        console.log(`[Concurrency] Successes: ${successes}, Conflicts (409): ${conflicts}, Total: ${N}`);

        // At least 1 must succeed
        expect(successes).toBeGreaterThanOrEqual(1);
        // All N requests must be accounted for
        expect(successes + conflicts).toBe(N);

        // 3. Assert the DB thread version is exactly 2 (initial 1 + 1 successful increment)
        const rows = await adapter.rawQuery(
            `SELECT version, ownership FROM conversation_threads WHERE id = $1`,
            [threadId]
        );
        expect(rows[0].version).toBe(2);
        expect(rows[0].ownership).toBe('HUMAN');

        // 4. Assert OWNERSHIP_SWITCHED appears exactly once in the audit log
        const auditRows = await adapter.rawQuery(
            `SELECT * FROM audit_logs WHERE thread_id = $1 AND action = 'OWNERSHIP_SWITCHED'`,
            [threadId]
        );
        expect(auditRows.length).toBe(1);
    });

    it('should handle 10-goroutine ownership storm — exactly 1 success, version = 2', async () => {
        // 1. Create a fresh thread
        const initRes = await superRequest(app.getHttpServer())
            .post('/thread/init')
            .send({ domain: 'healthcare', user_id: uuidv4(), channel: 'web' })
            .expect(201);

        const threadId = initRes.body.id;

        // 2. Fire 10 parallel requests
        const N = 10;
        const responses = await Promise.allSettled(
            Array.from({ length: N }).map(() =>
                superRequest(app.getHttpServer())
                    .post('/thread/ownership/switch')
                    .send({
                        thread_id: threadId,
                        ownership: 'HUMAN',
                        actor_id: 'storm-agent-' + Math.random().toString(36).slice(2),
                    })
            )
        );

        const s = responses.filter(r => r.status === 'fulfilled' && (r as any).value.status === 201).length;
        const c = responses.filter(r => r.status === 'fulfilled' && (r as any).value.status === 409).length;

        console.log(`[Stress] Successes: ${s}, Conflicts: ${c}`);

        expect(s).toBe(1);
        expect(s + c).toBe(N);

        const dbRows = await adapter.rawQuery(
            `SELECT version FROM conversation_threads WHERE id = $1`,
            [threadId]
        );
        expect(dbRows[0].version).toBe(2);
    });
});
