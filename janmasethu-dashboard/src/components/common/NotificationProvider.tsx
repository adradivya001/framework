import React, { useState, useEffect, createContext, useContext } from 'react';
import { Bell, Flame, Lock, UserCheck, X } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'critical' | 'alert' | 'success' | 'info';
    message: string;
    description?: string;
}

const NotificationContext = createContext({
    notify: (n: Omit<Notification, 'id'>) => { },
});

export const useNotifications = () => useContext(NotificationContext);

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = (n: Omit<Notification, 'id'>) => {
        const id = Math.random().toString();
        setNotifications((prev) => [...prev, { ...n, id }]);
        setTimeout(() => {
            remove(id);
        }, 6000);
    };

    const remove = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-6 right-6 z-[999] flex flex-col items-end space-y-3 pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`pointer-events-auto flex items-start space-x-3 w-80 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-4 duration-300 transition-all ${n.type === 'critical'
                                ? 'bg-red-50/95 border-red-200 text-red-800 ring-2 ring-red-500/20'
                                : n.type === 'alert'
                                    ? 'bg-amber-50/95 border-amber-200 text-amber-800'
                                    : 'bg-white/95 border-slate-200 text-slate-800'
                            }`}
                    >
                        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'critical' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {n.type === 'critical' ? <Flame size={16} /> : <Bell size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold uppercase tracking-tight">{n.message}</h4>
                            {n.description && <p className="text-xs opacity-80 mt-1 leading-relaxed">{n.description}</p>}
                        </div>
                        <button onClick={() => remove(n.id)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}
