import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, MessageSquare, Smile, BookText, CheckSquare, Moon, Trophy, ShieldAlert, Users, Music, Library, LayoutDashboard, Settings } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setRole(localStorage.getItem('role'));
        }
    }, []);

    const mainNav = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Team Wellness', href: '/team', icon: Users },
        { name: 'AI Chat', href: '/chat', icon: MessageSquare },
    ];

    const wellnessNav = [
        { name: 'Mood', href: '/mood', icon: Smile },
        { name: 'Journal', href: '/journal', icon: BookText },
        { name: 'Habits', href: '/habits', icon: CheckSquare },
        { name: 'Sleep', href: '/sleep', icon: Moon },
    ];

    const communityNav = [
        { name: 'Community', href: '/community', icon: Users },
        { name: 'Meditations', href: '/meditations', icon: Music },
        { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
        { name: 'Resources', href: '/resources', icon: Library },
    ];

    const adminNav = role === 'admin' ? [
        { name: 'Admin Panel', href: '/admin', icon: ShieldAlert },
        { name: 'Organization', href: '/organization', icon: LayoutDashboard },
    ] : [];

    const NavGroup = ({ items, title }: { items: any[], title?: string }) => (
        <div className="mb-6">
            {title && <p className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>}
            <div className="flex flex-col gap-1">
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-white shadow-sm shadow-indigo-100 border border-slate-200/60 text-indigo-600 font-bold'
                                : 'text-slate-500 hover:bg-white/60 hover:text-indigo-600 border border-transparent hover:shadow-sm'
                                }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`} />
                            </div>
                            <span className="text-sm tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-white/40 backdrop-blur-xl border-r border-slate-200/60 overflow-y-auto hidden md:block z-30 pt-24 pb-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            <nav className="p-5">
                <NavGroup items={mainNav} />
                <NavGroup items={wellnessNav} title="My Wellness" />
                <NavGroup items={communityNav} title="Community" />
                {adminNav.length > 0 && <NavGroup items={adminNav} title="Administration" />}

                <div className="mt-8 pt-6 border-t border-slate-200/50 px-2">
                    <Link href="/profile" className="flex items-center gap-3 text-slate-500 hover:text-indigo-600 transition-all py-3 px-3 hover:bg-white/60 rounded-2xl group border border-transparent hover:border-slate-200/60 hover:shadow-sm">
                        <div className="p-1.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">Settings & Profile</span>
                    </Link>
                </div>
            </nav>
        </aside>
    );
}
