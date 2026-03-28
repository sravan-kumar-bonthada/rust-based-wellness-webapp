'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import HabitCard, { HabitProps } from '@/components/Habits/HabitCard';
import { Target, Plus, Trophy, Award } from 'lucide-react';
import api from '@/lib/api';

export default function HabitsPage() {
    const router = useRouter();
    const [habits, setHabits] = useState<HabitProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewHabit, setShowNewHabit] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');

    const fetchHabits = async () => {
        try {
            const res = await api.get('/habits');
            setHabits(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch habits', err);
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
        fetchHabits();
    }, [router]);

    const handleToggle = async (id: string) => {
        try {
            const habit = habits.find(h => h.id === id);
            if (!habit) return;

            const newlyCompleted = !habit.completedToday;
            await api.post(`/habits/${id}/log`, { completed: newlyCompleted });

            setHabits(habits.map(h => {
                if (h.id === id) {
                    return {
                        ...h,
                        completedToday: newlyCompleted,
                        streak: newlyCompleted ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1)
                    };
                }
                return h;
            }));
        } catch (err) {
            console.error('Failed to toggle habit', err);
        }
    };

    const handleAddHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        try {
            const res = await api.post('/habits', { name: newHabitName, category: 'General' });
            setHabits(prev => [res.data, ...prev]);
            setNewHabitName('');
            setShowNewHabit(false);
            fetchHabits();
        } catch (err) {
            console.error('Failed to add habit', err);
        }
    };

    const completedCount = habits.filter(h => h.completedToday).length;
    const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

    return (
        <div className="flex min-h-screen bg-transparent overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64 h-full relative">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">

                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Habits</h1>
                                <p className="text-gray-500 mt-1">Build positive routines and track your streaks.</p>
                            </div>
                            <button
                                onClick={() => setShowNewHabit(true)}
                                className="inline-flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
                            >
                                <Plus className="w-5 h-5" /> New Habit
                            </button>
                        </header>

                        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Target className="w-48 h-48" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Today's Progress</h2>
                                        <p className="text-gray-500 mt-1">You've completed {completedCount} out of {habits.length} habits.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score</p>
                                            <p className="text-2xl font-black text-gray-900">+{completedCount * 15} <span className="text-sm text-gray-400 font-medium">pts</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-blue-600">{progressPercent}% Completed</span>
                                        <span className="text-gray-400">{habits.length - completedCount} remaining</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out relative"
                                            style={{ width: `${progressPercent}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showNewHabit && (
                            <form onSubmit={handleAddHabit} className="bg-white rounded-2xl p-6 border border-blue-200 shadow-md animate-in fade-in slide-in-from-top-4">
                                <h3 className="text-lg font-bold mb-4">Create New Habit</h3>
                                <div className="flex gap-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newHabitName}
                                        onChange={(e) => setNewHabitName(e.target.value)}
                                        placeholder="What habit do you want to build? (e.g. Drink Water)"
                                        className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium">Add</button>
                                    <button type="button" onClick={() => setShowNewHabit(false)} className="px-4 py-2 text-gray-500">Cancel</button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Award className="w-5 h-5 text-gray-400" /> My Habits
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {isLoading ? (
                                    <div className="col-span-full py-20 text-center text-gray-400 animate-pulse">Loading habits...</div>
                                ) : habits.length === 0 ? (
                                    <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
                                        No habits yet. Click "New Habit" to get started!
                                    </div>
                                ) : (
                                    habits.map((habit) => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            onToggle={handleToggle}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
