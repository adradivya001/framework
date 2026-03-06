import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuditLog } from '../../types';

@Injectable()
export class AuditService {
    constructor(
        @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
    ) { }

    async append(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
        const { error } = await this.supabase
            .from('audit_logs')
            .insert([
                {
                    ...log,
                    created_at: new Date(),
                },
            ]);

        if (error) {
            console.error('Failed to append audit log:', error);
            // In production, we might want to handle this more robustly (e.g., local buffer or alerting)
        }
    }

    async getAll(): Promise<AuditLog[]> {
        const { data, error } = await this.supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data || [];
    }
}
