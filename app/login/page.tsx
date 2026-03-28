'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });

            // Assume backend returns token
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                if (response.data.org_id) {
                    localStorage.setItem('org_id', response.data.org_id);
                }
                if (response.data.role) {
                    localStorage.setItem('role', response.data.role);
                }
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
            {/* Left side - Branding/Hero for Login */}
            <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all shadow-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white mb-0.5">Mindful<span className="text-indigo-300">AI</span></span>
                    </Link>
                </div>

                <div className="relative z-10 w-full max-w-sm">
                    <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6 drop-shadow-sm">
                        Unlock your team's mental resilience.
                    </h2>
                    <p className="text-indigo-200/90 text-lg font-medium leading-relaxed mb-8">
                        Join hundreds of innovative companies using MindfulAI to build resilient, high-performing cultures.
                    </p>

                    <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`w-10 h-10 rounded-full border-2 border-indigo-800 bg-indigo-${300 + i * 100} flex items-center justify-center text-[10px] font-bold text-white shadow-lg`}>
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-indigo-200">
                            <strong>1,000+</strong> users
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none md:hidden z-0"></div>

                <div className="w-full max-w-[400px] relative z-10">
                    <div className="text-center md:text-left mb-10">
                        <div className="md:hidden flex justify-center mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Brain className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-500 font-medium text-lg">Log in to your workspace.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/google`}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group mb-6 hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.69-2.3 1.1-3.71 1.1-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.87 14.06c-.22-.66-.35-1.36-.35-2.06s.13-1.4.35-2.06V7.1H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.9l3.69-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.1l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-[#f8fafc] text-slate-400 font-bold tracking-widest uppercase text-[10px]">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Work Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm placeholder:text-slate-400 font-medium"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm placeholder:text-slate-400 font-medium font-mono tracking-widest"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-1 pb-4">
                            <label className="flex items-center cursor-pointer group">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 w-4 h-4 transition-colors" />
                                <span className="ml-2 text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm font-semibold text-slate-500 mt-8">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                            Request access
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
