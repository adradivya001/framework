import React from 'react';
import { MockThread, UserRole } from '../../data/mockThreads';
import { Clock, User, MessageSquare, Lock, UserCheck } from 'lucide-react';

interface ThreadCardProps {
    thread: MockThread;
    currentRole: UserRole;
    onView: (thread: MockThread) => void;
    onTakeControl: (threadId: string) => void;
}

const SEV = {
    RED: { badge: 'bg-red-100 text-red-700 border border-red-200', bar: 'bg-red-500', ring: 'hover:border-red-300 hover:shadow-red-50' },
    YELLOW: { badge: 'bg-amber-100 text-amber-700 border border-amber-200', bar: 'bg-amber-400', ring: 'hover:border-amber-300 hover:shadow-amber-50' },
    GREEN: { badge: 'bg-green-100 text-green-700 border border-green-200', bar: 'bg-green-500', ring: 'hover:border-green-300 hover:shadow-green-50' },
};

function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

export default function ThreadCard({ thread, currentRole, onView, onTakeControl }: ThreadCardProps) {
    const s = SEV[thread.severity];
    const lastMsg = thread.conversation[thread.conversation.length - 1];

    const canTake =
        !thread.assigned &&
        ((currentRole === 'DOCTOR' && thread.severity === 'RED') ||
            (currentRole === 'NURSE' && thread.severity === 'YELLOW') ||
            currentRole === 'CRO');

    return (
        <div
            onClick={() => onView(thread)}
            className={`bg-white rounded-xl border border-slate-200 border-l-4 ${s.bar === 'bg-red-500' ? 'border-l-red-500' : s.bar === 'bg-amber-400' ? 'border-l-amber-400' : 'border-l-green-500'} shadow-sm hover:shadow-md ${s.ring} transition-all duration-200 cursor-pointer overflow-hidden`}
        >
            <div className="p-5 space-y-3">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${s.badge}`}>
                            {thread.severity}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-medium">#{thread.id.slice(-3)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{timeAgo(thread.createdAt)}</span>
                    </span>
                </div>

                {/* Patient ID */}
                <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={13} className="text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 leading-none">Patient ID</p>
                        <p className="text-sm font-semibold text-slate-800">{thread.patient}</p>
                    </div>
                </div>

                {/* Last Message */}
                {lastMsg && (
                    <div className="bg-slate-50 rounded-lg px-3.5 py-2.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 flex items-center space-x-1 mb-0.5">
                            <MessageSquare size={9} />
                            <span>LAST MESSAGE · {lastMsg.sender}</span>
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{lastMsg.text}</p>
                    </div>
                )}

                {/* Assignment + Button Row */}
                <div className="flex items-center justify-between pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs">
                        {thread.assignedUser ? (
                            <span className="flex items-center space-x-1 text-slate-700 font-semibold">
                                <UserCheck size={12} className="text-blue-500" />
                                <span>Assigned to: {thread.assignedUser}</span>
                            </span>
                        ) : thread.assigned ? (
                            <span className="flex items-center space-x-1 text-slate-600 font-medium">
                                <Lock size={11} />
                                <span>Owned by {thread.owner}</span>
                            </span>
                        ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onView(thread); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                        View Thread
                    </button>
                </div>
            </div>
        </div>
    );
}
