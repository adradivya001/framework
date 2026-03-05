import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Activity, Server, Database, Wifi, CheckCircle } from 'lucide-react';

const services = [
    { name: 'Control Tower Backend', url: 'http://localhost:3000', status: 'operational', latency: '12ms' },
    { name: 'Supabase Database', url: 'vhedpucowbjabgiklyea.supabase.co', status: 'operational', latency: '48ms' },
    { name: 'Redis Queue (BullMQ)', url: 'localhost:6379', status: 'operational', latency: '3ms' },
    { name: 'Sakhi AI Chatbot', url: 'Upstream Integration', status: 'operational', latency: 'N/A' },
    { name: 'BERT Risk Engine', url: 'ngrok endpoint', status: 'degraded', latency: '320ms' },
];

export default function SystemHealth() {
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
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Overall System Status</p>
                        <p className="text-2xl font-bold text-green-600">Operational</p>
                        <p className="text-xs text-slate-400 mt-0.5">4 of 5 services healthy · Last checked just now</p>
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
                                    <div className={`h-2.5 w-2.5 rounded-full ${svc.status === 'operational' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{svc.name}</p>
                                        <p className="text-xs text-slate-400 font-mono">{svc.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs text-slate-400">{svc.latency}</span>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${svc.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {svc.status === 'operational' ? 'Healthy' : 'Degraded'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Architecture */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: Server, label: 'Backend', value: 'NestJS v11', sub: 'Port 3000', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: Database, label: 'Database', value: 'Supabase', sub: 'PostgreSQL 15', color: 'text-green-600', bg: 'bg-green-50' },
                        { icon: Wifi, label: 'Queue', value: 'BullMQ + Redis', sub: 'v5.70 · Port 6379', color: 'text-purple-600', bg: 'bg-purple-50' },
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
