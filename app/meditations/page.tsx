'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { Play, Clock, Filter, Search, Award } from 'lucide-react';
import api from '@/lib/api';

export default function MeditationsPage() {
    const [meditations, setMeditations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Anxiety', 'Sleep', 'Morning', 'Focus', 'Stress'];

    const fetchMeditations = async () => {
        try {
            const res = await api.get('/meditations');
            setMeditations(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch meditations', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMeditations();
    }, []);

    const filtered = selectedCategory === 'All'
        ? meditations
        : meditations.filter(m => m.category === selectedCategory);

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-24">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Meditations</h1>
                                <p className="text-gray-500 mt-1">Guided sessions to help you find your inner peace.</p>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search sessions..."
                                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                                />
                            </div>
                        </header>

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
                                ))
                            ) : filtered.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300">
                                    No sessions found in this category.
                                </div>
                            ) : (
                                filtered.map((med) => (
                                    <div key={med.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                        <div className="aspect-video bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                                            {med.thumbnail_url ? (
                                                <img src={med.thumbnail_url} alt={med.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Play className="w-12 h-12 text-white/50 group-hover:text-white/80 transition-colors" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                                                    {med.category || 'Meditation'}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-4 left-4 text-white">
                                                <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                                                    <Clock className="w-3 h-3" /> {Math.floor(med.duration_seconds / 60)} min
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-2">
                                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{med.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{med.description || 'Focus on your breath and let go of stress.'}</p>
                                            <button className="w-full mt-4 py-3 bg-gray-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all group-active:scale-95">
                                                Start Session
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
