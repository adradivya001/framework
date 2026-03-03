import * as request from 'supertest';
const superRequest = (request as any).default || request;
import { IntegrationTestSetup } from './integration-test.setup';
import { INestApplication } from '@nestjs/common';
import { SupabasePgAdapter } from './helpers/supabase-pg.adapter';
import { v4 as uuidv4 } from 'uuid';

describe('Orchestration Integration — Guardrail & Sentiment Persistence', () => {
    let setup: IntegrationTestSetup;
    let app: INestApplication;
    let adapter: SupabasePgAdapter;

    // Fixed UUID to pass @IsUUID() validation on user_id
    const TEST_USER = uuidv4();
    const SAFE_CONTENT = 'Hello, I would like to check my account balance.';
    const FLAGGED_CONTENT = 'I have a scam for you. Use ssh to access the system.';

    beforeAll(async () => {
        setup = new IntegrationTestSetup();
        const started = await setup.start();
        app = started.app;
        adapter = started.adapter;
    }, 120_000); // Allow 2 min for container startup

    afterAll(async () => {
        await setup.stop();
    });

    describe('Guardrail Engine — Keyword Detection', () => {
        it('should initialize a thread and return a valid UUID id', async () => {
            const res = await superRequest(app.getHttpServer())
                .post('/thread/init')
                .send({ domain: 'healthcare', user_id: TEST_USER, channel: 'web' })
                .expect(201);

            expect(res.body.id).toBeDefined();
            expect(res.body.ownership).toBe('AI');
            expect(res.body.status).toBe('green');
        });

        it('should detect blocked keyword, escalate ownership, and persist to guardrail_evaluations', async () => {
            // 1. Init thread
            const initRes = await superRequest(app.getHttpServer())
                .post('/thread/init')
                .send({ domain: 'healthcare', user_id: TEST_USER, channel: 'web' })
                .expect(201);

            const threadId = initRes.body.id;

            // 2. Send message with blocked keyword "scam"
            await superRequest(app.getHttpServer())
                .post('/thread/event/message')
                .send({
                    thread_id: threadId,
                    sender_id: TEST_USER,
                    sender_type: 'USER',
                    content: FLAGGED_CONTENT,
                })
                .expect(201);

            // 3. Verify thread is RED + HUMAN
            const statusRes = await superRequest(app.getHttpServer())
                .get(`/thread/${threadId}`)
                .expect(200);

            expect(statusRes.body.status).toBe('red');
            expect(statusRes.body.ownership).toBe('HUMAN');

            // 4. Verify guardrail was PERSISTED to the physical database
            const guardRails = await adapter.rawQuery(
                `SELECT * FROM guardrail_evaluations WHERE thread_id = $1`,
                [threadId]
            );
            expect(guardRails.length).toBeGreaterThanOrEqual(1);
            expect(guardRails[0].triggered_rule).toMatch(/scam|ssh/i);
            expect(guardRails[0].action).toBe('escalate');

            // 5. Verify GUARDRAIL_TRIGGERED is in audit log
            const auditRows = await adapter.rawQuery(
                `SELECT * FROM audit_logs WHERE thread_id = $1 AND action = 'GUARDRAIL_TRIGGERED'`,
                [threadId]
            );
            expect(auditRows.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Sentiment Engine — Domain Provider Persistence', () => {
        it('should store a message and trigger async sentiment evaluation', async () => {
            // 1. Init thread
            const initRes = await superRequest(app.getHttpServer())
                .post('/thread/init')
                .send({ domain: 'healthcare', user_id: TEST_USER, channel: 'web' })
                .expect(201);

            const threadId = initRes.body.id;

            // 2. Send safe (positive) message  
            await superRequest(app.getHttpServer())
                .post('/thread/event/message')
                .send({
                    thread_id: threadId,
                    sender_id: TEST_USER,
                    sender_type: 'USER',
                    content: SAFE_CONTENT,
                })
                .expect(201);

            // 3. Verify thread exists and is still green
            const statusRes = await superRequest(app.getHttpServer())
                .get(`/thread/${threadId}`)
                .expect(200);

            expect(statusRes.body.id).toBe(threadId);
            expect(statusRes.body.status).toBe('green');

            // 4. Verify message persisted to conversation_messages
            const messages = await adapter.rawQuery(
                `SELECT * FROM conversation_messages WHERE thread_id = $1`,
                [threadId]
            );
            expect(messages.length).toBe(1);
            expect(messages[0].content).toBe(SAFE_CONTENT);
            expect(messages[0].sender_type).toBe('USER');

            // 5. Wait briefly for async sentiment to settle, then check
            await new Promise(r => setTimeout(r, 500));
            const auditRows = await adapter.rawQuery(
                `SELECT * FROM audit_logs WHERE thread_id = $1 AND action = 'MESSAGE_APPENDED'`,
                [threadId]
            );
            expect(auditRows.length).toBe(1);
        });
    });
});
