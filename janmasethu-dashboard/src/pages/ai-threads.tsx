import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import ThreadCard from '../components/threads/ThreadCard';
import ThreadContextModal from '../components/threads/ThreadContextModal';
import { useAuth } from '../hooks/useAuth';
import { useMockThreads } from '../hooks/useMockThreads';
import { MockThread } from '../data/mockThreads';
import { Bot } from 'lucide-react';

export default function AiThreads() {
    const { user } = useAuth();
    const { allThreads, takeControl, assignThread, sendReply } = useMockThreads(user?.role, user?.name);
    const [selectedThread, setSelectedThread] = useState<MockThread | null>(null);
    const greenThreads = allThreads.filter((t) => t.severity === 'GREEN');

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Bot size={20} className="text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                            <span>AI Threads</span>
                            <span className="text-sm bg-green-100 text-green-600 font-semibold px-2.5 py-0.5 rounded-full">{greenThreads.length} active</span>
                        </h1>
                        <p className="text-sm text-slate-500">Conversations managed by the Sakhi AI Signal Engine</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {greenThreads.map((thread) => (
                        <ThreadCard key={thread.id} thread={thread} currentRole={user!.role}
                            onView={setSelectedThread} onTakeControl={(id) => takeControl(id, user!.role)} />
                    ))}
                </div>
            </div>
            {selectedThread && (
                <ThreadContextModal thread={selectedThread} currentRole={user!.role} currentUserName={user!.name}
                    onClose={() => setSelectedThread(null)} onTakeControl={(id) => takeControl(id, user!.role)}
                    onSendReply={sendReply} onAssign={assignThread} />
            )}
        </DashboardLayout>
    );
}
