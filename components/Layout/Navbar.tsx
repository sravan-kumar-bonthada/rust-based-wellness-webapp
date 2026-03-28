'use client';
import { useEffect, useState } from 'react';
import 'lucide-react';
import { Menu, UserCircle, Building2, Brain } from 'lucide-react';
import Link from 'next/link';
import NotificationDropdown from '@/components/Notifications/NotificationDropdown';

export default function Navbar() {
    const [orgName, setOrgName] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrgName(localStorage.getItem('org_name') || 'Organization');
            setRole(localStorage.getItem('role'));
        }
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white/50 backdrop-blur-xl border-b border-white/60 shadow-sm z-40 transition-all duration-300">
            <div className="w-full mx-auto h-full flex items-center justify-between px-6 md:px-10">
                <div className="flex items-center gap-8">
                    {/* Brand / Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group hidden md:flex">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">Mindful<span className="text-indigo-600">AI</span></span>
                    </Link>

                    <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-white/60 rounded-xl transition-colors border border-transparent hover:border-slate-200">
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-sm">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 tracking-tight">{orgName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <NotificationDropdown />

                    <Link href="/profile" className="flex items-center gap-3 pl-6 border-l border-slate-200/60 cursor-pointer hover:bg-white/60 p-2 pr-4 rounded-2xl transition-all duration-300 group border border-transparent hover:border-slate-200/60 hover:shadow-sm">
                        <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 p-1.5 rounded-xl border border-indigo-100/50 group-hover:scale-110 transition-transform shadow-sm">
                            <UserCircle className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">{role || 'User'}</p>
                            <p className="font-bold text-slate-800 text-sm leading-none tracking-tight">My Account</p>
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
