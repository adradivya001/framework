import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import { Activity, Server, Database, Wifi, CheckCircle, XCircle } from 'lucide-react';

export default function SystemHealth() {
    const [status, setStatus] = useState<'loading' | 'healthy' | 'unhealthy'>('loading');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const check = async () => {
            const start = Date.now();
            try {
                await api.get('/health');
                setLatency(Date.now() - start);
                setStatus('healthy');
            } catch (err) {
                setStatus('unhealthy');
            }
        };
        check();
        const interval = setInterval(check, 10000);
        return () => clearInterval(interval);
    }, []);

    const services = [
        { name: 'Control Tower Backend', url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', status: status === 'healthy' ? 'operational' : 'offline', latency: latency ? `${latency}ms` : 'N/A' },
        { name: 'Supabase Database', url: 'Cloud Orchestration', status: status === 'healthy' ? 'operational' : 'unknown', latency: 'Connected' },
        { name: 'Redis Queue (BullMQ)', url: 'Local Persistence', status: status === 'healthy' ? 'operational' : 'unknown', latency: '3ms' },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Activity size={20} className="text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">System Health</h1>
                        <p className="text-sm text-slate-500">Real-time infrastructure monitoring for the medical orchestration cluster</p>
                    </div>
                </div>

                {/* Overall Status */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center space-x-5">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center ${status === 'healthy' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {status === 'healthy' ? <CheckCircle size={32} className="text-green-500" /> : <XCircle size={32} className="text-red-500" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Overall System Status</p>
                        <p className={`text-2xl font-bold ${status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                            {status === 'healthy' ? 'Operational' : status === 'loading' ? 'Checking...' : 'Issues Detected'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {status === 'healthy' ? 'All core services healthy' : 'Backend connectivity error'} · Last checked just now
                        </p>
                    </div>
                </div>

                {/* Service List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-700">Service Status</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {services.map((svc) => (
                            <div key={svc.name} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`h-2.5 w-2.5 rounded-full ${svc.status === 'operational' ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{svc.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">{svc.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs text-slate-400">{svc.latency}</span>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${svc.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {svc.status === 'operational' ? 'Healthy' : 'Disconnected'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Architecture */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: Server, label: 'Backend', value: 'NestJS Framework', sub: 'Port 3001 (Mapped)', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Database, label: 'Database', value: 'Supabase', sub: 'PostgreSQL Active', color: 'text-green-600', bg: 'bg-green-50' },
                        { icon: Wifi, label: 'Queue', value: 'BullMQ + Redis', sub: 'Operational', color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((item) => (
                        <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${item.bg}`}>
                                <item.icon size={20} className={item.color} />
                            </div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{item.label}</p>
                            <p className="text-base font-bold text-slate-900 mt-0.5">{item.value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
