'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { Moon, Sun, Clock, History, BarChart2 } from 'lucide-react';
import api from '@/lib/api';

export default function SleepPage() {
    const router = useRouter();
    const [sleepScore, setSleepScore] = useState(0);
    const [sleepData, setSleepData] = useState<any[]>([]);
    const [aiSuggestion, setAiSuggestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [historyRes, suggestionRes] = await Promise.all([
                api.get('/sleep'),
                api.get('/sleep/suggestions')
            ]);
            setSleepData(historyRes.data.data || []);
            setAiSuggestion(suggestionRes.data.suggestion || '');

            if (historyRes.data.data?.length > 0) {
                setSleepScore(historyRes.data.data[0].quality_score * 10 || 0);
            }
        } catch (err) {
            console.error('Failed to fetch sleep data', err);
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

                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Sleep Dashboard</h1>
                                <p className="text-gray-500 mt-1">Track your rest to optimize your mood and energy.</p>
                            </div>
                            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
                                <Moon className="w-5 h-5" /> Log Sleep
                            </button>
                        </header>

                        {/* Main Stats Area */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Overall Score */}
                            <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="relative w-40 h-40 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                                        <circle
                                            cx="50" cy="50" r="45"
                                            fill="none"
                                            stroke="#4f46e5"
                                            strokeWidth="8"
                                            strokeDasharray={`${(sleepScore / 100) * 283} 283`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-gray-900">{sleepScore}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mt-6 mb-1">Optimal Rest</h3>
                                <p className="text-gray-500 text-sm">Your sleep efficiency has improved by 12% this week.</p>
                            </div>

                            {/* Averages & Insights */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between">
                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-900/60 uppercase tracking-wider mb-1">Avg Duration</p>
                                        <p className="text-3xl font-bold text-indigo-900">7<span className="text-xl font-medium">h</span> 12<span className="text-xl font-medium">m</span></p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col justify-between">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                        <Sun className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900/60 uppercase tracking-wider mb-1">Avg Wake Time</p>
                                        <p className="text-3xl font-bold text-blue-900">6:45 <span className="text-xl font-medium">AM</span></p>
                                    </div>
                                </div>

                                {/* AI Insight Row spanning full width within this grid */}
                                <div className="col-span-2 bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
                                    <Moon className="absolute -right-4 -top-8 w-32 h-32 text-indigo-800 opacity-50 block mix-blend-screen" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 text-indigo-200 mb-2">
                                            <BarChart2 className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">AI Sleep Insight</span>
                                        </div>
                                        <p className="text-lg font-medium leading-relaxed max-w-lg">
                                            {isLoading ? "Analyzing your sleep patterns..." : (aiSuggestion || "Log your sleep to get personalized AI insights!")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* History List */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-gray-400" /> Recent Logs
                                </h2>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {isLoading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-20 bg-white/50 rounded-xl animate-pulse mx-6 my-2" />)
                                ) : sleepData.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500 font-medium">No sleep logs found. Start tracking your rest!</div>
                                ) : (
                                    sleepData.map((log) => (
                                        <div key={log.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${log.quality_score >= 8 ? 'bg-green-500' :
                                                    log.quality_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{new Date(log.logged_at).toLocaleDateString()}</p>
                                                    <p className="text-sm text-gray-500">Duration: {log.hours_slept}h</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 text-lg">{log.hours_slept}h</p>
                                                <p className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider inline-block mt-1 ${log.quality_score >= 8 ? 'bg-green-100 text-green-700' :
                                                    log.quality_score >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    Score: {log.quality_score}/10
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
