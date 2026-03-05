import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ThreadCard from '../components/threads/ThreadCard';
import ThreadContextModal from '../components/threads/ThreadContextModal';
import { useAuth } from '../hooks/useAuth';
import { useMockThreads } from '../hooks/useMockThreads';
import { MockThread } from '../data/mockThreads';
import { AlertCircle, Users, Activity, MessageSquare, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const { threads, allThreads, takeControl, assignThread, sendReply } = useMockThreads(user?.role, user?.name);
    const [selectedThread, setSelectedThread] = useState<MockThread | null>(null);

    const redCount = allThreads.filter((t) => t.severity === 'RED').length;
    const yellowCount = allThreads.filter((t) => t.severity === 'YELLOW').length;
    const greenCount = allThreads.filter((t) => t.severity === 'GREEN').length;

    const stats = [
        { name: 'Total Threads', value: allThreads.length, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Red Alerts', value: redCount, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { name: 'Nurse Queue', value: yellowCount, icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
        { name: 'AI Active', value: greenCount, icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    const urgentThreads = threads.filter((t) => t.severity === 'RED' || t.severity === 'YELLOW');

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Hospital Control Tower</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Janmasethu Janani · Medical Orchestration System</p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span>Live · Polling every 5s</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                                    <stat.icon size={18} className={stat.color} />
                                </div>
                                <TrendingUp size={14} className="text-slate-300" />
                            </div>
                            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{stat.name}</p>
                        </div>
                    ))}
                </div>

                {/* Severity Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Severity Distribution</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'RED — Emergency', count: redCount, color: 'bg-red-500' },
                            { label: 'YELLOW — Moderate', count: yellowCount, color: 'bg-amber-400' },
                            { label: 'GREEN — AI Managed', count: greenCount, color: 'bg-green-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="font-medium text-slate-600">{item.label}</span>
                                    <span className="text-slate-400">{item.count} threads</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                        style={{ width: `${allThreads.length ? (item.count / allThreads.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Urgent Alerts */}
                <div>
                    <h3 className="text-base font-bold text-slate-800 mb-4">
                        Active Alerts
                        {urgentThreads.length > 0 && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                                {urgentThreads.length} requiring attention
                            </span>
                        )}
                    </h3>
                    {urgentThreads.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center text-slate-400">
                            <Activity size={40} className="mx-auto mb-3 opacity-20" />
                            <p>No active alerts. All threads are AI-managed.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {urgentThreads.map((thread) => (
                                <ThreadCard
                                    key={thread.id}
                                    thread={thread}
                                    currentRole={user!.role}
                                    onView={setSelectedThread}
                                    onTakeControl={(id) => takeControl(id, user!.role)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedThread && (
                <ThreadContextModal
                    thread={selectedThread}
                    currentRole={user!.role}
                    currentUserName={user!.name}
                    onClose={() => setSelectedThread(null)}
                    onTakeControl={(id) => takeControl(id, user!.role)}
                    onSendReply={sendReply}
                    onAssign={assignThread}
                />
            )}
        </DashboardLayout>
    );
}
