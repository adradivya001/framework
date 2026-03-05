import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ThreadCard from '../components/threads/ThreadCard';
import ThreadContextModal from '../components/threads/ThreadContextModal';
import { useAuth } from '../hooks/useAuth';
import { useMockThreads } from '../hooks/useMockThreads';
import { MockThread } from '../data/mockThreads';
import { List, Search } from 'lucide-react';

type SevFilter = 'ALL' | 'RED' | 'YELLOW' | 'GREEN';

export default function AllThreads() {
    const { user } = useAuth();
    const { allThreads, takeControl, assignThread, sendReply } = useMockThreads(user?.role, user?.name);
    const [selectedThread, setSelectedThread] = useState<MockThread | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<SevFilter>('ALL');

    const filtered = allThreads
        .filter((t) => filter === 'ALL' || t.severity === filter)
        .filter((t) => !search || t.patient.includes(search) || t.id.includes(search));

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <List size={20} className="text-slate-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">All Threads</h1>
                            <p className="text-sm text-slate-500">Complete thread archive — {allThreads.length} total</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="h-9 rounded-lg border border-slate-200 pl-9 pr-4 text-sm focus:outline-none w-44" />
                        </div>
                        <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                            {(['ALL', 'RED', 'YELLOW', 'GREEN'] as SevFilter[]).map((f) => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${filter === f ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((thread) => (
                        <ThreadCard key={thread.id} thread={thread} currentRole={user!.role}
                            onView={setSelectedThread} onTakeControl={(id) => takeControl(id, user!.role)} />
                    ))}
                </div>
                {filtered.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl py-16 text-center text-slate-400">
                        No threads match your filters.
                    </div>
                )}
            </div>
            {selectedThread && (
                <ThreadContextModal thread={selectedThread} currentRole={user!.role} currentUserName={user!.name}
                    onClose={() => setSelectedThread(null)} onTakeControl={(id) => takeControl(id, user!.role)}
                    onSendReply={sendReply} onAssign={assignThread} />
            )}
        </DashboardLayout>
    );
}
