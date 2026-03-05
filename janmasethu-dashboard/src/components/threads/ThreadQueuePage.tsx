import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import ThreadCard from "./ThreadCard";
import ThreadContextModal from "./ThreadContextModal";
import { Thread } from "../../services/threadService";
import { Search, Filter, AlertTriangle } from "lucide-react";

interface ThreadQueuePageProps {
    title: string;
    description: string;
    filter: (thread: Thread) => boolean;
    emptyMessage: string;
    threads: Thread[] | undefined;
    isLoading: boolean;
}

export default function ThreadQueuePage({
    title,
    description,
    filter,
    emptyMessage,
    threads,
    isLoading
}: ThreadQueuePageProps) {
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredThreads = threads?.filter(filter).filter(t =>
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Auto-alert notification logic for RED threads
    useEffect(() => {
        if (title === "Doctor Queue") {
            const redThreads = threads?.filter(t => t.status === 'red') || [];
            // Simple logic to check for "new" red threads could be added here
            // For now, we rely on the 5s polling from the hook
        }
    }, [threads, title]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col justify-between sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                        <p className="text-slate-500">{description}</p>
                    </div>

                    <div className="mt-4 flex space-x-2 sm:mt-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search queue..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-64 rounded-md border border-border pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <button className="flex items-center space-x-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center text-slate-400">Loading synchronization records...</div>
                ) : filteredThreads?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20 text-slate-400 bg-white">
                        <AlertTriangle size={48} className="mb-4 opacity-10" />
                        <p className="font-medium">{searchQuery ? "No matches found for your search." : emptyMessage}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredThreads?.map(thread => (
                            <ThreadCard
                                key={thread.id}
                                thread={thread}
                                onClick={setSelectedThread}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedThread && (
                <ThreadContextModal
                    thread={selectedThread}
                    onClose={() => setSelectedThread(null)}
                />
            )}
        </DashboardLayout>
    );
}
