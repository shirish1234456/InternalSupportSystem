'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Eye, EyeOff, Activity, MessageSquare, MapPin, Network, BarChart3, Zap, Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to authenticate');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('System anomaly detected. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans text-slate-900 dark:text-white bg-slate-50 dark:bg-transparent">
            
            {/* Left Side: Dramatic Image Presentation */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                {/* Dark gradient overlay to ensure text is readable */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-950 z-10" />
                <div className="absolute inset-0 bg-primary-900/20 mix-blend-overlay z-10" />
                
                {/* Abstract tech image */}
                <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                    alt="Abstract data architecture" 
                    className="absolute inset-0 w-full h-full object-cover scale-105 transform hover:scale-100 transition-transform duration-[10s] ease-out opacity-80"
                />

                <div className="relative z-20 max-w-xl p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-8 animate-float">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
                        Intelligence at Scale
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed font-medium drop-shadow-sm max-w-md mx-auto">
                        Streamline your entire support operation with real-time telemetry, unified insights, and uncompromising security protocols.
                    </p>
                </div>
                
                {/* Footer text specific to left pane */}
                <div className="absolute bottom-8 text-xs text-slate-400 font-mono tracking-widest z-20 uppercase">
                    Aether Insights Architecture
                </div>
            </div>

            {/* Right Side: The Login Card Interface */}
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                
                {/* Corner Markers (adapted to the container) */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-slate-400/30 dark:border-slate-700/50 pointer-events-none hidden sm:block" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-slate-400/30 dark:border-slate-700/50 pointer-events-none hidden sm:block" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-slate-400/30 dark:border-slate-700/50 pointer-events-none hidden sm:block" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-slate-400/30 dark:border-slate-700/50 pointer-events-none hidden sm:block" />

                {/* Faint Background Icons */}
                <MessageSquare className="absolute top-20 left-[15%] w-32 h-32 text-slate-400 dark:text-slate-500 opacity-20 dark:opacity-[0.05] blur-sm pointer-events-none" />
                <MapPin className="absolute top-[40%] left-[5%] w-24 h-24 text-slate-400 dark:text-slate-500 opacity-20 dark:opacity-[0.05] blur-sm pointer-events-none" />
                <Network className="absolute right-[15%] top-[60%] w-28 h-28 text-primary-500 dark:text-cyan-500 opacity-10 dark:opacity-[0.03] blur-[2px] pointer-events-none" />
                
                <div className="absolute bottom-10 right-[10%] opacity-20 dark:opacity-10 blur-[1px] pointer-events-none bg-primary-100/50 dark:bg-indigo-900/10 rounded-3xl p-6">
                     <BarChart3 className="w-32 h-32 text-primary-500 dark:text-indigo-400" />
                </div>

                <div className="max-w-[420px] w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
                    {/* Main Card */}
                    <div className="glass-card rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/40 dark:border-slate-800/80">
                        {/* Subtle top edge highlight */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-slate-600/30 to-transparent" />
                        
                        <div className="p-8 sm:p-10">
                            {/* Header */}
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Activity className="w-7 h-7 text-primary-500 dark:text-cyan-400 dark:shadow-cyan-400/50 drop-shadow-sm" />
                                <h1 className="text-[22px] font-bold tracking-tight">
                                    <span>ChatSupport</span>{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400">Analytics</span>
                                </h1>
                            </div>
                            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-500 text-center mb-10 text-nowrap">
                                UNLOCK INSIGHTS. EMPOWER CONVERSATIONS.
                            </p>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Email */}
                                <div>
                                    <label className="block text-[11px] font-bold tracking-widest text-primary-600 dark:text-cyan-500 mb-2.5 uppercase">
                                        Operator ID / Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-400 font-bold text-lg leading-none">@</span>
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            autoComplete="email"
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/80 rounded-[1rem] sm:rounded-[1.25rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-sky-500/50 focus:border-primary-400 dark:focus:border-sky-400 transition-all text-sm font-medium disabled:opacity-60 shadow-sm"
                                            placeholder="nexus.id@aether.ai"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="flex justify-between items-center mb-2.5">
                                        <label className="block text-[11px] font-bold tracking-widest text-primary-600 dark:text-cyan-500 uppercase">
                                            Access Cipher
                                        </label>
                                        <span className="text-[9px] tracking-wide text-slate-400 dark:text-slate-500 uppercase cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                                            Lost access?
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                            autoComplete="current-password"
                                            required
                                            className="block w-full pl-12 pr-12 py-3.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/80 rounded-[1rem] sm:rounded-[1.25rem] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-sky-500/50 focus:border-primary-400 dark:focus:border-sky-400 transition-all text-[15px] font-bold tracking-widest disabled:opacity-60 shadow-sm"
                                            placeholder="•••••••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    id="login-btn"
                                    disabled={loading}
                                    className="mt-8 w-full flex justify-center items-center gap-2 py-4 px-4 bg-gradient-to-r from-primary-500 to-indigo-500 dark:from-[#60a5fa] dark:to-[#a78bfa] text-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] rounded-full text-[12px] font-bold tracking-[0.15em] uppercase transition-all shadow-lg shadow-primary-500/30 dark:shadow-[0_0_20px_rgba(96,165,250,0.4)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(96,165,250,0.6)] border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Authorizing
                                        </>
                                    ) : (
                                        <>
                                            Authenticate
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Card Footer Status */}
                        <div className="px-8 py-5 border-t border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0d1017]/80 flex justify-between items-center text-[9px] tracking-widest text-slate-500 font-mono uppercase">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-cyan-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] dark:shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                                System Ready
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                v4.2.0-Alpha <Zap className="w-2.5 h-2.5 text-primary-500/50 dark:text-cyan-600/50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Absolute Terms text */}
            <div className="absolute bottom-6 left-6 lg:left-1/2 lg:ml-6 text-[10px] tracking-widest text-slate-400 dark:text-slate-600 font-mono flex items-center gap-6">
                <span className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 transition-colors">PRIVACY_PROTOCOL</span>
                <span className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-400 transition-colors">TERMS OF MATRIX</span>
            </div>
            <div className="absolute bottom-6 right-6 text-[10px] tracking-widest text-slate-400 dark:text-slate-600 font-mono hidden md:block cursor-default hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                © 2024 AETHER INSIGHTS
            </div>
        </div>
    );
}
