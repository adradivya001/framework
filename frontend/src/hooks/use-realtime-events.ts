import { useState, useEffect } from 'react';

const REALTIME_EVENT_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3000/janmasethu/realtime/events';

export function useRealtimeEvents() {
    const [events, setEvents] = useState<any[]>([]);
    const [lastEvent, setLastEvent] = useState<any>(null);

    useEffect(() => {
        const eventSource = new EventSource(REALTIME_EVENT_URL);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type !== 'HEARTBEAT') {
                    console.log('📬 NEW CLINICAL EVENT:', data);
                    setEvents((prev) => [data, ...prev].slice(0, 50));
                    setLastEvent(data);
                }
            } catch (err) {
                console.error('Failed to parse SSE event', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Connection failed. Retrying...', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return { events, lastEvent };
}
