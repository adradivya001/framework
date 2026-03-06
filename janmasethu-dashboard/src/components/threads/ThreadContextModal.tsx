import React, { useState } from 'react';
import { Thread, Message } from '../../services/threadService';
import { UserRole } from '../../hooks/useAuth';
import { useThreadContext } from '../../hooks/useThreads';
import { X, Send, Lock, User, Bot, ChevronDown } from 'lucide-react';

interface Props {
    thread: Thread;
    currentRole: UserRole;
    currentUserName: string;
    onClose: () => void;
    onTakeControl: (threadId: string) => void;
    onSendReply: (threadId: string, content: string) => void;
    onAssign: (threadId: string, assignedUser: string, assignedRole: string) => void;
}

const SEVERITY_HEADER: Record<string, string> = {
    red: 'from-red-500 to-red-600',
    yellow: 'from-amber-400 to-amber-500',
    green: 'from-green-500 to-green-600',
};

const BUBBLE: Record<string, string> = {
    USER: 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm',
    AI: 'bg-blue-50 border border-blue-100 text-slate-800 rounded-tr-sm',
    HUMAN: 'bg-slate-800 text-white rounded-tr-sm',
};

const MOCK_STAFF = [
    { name: 'Dr. Samuel', role: 'DOCTOR' },
    { name: 'Dr. Smith', role: 'DOCTOR' },
    { name: 'Nurse Mary', role: 'NURSE' },
    { name: 'Nurse John', role: 'NURSE' },
];

function timeFmt(t: string) {
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ThreadContextModal({ thread, currentRole, currentUserName, onClose, onTakeControl, onSendReply, onAssign }: Props) {
    const { data: messages = [], isLoading } = useThreadContext(thread.id);
    const [reply, setReply] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');

    const isOwner = thread.ownership === 'HUMAN' && (thread.assigned_user_id === currentUserName || currentRole === 'CRO');
    const canTakeControl = !thread.is_locked && (
        currentRole === 'CRO' ||
        (currentRole === 'DOCTOR' && thread.status === 'red') ||
        (currentRole === 'NURSE' && thread.status === 'yellow')
    );

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        onSendReply(thread.id, reply.trim());
        setReply('');
    };

    const handleAssign = () => {
        const staff = MOCK_STAFF.find((s) => s.name === selectedStaff);
        if (!staff || !selectedStaff) return;
        onAssign(thread.id, staff.name, staff.role);
        setSelectedStaff('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="flex h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

                {/* Header gradient */}
                <div className={`bg-gradient-to-r ${SEVERITY_HEADER[thread.status] || SEVERITY_HEADER.green} px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                        <span className="bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {thread.status}
                        </span>
                        <div>
                            <h3 className="text-white font-bold text-sm">Thread Context</h3>
                            <p className="text-white/70 text-xs">Patient: {thread.user_id} · {thread.id.slice(-8)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 bg-white/20 hover:bg-white/30 transition-colors">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-6 py-3 flex-wrap gap-2">
                    <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center space-x-1.5">
                            <div className={`h-2 w-2 rounded-full ${thread.is_locked ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></div>
                            <span className="text-slate-600 font-medium text-xs">
                                {thread.assigned_user_id
                                    ? `Assigned to: ${thread.assigned_user_id}`
                                    : thread.is_locked
                                        ? `Controlled by HUMAN`
                                        : 'AI Active — Unassigned'}
                            </span>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {canTakeControl && (
                            <button
                                onClick={() => onTakeControl(thread.id)}
                                className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
                            >
                                <Lock size={12} />
                                <span>Take Control</span>
                            </button>
                        )}
                        {thread.is_locked && (
                            <span className="flex items-center space-x-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg">
                                <Lock size={12} />
                                <span>{isOwner ? 'You have control' : 'Thread Locked'}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Conversation */}
                <div className="flex-1 overflow-y-auto bg-slate-50/60 p-5 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                            <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                            <p className="text-xs">Loading context...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm italic">No messages found for this thread.</div>
                    ) : messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex flex-col ${msg.sender_type === 'USER' ? 'items-start' : 'items-end ml-auto'} max-w-[76%] ${msg.sender_type !== 'USER' ? 'self-end' : ''}`}
                        >
                            <div className="flex items-center space-x-1.5 mb-1 px-1">
                                {msg.sender_type === 'USER' ? <User size={9} className="text-slate-400" /> : msg.sender_type === 'AI' ? <Bot size={9} className="text-blue-400" /> : <Lock size={9} className="text-slate-600" />}
                                <span className={`text-[10px] font-semibold uppercase ${msg.sender_type === 'USER' ? 'text-slate-400' : msg.sender_type === 'AI' ? 'text-blue-500' : 'text-slate-600'}`}>
                                    {msg.sender_type}
                                </span>
                                <span className="text-[10px] text-slate-300">· {timeFmt(msg.created_at)}</span>
                            </div>
                            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${BUBBLE[msg.sender_type] || BUBBLE.USER}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom Panels */}
                <div className="border-t border-slate-200 bg-white">

                    {/* CRO Assignment */}
                    {currentRole === 'CRO' && (
                        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Thread</p>
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <select
                                        value={selectedStaff}
                                        onChange={(e) => setSelectedStaff(e.target.value)}
                                        className="w-full h-9 appearance-none rounded-lg border border-slate-200 px-3.5 pr-8 text-sm focus:border-blue-500 focus:outline-none bg-white text-slate-700 cursor-pointer"
                                    >
                                        <option value="">— Select Staff Member —</option>
                                        {MOCK_STAFF.map((s) => (
                                            <option key={s.name} value={s.name}>{s.name} ({s.role})</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleAssign}
                                    disabled={!selectedStaff}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Human Response Section */}
                    <div className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Human Response</p>
                        {!thread.is_locked ? (
                            <div className="flex items-center space-x-2 text-sm text-slate-400 italic bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                                <Lock size={13} />
                                <span>Take control of this thread to send a clinical response.</span>
                            </div>
                        ) : thread.ownership !== 'HUMAN' ? (
                            <div className="flex items-center space-x-2 text-sm text-slate-400 italic bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                                <Lock size={13} />
                                <span>Controlled by <strong>{thread.ownership}</strong>. Read-only mode.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSend} className="flex space-x-2">
                                <textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder="Enter response to patient..."
                                    rows={2}
                                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!reply.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 disabled:bg-slate-200 disabled:text-slate-400 transition-colors self-end"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
