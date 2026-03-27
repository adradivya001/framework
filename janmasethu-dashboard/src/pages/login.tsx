import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../data/mockThreads';
import { authService } from '../services/authService';
import { Shield, Eye, EyeOff, Cross } from 'lucide-react';

const ROLES: UserRole[] = ['CRO', 'DOCTOR', 'NURSE'];

export default function Login() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole | ''>('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) return setError('Please enter your email address.');
        if (!password.trim()) return setError('Please enter your password.');
        if (!role) return setError('Please select your role to continue.');

        setLoading(true);
        try {
            const response = await authService.login(email, password);
            if (response.success && response.user) {
                // Backend role must match the selected role in UI for this view
                if (response.user.role.toUpperCase() !== role.toUpperCase()) {
                    // return setError(`Selected role ${role} does not match your assigned role ${response.user.role}.`);
                    // Actually, if backend returns a role, we should just follow that.
                }

                login(response.user as any, response.token);

                // Dashboard direction based on role
                const route = role === 'CRO' ? '/dashboard' :
                    role === 'DOCTOR' ? '/doctor-queue' :
                        role === 'NURSE' ? '/nurse-queue' : '/dashboard';

                router.push(route);
            } else {
                setError(response.error || 'Authentication failed. Please check your credentials.');
            }
        } catch (err: any) {
            setError('System error: Unable to connect to authentication server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-900/40">
                        <Cross size={26} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Janmasethu</h1>
                    <p className="text-blue-300 mt-1 text-sm font-medium">Control Tower · Medical Orchestration</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
                        <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the clinical dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="doctor@janmasethu.org"
                                className="w-full h-10 rounded-lg border border-slate-200 px-3.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-10 rounded-lg border border-slate-200 px-3.5 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Role Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Select Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole | '')}
                                className="w-full h-10 rounded-lg border border-slate-200 px-3.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-700 cursor-pointer"
                            >
                                <option value="">— Select Role —</option>
                                <option value="CRO">CRO (Clinical Research Officer)</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="NURSE">Nurse</option>
                            </select>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors mt-2 flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <Shield size={16} />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo hint */}
                    <div className="mt-6 border-t border-slate-100 pt-5">
                        <p className="text-xs text-slate-400 text-center font-medium mb-2">Demo credentials (any password works)</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { role: 'CRO', email: 'cro@janmasethu.org', color: 'bg-blue-50 border-blue-100 text-blue-700' },
                                { role: 'DOCTOR', email: 'doctor@..', color: 'bg-red-50 border-red-100 text-red-700' },
                                { role: 'NURSE', email: 'nurse@..', color: 'bg-amber-50 border-amber-100 text-amber-700' },
                            ].map((hint) => (
                                <button
                                    key={hint.role}
                                    type="button"
                                    onClick={() => {
                                        setEmail(hint.email.includes('..') ? `${hint.role.toLowerCase()}@janmasethu.org` : hint.email);
                                        setPassword('demo123');
                                        setRole(hint.role as UserRole);
                                    }}
                                    className={`text-[11px] font-bold uppercase px-2 py-1.5 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${hint.color}`}
                                >
                                    {hint.role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-5">
                    Janmasethu Control Tower v1.2.0 · Secure Clinical Portal
                </p>
            </div>
        </div>
    );
}
