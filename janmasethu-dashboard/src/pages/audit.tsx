import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Shield, Eye, Lock, Activity, Search, Filter, Download, User, Calendar } from 'lucide-react';

interface AuditLog {
    id: string;
    timestamp: string;
    actor: {
        name: string;
        role: string;
    };
    action: 'DECRYPTION' | 'TAKEOVER' | 'ASSIGNMENT' | 'PII_ACCESS';
    targetId: string; // threadId
    details: string;
    severity: 'low' | 'medium' | 'high';
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
    {
        id: 'aud-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        actor: { name: 'Dr. Aditi Sharma', role: 'DOCTOR' },
        action: 'PII_ACCESS',
        targetId: 'th-9912',
        details: 'Decrypted patient contact info for emergency validation.',
        severity: 'high'
    },
    {
        id: 'aud-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        actor: { name: 'Nurse John', role: 'NURSE' },
        action: 'TAKEOVER',
        targetId: 'th-8812',
        details: 'Manually took control of thread after alert.',
        severity: 'medium'
    },
    {
        id: 'aud-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        actor: { name: 'CRO Admin', role: 'CRO' },
        action: 'ASSIGNMENT',
        targetId: 'th-7712',
        details: 'Reassigned thread from Nurse John to Dr. Aditi.',
        severity: 'low'
    },
    {
        id: 'aud-4',
        timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
        actor: { name: 'Dr. Aditi Sharma', role: 'DOCTOR' },
        action: 'PII_ACCESS',
        targetId: 'th-1234',
        details: 'Accessed PII to verify medical record linkage.',
        severity: 'medium'
    }
];

export default function AuditLogsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = MOCK_AUDIT_LOGS.filter(log =>
        log.actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionIcon = (action: AuditLog['action']) => {
        switch (action) {
            case 'PII_ACCESS': return <Eye className="text-purple-500" size={16} />;
            case 'DECRYPTION': return <Shield className="text-red-500" size={16} />;
            case 'TAKEOVER': return <Activity className="text-amber-500" size={16} />;
            case 'ASSIGNMENT': return <User className="text-blue-500" size={16} />;
        }
    };

    const getSeverityBadge = (severity: AuditLog['severity']) => {
        const styles = {
            low: 'bg-blue-50 text-blue-600 border-blue-100',
            medium: 'bg-amber-50 text-amber-600 border-amber-100',
            high: 'bg-red-50 text-red-600 border-red-100'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[severity]}`}>
                {severity}
            </span>
        );
    };

    return (
        <DashboardLayout title="Audit Logs">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Governance & Compliance</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Immutable audit trails for PII access and system operations.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                            <Download size={16} />
                            <span>Export (CSV)</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by actor, thread ID, or details..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">
                            <Calendar size={16} />
                            <span>Last 24h</span>
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Actor</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Target</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Risk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{log.actor.name}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{log.actor.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {getActionIcon(log.action)}
                                            <span className="text-xs font-semibold text-slate-700">{log.action}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                            #{log.targetId}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getSeverityBadge(log.severity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                            <Shield size={40} className="mx-auto mb-3 opacity-20" />
                            <p>No audit logs found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
