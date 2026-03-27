import api from "./api";

export interface Thread {
    id: string;
    domain: string;
    user_id: string;
    channel: string;
    status: 'green' | 'yellow' | 'red' | 'red_plus';
    ownership: 'AI' | 'HUMAN';
    assigned_role: string | null;
    assigned_user_id: string | null;
    is_locked: boolean;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    thread_id: string;
    sender_id: string;
    sender_type: 'USER' | 'AI' | 'HUMAN';
    content: string;
    created_at: string;
}

// Janmasethu Specific Endpoints
export const fetchJanmasethuThreads = () => api.get<Thread[]>("/janmasethu/threads").then(res => res.data);

export const fetchThreadContext = (threadId: string) =>
    api.get<Message[]>(`/janmasethu/context/${threadId}`).then(res => res.data);

export const takeControl = (threadId: string) =>
    api.post(`/janmasethu/take-control/${threadId}`);

export const sendHumanReply = (payload: { thread_id: string; content: string }) =>
    api.post("/janmasethu/reply", {
        ...payload,
        sender_type: "HUMAN"
    });

export const assignThread = (threadId: string, assignedUser: string, assignedRole: string) =>
    api.post(`/janmasethu/assign/${threadId}`, {
        targetUserId: assignedUser,
        targetRole: assignedRole
    });

export const threadService = {
    getThreads: fetchJanmasethuThreads,
    getContext: fetchThreadContext,
    switchOwnership: takeControl,
    sendMessage: sendHumanReply,
    assignThread: assignThread
};

export default threadService;
