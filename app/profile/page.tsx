'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import api from '@/lib/api';

export default function Profile() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [user, setUser] = useState<any>(null);
    const [mentalProfile, setMentalProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfileData = async () => {
        try {
            const [userRes, profileRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/users/me/mental-profile')
            ]);
            setUser(userRes.data);
            setMentalProfile(profileRes.data);
        } catch (err) {
            console.error('Failed to fetch profile info', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchProfileData();
    }, [router]);

    const handleGeneralSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/users/me', {
                display_name: user.display_name,
                bio: user.bio,
            });
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Failed to update general info', err);
            alert('Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleMentalProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/users/me/mental-profile', {
                ...mentalProfile,
                mental_profile_completed: true
            });
            alert('Mental profile updated!');
        } catch (err) {
            console.error('Failed to update mental profile', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreferenceToggle = async (key: string, value: boolean) => {
        const newPrefs = { ...(user.notification_prefs || {}), [key]: value };
        try {
            await api.post('/users/me/preferences', { notification_prefs: newPrefs });
            setUser({ ...user, notification_prefs: newPrefs });
        } catch (err) {
            console.error('Failed to update preferences', err);
        }
    };

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                        <header>
                            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                            <p className="text-gray-500 mt-1">Manage your account and mental profile preferences.</p>
                        </header>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                            {/* Sidebar Tabs */}
                            <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 space-y-1">
                                {[
                                    { id: 'general', label: 'General Info' },
                                    { id: 'mental-profile', label: 'Mental Profile' },
                                    { id: 'preferences', label: 'Preferences' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 md:p-8">
                                {isLoading || !user ? (
                                    <div className="p-8 text-center animate-pulse">Loading profile...</div>
                                ) : activeTab === 'general' && (
                                    <form onSubmit={handleGeneralSave} className="space-y-6 animate-in fade-in duration-300">
                                        <h2 className="text-xl font-semibold text-gray-900">General Information</h2>
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                                    className="w-full h-full object-cover"
                                                    alt="Avatar"
                                                />
                                            </div>
                                            <button type="button" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                                Change Avatar
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={user.display_name || ''}
                                                    onChange={(e) => setUser({ ...user, display_name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input
                                                    disabled
                                                    type="email"
                                                    value={user.email || ''}
                                                    className="w-full px-4 py-2 border border-blue-50 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                                <textarea
                                                    rows={3}
                                                    value={user.bio || ''}
                                                    onChange={(e) => setUser({ ...user, bio: e.target.value })}
                                                    placeholder="Tell us a little about yourself..."
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'mental-profile' && mentalProfile && (
                                    <form onSubmit={handleMentalProfileSave} className="space-y-6 animate-in fade-in duration-300">
                                        <h2 className="text-xl font-semibold text-gray-900">Mental Profile</h2>
                                        <p className="text-sm text-gray-500">Helping the AI understand your needs better.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Concerns (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={mentalProfile.primary_concerns?.join(', ') || ''}
                                                    onChange={(e) => setMentalProfile({
                                                        ...mentalProfile,
                                                        primary_concerns: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                                    })}
                                                    placeholder="e.g. Anxiety, Social Stress"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Therapy Goals (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={mentalProfile.therapy_goals?.join(', ') || ''}
                                                    onChange={(e) => setMentalProfile({
                                                        ...mentalProfile,
                                                        therapy_goals: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                                    })}
                                                    placeholder="e.g. Mindfulness, Better Sleep"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Anxiety Baseline (1-10)</label>
                                                    <input
                                                        type="number"
                                                        min="1" max="10"
                                                        value={mentalProfile.anxiety_baseline || 5}
                                                        onChange={(e) => setMentalProfile({ ...mentalProfile, anxiety_baseline: parseInt(e.target.value) })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Depression Score (1-10)</label>
                                                    <input
                                                        type="number"
                                                        min="1" max="10"
                                                        value={mentalProfile.depression_score || 5}
                                                        onChange={(e) => setMentalProfile({ ...mentalProfile, depression_score: parseInt(e.target.value) })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                            >
                                                {isSaving ? 'Updating...' : 'Update Mental Profile'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'preferences' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h2 className="text-xl font-semibold text-gray-900">App Preferences</h2>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">Daily Reminders</p>
                                                    <p className="text-sm text-gray-500">Receive notifications to log mood</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={user.notification_prefs?.daily_reminders || false}
                                                        onChange={(e) => handlePreferenceToggle('daily_reminders', e.target.checked)}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">Weekly Summary</p>
                                                    <p className="text-sm text-gray-500">Get a report of your wellness journey</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={user.notification_prefs?.weekly_summary || false}
                                                        onChange={(e) => handlePreferenceToggle('weekly_summary', e.target.checked)}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
