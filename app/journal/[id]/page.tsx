'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function JournalEntry() {
    const router = useRouter();
    const params = useParams();
    const isNew = params.id === 'new';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [aiInsight, setAiInsight] = useState('');

    // Mock fetch if editing
    useEffect(() => {
        if (!isNew) {
            setTitle('Morning Reflections');
            setContent('Woke up feeling a bit anxious about the meeting today. I think I am prepared, but the presentation is to the senior leadership team. I just need to remember to breathe and stick to my talking points.');
            setAiInsight('It is completely normal to feel anxious before a big presentation. Your preparation will carry you through. Consider taking 3 deep breaths before pulling up your slides.');
        }
    }, [isNew]);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            router.push('/journal');
        }, 1000);
    };

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />

                {/* Editor Top Bar */}
                <div className="border-b border-white/40 mt-16 flex items-center justify-between glass z-10 sticky top-16 transition-all duration-300">
                    <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 md:px-8 py-3">
                        <div className="flex items-center gap-4">
                            <Link href="/journal" className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <span className="text-sm font-medium text-gray-500">
                                {isSaving ? 'Saving...' : 'All changes saved'}
                            </span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !title || !content}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 inline-block mr-1.5" />
                            Save Entry
                        </button>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">

                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your entry a title..."
                            className="text-3xl md:text-5xl font-bold text-gray-900 border-none outline-none w-full placeholder-gray-300 bg-transparent"
                        />

                        <div className="text-sm text-gray-400 font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind today?"
                            className="w-full min-h-[400px] text-lg leading-relaxed text-gray-700 border-none outline-none resize-none bg-transparent placeholder-gray-400"
                        />

                        {/* AI Insights Block */}
                        {!isNew && aiInsight && (
                            <div className="mt-12 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2"></div>

                                <h3 className="font-semibold text-indigo-900 flex items-center gap-2 mb-3 relative z-10">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                    AI Journal Insight
                                </h3>
                                <p className="text-indigo-800 leading-relaxed relative z-10">
                                    {aiInsight}
                                </p>
                                <div className="mt-4 flex gap-3 relative z-10">
                                    <button className="text-sm px-3 py-1.5 bg-white text-indigo-700 rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 font-medium">
                                        Try a Grounding Exercise
                                    </button>
                                    <button className="text-sm px-3 py-1.5 bg-white text-indigo-700 rounded-lg shadow-sm border border-indigo-100 hover:bg-indigo-50 font-medium flex items-center gap-1.5">
                                        <ChatBubbleIcon /> Discuss this in Chat
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}

function ChatBubbleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    );
}
