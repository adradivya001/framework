import { Injectable, Inject, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Thread, Message } from '../../types';
import { JANMASETHU_DOMAIN, JanmasethuUserContext, JanmasethuUserRole } from './janmasethu.types';
import { ConcurrencyException } from '../../infrastructure/exceptions';

@Injectable()
export class JanmasethuRepository {
    private readonly logger = new Logger(JanmasethuRepository.name);

    constructor(@Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient) { }

    /**
     * VISIBILITY ENFORCEMENT (FINAL)
     * CRO: All janmasethu threads
     * DOCTOR: status = 'red'
     * NURSE: status = 'yellow'
     */
    async findThreads(user: JanmasethuUserContext): Promise<Thread[]> {
        let query = this.supabase
            .from('conversation_threads')
            .select('*')
            .eq('domain', JANMASETHU_DOMAIN);

        if (user.role === JanmasethuUserRole.CRO) {
            // No status filter for CRO
        } else if (user.role === JanmasethuUserRole.DOCTOR) {
            query = query.eq('status', 'red');
        } else if (user.role === JanmasethuUserRole.NURSE) {
            query = query.eq('status', 'yellow');
        } else {
            return []; // Unauthorized role
        }

        const { data, error } = await query;
        if (error) {
            this.logger.error(`Failed to fetch threads for ${user.role}: ${error.message}`);
            throw error;
        }
        return (data || []) as Thread[];
    }

    async findThreadById(id: string, user?: JanmasethuUserContext): Promise<Thread | null> {
        let query = this.supabase
            .from('conversation_threads')
            .select('*')
            .eq('id', id)
            .eq('domain', JANMASETHU_DOMAIN);

        if (user) {
            if (user.role === JanmasethuUserRole.DOCTOR) {
                query = query.eq('status', 'red');
            } else if (user.role === JanmasethuUserRole.NURSE) {
                query = query.eq('status', 'yellow');
            }
        }

        const { data, error } = await query.single();
        if (error || !data) return null;
        return data as Thread;
    }

    /**
     * CONCURRENCY-SAFE UPDATE
     */
    async updateThreadAtomic(
        id: string,
        version: number,
        updates: Partial<Thread>,
        extraConditions: Record<string, any> = {}
    ): Promise<Thread> {
        let query = this.supabase
            .from('conversation_threads')
            .update({
                ...updates,
                version: version + 1,
                updated_at: new Date(),
            })
            .eq('id', id)
            .eq('domain', JANMASETHU_DOMAIN)
            .eq('version', version);

        // Apply extra conditions (e.g., is_locked: false for takeover)
        Object.entries(extraConditions).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        const { data, error } = await query.select();

        if (error) {
            this.logger.error(`Atomic update failed for thread ${id}: ${error.message}`);
            throw error;
        }

        if (!data || data.length === 0) {
            this.logger.warn(`Concurrency conflict for thread ${id}. Expected version ${version}.`);
            throw new ConcurrencyException();
        }

        return data[0] as Thread;
    }

    async createThread(dto: Partial<Thread>): Promise<Thread> {
        const { data, error } = await this.supabase
            .from('conversation_threads')
            .insert([{ ...dto, domain: JANMASETHU_DOMAIN }])
            .select()
            .single();

        if (error) throw error;
        return data as Thread;
    }

    async createMessage(dto: Partial<Message>): Promise<Message> {
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .insert([dto])
            .select()
            .single();

        if (error) throw error;
        return data as Message;
    }

    async findMessageById(id: string): Promise<Message | null> {
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data as Message;
    }

    /**
     * FETCH CHRONOLOGICAL CONVERSATION HISTORY
     */
    async findMessagesByThreadId(threadId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .select('sender_type, content, created_at')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (error) {
            this.logger.error(`Failed to fetch messages for thread ${threadId}: ${error.message}`);
            throw error;
        }

        return data || [];
    }

    async findRecentMessages(threadId: string, limit: number): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('conversation_messages')
            .select('sender_type, content, created_at')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            this.logger.error(`Failed to fetch recent messages for thread ${threadId}: ${error.message}`);
            throw error;
        }

        // Return in chronological order
        return (data || []).reverse();
    }

    async insertAuditLog(log: any): Promise<void> {
        await this.supabase.from('audit_logs').insert([log]);
    }

    async insertRoutingEvent(event: any): Promise<void> {
        await this.supabase.from('routing_events').insert([event]);
    }
}
