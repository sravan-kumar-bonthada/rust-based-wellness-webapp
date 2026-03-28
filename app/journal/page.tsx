'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import Link from 'next/link';
import { BookText, Plus, Search, Calendar, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

export default function JournalPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEntries = async () => {
        try {
            const res = await api.get('/journal');
            setEntries(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch journal entries', err);
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
        fetchEntries();
    }, [router]);

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
                                <p className="text-gray-500 mt-1">A safe space for your thoughts and reflections.</p>
                            </div>
                            <Link
                                href="/journal/new"
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
                            >
                                <Plus className="w-5 h-5" /> New Entry
                            </Link>
                        </header>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search your journal..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2">
                                    <Calendar className="w-4 h-4" /> Filter by Date
                                </button>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {isLoading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/50 rounded-xl animate-pulse mx-4 my-2" />)
                                ) : entries.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <BookText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                        <p className="text-lg font-medium text-gray-900">No journal entries yet</p>
                                        <p className="mt-1">Write your first entry to start tracking your thoughts.</p>
                                    </div>
                                ) : (
                                    entries.map((entry) => (
                                        <Link
                                            key={entry.id}
                                            href={`/journal/${entry.id}`}
                                            className="block p-5 hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                            {entry.title || "Untitled Entry"}
                                                        </h3>
                                                        <span className="text-xl" title="Mood score logged">{entry.mood_score ? `Mood: ${entry.mood_score}/10` : ""}</span>
                                                    </div>
                                                    <p className="text-gray-600 line-clamp-2 text-sm">
                                                        {entry.content}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2 font-medium">
                                                        {new Date(entry.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="hidden sm:flex items-center self-center text-gray-300 group-hover:text-blue-500 transition-colors">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </Link>
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
