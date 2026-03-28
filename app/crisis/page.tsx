'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { Phone, HeartHandshake, ShieldAlert, Heart, Activity } from 'lucide-react';
import api from '@/lib/api';

export default function CrisisPage() {
    const router = useRouter();
    const [resources, setResources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchResources = async () => {
            try {
                const res = await api.get('/crisis/resources');
                setResources(res.data);
            } catch (err) {
                console.error('Failed to fetch crisis resources', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResources();
    }, [router]);

    return (
        <div className="flex h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24 bg-red-50/30">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                        <header className="text-center space-y-4">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-6">
                                <HeartHandshake className="w-10 h-10" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">You are not alone.</h1>
                            <p className="text-xl text-gray-600 max-w-xl mx-auto">
                                If you are experiencing a mental health crisis or having thoughts of suicide, please reach out immediately. Help is available right now.
                            </p>
                        </header>

                        {/* Emergency Contacts */}
                        <div className="bg-white rounded-3xl p-8 border-2 border-red-100 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <ShieldAlert className="w-48 h-48 text-red-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-6 relative z-10 flex items-center gap-2">
                                <Phone className="w-6 h-6 text-red-500" /> Immediate Support
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                {isLoading ? (
                                    [1, 2].map(i => <div key={i} className="h-32 bg-red-50/50 rounded-2xl animate-pulse" />)
                                ) : resources.length === 0 ? (
                                    <div className="col-span-2 text-center text-slate-500 font-medium">No resources listed. Please call emergency services if needed.</div>
                                ) : (
                                    resources.map((resource) => (
                                        <a key={resource.id} href={resource.contact_info.startsWith('http') ? resource.contact_info : `tel:${resource.contact_info}`} className="block p-6 rounded-2xl bg-red-50 border border-red-200 hover:bg-red-100 transition-colors group">
                                            <h3 className="text-xl font-bold text-red-900 flex items-center justify-between">
                                                {resource.name}
                                                <Phone className="w-5 h-5 text-red-500 group-hover:animate-pulse" />
                                            </h3>
                                            <p className="text-red-700 mt-2 font-medium text-2xl mb-2">{resource.contact_info}</p>
                                            <p className="text-sm text-red-600">{resource.description}</p>
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Grounding Techniques */}
                        <div className="space-y-6 pt-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-teal-500" /> Immediete Grounding Exercises
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button className="text-left bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Heart className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-lg mb-2">Box Breathing</h4>
                                    <p className="text-gray-500 text-sm">Follow an interactive 4-4-4-4 breathing pattern to calm your nervous system instantly.</p>
                                </button>

                                <button className="text-left bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
                                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl">🖐️</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-lg mb-2">5-4-3-2-1 Method</h4>
                                    <p className="text-gray-500 text-sm">A sensory grounding exercise to bring you back to the present moment.</p>
                                </button>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
