import { Check, Flame, Repeat } from 'lucide-react';

export interface HabitProps {
    id: string;
    name: string;
    category: string;
    frequency: string;
    streak: number;
    completedToday: boolean;
}

export default function HabitCard({ habit, onToggle }: { habit: HabitProps, onToggle: (id: string) => void }) {
    return (
        <div className={`p-5 rounded-3xl transition-all duration-300 relative overflow-hidden group ${habit.completedToday
            ? 'glass bg-emerald-50/40 border-emerald-200/50'
            : 'glass-card glass-card-hover'
            }`}>
            {/* Soft background glow for uncompleted habits */}
            {!habit.completedToday && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
            )}

            <div className="flex items-center gap-5 relative z-10">
                {/* Action button */}
                <button
                    onClick={() => onToggle(habit.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${habit.completedToday
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-200 hover:shadow-md hover:scale-105'
                        : 'bg-white/80 text-slate-400 border border-slate-200/60 hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200 hover:scale-105'
                        }`}
                >
                    {habit.completedToday ? (
                        <Check className="w-7 h-7 scale-100 transition-transform duration-300" />
                    ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-current opacity-60 group-hover:border-indigo-400 transition-colors"></div>
                    )}
                </button>

                <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg truncate transition-colors duration-300 ${habit.completedToday ? 'text-emerald-800 line-through opacity-60' : 'text-slate-800 group-hover:text-indigo-900'}`}>
                        {habit.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5 bg-white/60 px-2.5 py-1 rounded-md border border-slate-100 shadow-sm backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            {habit.category}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                            <Repeat className="w-3 h-3" /> {habit.frequency}
                        </span>
                    </div>
                </div>

                {/* Streak indicator */}
                <div className="flex flex-col items-center justify-center text-center pl-4 border-l border-slate-200/50">
                    <div className={`flex items-center gap-1 font-bold text-lg ${habit.streak >= 3 ? 'text-orange-500 drop-shadow-sm' : 'text-slate-400'}`}>
                        <Flame className={`w-5 h-5 ${habit.streak >= 3 ? 'fill-orange-400 animate-bounce' : ''}`} style={{ animationDuration: '2s' }} />
                        {habit.streak}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Streak</span>
                </div>
            </div>
        </div>
    );
}
