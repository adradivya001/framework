"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased font-sans">
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* SIDEBAR NAVIGATION MOCKUP */}
            <aside className="w-64 border-r border-slate-200 bg-white/50 backdrop-blur-xl hidden lg:flex flex-col p-6">
              <div className="flex items-center gap-2 mb-10">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">J</div>
                <span className="font-outfit text-xl font-bold tracking-tight">JanmaSethu</span>
              </div>

              <nav className="space-y-4 flex-1">
                <NavItem icon="📊" label="Mission Control" active />
                <NavItem icon="💬" label="Active Chats" count={24} />
                <NavItem icon="🩺" label="Vitals Monitor" />
                <NavItem icon="📅" label="Appointments" />
                <NavItem icon="📂" label="Case Records" />
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div>
                  <p className="text-sm font-semibold">Dr. Divya</p>
                  <p className="text-[10px] text-slate-500 font-medium">Head Physician</p>
                </div>
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass text-sm font-medium',
              duration: 5000,
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}

function NavItem({ icon, label, active = false, count }: any) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' : 'text-slate-500 hover:bg-slate-100'}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      </div>
      {count && (
        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}
