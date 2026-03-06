import React from 'react';
import ThreadQueuePage from '../components/threads/ThreadQueuePage';
import { useThreads } from '../hooks/useThreads';
import { Shield } from 'lucide-react';

export default function DoctorQueue() {
    const { data: threads = [], isLoading } = useThreads();

    // Filter for red status (useful if user is CRO)
    const doctorThreads = threads.filter(t => t.status === 'red');

    return (
        <ThreadQueuePage
            title="Doctor Queue"
            subtitle="Emergency threads requiring immediate clinical intervention"
            threads={doctorThreads}
            isLoading={isLoading}
            icon={Shield}
            iconColor="text-red-600"
            iconBg="bg-red-50"
            noThreadsMessage="Clear! No emergency threads currently pending."
        />
    );
}
