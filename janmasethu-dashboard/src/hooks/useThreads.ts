import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { threadService, Thread } from "../services/threadService";

export const useThreads = () => {
    return useQuery({
        queryKey: ["threads"],
        queryFn: threadService.getAllThreads,
        refetchInterval: 5000, // Polling every 5 seconds as requested
    });
};

export const useThread = (id: string) => {
    return useQuery({
        queryKey: ["thread", id],
        queryFn: () => threadService.getThreadById(id),
        enabled: !!id,
    });
};

export const useSwitchOwnership = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            threadId,
            ownership,
            actorId,
            assignedRole,
        }: {
            threadId: string;
            ownership: "AI" | "HUMAN";
            actorId: string;
            assignedRole?: string;
        }) => threadService.switchOwnership(threadId, ownership, actorId, assignedRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["threads"] });
            queryClient.invalidateQueries({ queryKey: ["thread", variables.threadId] });
        },
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            threadId,
            senderId,
            senderType,
            content,
        }: {
            threadId: string;
            senderId: string;
            senderType: "USER" | "AI" | "HUMAN";
            content: string;
        }) => threadService.sendMessage(threadId, senderId, senderType, content),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["thread-context", variables.threadId] });
        },
    });
};
