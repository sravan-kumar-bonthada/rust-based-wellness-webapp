import { useState } from 'react';

const MOODS = [
    { value: 1, label: 'Awful', emoji: '😭', color: 'bg-red-500' },
    { value: 3, label: 'Bad', emoji: '😞', color: 'bg-orange-500' },
    { value: 5, label: 'Okay', emoji: '😐', color: 'bg-yellow-500' },
    { value: 7, label: 'Good', emoji: '🙂', color: 'bg-green-500' },
    { value: 10, label: 'Awesome', emoji: '🤩', color: 'bg-blue-500' },
];

export default function MoodForm({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedMood !== null) {
            onSubmit({ score: selectedMood, note });
            setSelectedMood(null);
            setNote('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">How are you feeling right now?</h2>
                <p className="text-gray-500 text-sm mt-1">Select the emoji that best matches your mood.</p>
            </div>

            <div className="flex justify-between items-center max-w-md mx-auto">
                {MOODS.map((mood) => (
                    <button
                        key={mood.value}
                        type="button"
                        onClick={() => setSelectedMood(mood.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${selectedMood === mood.value
                                ? 'bg-gray-100 scale-110 shadow-sm'
                                : 'hover:bg-gray-50 hover:scale-105 opacity-70 hover:opacity-100'
                            }`}
                    >
                        <span className="text-4xl filter drop-shadow-sm">{mood.emoji}</span>
                        <span className={`text-xs font-medium ${selectedMood === mood.value ? 'text-gray-900' : 'text-gray-500'}`}>
                            {mood.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Add a note (optional)
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's making you feel this way?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
                />
            </div>

            <button
                type="submit"
                disabled={selectedMood === null}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Log Mood
            </button>
        </form>
    );
}
