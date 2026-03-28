'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import MessageList from '@/components/Chat/MessageList';
import MessageInput from '@/components/Chat/MessageInput';
import api from '@/lib/api';

export default function ChatPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await api.get('/chat/sessions');
            const data = res.data.data || [];
            setSessions(data);
            if (data.length > 0 && !currentSessionId) {
                setCurrentSessionId(data[0].id);
            } else if (data.length === 0) {
                // Create a default session if none exist
                const newSess = await api.post('/chat/sessions', {
                    session_type: 'general',
                    title: 'New Session'
                });
                const sess = newSess.data.data;
                setSessions([sess]);
                setCurrentSessionId(sess.id);
            }
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        } finally {
            setIsInitialLoading(false);
        }
    }, [currentSessionId]);

    const fetchMessages = useCallback(async (sessionId: string) => {
        try {
            const res = await api.get(`/chat/sessions/${sessionId}/messages`);
            const data = res.data.data || [];
            // API returns messages DESC, we want ASC for the list
            setMessages(data.reverse().map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        } catch (err) {
            console.error('Failed to fetch messages', err);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchSessions();
    }, [fetchSessions, router]);

    useEffect(() => {
        if (currentSessionId) {
            fetchMessages(currentSessionId);
        }
    }, [currentSessionId, fetchMessages]);

    const handleSendMessage = async (content: string) => {
        if (!currentSessionId) return;

        const isNewSession = messages.length === 0;

        const newUserMsg = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            const res = await api.post(`/chat/sessions/${currentSessionId}/messages`, {
                content
            });

            const aiMsg = res.data.data;
            const newAiMsg = {
                id: aiMsg.id,
                role: aiMsg.role,
                content: aiMsg.content,
                timestamp: new Date(aiMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, newAiMsg]);

            // Refetch sessions to catch auto-generated titles
            // We do it once immediately, and once after a short delay since AI might be slow
            const checkTitle = () => {
                const currentSess = sessions.find(s => s.id === currentSessionId);
                return isNewSession || currentSess?.title?.startsWith('New Session');
            };

            if (checkTitle()) {
                fetchSessions();
                setTimeout(() => fetchSessions(), 1500); // Second check for safety
            }
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewSession = async () => {
        try {
            const res = await api.post('/chat/sessions', {
                session_type: 'general',
                title: 'New Session'
            });
            const sess = res.data.data;
            setSessions(prev => [sess, ...prev]);
            setCurrentSessionId(sess.id);
            setMessages([]);
        } catch (err) {
            console.error('Failed to create session', err);
        }
    };

    return (
        <div className="flex h-screen bg-[#FFFDF9] overflow-hidden font-medium">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64 h-full relative">
                <Navbar />

                {/* Chat History Sidebar (Desktop) */}
                <div className="hidden lg:block absolute left-64 top-16 bottom-0 w-72 bg-[#FFF9F0] border-r border-orange-100 z-10 overflow-y-auto pt-6 px-4">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="space-y-0.5">
                            <h2 className="text-[10px] font-black text-orange-300 uppercase tracking-[0.2em]">Your Sanctuary</h2>
                            <p className="text-xs text-orange-400/60">Past Reflections</p>
                        </div>
                        <button
                            onClick={createNewSession}
                            className="bg-white text-[#FF9662] hover:bg-[#FF9662] hover:text-white p-2.5 rounded-2xl shadow-sm border border-orange-100 transition-all duration-300 group"
                            title="New Session"
                        >
                            <svg className="group-hover:rotate-90 transition-transform duration-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => setCurrentSessionId(session.id)}
                                className={`w-full text-left px-4 py-4 rounded-3xl transition-all duration-300 ${currentSessionId === session.id
                                    ? 'bg-white shadow-md shadow-orange-100/50 scale-[1.02] border-l-4 border-[#FF9662]'
                                    : 'text-gray-500 hover:bg-white/50 hover:pl-5'
                                    }`}
                            >
                                <span className={`block truncate text-sm ${currentSessionId === session.id ? 'text-[#333333] font-bold' : 'text-gray-500'}`}>
                                    {session.title || 'Untitled Session'}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                    <div className={`w-1 h-1 rounded-full ${currentSessionId === session.id ? 'bg-[#FF9662]' : 'bg-gray-300'}`}></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <main className="flex-1 flex flex-col lg:ml-72 pt-16 bg-[#FFF9F0] overflow-hidden">
                    {isInitialLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-pulse flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-[#FF9662]/10 rounded-full flex items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-[#FF9662] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <p className="text-orange-300 font-bold uppercase tracking-widest text-xs">Finding Peace...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <MessageList messages={messages} isLoading={isLoading} />
                            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
