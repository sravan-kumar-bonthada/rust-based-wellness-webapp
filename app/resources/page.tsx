'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { BookOpen, Video, FileText, ChevronRight, Search } from 'lucide-react';
import api from '@/lib/api';

export default function ResourcesPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchResources = async () => {
        try {
            const res = await api.get('/resources');
            setResources(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch resources', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Resource Library</h1>
                                <p className="text-gray-500 mt-1">Educational materials to support your wellness journey.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search articles..."
                                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                    />
                                </div>
                            </div>
                        </header>

                        {/* Resource Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isLoading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
                                ))
                            ) : resources.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300">
                                    No resources available yet.
                                </div>
                            ) : (
                                resources.map((res) => (
                                    <div key={res.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex gap-6 group cursor-pointer">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${res.content_type === 'Article' ? 'bg-blue-100 text-blue-600' :
                                            res.content_type === 'Video' ? 'bg-red-100 text-red-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                            {res.content_type === 'Article' ? <FileText className="w-8 h-8" /> :
                                                res.content_type === 'Video' ? <Video className="w-8 h-8" /> :
                                                    <BookOpen className="w-8 h-8" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    {res.category || 'General'} • {res.content_type}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                {res.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                {res.preview_text || 'An informative guide on your mental health journey.'}
                                            </p>
                                            <div className="flex items-center gap-1 text-blue-600 text-sm font-bold mt-4">
                                                Read More <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Newsletter Signup */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-200">
                            <div className="space-y-2 text-center md:text-left">
                                <h2 className="text-2xl font-bold">Want more tips?</h2>
                                <p className="text-blue-100">Subscribe to our weekly newsletter for curated wellness insights.</p>
                            </div>
                            <div className="flex w-full md:w-auto gap-3">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 outline-none focus:bg-white/20 transition-all flex-1 md:w-64 placeholder:text-blue-200"
                                />
                                <button className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
