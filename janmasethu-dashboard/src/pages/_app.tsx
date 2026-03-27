import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import NotificationProvider from "@/components/common/NotificationProvider";

export default function App({ Component, pageProps }: AppProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <NotificationProvider>
                <Component {...pageProps} />
            </NotificationProvider>
        </QueryClientProvider>
    );
}
