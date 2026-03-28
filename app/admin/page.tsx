'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Activity,
    Smile,
    Zap,
    Moon,
    TrendingUp,
    AlertTriangle,
    Users,
    BarChart3,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

interface Analytics {
    total_members: number;
    daily_active_users: number;
    engagement_rate_pct: number;
    avg_mood_7d: number | null;
    habit_completion_rate_pct: number;
    avg_sleep_hours_7d: number | null;
    crisis_events_30d: number;
    mood_trend: { day: string; avg_mood: number }[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch admin analytics', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!data) return (
        <div className="p-8 text-center text-slate-500">
            Access Denied. Admin privileges required.
        </div>
    );

    const stats = [
        {
            name: 'Total Employees',
            value: data.total_members,
            icon: Users,
            color: 'bg-blue-500',
            change: '+2%',
            trend: 'up'
        },
        {
            name: 'Engagement Rate',
            value: `${data.engagement_rate_pct}%`,
            icon: Zap,
            color: 'bg-amber-500',
            change: '+5.4%',
            trend: 'up'
        },
        {
            name: 'Avg. Team Mood',
            value: data.avg_mood_7d ? `${data.avg_mood_7d}/10` : 'N/A',
            icon: Smile,
            color: 'bg-green-500',
            change: '-0.2%',
            trend: 'down'
        },
        {
            name: 'Habit Completion',
            value: `${data.habit_completion_rate_pct}%`,
            icon: Activity,
            color: 'bg-indigo-500',
            change: '+1.2%',
            trend: 'up'
        },
    ];

    return (
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pt-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-indigo-500" />
                        Executive Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Org-wide wellness analytics and employee engagement</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last 30 Days
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-2xl">
                {stats.map((stat) => (
                    <div key={stat.name} className="glass-card p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-200`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend === 'up' ? 'text-green-500' : 'text-rose-500'}`}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {stat.change}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">{stat.name}</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Mood Trend Chart (Simplified representation) */}
                <div className="lg:col-span-2 glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Organization Mood Trend</h2>
                            <p className="text-sm text-slate-400 font-medium">Daily average across all reporting employees</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                        {data.mood_trend.length > 0 ? (
                            data.mood_trend.map((point, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                    <div
                                        className="w-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-all rounded-t-lg relative"
                                        style={{ height: `${point.avg_mood * 10}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Score: {point.avg_mood.toFixed(1)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 rotate-45 md:rotate-0 origin-left">
                                        {point.day.split('-').slice(1).join('/')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest">
                                Insufficient Data for Trend
                            </div>
                        )}
                    </div>
                </div>

                {/* Alerts & Risk */}
                <div className="glass-card p-8 border-rose-100 bg-rose-50/10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Health Alerts</h2>
                        <AlertTriangle className="w-6 h-6 text-rose-500" />
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex items-start gap-4">
                            <div className="bg-rose-100 p-2 rounded-xl text-rose-500 mt-0.5">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    Crisis Events: {data.crisis_events_30d}
                                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase">Priority</span>
                                </h4>
                                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                    Employees reaching out to crisis resources. Anonymized overview available in detailed reports.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4">
                            <div className="bg-amber-100 p-2 rounded-xl text-amber-500 mt-0.5">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Engagement Dip</h4>
                                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                    Community activity is down 12% compared to last period. Tip: Launch a team habit challenge.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900 rounded-2xl text-white mt-10 relative overflow-hidden">
                            <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white/5 -rotate-12" />
                            <h4 className="font-bold text-lg relative z-10">AI Wellbeing Score</h4>
                            <p className="text-xs text-slate-400 font-medium mt-1 relative z-10">
                                Predicted team burnout risk: <span className="text-green-400 font-bold">LOW</span>
                            </p>
                            <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl transition-all border border-white/20 text-xs">
                                Read AI Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
