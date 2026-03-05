import { useState, useCallback } from 'react';
import { initialMockThreads, MockThread, UserRole } from '../data/mockThreads';

export function useMockThreads(role: UserRole | undefined, userName?: string) {
    const [threads, setThreads] = useState<MockThread[]>(initialMockThreads);

    // Role-based visibility:
    // DOCTOR → RED + assigned to this doctor
    // NURSE  → YELLOW + assigned to this nurse
    // CRO    → All
    const visibleThreads = threads.filter((t) => {
        if (!role) return false;
        if (role === 'CRO') return true;
        if (role === 'DOCTOR') return t.severity === 'RED' || t.assignedUser === userName;
        if (role === 'NURSE') return t.severity === 'YELLOW' || t.assignedUser === userName;
        return false;
    });

    const takeControl = useCallback((threadId: string, actorRole: UserRole) => {
        setThreads((prev) =>
            prev.map((t) =>
                t.id === threadId ? { ...t, assigned: true, owner: actorRole } : t
            )
        );
    }, []);

    const assignThread = useCallback((threadId: string, assignedUser: string, assignedRole: 'DOCTOR' | 'NURSE') => {
        setThreads((prev) =>
            prev.map((t) =>
                t.id === threadId ? { ...t, assignedUser, assignedRole, assigned: true } : t
            )
        );
    }, []);

    const sendReply = useCallback((threadId: string, text: string, senderLabel: string) => {
        setThreads((prev) =>
            prev.map((t) =>
                t.id === threadId
                    ? {
                        ...t,
                        conversation: [
                            ...t.conversation,
                            {
                                sender: 'HUMAN' as const,
                                text: `${senderLabel}: ${text}`,
                                timestamp: new Date().toISOString(),
                            },
                        ],
                    }
                    : t
            )
        );
    }, []);

    return { threads: visibleThreads, allThreads: threads, takeControl, assignThread, sendReply };
}
