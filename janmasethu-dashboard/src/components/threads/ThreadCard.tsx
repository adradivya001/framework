import React from 'react';
import { Thread } from '../../services/threadService';
import { UserRole } from '../../hooks/useAuth';
import { Clock, User, MessageSquare, Lock, UserCheck } from 'lucide-react';

interface ThreadCardProps {
    thread: Thread;
    currentRole: UserRole;
    onView: (thread: Thread) => void;
    onTakeControl: (threadId: string) => void;
}

const SEV: any = {
    red_plus: { badge: 'bg-red-600 text-white border border-red-700', bar: 'border-l-red-600', ring: 'hover:border-red-500 hover:shadow-red-100' },
    red: { badge: 'bg-red-100 text-red-700 border border-red-200', bar: 'border-l-red-500', ring: 'hover:border-red-300 hover:shadow-red-50' },
    yellow: { badge: 'bg-amber-100 text-amber-700 border border-amber-200', bar: 'border-l-amber-400', ring: 'hover:border-amber-300 hover:shadow-amber-50' },
    green: { badge: 'bg-green-100 text-green-700 border border-green-200', bar: 'border-l-green-500', ring: 'hover:border-green-300 hover:shadow-green-50' },
};

function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

export default function ThreadCard({ thread, currentRole, onView, onTakeControl }: ThreadCardProps) {
    const s = SEV[thread.status] || SEV.green;

    const canTake =
        !thread.is_locked &&
        ((currentRole === 'DOCTOR' && thread.status === 'red') ||
            (currentRole === 'NURSE' && thread.status === 'yellow') ||
            currentRole === 'CRO');

    return (
        <div
            onClick={() => onView(thread)}
            className={`bg-white rounded-xl border border-slate-200 border-l-4 ${s.bar} shadow-sm hover:shadow-md ${s.ring} transition-all duration-200 cursor-pointer overflow-hidden`}
        >
            <div className="p-5 space-y-3">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${s.badge}`}>
                            {thread.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-medium">#{thread.id.slice(-8)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{timeAgo(thread.created_at)}</span>
                    </span>
                </div>

                {/* Patient / User ID */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center relative">
                            <User size={13} className="text-slate-500" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                                <MessageSquare size={8} className={thread.channel === 'whatsapp' ? 'text-green-500' : 'text-blue-500'} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 leading-none">Participant via {thread.channel}</p>
                            <p className="text-sm font-semibold text-slate-800">{thread.user_id}</p>
                        </div>
                    </div>
                </div>

                {/* Ownership Info */}
                <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Lock size={12} className={thread.is_locked ? 'text-amber-500' : 'text-slate-300'} />
                        <span className="text-xs text-slate-600 font-medium">
                            Ownership: <span className="text-blue-600 font-bold">{thread.ownership}</span>
                        </span>
                    </div>
                    {thread.assigned_user_id && (
                        <span className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold bg-white border border-slate-100 rounded px-1.5 py-0.5">
                            <UserCheck size={10} className="text-blue-500" />
                            <span>ASSIGNED</span>
                        </span>
                    )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs">
                        {canTake ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onTakeControl(thread.id); }}
                                className="text-[11px] font-bold uppercase text-blue-600 hover:text-blue-700"
                            >
                                Take Control
                            </button>
                        ) : thread.is_locked ? (
                            <span className="text-slate-400 italic text-[11px]">Locked by Staff</span>
                        ) : (
                            <span className="text-slate-400 italic text-[11px]">AI Managed</span>
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onView(thread); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                        View Context
                    </button>
                </div>
            </div>
        </div>
    );
}
