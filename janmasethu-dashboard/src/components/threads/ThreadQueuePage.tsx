import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import ThreadCard from './ThreadCard';
import ThreadContextModal from './ThreadContextModal';
import { useAuth } from '../../hooks/useAuth';
import { useTakeControl, useSendReply, useAssignThread } from '../../hooks/useThreads';
import { Thread } from '../../services/threadService';
import { Search, LucideIcon, AlertCircle } from 'lucide-center'; // Fix possible typo in icon lib if needed, but 'lucide-react' is standard

import { LucideIcon as LucideIconType } from 'lucide-react';
import { Search as SearchIcon, AlertCircle as AlertCircleIcon } from 'lucide-react';

interface Props {
    title: string;
    subtitle: string;
    threads: Thread[];
    isLoading: boolean;
    icon: LucideIconType;
    iconColor: string;
    iconBg: string;
    searchPlaceholder?: string;
    noThreadsMessage: string;
}

export default function ThreadQueuePage({
    title,
    subtitle,
    threads,
    isLoading,
    icon: Icon,
    iconColor,
    iconBg,
    searchPlaceholder = "Search threads...",
    noThreadsMessage
}: Props) {
    const { user } = useAuth();
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [search, setSearch] = useState('');

    const takeControlMutation = useTakeControl();
    const sendReplyMutation = useSendReply();
    const assignThreadMutation = useAssignThread();

    const filteredThreads = threads.filter((t) =>
        !search || t.user_id.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search)
    );

    const handleTakeControl = (threadId: string) => {
        takeControlMutation.mutate(threadId);
    };

    const handleSendReply = (threadId: string, content: string) => {
        sendReplyMutation.mutate({ thread_id: threadId, content });
    };

    const handleAssign = (threadId: string, assignedUser: string, assignedRole: string) => {
        assignThreadMutation.mutate({ thread_id: threadId, assigned_user: assignedUser, assigned_role: assignedRole });
    };

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                            <Icon size={20} className={iconColor} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                                <span>{title}</span>
                                <span className={`text-sm ${iconBg} ${iconColor} font-semibold px-2.5 py-0.5 rounded-full`}>
                                    {filteredThreads.length} active
                                </span>
                            </h1>
                            <p className="text-sm text-slate-500">{subtitle}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 pl-9 pr-4 text-sm focus:border-blue-400 focus:outline-none w-52 bg-white"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl h-48 animate-pulse" />
                        ))}
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-24 text-center">
                        <AlertCircleIcon size={48} className="mx-auto mb-3 text-slate-200" />
                        <p className="font-medium text-slate-400">{noThreadsMessage}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredThreads.map((thread) => (
                            <ThreadCard
                                key={thread.id}
                                thread={thread}
                                currentRole={user?.role || 'nurse'}
                                onView={setSelectedThread}
                                onTakeControl={handleTakeControl}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedThread && (
                <ThreadContextModal
                    thread={selectedThread}
                    currentRole={user?.role || 'nurse'}
                    currentUserName={user?.name || 'User'}
                    onClose={() => setSelectedThread(null)}
                    onTakeControl={handleTakeControl}
                    onSendReply={handleSendReply}
                    onAssign={handleAssign}
                />
            )}
        </DashboardLayout>
    );
}
