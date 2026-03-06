import React from 'react';
import ThreadQueuePage from '../components/threads/ThreadQueuePage';
import { useThreads } from '../hooks/useThreads';
import { MessageSquare } from 'lucide-react';

export default function AllThreads() {
    const { data: threads = [], isLoading } = useThreads();

    return (
        <ThreadQueuePage
            title="All Activity"
            subtitle="Global view of all patient-chatbot interactions"
            threads={threads}
            isLoading={isLoading}
            icon={MessageSquare}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            noThreadsMessage="No conversation activity recorded."
        />
    );
}
