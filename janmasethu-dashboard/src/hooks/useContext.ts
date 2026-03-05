import { useQuery } from "@tanstack/react-query";
import { contextService } from "../services/contextService";

export const useThreadContext = (threadId: string) => {
    return useQuery({
        queryKey: ["thread-context", threadId],
        queryFn: () => contextService.getThreadContext(threadId),
        enabled: !!threadId,
        refetchInterval: 3000, // Slightly faster polling for active conversation
    });
};
