import { Send, Mic, Smile } from 'lucide-react';
import { useState } from 'react';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    isLoading: boolean;
}

export default function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-orange-100 bg-[#FFFDF9] p-6">
            <div className="max-w-4xl mx-auto flex items-end gap-3 rounded-[2rem] border-2 border-[#FEE2B3] bg-white p-3 focus-within:border-[#FF9662] focus-within:shadow-lg focus-within:shadow-orange-100/50 transition-all duration-300">
                <button
                    type="button"
                    className="p-2.5 text-orange-300 hover:text-[#FF9662] transition-colors"
                >
                    <Smile className="w-6 h-6" />
                </button>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share what's on your mind..."
                    className="max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent py-2.5 text-[1.05rem] text-[#333333] placeholder:text-orange-200 focus:outline-none focus:ring-0"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <div className="flex items-center gap-2 pb-0.5 pr-0.5">
                    <button
                        type="button"
                        className="p-3 text-orange-200 hover:text-[#FF9662] hover:bg-orange-50 rounded-full transition-all"
                        title="Voice input"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                    <button
                        type="submit"
                        disabled={!message.trim() || isLoading}
                        className="p-3 bg-[#FF9662] text-white rounded-full hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-md shadow-orange-200/50 disabled:bg-gray-200 disabled:shadow-none disabled:scale-100 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <Send className="w-5 h-5 ml-0.5" />
                        )}
                    </button>
                </div>
            </div>
            <p className="max-w-4xl mx-auto text-center text-[11px] text-orange-200 mt-3 font-medium tracking-wide uppercase">
                Take a deep breath. We're in this together.
            </p>
        </form>
    );
}
