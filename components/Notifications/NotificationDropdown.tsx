'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Sparkles, Moon, Clock, Trophy } from 'lucide-react';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState([
        { id: 1, type: 'ai', title: 'New insight available', message: 'I noticed a pattern between your sleep and mood today.', time: '10 min ago', isRead: false },
        { id: 2, type: 'reminder', title: 'Time to log your mood', message: 'How are you feeling this evening?', time: '2 hours ago', isRead: false },
        { id: 3, type: 'achievement', title: '7-Day Streak!', message: 'You have logged your habits for 7 days in a row.', time: '1 day ago', isRead: true },
        { id: 4, type: 'sleep', title: 'Great sleep last night', message: 'You got 8 hours of restorative sleep.', time: '2 days ago', isRead: true },
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ai': return <Sparkles className="w-4 h-4 text-indigo-500" />;
            case 'reminder': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'achievement': return <Trophy className="w-4 h-4 text-yellow-500" />;
            case 'sleep': return <Moon className="w-4 h-4 text-blue-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'ai': return 'bg-indigo-100';
            case 'reminder': return 'bg-amber-100';
            case 'achievement': return 'bg-yellow-100';
            case 'sleep': return 'bg-blue-100';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-colors relative ${isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div>
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            <p className="text-xs text-gray-500 mt-0.5">You have {unreadCount} unread messages</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => {
                                            setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                        }}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getBgColor(notif.type)}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notif.title}
                                            </p>
                                            <p className={`text-sm mt-0.5 line-clamp-2 ${!notif.isRead ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2 font-medium">
                                                {notif.time}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                        <button className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            View All Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
