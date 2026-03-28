'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Trophy,
    Users,
    Smile,
    Zap,
    Flame,
    TrendingUp,
    Target,
    Award,
    ChevronRight,
    Map
} from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    display_name: string;
    avatar_url: string | null;
    total_points: number;
    level: number;
    weekly_streak: number;
}

export default function TeamWellness() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const res = await api.get('/gamification/leaderboard');
                setLeaderboard(res.data.data);
            } catch (err) {
                console.error('Failed to fetch team leaderboard', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeamData();
    }, []);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-12 animate-fade-in pt-24">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                    <Trophy className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-indigo-600 tracking-tight">Team Wellbeing Challenge</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                    Wellness Leaderboard
                </h1>
                <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                    Celebrate progress together. Earn points by completing habits, logging moods, and engaging in mindfulness exercises.
                </p>
            </div>

            {/* Podium */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-10">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="w-full md:w-64 bg-white rounded-t-3xl border-x border-t border-slate-100 shadow-sm p-8 text-center space-y-4 animate-slide-up animation-delay-500 order-2 md:order-1">
                        <div className="relative inline-block">
                            <div className="h-20 w-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center font-black text-2xl text-slate-400 border-4 border-slate-50 shadow-inner">
                                {topThree[1].display_name[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">2</div>
                        </div>
                        <div>
                            <p className="font-black text-slate-800 truncate">{topThree[1].display_name}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Level {topThree[1].level}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl py-3 px-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase">Points</span>
                            <span className="font-black text-slate-800">{topThree[1].total_points}</span>
                        </div>
                        <div className="h-24 bg-slate-50/50 rounded-t-xl -mb-8"></div>
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="w-full md:w-72 bg-white rounded-t-3xl border-x border-t border-indigo-100 shadow-xl shadow-indigo-100/30 p-10 text-center space-y-4 animate-slide-up order-1 md:order-2 z-10 scale-105 md:scale-110">
                        <div className="relative inline-block mb-2">
                            <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-amber-400 filter drop-shadow-md" />
                            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-amber-50 to-amber-100 mx-auto flex items-center justify-center font-black text-3xl text-amber-600 border-4 border-amber-200 shadow-inner">
                                {topThree[0].display_name[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white shadow-md">1</div>
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-lg truncate">{topThree[0].display_name}</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Master</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Level {topThree[0].level}</span>
                            </div>
                        </div>
                        <div className="bg-indigo-600 rounded-2xl py-4 px-6 flex items-center justify-between text-white shadow-lg shadow-indigo-200">
                            <span className="text-xs font-bold opacity-80 uppercase">Total Score</span>
                            <span className="font-black text-xl">{topThree[0].total_points}</span>
                        </div>
                        <div className="h-32 bg-indigo-50/50 rounded-t-xl -mb-10"></div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="w-full md:w-64 bg-white rounded-t-3xl border-x border-t border-slate-100 shadow-sm p-8 text-center space-y-4 animate-slide-up animation-delay-700 order-3">
                        <div className="relative inline-block">
                            <div className="h-20 w-20 rounded-full bg-orange-50 mx-auto flex items-center justify-center font-black text-2xl text-orange-400 border-4 border-orange-100 shadow-inner">
                                {topThree[2].display_name[0].toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-orange-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white">3</div>
                        </div>
                        <div>
                            <p className="font-black text-slate-800 truncate">{topThree[2].display_name}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Level {topThree[2].level}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl py-3 px-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase">Points</span>
                            <span className="font-black text-slate-800">{topThree[2].total_points}</span>
                        </div>
                        <div className="h-16 bg-slate-50/50 rounded-t-xl -mb-8"></div>
                    </div>
                )}
            </div>

            {/* Rest of the leaderboard */}
            <div className="glass-card max-w-4xl mx-auto overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Full Ranking
                    </h3>
                    <button className="text-xs font-bold text-indigo-600 hover:scale-105 transition-transform">VIEW ALL</button>
                </div>
                <div className="divide-y divide-slate-50">
                    {rest.map((entry) => (
                        <div key={entry.rank} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-6">
                                <span className="w-6 text-sm font-black text-slate-300 group-hover:text-indigo-500 transition-colors">#{entry.rank}</span>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                        {entry.display_name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{entry.display_name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level {entry.level}</span>
                                            {entry.weekly_streak > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                                                    <Flame className="w-3 h-3" /> {entry.weekly_streak} DAY STREAK
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="font-black text-slate-800 leading-none">{entry.total_points}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))}
                    {rest.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-medium">
                            Join the challenge to see more team rankings!
                        </div>
                    )}
                </div>
            </div>

            {/* Team Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-8 space-y-4">
                    <div className="bg-green-100 p-3 rounded-2xl w-max text-green-600">
                        <Smile className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900">Highest Happiness</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Design Team has the highest average mood score this week at 8.4/10. Keep it up!
                    </p>
                </div>
                <div className="glass-card p-8 space-y-4">
                    <div className="bg-amber-100 p-3 rounded-2xl w-max text-amber-600">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900">Efficiency Boost</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Org-wide meditation minutes are up 40% this morning. Afternoon focus scores expected to rise.
                    </p>
                </div>
                <div className="glass-card p-8 space-y-4">
                    <div className="bg-indigo-100 p-3 rounded-2xl w-max text-indigo-600">
                        <Award className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900">Top Streaks</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        12 people have a 7+ day wellness streak. The team is building consistent healthy habits!
                    </p>
                </div>
            </div>
        </main>
    );
}
