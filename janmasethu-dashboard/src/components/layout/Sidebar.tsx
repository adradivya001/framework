import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    LayoutDashboard, Stethoscope, Thermometer, Bot,
    List, FileText, Activity, LogOut, Cross
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['CRO', 'DOCTOR', 'NURSE'] },
    { name: 'Doctor Queue', icon: Stethoscope, href: '/doctor-queue', roles: ['CRO', 'DOCTOR'] },
    { name: 'Nurse Queue', icon: Thermometer, href: '/nurse-queue', roles: ['CRO', 'NURSE'] },
    { name: 'AI Threads', icon: Bot, href: '/ai-threads', roles: ['CRO'] },
    { name: 'All Threads', icon: List, href: '/all-threads', roles: ['CRO'] },
    { name: 'Audit Logs', icon: FileText, href: '/audit-logs', roles: ['CRO'] },
    { name: 'System Health', icon: Activity, href: '/system-health', roles: ['CRO'] },
];

const ROLE_BADGE: Record<string, string> = {
    CRO: 'bg-blue-500/20 text-blue-300',
    DOCTOR: 'bg-red-500/20 text-red-300',
    NURSE: 'bg-amber-500/20 text-amber-300',
};

export default function Sidebar() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const menuItems = allMenuItems.filter(
        (item) => !user || item.roles.includes(user.role)
    );

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 flex-shrink-0 border-r border-slate-800">
            {/* Brand */}
            <div className="flex items-center space-x-3 px-5 py-5 border-b border-slate-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
                    <Cross size={17} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-bold text-sm leading-none">Janmasethu</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Control Tower</p>
                </div>
            </div>

            {/* User Profile */}
            {user && (
                <div className="px-4 py-4 border-b border-slate-800">
                    <div className="flex items-center space-x-3 bg-slate-800 rounded-xl p-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-sm font-bold truncate">{user.name}</p>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>
                                    {user.role}
                                </span>
                            </div>
                            {user.email && (
                                <p className="text-slate-500 text-[10px] mt-0.5 truncate">{user.email}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={17} />
                            <span>{item.name}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></div>}
                        </Link>
                    );
                })}
            </nav>

            {/* Sign Out */}
            <div className="px-3 py-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all"
                >
                    <LogOut size={17} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
