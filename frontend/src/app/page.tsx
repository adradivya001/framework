"use client";

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Activity, Users, AlertTriangle, Clock,
  ShieldAlert, TrendingUp, Inbox, CheckCircle
} from 'lucide-react';

// --- MOCK DATA FOR THE UI MOCKUP ---
const MOCK_RISK = [
  { name: 'Critical (Red)', value: 12, color: '#ef4444' },
  { name: 'Moderate (Yellow)', value: 25, color: '#f59e0b' },
  { name: 'Stable (Green)', value: 84, color: '#22c55e' },
];

const MOCK_LOAD = [
  { name: 'Dr. Divya', threads: 15 },
  { name: 'Dr. Sarah', threads: 18 },
  { name: 'Dr. Rahul', threads: 8 },
  { name: 'Nurse Anjali', threads: 24 },
];

export default function MissionControl() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mission Control
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Janmasethu Clinical OS Dashboard • Real-time Monitoring Active
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="glass px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-white/90">
            <ShieldAlert size={18} className="text-red-500" />
            Audit Ledger
          </button>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            + New Consultation
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Threads" value="121" icon={<Inbox className="text-primary" />} trend="+12% from yesterday" />
        <StatCard title="SLA Pulse" value="4.2m" icon={<Clock className="text-amber-500" />} trend="Avg response time" />
        <StatCard title="Risk Breaches" value="3" icon={<AlertTriangle className="text-red-500" />} trend="Requires Immediate Action" alert />
        <StatCard title="Patient Intake" value="48" icon={<Users className="text-emerald-500" />} trend="Last 24 hours" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RISK DISTRIBUTION CHART */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="text-primary" /> Risk Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_RISK}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {MOCK_RISK.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CLINICIAN LOAD */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Clinician Workload
          </h3>
          <div className="space-y-4">
            {MOCK_LOAD.map((cl, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{cl.name}</p>
                  <div className="w-48 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(cl.threads / 30) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">{cl.threads} Threads</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button className="text-primary text-sm font-semibold hover:underline">
              View All Workforce Stats →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, alert = false }: any) {
  return (
    <div className={`p-6 rounded-2xl transition-all duration-300 ${alert ? 'bg-red-50 border-2 border-red-100' : 'glass hover:scale-[1.02]'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        {alert && <div className="animate-pulse flex h-3 w-3 rounded-full bg-red-400" />}
      </div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-slate-900">{value}</h3>
      <p className={`text-[10px] mt-2 font-medium ${alert ? 'text-red-600' : 'text-slate-400'}`}>
        {trend}
      </p>
    </div>
  );
}
