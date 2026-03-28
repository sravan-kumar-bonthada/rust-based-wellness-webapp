'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import Link from 'next/link';
import { BrainCircuit, BookOpen, AlertCircle, PlayCircle, Lock } from 'lucide-react';
import api from '@/lib/api';

export default function CBTPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'modules' | 'thoughts'>('modules');
    const [modules, setModules] = useState<any[]>([]);
    const [thoughtRecords, setThoughtRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'modules') {
                    const res = await api.get('/cbt/modules');
                    setModules(res.data.data || []);
                } else {
                    const res = await api.get('/cbt/thoughts');
                    setThoughtRecords(res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch CBT data', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router, activeTab]);

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 animate-fade-in">

                        <header className="relative bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob pointer-events-none"></div>
                            <div className="absolute -bottom-10 left-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-[60px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>

                            <div className="absolute top-10 right-10 opacity-20 transform rotate-12">
                                <BrainCircuit className="w-48 h-48" />
                            </div>

                            <div className="relative z-10 max-w-2xl">
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Cognitive Behavioral Therapy</h1>
                                <p className="text-emerald-100/90 text-lg leading-relaxed font-medium">
                                    Learn practical skills to identify and change negative thought patterns, manage stress, and build resilience.
                                </p>
                                <div className="mt-8 flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('modules')}
                                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'modules' ? 'bg-white text-emerald-800 shadow-lg scale-105' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'}`}
                                    >
                                        Learning Modules
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('thoughts')}
                                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${activeTab === 'thoughts' ? 'bg-white text-emerald-800 shadow-lg scale-105' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'}`}
                                    >
                                        Thought Records
                                    </button>
                                </div>
                            </div>
                        </header>

                        {activeTab === 'modules' ? (
                            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2.5 bg-white/60 rounded-xl shadow-sm border border-slate-100 backdrop-blur-md">
                                        <BookOpen className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Course Journey
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    {isLoading ? (
                                        [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/40 rounded-3xl animate-pulse" />)
                                    ) : (
                                        modules.map((mod) => (
                                            <div
                                                key={mod.id}
                                                className={`glass-card p-8 rounded-3xl border transition-all duration-500 group relative overflow-hidden ${mod.locked
                                                    ? 'border-white/30 bg-white/40 opacity-80'
                                                    : 'border-white/60 glass-card-hover'
                                                    }`}
                                            >
                                                {!mod.locked && (
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"></div>
                                                )}

                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 ${mod.locked ? 'bg-slate-200/80 text-slate-400' : 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 group-hover:scale-110'
                                                        }`}>
                                                        {mod.locked ? <Lock className="w-6 h-6" /> : <PlayCircle className="w-7 h-7 ml-0.5" />}
                                                    </div>
                                                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/60 text-slate-600 shadow-sm border border-slate-100/50 backdrop-blur-md">
                                                        {mod.duration_minutes || 0} min
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-bold text-slate-800 mb-3 relative z-10">{mod.title}</h3>
                                                <p className="text-slate-600 font-medium mb-8 min-h-[48px] leading-relaxed relative z-10">{mod.description}</p>

                                                {!mod.locked ? (
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-end mb-3">
                                                            <span className="text-sm font-bold text-slate-500">Progress</span>
                                                            <span className="text-sm font-black text-emerald-600">{mod.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden shadow-inner border border-slate-300/30">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                                                                style={{ width: `${mod.progress || 0}%` }}
                                                            ></div>
                                                        </div>
                                                        <Link href={`/cbt/session/${mod.id}`} className="block w-full text-center mt-6 py-3.5 border border-emerald-200/50 text-emerald-700 bg-white/60 hover:bg-emerald-50 rounded-xl text-base font-bold transition-all shadow-sm group-hover:shadow-md">
                                                            {(mod.progress || 0) === 0 ? 'Start Module' : mod.progress === 100 ? 'Review' : 'Continue'}
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="mt-8 pt-6 border-t border-slate-200/40 text-sm text-center text-slate-500 font-semibold relative z-10">
                                                        <Lock className="w-4 h-4 inline-block mr-2 -mt-0.5 opacity-50" />
                                                        Complete previous modules to unlock
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                        <div className="p-2.5 bg-white/60 rounded-xl shadow-sm border border-slate-100 backdrop-blur-md">
                                            <AlertCircle className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        Thought Records
                                    </h2>
                                    <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                        New Thought Record
                                    </button>
                                </div>

                                <div className="glass-card rounded-[2rem] border border-white/60 overflow-hidden shadow-md">
                                    {isLoading ? (
                                        <div className="p-10 text-center animate-pulse">Loading thought records...</div>
                                    ) : thoughtRecords.length === 0 ? (
                                        <div className="p-10 text-center text-slate-500 font-medium">No thought records yet. Start by reframing a challenging thought!</div>
                                    ) : (
                                        thoughtRecords.map((record, i) => (
                                            <div key={record.id} className={`p-8 hover:bg-white/40 transition-colors duration-300 ${i !== 0 ? 'border-t border-slate-200/50' : ''}`}>
                                                <div className="flex justify-between items-start mb-6">
                                                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/80 text-slate-600 shadow-sm border border-slate-100 backdrop-blur-md inline-block">
                                                        {new Date(record.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50/80 text-rose-600 border border-rose-200 shadow-sm backdrop-blur-md">
                                                        {record.emotion}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-white/50 rounded-2xl p-6 border border-white/80 shadow-sm relative overflow-hidden group hover:bg-white/80 transition-colors">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                                                        <p className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                            Trigger / Setup
                                                        </p>
                                                        <p className="text-slate-600 font-medium leading-relaxed">{record.trigger}</p>
                                                    </div>
                                                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden group hover:bg-emerald-50 transition-colors">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                                                        <p className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                                            Reframed Thought
                                                        </p>
                                                        <p className="text-emerald-700 font-medium leading-relaxed">{record.reframed}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
