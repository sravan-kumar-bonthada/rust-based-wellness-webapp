'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import { MessageSquare, Heart, Share2, Send, Tag } from 'lucide-react';
import api from '@/lib/api';

export default function CommunityPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [newPost, setNewPost] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/community/posts');
            setPosts(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        try {
            await api.post('/community/posts', { content: newPost, tags: [] });
            setNewPost('');
            fetchPosts();
        } catch (err) {
            console.error('Failed to create post', err);
        }
    };

    return (
        <div className="flex h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64">
                <Navbar />
                <main className="flex-1 overflow-y-auto pt-24">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                        <header>
                            <h1 className="text-3xl font-bold text-gray-900">Community</h1>
                            <p className="text-gray-500 mt-1">A safe space to share and support each other.</p>
                        </header>

                        {/* Create Post */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <form onSubmit={handleCreatePost} className="space-y-4">
                                <textarea
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    placeholder="What's on your mind today?"
                                    className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
                                />
                                <div className="flex justify-between items-center">
                                    <button type="button" className="text-gray-400 hover:text-blue-500 flex items-center gap-2 text-sm font-medium">
                                        <Tag className="w-4 h-4" /> Add Tags
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newPost.trim()}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" /> Post
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Feed */}
                        <div className="space-y-6">
                            {isLoading ? (
                                <div className="text-center py-20 text-gray-400 animate-pulse">Loading community feed...</div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
                                    No posts yet. Be the first to share something!
                                </div>
                            ) : (
                                posts.map((post) => (
                                    <div key={post.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                {post.user_id.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">User</p>
                                                <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{post.content}</p>
                                        <div className="flex items-center gap-6 pt-2 border-t border-gray-50">
                                            <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition text-sm font-medium">
                                                <Heart className="w-4 h-4" /> {post.like_count || 0}
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition text-sm font-medium">
                                                <MessageSquare className="w-4 h-4" /> Comment
                                            </button>
                                            <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition text-sm font-medium">
                                                <Share2 className="w-4 h-4" /> Share
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
