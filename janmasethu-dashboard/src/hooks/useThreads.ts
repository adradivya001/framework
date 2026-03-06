import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import threadService from "../services/threadService";

export const useThreads = () => {
    return useQuery({
        queryKey: ["janmasethu-threads"],
        queryFn: threadService.getThreads,
        refetchInterval: 5000,
    });
};

export const useThreadContext = (threadId: string) => {
    return useQuery({
        queryKey: ["thread-context", threadId],
        queryFn: () => threadService.getContext(threadId),
        enabled: !!threadId,
        refetchInterval: 5000,
    });
};

export const useTakeControl = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (threadId: string) => threadService.switchOwnership(threadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["janmasethu-threads"] });
        },
    });
};

export const useSendReply = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { thread_id: string; content: string }) =>
            threadService.sendMessage(payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["janmasethu-threads"] });
            queryClient.invalidateQueries({ queryKey: ["thread-context", variables.thread_id] });
        },
    });
};

export const useAssignThread = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { thread_id: string; assigned_user: string; assigned_role: string }) =>
            threadService.assignThread(payload.thread_id, payload.assigned_user, payload.assigned_role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["janmasethu-threads"] });
        },
    });
};
