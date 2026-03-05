import api from "./api";

export interface Thread {
    id: string;
    domain: string;
    user_id: string;
    channel: string;
    status: "green" | "yellow" | "red";
    ownership: "AI" | "HUMAN";
    assigned_role?: string;
    assigned_user_id?: string;
    is_locked: boolean;
    version: number;
    created_at: string;
    updated_at: string;
}

export const threadService = {
    getAllThreads: async (): Promise<Thread[]> => {
        // Note: In a real app, there might be a specific endpoint for all threads.
        // For now, we assume searching or a generic fetch.
        const response = await api.get<Thread[]>("/thread/all"); // Assuming /thread/all exists or mapping to /threads
        return response.data;
    },

    getThreadById: async (id: string): Promise<Thread> => {
        const response = await api.get<Thread>(`/thread/${id}`);
        return response.data;
    },

    switchOwnership: async (
        threadId: string,
        ownership: "AI" | "HUMAN",
        actorId: string,
        assignedRole?: string
    ) => {
        const response = await api.post("/thread/ownership/switch", {
            thread_id: threadId,
            ownership,
            actor_id: actorId,
            assigned_role: assignedRole,
        });
        return response.data;
    },

    sendMessage: async (
        threadId: string,
        senderId: string,
        senderType: "USER" | "AI" | "HUMAN",
        content: string
    ) => {
        const response = await api.post("/thread/event/message", {
            thread_id: threadId,
            sender_id: senderId,
            sender_type: senderType,
            content,
        });
        return response.data;
    },
};
