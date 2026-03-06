import React from 'react';
import ThreadQueuePage from '../components/threads/ThreadQueuePage';
import { useThreads } from '../hooks/useThreads';
import { Activity } from 'lucide-react';

export default function AIThreads() {
    const { data: threads = [], isLoading } = useThreads();

    // Filter for green status (useful if user is CRO)
    const aiThreads = threads.filter(t => t.status === 'green');

    return (
        <ThreadQueuePage
            title="AI Passive Monitoring"
            subtitle="Low risk conversations being handled by Sakhi AI"
            threads={aiThreads}
            isLoading={isLoading}
            icon={Activity}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            noThreadsMessage="No AI-managed conversations at the moment."
        />
    );
}
