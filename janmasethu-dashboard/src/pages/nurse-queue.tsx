import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ThreadCard from '../components/threads/ThreadCard';
import ThreadContextModal from '../components/threads/ThreadContextModal';
import { useAuth } from '../hooks/useAuth';
import { useMockThreads } from '../hooks/useMockThreads';
import { MockThread } from '../data/mockThreads';
import { Thermometer, Search } from 'lucide-react';

export default function NurseQueue() {
    const { user } = useAuth();
    const { threads, takeControl, assignThread, sendReply } = useMockThreads(user?.role, user?.name);
    const [selectedThread, setSelectedThread] = useState<MockThread | null>(null);
    const [search, setSearch] = useState('');

    const yellowThreads = threads
        .filter((t) => t.severity === 'YELLOW' || t.assignedUser === user?.name)
        .filter((t) => !search || t.patient.includes(search) || t.id.includes(search));

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Thermometer size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                                <span>Nurse Queue</span>
                                <span className="text-sm bg-amber-100 text-amber-600 font-semibold px-2.5 py-0.5 rounded-full">{yellowThreads.length} active</span>
                            </h1>
                            <p className="text-sm text-slate-500">Moderate YELLOW threads requiring clinical nursing assessment</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 pl-9 pr-4 text-sm focus:border-amber-400 focus:outline-none w-52" />
                    </div>
                </div>

                {yellowThreads.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-24 text-center">
                        <Thermometer size={48} className="mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-slate-400">No YELLOW threads in the queue.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {yellowThreads.map((thread) => (
                            <ThreadCard key={thread.id} thread={thread} currentRole={user!.role}
                                onView={setSelectedThread} onTakeControl={(id) => takeControl(id, user!.role)} />
                        ))}
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
