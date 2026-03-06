import React from 'react';
import ThreadQueuePage from '../components/threads/ThreadQueuePage';
import { useThreads } from '../hooks/useThreads';
import { Users } from 'lucide-react';

export default function NurseQueue() {
    const { data: threads = [], isLoading } = useThreads();

    // Filter for yellow status (useful if user is CRO)
    const nurseThreads = threads.filter(t => t.status === 'yellow');

    return (
        <ThreadQueuePage
            title="Nurse Queue"
            subtitle="Moderate severity threads requiring nursing triage"
            threads={nurseThreads}
            isLoading={isLoading}
            icon={Users}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            noThreadsMessage="No nursing support threads currently active."
        />
    );
}
