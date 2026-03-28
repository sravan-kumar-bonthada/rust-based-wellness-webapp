'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { BookText, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function NewJournalPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            await api.post('/journal', {
                title: title || 'Untitled Entry',
                content,
                tags: []
            });
            router.push('/journal');
        } catch (err) {
            console.error('Failed to save journal entry', err);
            alert('Failed to save entry. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">

                        <div className="flex items-center justify-between">
                            <Link
                                href="/journal"
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Journal
                            </Link>
                            <div className="flex gap-3">
                                <Link
                                    href="/journal"
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </Link>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !content.trim()}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                                >
                                    {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Entry</>}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 md:p-8 space-y-6">
                                <input
                                    type="text"
                                    placeholder="Entry Title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full text-3xl font-bold border-none outline-none placeholder:text-gray-300 focus:ring-0"
                                />
                                <hr className="border-gray-100" />
                                <textarea
                                    placeholder="Start writing your thoughts here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={15}
                                    className="w-full text-lg border-none outline-none placeholder:text-gray-300 focus:ring-0 resize-none min-h-[400px]"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start text-blue-800 text-sm">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <BookText className="w-4 h-4" />
                            </div>
                            <p>
                                <strong>Tip:</strong> Don't worry about being perfect. Just write what's on your mind.
                                Our AI will help analyze your sentiment and provide insights once you save.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
