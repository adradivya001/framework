import api from "./api";

export interface Message {
    id: string;
    thread_id: string;
    sender_id: string;
    sender_type: "USER" | "AI" | "HUMAN";
    content: string;
    created_at: string;
}

export const contextService = {
    getThreadContext: async (threadId: string): Promise<Message[]> => {
        const response = await api.get<Message[]>(`/janmasethu/context/${threadId}`);
        return response.data;
    },
};
