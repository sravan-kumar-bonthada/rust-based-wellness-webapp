import { useRef, useEffect } from 'react';
import { User, Sparkles, Heart } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'ai' | 'assistant';
    content: string;
    timestamp: string;
}

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto w-full scroll-smooth bg-[#FFF9F0]"
        >
            <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 mt-20 animate-in fade-in zoom-in duration-700">
                        <div className="w-24 h-24 bg-[#FF9662] rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-200/50 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-700 rounded-full"></div>
                            <Sparkles className="w-12 h-12 relative z-10 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-[#333333] tracking-tight">Welcome to Kind Mind</h2>
                            <p className="text-gray-500 max-w-sm mx-auto text-lg leading-relaxed">
                                I'm here to listen and walk with you. How is your heart feeling in this moment?
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 border border-orange-100 shadow-sm">Feeling anxious</span>
                            <span className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 border border-orange-100 shadow-sm">Need to vent</span>
                            <span className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 border border-orange-100 shadow-sm">Just checking in</span>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-4 duration-500`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${(msg.role === 'ai' || msg.role === 'assistant')
                                ? 'bg-white border-2 border-[#FFDAB9] text-[#FF9662]'
                                : 'bg-[#4F46E5] text-white'
                                }`}>
                                {(msg.role === 'ai' || msg.role === 'assistant') ? <Heart size={22} fill="#FF9662" fillOpacity={0.2} /> : <User size={22} />}
                            </div>

                            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-6 py-4 rounded-[2rem] text-[1.05rem] leading-[1.6] ${msg.role === 'user'
                                    ? 'bg-[#FF9662] text-white rounded-tr-none'
                                    : 'bg-white border border-[#FEE2B3] text-[#444444] rounded-tl-none shadow-md shadow-orange-100/20'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-2 px-2" suppressHydrationWarning>{msg.timestamp}</span>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-4 animate-pulse">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white border-2 border-[#FFDAB9] text-[#FF9662]">
                            <Heart size={22} />
                        </div>
                        <div className="bg-white border border-[#FEE2B3] rounded-[2rem] rounded-tl-none px-6 py-5 shadow-sm flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-[#FFDAB9] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2.5 h-2.5 bg-[#FFDAB9] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2.5 h-2.5 bg-[#FFDAB9] rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
