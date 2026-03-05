import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ROLE_BADGE: Record<string, string> = {
    CRO: 'bg-blue-100 text-blue-700 border border-blue-200',
    DOCTOR: 'bg-red-100 text-red-700 border border-red-200',
    NURSE: 'bg-amber-100 text-amber-700 border border-amber-200',
};

export default function Navbar() {
    const { user } = useAuth();

    return (
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6 flex-shrink-0">
            <div className="flex flex-1 items-center">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search threads, patients..."
                        className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-slate-50"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                </button>

                {user && (
                    <div className="flex items-center space-x-3">
                        <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role]}`}>
                            {user.role}
                        </span>
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                {user.avatar}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Control Tower</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
