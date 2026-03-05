import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { mockAuditLogs } from '../data/mockThreads';
import { FileText, Shield, ArrowRightLeft, Plus, MessageSquare } from 'lucide-react';

const ACTION_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    THREAD_ESCALATED: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    OWNERSHIP_SWITCH: { icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50' },
    THREAD_CREATED: { icon: Plus, color: 'text-green-600', bg: 'bg-green-50' },
    MESSAGE_SENT: { icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export default function AuditLogs() {
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
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{mockAuditLogs.length} entries</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {mockAuditLogs.map((log) => {
                            const style = ACTION_STYLES[log.action] || ACTION_STYLES.MESSAGE_SENT;
                            const Icon = style.icon;
                            return (
                                <div key={log.id} className="flex items-start space-x-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                        <Icon size={16} className={style.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-0.5">
                                            <span className="text-sm font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                                            <span className="text-xs text-slate-400 font-mono">{log.threadId}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">{log.details}</p>
                                        <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-400">
                                            <span>Actor: <span className="font-medium text-slate-600">{log.actor}</span></span>
                                            <span>·</span>
                                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
