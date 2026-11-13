import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Plus, User, Send, X, Loader2, Image as ImageIcon, Video, FileUp, Play, Download, RefreshCw, Pin, Sparkles, Calendar as CalendarIcon, BookOpen, ShieldCheck, Activity } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Post, Comment } from '../types';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { SocialFeed } from '../src/components/SocialFeed';

import { PostCard } from '../src/components/PostCard';

export const FeedView: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
    const [viewMode, setViewMode] = useState<'posts' | 'activity'>('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [caption, setCaption] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(loadMoreRef);
    const currentUser = firebaseService.getCurrentUser();

    // Initial load with subscription for real-time updates on the first page
    useEffect(() => {
        if (!currentUser) return;
        const unsub = firebaseService.subscribePosts(async (data) => {
            if (data.length > 0) {
                // Set posts immediately for better perceived performance
                setPosts(prev => {
                    if (prev.length === 0) return data;
                    const updatedIds = new Set(data.map(p => p.id));
                    const remainingPosts = prev.filter(p => !updatedIds.has(p.id));
                    return [...data, ...remainingPosts];
                });
                
                // Fetch liked status in background
                const liked = await firebaseService.getLikedPostIds(data.map(p => p.id));
                setLikedPostIds(prev => new Set([...prev, ...liked]));
                
                setHasMore(prev => prev || data.length >= 10);
            }
            setLoading(false);
        }, 10);
        return () => { if (unsub) unsub(); };
    }, [currentUser?.uid]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || posts.length === 0 || viewMode === 'activity') return;
        
        setLoadingMore(true);
        try {
            const lastPost = posts[posts.length - 1];
            const { posts: newPosts, lastVisible: newLast } = await firebaseService.getPostsPaginated(lastPost, 10);
            
            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                // Update posts immediately
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });

                // Fetch liked status in background
                const newLiked = await firebaseService.getLikedPostIds(newPosts.map(p => p.id));
                setLikedPostIds(prev => new Set([...prev, ...newLiked]));

                setHasMore(newPosts.length >= 10);
            }
        } catch (error) {
            console.error("Error loading more posts:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore, posts, viewMode]);

    useEffect(() => {
        if (isInView && hasMore && !loading && !loadingMore && viewMode === 'posts') {
            loadMore();
        }
    }, [isInView, hasMore, loading, loadingMore, loadMore, viewMode]);

    const handleLike = useCallback(async (postId: string) => {
        if (!currentUser) return;
        
        // Optimistic update
        const isCurrentlyLiked = likedPostIds.has(postId);
        setLikedPostIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyLiked) next.delete(postId);
            else next.add(postId);
            return next;
        });

        // Update post count locally for immediate feedback
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, likeCount: (p.likeCount || 0) + (isCurrentlyLiked ? -1 : 1) };
            }
            return p;
        }));

        await firebaseService.toggleLike(postId, currentUser.uid);
    }, [currentUser, likedPostIds]);

    const handleShare = useCallback((post: Post) => {
        const shareText = `Confira esse post de ${post.authorName} na UMADW: ${post.caption}`;
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'UMADW Comunidade',
                text: shareText,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(`${shareText} - ${url}`);
            alert('Link copiado para a área de transferência!');
        }
    }, []);

    const handleDownload = useCallback(async (url: string, filename: string) => {
        if (!url) return;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Erro ao baixar:", error);
            window.open(url, '_blank');
        }
    }, []);

    const handleBocaDeDeus = async () => {
        setIsUploading(true);
        try {
            await firebaseService.postEncouragement();
        } catch (error) {
            console.error("Erro ao postar encorajamento:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaType(file.type.startsWith('video') ? 'video' : 'image');
            const reader = new FileReader();
            reader.onloadend = () => setMediaPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreatePost = async () => {
        if (!caption.trim() || !currentUser) return;
        setIsUploading(true);
        try {
            await firebaseService.createFeedPost({
                authorUid: currentUser.uid,
                authorName: currentUser.name,
                authorPhoto: currentUser.photo,
                caption: caption,
                mediaFile: mediaFile || undefined,
                mediaType: mediaType,
                type: 'normal'
            });
            setCaption('');
            setMediaFile(null);
            setMediaPreview(null);
            setShowCreate(false);
        } catch (error) {
            console.error("Erro ao criar post:", error);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-[#FDB813]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-24 animate-appear">
            <div className="px-6 space-y-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-brand font-black text-3xl uppercase tracking-tighter">Comunidade</h2>
                        <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Compartilhe sua fé</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {['Dono', 'Lider', 'Admin'].includes(currentUser?.role || '') && (
                            <button 
                                onClick={handleBocaDeDeus}
                                disabled={isUploading}
                                className="p-4 bg-rose-50 rounded-2xl text-rose-500 hover:bg-rose-100 transition-colors active:scale-95 disabled:opacity-50"
                                title="Boca de Deus"
                            >
                                <Sparkles size={20} />
                            </button>
                        )}
                        <button 
                            onClick={() => window.location.reload()} 
                            className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-[#001220] transition-colors active:scale-95"
                            title="Recarregar"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button 
                            onClick={() => setShowCreate(true)} 
                            className="bg-[#001220] text-[#FDB813] p-4 rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="text-[10px] font-black uppercase">Postar</span>
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex p-1 bg-zinc-100 rounded-2xl">
                    <button
                        onClick={() => setViewMode('posts')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                            viewMode === 'posts' ? 'bg-white shadow-sm text-[#001220]' : 'text-zinc-400'
                        }`}
                    >
                        <ImageIcon size={16} />
                        Posts
                    </button>
                    <button
                        onClick={() => setViewMode('activity')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                            viewMode === 'activity' ? 'bg-white shadow-sm text-[#001220]' : 'text-zinc-400'
                        }`}
                    >
                        <Activity size={16} />
                        Atividade
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showCreate && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[500] bg-[#001220]/90 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="font-brand font-black text-xl uppercase">Nova Publicação</h3>
                                <button onClick={() => setShowCreate(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                                        Mídia (Foto ou Vídeo)
                                    </label>
                                    
                                    <div 
                                        onClick={() => !mediaPreview && fileInputRef.current?.click()}
                                        className={`w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden relative ${mediaPreview ? 'border-none' : ''}`}
                                    >
                                        {mediaPreview ? (
                                            <div className="relative w-full h-full group">
                                                {mediaType === 'image' ? (
                                                    <img src={mediaPreview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <video src={mediaPreview} className="w-full h-full object-cover" />
                                                )}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeMedia(); }}
                                                    className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-2xl shadow-xl active:scale-95 transition-transform z-10"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <FileUp size={32} className="text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Clique para selecionar</span>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileSelect} 
                                            accept="image/*,video/*" 
                                            className="hidden" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sua Mensagem / Versículo</label>
                                    <textarea 
                                        value={caption} 
                                        onChange={e => setCaption(e.target.value)} 
                                        placeholder="O que Deus falou com você hoje?" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:ring-2 ring-[#FDB813] h-24 resize-none transition-all text-sm" 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleCreatePost} 
                                disabled={!caption.trim() || isUploading}
                                className="w-full bg-[#001220] py-5 rounded-2xl font-brand font-black text-[#FDB813] uppercase shadow-2xl active:scale-95 transition-transform disabled:opacity-30 tracking-widest flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Enviando...</span>
                                    </>
                                ) : (
                                    "Publicar na Comunidade"
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-10 px-6">
                {viewMode === 'activity' ? (
                    <SocialFeed communityId={currentUser?.communityId || 'umadw'} />
                ) : (
                    <>
                        {posts.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
                            <MessageCircle size={40} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma publicação ainda.<br/>Seja o primeiro a postar!</p>
                    </div>
                ) : posts.map((post) => (
                    <PostCard 
                        key={post.id}
                        post={post}
                        isLiked={likedPostIds.has(post.id)}
                        onLike={handleLike}
                        onShare={handleShare}
                        onDownload={handleDownload}
                        onNavigate={onNavigate}
                    />
                ))}

                        {/* Infinite Scroll Trigger */}
                        <div ref={loadMoreRef} className="py-10 flex justify-center">
                            {loadingMore && (
                                <Loader2 className="animate-spin text-[#FDB813]" size={32} />
                            )}
                            {!hasMore && posts.length > 0 && (
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Você chegou ao fim do feed ✨</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
