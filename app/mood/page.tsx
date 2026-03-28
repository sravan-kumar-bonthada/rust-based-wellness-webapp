'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import MoodForm from '@/components/Mood/MoodForm';
import { LineChart, Activity, Calendar } from 'lucide-react';
import api from '@/lib/api';

export default function MoodPage() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/mood');
            setHistory(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch mood history', err);
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
        fetchHistory();
    }, [router]);

    const handleLogMood = async (data: any) => {
        try {
            await api.post('/mood', {
                mood_score: data.score,
                notes: data.note,
                emotions: [] // Default for now
            });
            fetchHistory();
        } catch (err) {
            console.error('Failed to log mood', err);
        }
    };

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 animate-fade-in">

                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Mood Tracking</h1>
                                <p className="text-gray-500 mt-1">Log how you feel to discover patterns over time.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                    <LineChart className="w-4 h-4" /> Analytics
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Form */}
                            <div className="lg:col-span-1">
                                <MoodForm onSubmit={handleLogMood} />

                                {/* Mini Stats */}
                                <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500" /> Weekly Stats
                                    </h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Average Mood</span>
                                        <span className="font-bold text-gray-900">6.8 / 10</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Entries This Week</span>
                                        <span className="font-bold text-gray-900">{history.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - History */}
                            <div className="lg:col-span-2 space-y-4">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-gray-500" /> Recent History
                                </h2>

                                <div className="space-y-4">
                                    {isLoading ? (
                                        <div className="animate-pulse space-y-4">
                                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/50 rounded-xl" />)}
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="bg-white rounded-xl p-8 border border-dashed border-gray-300 text-center">
                                            <p className="text-gray-500">No mood entries yet. How are you feeling today?</p>
                                        </div>
                                    ) : (
                                        history.map((entry) => (
                                            <div key={entry.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-start gap-4 animate-fade-in">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl ${entry.mood_score >= 8 ? 'bg-blue-100 border-blue-200' :
                                                    entry.mood_score >= 6 ? 'bg-green-100 border-green-200' :
                                                        entry.mood_score >= 4 ? 'bg-yellow-100 border-yellow-200' :
                                                            entry.mood_score >= 3 ? 'bg-orange-100 border-orange-200' :
                                                                'bg-red-100 border-red-200'
                                                    } border`}>
                                                    {entry.mood_score >= 8 ? '🤩' : entry.mood_score >= 6 ? '🙂' : entry.mood_score >= 4 ? '😐' : entry.mood_score >= 3 ? '😞' : '😭'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="font-medium text-gray-900">Score: {entry.mood_score}/10</p>
                                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                                            {new Date(entry.logged_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {entry.note && (
                                                        <p className="text-gray-600 text-sm mt-1">{entry.note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
