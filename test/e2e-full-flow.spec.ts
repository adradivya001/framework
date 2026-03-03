import * as request from 'supertest';
const superRequest = (request as any).default || request;
import { IntegrationTestSetup } from './integration-test.setup';
import { INestApplication } from '@nestjs/common';
import { SupabasePgAdapter } from './helpers/supabase-pg.adapter';
import { v4 as uuidv4 } from 'uuid';

/**
 * Phase 4: Full End-to-End Flow
 *
 * Single test covers the complete operational path:
 *   Message Post → Guardrail Check → Sentiment Analysis → Human Escalation
 *
 * Runs on the HTTP transport layer (Port 3000 equivalent).
 * Retires test-query.js simulation.
 *
 * Test Map:
 *  ① Health check alive
 *  ② Thread init (AI, GREEN)
 *  ③ Safe message (GREEN holds)
 *  ④ Flagged message → Guardrail → RED + HUMAN
 *  ⑤ AI attempt → 403 suppressed
 *  ⑥ Human agent responds → 201
 *  ⑦ Human returns thread to AI
 *  ⑧ AI resumes messaging → 201
 *  ⑨ Full audit verified in DB
 *  ⑩ Message count verified in DB
 */
describe('E2E Full Flow — Message → Guardrail → Escalation → Release', () => {
    let setup: IntegrationTestSetup;
    let app: INestApplication;
    let adapter: SupabasePgAdapter;

    let threadId: string;
    const USER_ID = uuidv4();

    beforeAll(async () => {
        setup = new IntegrationTestSetup();
        const started = await setup.start();
        app = started.app;
        adapter = started.adapter;
    }, 120_000);

    afterAll(async () => {
        await setup.stop();
    });

    it('① Health — HTTP transport is alive on /health', async () => {
        const res = await superRequest(app.getHttpServer())
            .get('/health')
            .expect(200);

        expect(res.body.status).toBe('ok');
    });

    it('② Thread Born — POST /thread/init returns AI ownership + GREEN status', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/init')
            .send({ domain: 'healthcare', user_id: USER_ID, channel: 'web' })
            .expect(201);

        threadId = res.body.id;
        expect(threadId).toBeDefined();
        expect(res.body.ownership).toBe('AI');
        expect(res.body.status).toBe('green');
    });

    it('③ Safe Message — GREEN path holds, no escalation', async () => {
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: USER_ID,
                sender_type: 'USER',
                content: 'Hello, I need help with my subscription.',
            })
            .expect(201);

        const res = await superRequest(app.getHttpServer())
            .get(`/thread/${threadId}`)
            .expect(200);

        expect(res.body.status).toBe('green');
        expect(res.body.ownership).toBe('AI');
    });

    it('④ Flagged Message — Guardrail fires, escalates to RED + HUMAN', async () => {
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: USER_ID,
                sender_type: 'USER',
                content: 'This is a scam. I will use the exec command to break in.',
            })
            .expect(201);

        const res = await superRequest(app.getHttpServer())
            .get(`/thread/${threadId}`)
            .expect(200);

        // Guardrail detected "scam" or "exec" (both in default blocked list)
        expect(res.body.status).toBe('red');
        expect(res.body.ownership).toBe('HUMAN');
    });

    it('⑤ AI Suppression — POST /thread/event/message with AI sender returns 403', async () => {
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: 'ai-assistant',
                sender_type: 'AI',
                content: 'I can assist with that.',
            })
            .expect(403);
    });

    it('⑥ Human Response — HUMAN agent can send while owning thread', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: 'agent-042',
                sender_type: 'HUMAN',
                content: 'We have flagged your account for review. Please do not attempt any unauthorized access.',
            })
            .expect(201);

        expect(res.body.sender_type).toBe('HUMAN');
        expect(res.body.content).toContain('flagged');
    });

    it('⑦ Human → AI Transfer — ownership returns to AI', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/ownership/switch')
            .send({
                thread_id: threadId,
                ownership: 'AI',
                actor_id: 'agent-042',
            })
            .expect(201);

        expect(res.body.ownership).toBe('AI');
    });

    it('⑧ AI Resumes — AI messages pass through after re-acquisition', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: 'ai-assistant',
                sender_type: 'AI',
                content: 'The security incident has been resolved. How else can I help you today?',
            })
            .expect(201);

        expect(res.body.sender_type).toBe('AI');
    });

    it('⑨ Audit Trail — DB contains all required lifecycle events in order', async () => {
        const rows = await adapter.rawQuery(
            `SELECT action FROM audit_logs WHERE thread_id = $1 ORDER BY created_at ASC`,
            [threadId]
        );

        const actions = rows.map(r => r.action);
        console.log('[E2E Audit Trail]:', actions);

        expect(actions).toContain('THREAD_INITIALIZED');
        expect(actions).toContain('MESSAGE_APPENDED');
        expect(actions).toContain('GUARDRAIL_TRIGGERED');
        expect(actions).toContain('OWNERSHIP_SWITCHED');
        expect(actions[0]).toBe('THREAD_INITIALIZED');
    });

    it('⑩ Message Persistence — DB has 4 messages (2 user, 1 human, 1 AI after transfer)', async () => {
        // Wait for async sentiment to settle
        await new Promise(r => setTimeout(r, 300));

        const rows = await adapter.rawQuery(
            `SELECT sender_type FROM conversation_messages WHERE thread_id = $1 ORDER BY created_at ASC`,
            [threadId]
        );

        console.log('[E2E Messages]:', rows.map(r => r.sender_type));

        // safe + flagged = 2 USER messages, 1 HUMAN, 1 AI
        expect(rows.length).toBe(4);
        expect(rows.filter(r => r.sender_type === 'USER').length).toBe(2);
        expect(rows.filter(r => r.sender_type === 'HUMAN').length).toBe(1);
        expect(rows.filter(r => r.sender_type === 'AI').length).toBe(1);
    });
});
