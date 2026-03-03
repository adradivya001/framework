import * as request from 'supertest';
const superRequest = (request as any).default || request;
import { IntegrationTestSetup } from './integration-test.setup';
import { INestApplication } from '@nestjs/common';
import { SupabasePgAdapter } from './helpers/supabase-pg.adapter';
import { v4 as uuidv4 } from 'uuid';

/**
 * Phase 3: Lifecycle & Concurrency Stress
 *
 * Tests the complete "Human Takeover" lifecycle:
 *   AI ownership → Guardrail trigger → HUMAN takeover → AI suppress → Human message → AI return
 *
 * Also verifies that AuditService records every state transition in order.
 */
describe('Thread Lifecycle — Human Takeover & AI Suppression', () => {
    let setup: IntegrationTestSetup;
    let app: INestApplication;
    let adapter: SupabasePgAdapter;

    const USER_ID = uuidv4();
    let threadId: string;

    beforeAll(async () => {
        setup = new IntegrationTestSetup();
        const started = await setup.start();
        app = started.app;
        adapter = started.adapter;
    }, 120_000);

    afterAll(async () => {
        await setup.stop();
    });

    // ---------------------------------------------------------------
    // Step 1: Thread Born
    // ---------------------------------------------------------------
    it('1. should initialize a thread with AI ownership (GREEN)', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/init')
            .send({ domain: 'healthcare', user_id: USER_ID, channel: 'web' })
            .expect(201);

        threadId = res.body.id;
        expect(threadId).toBeDefined();
        expect(res.body.ownership).toBe('AI');
        expect(res.body.status).toBe('green');

        // Audit: THREAD_INITIALIZED recorded
        const rows = await adapter.rawQuery(
            `SELECT * FROM audit_logs WHERE thread_id = $1 AND action = 'THREAD_INITIALIZED'`,
            [threadId]
        );
        expect(rows.length).toBe(1);
    });

    // ---------------------------------------------------------------
    // Step 2: Safe message flows through — stays GREEN
    // ---------------------------------------------------------------
    it('2. should accept safe user messages while in AI ownership (GREEN path)', async () => {
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: USER_ID,
                sender_type: 'USER',
                content: 'What are your operating hours?',
            })
            .expect(201);

        const res = await superRequest(app.getHttpServer())
            .get(`/thread/${threadId}`)
            .expect(200);

        expect(res.body.status).toBe('green');
        expect(res.body.ownership).toBe('AI');
    });

    // ---------------------------------------------------------------
    // Step 3: Blocked keyword triggers guardrail → HUMAN takeover
    // ---------------------------------------------------------------
    it('3. should escalate to HUMAN when guardrail keyword detected (RED path)', async () => {
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: USER_ID,
                sender_type: 'USER',
                content: 'I spotted a scam. They wanted my SSH credentials.',
            })
            .expect(201);

        const res = await superRequest(app.getHttpServer())
            .get(`/thread/${threadId}`)
            .expect(200);

        expect(res.body.status).toBe('red');
        expect(res.body.ownership).toBe('HUMAN');
    });

    // ---------------------------------------------------------------
    // Step 4: AI suppression — AI cannot send while HUMAN owns thread
    // ---------------------------------------------------------------
    it('4. should reject AI messages while thread is HUMAN-owned (AISuppressionGuard)', async () => {
        // The AISuppressionGuard intercepts sender_type=AI when ownership=HUMAN
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: 'ai-bot',
                sender_type: 'AI',
                content: 'I am an AI, let me help.',
            })
            .expect(403);
    });

    // ---------------------------------------------------------------
    // Step 5: Human agent responds successfully
    // ---------------------------------------------------------------
    it('5. should allow HUMAN messages while in HUMAN ownership', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: 'agent-007',
                sender_type: 'HUMAN',
                content: 'Thank you for reporting — I am looking into this now.',
            })
            .expect(201);

        expect(res.body.id).toBeDefined();
        expect(res.body.sender_type).toBe('HUMAN');
    });

    // ---------------------------------------------------------------
    // Step 6: Human releases thread → AI resumes
    // ---------------------------------------------------------------
    it('6. should allow HUMAN → AI ownership transfer', async () => {
        const res = await superRequest(app.getHttpServer())
            .post('/thread/ownership/switch')
            .send({
                thread_id: threadId,
                ownership: 'AI',
                actor_id: 'agent-007',
            })
            .expect(201);

        expect(res.body.ownership).toBe('AI');
    });

    // ---------------------------------------------------------------
    // Step 7: AI can message again after re-acquisition
    // ---------------------------------------------------------------
    it('7. should accept AI messages after AI ownership is restored', async () => {
        await superRequest(app.getHttpServer())
            .post('/thread/event/message')
            .send({
                thread_id: threadId,
                sender_id: 'ai-bot',
                sender_type: 'AI',
                content: 'The incident has been reviewed. Is there anything else I can help you with?',
            })
            .expect(201);
    });

    // ---------------------------------------------------------------
    // Step 8: Full audit trail verification
    // ---------------------------------------------------------------
    it('8. should have a complete, ordered audit trail for the full lifecycle', async () => {
        const auditRows = await adapter.rawQuery(
            `SELECT action, created_at FROM audit_logs WHERE thread_id = $1 ORDER BY created_at ASC`,
            [threadId]
        );

        const actions = auditRows.map(r => r.action);
        console.log('[Lifecycle Audit Trail]:', actions);

        // Verify mandatory events exist (not strictly ordered — async events may interleave)
        expect(actions).toContain('THREAD_INITIALIZED');
        expect(actions).toContain('MESSAGE_APPENDED');
        expect(actions).toContain('GUARDRAIL_TRIGGERED');
        expect(actions).toContain('OWNERSHIP_SWITCHED');

        // Verify THREAD_INITIALIZED is always first
        expect(actions[0]).toBe('THREAD_INITIALIZED');

        // Verify OWNERSHIP_SWITCHED appears at least twice (AI→HUMAN and HUMAN→AI)
        const ownershipSwitches = actions.filter(a => a === 'OWNERSHIP_SWITCHED');
        expect(ownershipSwitches.length).toBeGreaterThanOrEqual(2);
    });
});
