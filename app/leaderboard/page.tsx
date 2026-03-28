'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { Trophy, Medal, Star, Shield, Zap, Target } from 'lucide-react';
import api from '@/lib/api';

export default function LeaderboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges'>('leaderboard');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [badges, setBadges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [lbRes, badgeRes] = await Promise.all([
                api.get('/gamification/leaderboard'),
                api.get('/gamification/badges')
            ]);

            // Map backend data to frontend field names
            const mappedLB = (lbRes.data.data || []).map((user: any) => ({
                ...user,
                name: user.display_name,
                points: user.total_points,
                streak: user.weekly_streak,
                avatar: user.avatar_url || '👤'
            }));

            const earnedIds = badgeRes.data.earned || [];
            const mappedBadges = (badgeRes.data.all || []).map((badge: any) => ({
                ...badge,
                earned: earnedIds.includes(badge.id),
                // Map emoji icon to a placeholder or keep as is if UI expects component
                icon: Trophy // Default icon for now, logic below will handle visualization
            }));

            setLeaderboard(mappedLB);
            setBadges(mappedBadges);
        } catch (err) {
            console.error('Failed to fetch leaderboard/badges', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchData();
    }, [router]);

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                        {/* Header & Main Stats */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Trophy className="w-48 h-48" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
                                    <p className="text-blue-100 max-w-md">Keep tracking your mood, habits, and sleep to earn more points and climb the ranks!</p>

                                    <div className="mt-6 inline-flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
                                        <button
                                            onClick={() => setActiveTab('leaderboard')}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'leaderboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}
                                        >
                                            Leaderboard
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('badges')}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'badges' ? 'bg-white text-blue-600 shadow-sm' : 'text-white hover:bg-white/10'}`}
                                        >
                                            My Badges
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-6 text-center">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[120px]">
                                        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total Points</p>
                                        <p className="text-4xl font-bold">1,250</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[120px]">
                                        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Current Rank</p>
                                        <p className="text-4xl font-bold">#3</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        {activeTab === 'leaderboard' ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Medal className="w-5 h-5 text-gray-400" /> Weekly Standings
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {leaderboard.map((user) => (
                                        <div
                                            key={user.rank}
                                            className={`p-4 flex items-center gap-4 transition-colors ${user.isCurrentUser ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-8 font-bold text-center ${user.rank === 1 ? 'text-yellow-500 text-xl' :
                                                user.rank === 2 ? 'text-gray-400 text-lg' :
                                                    user.rank === 3 ? 'text-amber-600 text-lg' :
                                                        'text-gray-400'
                                                }`}>
                                                #{user.rank}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl border">
                                                {user.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-gray-900 ${user.isCurrentUser ? 'text-blue-700' : ''}`}>
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-gray-500">{user.streak} day streak 🔥</p>
                                            </div>
                                            <div className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                                {user.points.toLocaleString()} pts
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {badges.map((badge) => {
                                    return (
                                        <div
                                            key={badge.id}
                                            className={`bg-white rounded-2xl p-6 border text-center transition-all ${badge.earned
                                                ? 'border-gray-200 shadow-sm'
                                                : 'border-gray-100 opacity-60 grayscale hover:grayscale-0 focus-within:grayscale-0'
                                                }`}
                                        >
                                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${badge.id === 'first_mood' ? 'bg-blue-100 text-blue-600' :
                                                badge.id === 'week_streak' ? 'bg-orange-100 text-orange-600' :
                                                    badge.id === 'journal_5' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                <span className="text-3xl">{badge.icon || '🏆'}</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                                            <p className="text-sm text-gray-500 leading-snug">{badge.description}</p>

                                            {!badge.earned && (
                                                <div className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 py-1 px-2 rounded inline-block">
                                                    Locked
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
