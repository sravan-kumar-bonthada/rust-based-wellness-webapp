'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function CBTSession() {
    const router = useRouter();
    const params = useParams();

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [moduleData, setModuleData] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const initSession = async () => {
            try {
                // 1. Fetch module and steps
                const modRes = await api.get(`/cbt/modules/${params.id}`);
                setModuleData(modRes.data);

                // 2. Start a new session
                const sessRes = await api.post('/cbt/sessions', { module_type: params.id as string });
                setSessionId(sessRes.data.id);
            } catch (err) {
                console.error('Failed to initialize CBT session', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            initSession();
        }
    }, [params.id, router]);

    if (isLoading || !moduleData) return <div className="p-8 h-screen w-full flex items-center justify-center bg-transparent"><div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div></div>;

    const steps = moduleData.steps || [];
    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = async () => {
        if (step?.step_type === 'input' && sessionId) {
            try {
                await api.post(`/cbt/sessions/${sessionId}/respond`, {
                    step_id: step.id,
                    response: answers[step.id] || ''
                });
            } catch (err) {
                console.error('Failed to save step response', err);
            }
        }

        if (isLastStep) {
            if (sessionId) {
                try {
                    await api.post(`/cbt/sessions/${sessionId}/complete`);
                } catch (err) {
                    console.error('Failed to complete session', err);
                }
            }
            router.push('/cbt');
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <div className="flex h-screen bg-transparent">
            <div className="hidden md:block"><Sidebar /></div>
            <div className="flex-1 flex flex-col md:pl-64 h-full relative">
                <div className="hidden md:block"><Navbar /></div>

                <main className="flex-1 flex flex-col h-full w-full md:pt-16 animate-fade-in relative z-10">
                    {/* Header */}
                    <header className="glass border-b border-white/60 p-4 shrink-0 sticky top-0 md:top-16 z-20 flex items-center shadow-sm backdrop-blur-xl">
                        <Link href="/cbt" className="p-2 -ml-2 text-slate-500 hover:bg-white/60 hover:text-slate-800 rounded-xl transition-colors mr-4 border border-transparent hover:border-slate-200/60 shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1 min-w-0 pr-4">
                            <h1 className="text-base font-bold text-slate-800 truncate mb-2">{moduleData.title}</h1>
                            <div className="w-full bg-slate-200/70 rounded-full h-1.5 shadow-inner overflow-hidden border border-slate-300/30">
                                <div
                                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 bg-white/80 rounded-lg text-xs font-bold text-slate-500 shadow-sm border border-slate-100 hidden sm:inline-block whitespace-nowrap">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                    </header>

                    {/* Activity Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-8 md:py-16 flex justify-center">
                        <div key={currentStep} className="max-w-2xl w-full flex flex-col justify-center animate-fade-in my-auto pb-16">

                            {step?.step_type === 'info' ? (
                                <div className="glass-card p-12 text-center rounded-[2.5rem] border border-white/60 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none"></div>
                                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 mb-10 p-5 shadow-inner border border-emerald-300/30 rotate-3">
                                        {currentStep === 0 ? <BookOpen className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
                                        {currentStep === 0 ? "Let's Begin" : "Take a moment."}
                                    </h2>
                                    <p className="text-xl text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
                                        {step.content}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8 w-full">
                                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight mb-4 drop-shadow-sm">
                                        {step?.question}
                                    </h2>
                                    <div className="relative group">
                                        <textarea
                                            autoFocus
                                            value={answers[step?.id] || ''}
                                            onChange={(e) => setAnswers({ ...answers, [step.id]: e.target.value })}
                                            placeholder={step?.placeholder}
                                            className="w-full min-h-[240px] p-8 text-xl glass-card border border-white/80 rounded-3xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 focus:bg-white/90 transition-all resize-none shadow-lg placeholder:text-slate-400 text-slate-800 font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Navigation Footer */}
                            <div className="mt-12 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    disabled={step?.step_type === 'input' && !answers[step.id]?.trim()}
                                    className="group px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-3"
                                >
                                    {isLastStep ? 'Complete Session' : 'Continue'}
                                    {!isLastStep && <ArrowLeft className="w-6 h-6 rotate-180 transition-transform group-hover:translate-x-1" />}
                                    {isLastStep && <CheckCircle2 className="w-6 h-6 transition-transform group-hover:scale-110 text-emerald-400" />}
                                </button>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
