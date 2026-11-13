import React, { useState, useEffect, memo } from 'react';
import { Heart, MessageCircle, Share2, Download, Pin, ShieldCheck, Image as ImageIcon, Loader2, X, BookOpen, Calendar as CalendarIcon, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Post, Comment } from '../../types';
import { firebaseService } from '../../services/firebase';

const CommentSection: React.FC<{ postId: string; onClose: () => void }> = ({ postId, onClose }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsub = firebaseService.subscribeComments(postId, async (data) => {
            setComments(data);
            setLoading(false);
            
            // Fetch liked status for comments
            const commentIds = data.map(c => c.id).filter(id => !!id) as string[];
            if (commentIds.length > 0) {
                const liked = await firebaseService.getLikedCommentIds(postId, commentIds);
                setLikedCommentIds(liked);
            }
        });
        return () => { if (unsub) unsub(); };
    }, [postId]);

    const handleAddComment = async () => {
        if (!commentInput.trim()) return;
        const text = commentInput.trim();
        setCommentInput('');
        await firebaseService.addComment(postId, text);
    };

    const handleToggleLike = async (commentId: string) => {
        const currentUser = firebaseService.currentUser;
        if (!currentUser?.uid) return;

        const isCurrentlyLiked = likedCommentIds.has(commentId);
        
        // Optimistic update
        setLikedCommentIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyLiked) next.delete(commentId);
            else next.add(commentId);
            return next;
        });

        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return { ...c, likeCount: (c.likeCount || 0) + (isCurrentlyLiked ? -1 : 1) };
            }
            return c;
        }));

        await firebaseService.toggleCommentLike(postId, commentId, currentUser.uid);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-6 border-t border-slate-50 space-y-4"
        >
            <div className="flex justify-between items-center px-1">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Comentários</h5>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={14} />
                </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar pr-2">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-slate-300" size={20} />
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-center text-[10px] text-slate-400 uppercase font-black py-4">Nenhum comentário ainda</p>
                ) : comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 p-3 rounded-2xl flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {comment.userPhoto && (
                                    <img src={comment.userPhoto} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                                )}
                                <p className="text-[10px] font-black uppercase text-[#FDB813]">{comment.userName}</p>
                            </div>
                            <p className="text-xs text-slate-600">{comment.text}</p>
                        </div>
                        <button 
                            onClick={() => comment.id && handleToggleLike(comment.id)}
                            className="flex flex-col items-center gap-1 mt-1 group"
                        >
                            <Heart 
                                size={14} 
                                className={comment.id && likedCommentIds.has(comment.id) ? "fill-rose-500 text-rose-500" : "text-slate-300 group-hover:text-rose-500 transition-colors"} 
                            />
                            <span className="text-[8px] font-black text-slate-400">{comment.likeCount || 0}</span>
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="flex gap-2">
                <input 
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 ring-[#FDB813]"
                />
                <button 
                    onClick={handleAddComment}
                    disabled={!commentInput.trim()}
                    className="bg-[#001220] text-[#FDB813] p-2 rounded-xl disabled:opacity-30"
                >
                    <Share2 size={16} className="rotate-90" />
                </button>
            </div>
        </motion.div>
    );
};

interface PostCardProps {
    post: Post;
    isLiked: boolean;
    onLike: (postId: string) => void;
    onShare: (post: Post) => void;
    onDownload: (url: string, filename: string) => void;
    onNavigate?: (tab: string) => void;
}

export const PostCard: React.FC<PostCardProps> = memo(({ 
    post, 
    isLiked, 
    onLike, 
    onShare, 
    onDownload, 
    onNavigate 
}) => {
    const [showComments, setShowComments] = useState(false);

    const getPostTypeIcon = (type: string) => {
        switch(type) {
            case 'devotional': return <BookOpen size={16} className="text-indigo-500" />;
            case 'event': return <CalendarIcon size={16} className="text-emerald-500" />;
            case 'verse': return <Play size={16} className="text-amber-500" />;
            case 'encouragement': return <Sparkles size={16} className="text-rose-500" />;
            default: return null;
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "100px" }}
            className="bg-white rounded-[48px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#FDB813] shadow-md">
                        <img 
                            src={post.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=FDB813&color=001220`} 
                            alt={post.authorName} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm uppercase tracking-tight">{post.authorName}</h4>
                            {getPostTypeIcon(post.type)}
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                            {post.type === 'normal' ? 'Membro da Comunidade' : post.type.toUpperCase()}
                            {post.timestamp && (
                                <span className="ml-2 opacity-50">
                                    • {formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true, locale: ptBR })}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {post.pinned && <Pin size={16} className="text-[#FDB813] fill-[#FDB813]" />}
                    {post.isLeaderPost && <ShieldCheck size={16} className="text-[#001220]" />}
                </div>
            </div>

            {(post.mediaUrl || post.type === 'normal') && (
                <div className="aspect-square bg-slate-50 relative group">
                    {post.mediaType === 'video' ? (
                        <video 
                            src={post.mediaUrl} 
                            className="w-full h-full object-cover" 
                            controls 
                            playsInline
                            preload="metadata"
                        />
                    ) : post.mediaUrl ? (
                        <img 
                            src={post.mediaUrl} 
                            alt="Post content" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <ImageIcon size={64} />
                        </div>
                    )}
                </div>
            )}

            <div className="p-8 space-y-6">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => onLike(post.id)} 
                        className="flex items-center gap-2 group"
                    >
                        <Heart 
                            size={28} 
                            className={isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-300 group-hover:text-rose-500 transition-all"} 
                        />
                        <span className="text-sm font-black text-slate-800">{post.likeCount || 0}</span>
                    </button>
                    
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 group"
                    >
                        <MessageCircle size={28} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                        <span className="text-sm font-black text-slate-800">{post.commentCount || 0}</span>
                    </button>

                    <button onClick={() => onShare(post)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#001220] transition-colors">
                        <Share2 size={20} />
                    </button>

                    <button 
                        onClick={() => onDownload(post.mediaUrl || '', `umadw_${post.id}.${post.mediaType === 'video' ? 'mp4' : 'jpg'}`)} 
                        className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-[#001220] transition-colors"
                    >
                        <Download size={20} />
                    </button>
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed">
                        <span className="font-black mr-2 uppercase text-[10px] text-[#001220]">{post.authorName}</span>
                        {post.caption}
                    </p>
                </div>

                <AnimatePresence>
                    {showComments && (
                        <CommentSection 
                            postId={post.id} 
                            onClose={() => setShowComments(false)} 
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});
