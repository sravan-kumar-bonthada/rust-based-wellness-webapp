'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Smile, CheckSquare, Moon, TrendingUp, AlertCircle,
    Shield, BarChart3,
    Sparkles, Trophy, Users, Zap, ArrowRight, Activity,
    Calendar, Clock, Heart, BookOpen, Music
} from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import api from '@/lib/api';

export default function Dashboard() {
    const router = useRouter();
    const [summary, setSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchSummary = async () => {
            try {
                const res = await api.get('/users/me/dashboard-summary');
                setSummary(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard summary', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, [router]);

    // Simple SVG Line Chart for Mood History
    const MoodChart = ({ history }: { history: any[] }) => {
        if (!history || history.length < 2) return <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Need more data for trends...</div>;

        const data = [...history].reverse(); // Oldest to newest
        const width = 300;
        const height = 100;
        const padding = 20;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = (1 - (d.mood_score / 10)) * (height - 2 * padding) + padding;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="w-full h-32 relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-lg">
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                    <polyline
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                        className="animate-[draw_2s_ease-out]"
                    />
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
                        const y = (1 - (d.mood_score / 10)) * (height - 2 * padding) + padding;
                        return (
                            <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" className="hover:scale-150 transition-transform cursor-pointer" />
                        );
                    })}
                </svg>
            </div>
        );
    };

    const WellnessScore = ({ score }: { score: number }) => {
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle
                        cx="64" cy="64" r={radius} fill="none" stroke="url(#scoreGradient)" strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#9333ea" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-3xl font-black text-slate-900 leading-none">{score}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Score</span>
                </div>
            </div>
        );
    };

    const calculateWellnessScore = () => {
        if (!summary) return 0;
        let score = 0;
        // Points contribution (max 40)
        score += Math.min(40, ((summary.points || 0) / 1000) * 40);
        // Habit contribution (max 30)
        const totalHabits = summary?.habits?.total || 0;
        if (totalHabits > 0) {
            score += ((summary.habits.completed || 0) / totalHabits) * 30;
        }
        // Mood contribution (max 30)
        const moodScore = summary.mood?.latest || 5;
        score += moodScore * 3;
        return Math.round(score);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-transparent">
                <Sidebar />
                <div className="flex-1 flex flex-col md:pl-64">
                    <Navbar />
                    <main className="flex-1 pt-24">
                        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                            <div className="h-12 w-64 bg-white/40 animate-pulse rounded-xl" />
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 h-32 bg-white/40 animate-pulse rounded-[2.5rem]" />
                                <div className="lg:col-span-4 h-32 bg-white/40 animate-pulse rounded-[2.5rem]" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/40 animate-pulse rounded-3xl" />)}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 pb-10">

                        {/* Top Section: Greeting & Wellness Score */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8 flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider border border-indigo-100 italic">
                                        {summary?.org_name || 'Individual'} Workspace
                                    </span>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">• {summary?.team_size || 1} Members</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                    {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{summary?.user_name || 'User'}</span>
                                </h1>
                                <p className="text-xl text-slate-500 mt-4 font-medium leading-relaxed max-w-xl">
                                    Your wellness journey is looking solid today. You've hit {summary?.habits?.completed || 0} habits and earned {summary?.points || 0} total points.
                                </p>
                            </div>
                            <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center justify-around gap-4 hover:shadow-md transition-shadow">
                                <div className="space-y-1 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-slate-900">Personal Index</h3>
                                    <p className="text-sm text-slate-500 font-medium">Daily health score</p>
                                </div>
                                <WellnessScore score={calculateWellnessScore()} />
                            </div>
                        </div>

                        {/* B2B Insight Section (Admin Only) */}
                        {summary?.org_role === 'admin' && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2.5rem] p-8 border border-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">
                                        <Shield size={12} /> Admin Insights
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Your Team's Wellness is Improving</h3>
                                    <p className="text-slate-500 text-sm font-medium">Activity is up 15% across {summary?.org_name} this week.</p>
                                </div>
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-2xl shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center gap-2 text-sm"
                                >
                                    <BarChart3 size={18} />
                                    View Detailed Analytics
                                </button>
                            </div>
                        )}

                        {/* Quick Dashboard Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Points Stat */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                    <Trophy size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Points</p>
                                    <p className="text-3xl font-black text-slate-900">{summary?.points?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            {/* Streak Stat */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <Zap size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Max Streak</p>
                                    <p className="text-3xl font-black text-slate-900">{summary?.habits?.max_streak || 0} <span className="text-sm">days</span></p>
                                </div>
                            </div>

                            {/* Community Stat */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                                    <Users size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Community</p>
                                    <p className="text-3xl font-black text-slate-900">{summary?.community?.new_posts || 0} <span className="text-sm">new</span></p>
                                </div>
                            </div>

                            {/* Sleep Stat */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                    <Moon size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sleep</p>
                                    <p className="text-3xl font-black text-slate-900">{summary?.sleep?.hours?.toFixed(1) || 0} <span className="text-sm">hrs</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Trends & Recommendations */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Mood Trend */}
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">Mood Trend</h2>
                                        <p className="text-slate-400 font-medium">Your emotional journey over 7 days</p>
                                    </div>
                                    <div className="px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-sm font-bold flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Improving
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <MoodChart history={summary?.mood?.history} />
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">
                                    <span>Older</span>
                                    <span>Today</span>
                                </div>
                            </div>

                            {/* Recommended Meditation */}
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 blur-2xl"></div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-2 text-indigo-200 uppercase tracking-widest text-[10px] font-black mb-6">
                                        <Sparkles className="w-4 h-4" /> Pick of the day
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Guided Meditation</h3>
                                    <p className="text-indigo-100 mb-8 opacity-90 line-clamp-2">
                                        Based on your current mood, we think you'll benefit from:
                                        {summary?.recommendation?.title ? ` "${summary.recommendation.title}"` : " a quick breathing session."}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                <Music size={14} />
                                            </div>
                                            {summary?.recommendation?.duration_seconds ? `${Math.floor(summary.recommendation.duration_seconds / 60)} mins` : '5 mins'}
                                        </div>
                                        <button
                                            onClick={() => router.push('/meditations')}
                                            className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:scale-110 transition shadow-lg group-active:scale-95"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Insight Box */}
                        <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl group">
                            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(79,70,229,0.1),transparent)] group-hover:opacity-60 transition-opacity"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-indigo-500/20 shadow-2xl flex-shrink-0 animate-pulse">
                                    <Activity className="text-white w-10 h-10" />
                                </div>
                                <div className="space-y-4 text-center md:text-left">
                                    <h4 className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">Personalized AI Insight</h4>
                                    <p className="text-white text-xl md:text-2xl font-medium leading-relaxed italic">
                                        "{summary?.ai_tip || "Stay consistent with your habits to unlock deeper mental health insights."}"
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            <style jsx global>{`
                @keyframes draw {
                    from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
                    to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
}
