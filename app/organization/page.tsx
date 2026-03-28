'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Users,
    UserPlus,
    Building2,
    Mail,
    Shield,
    Trash2,
    Check,
    X,
    ExternalLink,
    LayoutDashboard
} from 'lucide-react';

interface Member {
    user_id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
    status: string;
    joined_at: string;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    billing_email: string | null;
    max_seats: number;
    seats_used: number;
    logo_url: string | null;
    created_at: string;
}

export default function OrganizationPage() {
    const [org, setOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [isInviting, setIsInviting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orgRes, membersRes] = await Promise.all([
                    api.get('/org/me'),
                    api.get('/org/members')
                ]);
                setOrg(orgRes.data);
                setMembers(membersRes.data.members);
            } catch (err) {
                console.error('Failed to fetch org data', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/org/invite', { email: inviteEmail, role: inviteRole });
            setMessage({ text: `Invite sent to ${inviteEmail}`, type: 'success' });
            setInviteEmail('');
        } catch (err: any) {
            setMessage({ text: err.response?.data?.error || 'Failed to send invite', type: 'error' });
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/org/members/${userId}`);
            setMembers(members.filter(m => m.user_id !== userId));
            setMessage({ text: 'Member removed successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: 'Failed to remove member', type: 'error' });
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.put(`/org/members/${userId}/role`, { role: newRole });
            setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
            setMessage({ text: 'Role updated successfully', type: 'success' });
        } catch (err) {
            setMessage({ text: 'Failed to update role', type: 'error' });
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!org) return (
        <div className="p-8 text-center text-slate-500">
            Organization not found or access denied.
        </div>
    );

    return (
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pt-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-indigo-500" />
                        Organization Settings
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your workspace and team members</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="px-4 py-2 bg-indigo-50 rounded-xl">
                        <p className="text-xs font-bold text-indigo-600 uppercase">Subscription</p>
                        <p className="font-bold text-slate-700 capitalize">{org.subscription_plan}</p>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase">Seats</p>
                        <p className="font-bold text-slate-700">{org.seats_used} / {org.max_seats}</p>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invite Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-500" />
                            Invite Team Member
                        </h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                        placeholder="employee@company.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm appearance-none"
                                >
                                    <option value="member">Member (Standard Access)</option>
                                    <option value="admin">Admin (Org Management)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isInviting || org.seats_used >= org.max_seats}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isInviting ? 'Sending...' : 'Send Invite'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
                        <Building2 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                        <h3 className="font-bold text-xl relative z-10">Organization Sharing</h3>
                        <p className="text-indigo-100 text-sm opacity-90 relative z-10 leading-relaxed">
                            Share this link with your team to let them request access to your organization dashboard manually.
                        </p>
                        <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 rounded-xl transition-all border border-white/30 flex items-center justify-center gap-2 text-sm">
                            <ExternalLink className="w-4 h-4" />
                            Copy Invite Link
                        </button>
                    </div>
                </div>

                {/* Members List */}
                <div className="lg:col-span-2">
                    <div className="glass-card overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Team Members
                            </h2>
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                {members.length} Total
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Member</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {members.map((member) => (
                                        <tr key={member.user_id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                                                        {member.display_name?.[0] || member.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700">{member.display_name || 'Anonymous'}</p>
                                                        <p className="text-sm text-slate-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${member.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                {new Date(member.joined_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {member.role === 'member' ? (
                                                        <button
                                                            onClick={() => handleUpdateRole(member.user_id, 'admin')}
                                                            title="Make Admin"
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleUpdateRole(member.user_id, 'member')}
                                                            title="Remove Admin"
                                                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
