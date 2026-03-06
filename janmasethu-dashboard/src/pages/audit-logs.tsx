import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { FileText, Shield, ArrowRightLeft, Plus, MessageSquare, Activity } from 'lucide-react';

const ACTION_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    THREAD_ESCALATED: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    OWNERSHIP_SWITCH: { icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50' },
    THREAD_INITIALIZED: { icon: Plus, color: 'text-green-600', bg: 'bg-green-50' },
    MESSAGE_APPENDED: { icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export default function AuditLogs() {
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const res = await api.get('/thread/audit/all');
            return res.data;
        },
        refetchInterval: 10000
    });

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <FileText size={20} className="text-slate-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
                        <p className="text-sm text-slate-500">Complete activity trail of all system and clinical actions</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Recent Activity</p>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{logs.length} entries</span>
                    </div>

                    {isLoading ? (
                        <div className="p-10 text-center animate-pulse space-y-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-slate-50 rounded-lg" />)}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-20 text-center text-slate-400">
                            <Activity size={40} className="mx-auto mb-3 opacity-20" />
                            <p>No audit trail recorded yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {logs.map((log: any) => {
                                const style = ACTION_STYLES[log.action] || ACTION_STYLES.MESSAGE_APPENDED;
                                const Icon = style.icon;
                                return (
                                    <div key={log.id} className="flex items-start space-x-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                            <Icon size={16} className={style.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-0.5">
                                                <span className="text-sm font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-xs text-slate-400 font-mono">{log.thread_id.slice(-8)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed truncate">
                                                {JSON.stringify(log.payload)}
                                            </p>
                                            <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-400">
                                                <span>Actor: <span className="font-medium text-slate-600 uppercase">{log.actor_type}: {log.actor_id}</span></span>
                                                <span>·</span>
                                                <span>{new Date(log.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
