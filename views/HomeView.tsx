import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Bell, Loader2, PlusCircle, ShieldCheck, Users, Lock } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Community, User, TimelineEvent, Devotional, Challenge, Post } from '../types';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { DevotionalHero } from '../components/home/DevotionalHero';
import { QuickActions } from '../components/home/QuickActions';
import { CommunityMovement } from '../components/home/CommunityMovement';
import { UserJourney } from '../components/home/UserJourney';
import { ChallengesSection } from '../components/home/ChallengesSection';
import { PostCard } from '../src/components/PostCard';
import { CheckInForm } from '../src/components/CheckInForm';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  community: Community | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, community }) => {
    const [devotional, setDevotional] = useState<Devotional | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCheckIn, setShowCheckIn] = useState(false);
    
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(loadMoreRef);
    const currentUser = firebaseService.getCurrentUser();

    // Priority 1: Devotional & User Data
    useEffect(() => {
      const unsubDevo = firebaseService.subscribeLatestDevotional(setDevotional);
      
      if (currentUser?.uid) {
        firebaseService.getTimeline(currentUser.uid).then(setTimeline);
        firebaseService.getChallenges().then(setChallenges);
      }

      return () => {
        if (unsubDevo) unsubDevo();
      };
    }, [currentUser?.uid]);

    // Priority 2: Feed Data
    useEffect(() => {
      if (!currentUser) return;
      const unsubPosts = firebaseService.subscribePosts(async (data) => {
        if (data.length > 0) {
          setPosts(prev => {
            if (prev.length === 0) return data;
            const updatedIds = new Set(data.map(p => p.id));
            const remainingPosts = prev.filter(p => !updatedIds.has(p.id));
            return [...data, ...remainingPosts];
          });
          
          const liked = await firebaseService.getLikedPostIds(data.map(p => p.id));
          setLikedPostIds(prev => new Set([...prev, ...liked]));
          setHasMore(prev => prev || data.length >= 10);
        }
        setLoading(false);
      }, 10);

      return () => {
        if (unsubPosts) unsubPosts();
      };
    }, [currentUser?.uid]);

    const loadMore = useCallback(async () => {
      if (loadingMore || !hasMore || posts.length === 0) return;
      
      setLoadingMore(true);
      try {
        const lastPost = posts[posts.length - 1];
        const { posts: newPosts } = await firebaseService.getPostsPaginated(lastPost, 10);
        
        if (newPosts.length === 0) {
          setHasMore(false);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = newPosts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });

          const newLiked = await firebaseService.getLikedPostIds(newPosts.map(p => p.id));
          setLikedPostIds(prev => new Set([...prev, ...newLiked]));
          setHasMore(newPosts.length >= 10);
        }
      } catch (error) {
        console.error("Error loading more posts:", error);
      } finally {
        setLoadingMore(false);
      }
    }, [loadingMore, hasMore, posts]);

    useEffect(() => {
      if (isInView && hasMore && !loading && !loadingMore) {
        loadMore();
      }
    }, [isInView, hasMore, loading, loadingMore, loadMore]);

    const handleLike = useCallback(async (postId: string) => {
      if (!currentUser) return;
      const isCurrentlyLiked = likedPostIds.has(postId);
      setLikedPostIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });

      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, likeCount: (p.likeCount || 0) + (isCurrentlyLiked ? -1 : 1) };
        }
        return p;
      }));

      await firebaseService.toggleLike(postId, currentUser.uid);
    }, [currentUser, likedPostIds]);

    const handleShare = (post: Post) => {
      if (navigator.share) {
        navigator.share({
          title: 'Portal UMADW',
          text: post.caption,
          url: window.location.href,
        });
      }
    };

    const handleDownload = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
        <div className="p-6 pt-24 space-y-10 animate-appear pb-32">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-brand font-black text-2xl uppercase tracking-tighter">
                        {community?.name || 'UMADW'}
                    </h1>
                    <p className="text-primary text-[9px] font-black uppercase tracking-[0.3em]">Portal da Juventude</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowCheckIn(true)}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                        <Heart size={20} />
                        <span className="text-[10px] font-black uppercase">Check-in</span>
                    </button>
                    <button className="p-3 bg-slate-100 rounded-2xl text-slate-400 relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                    </button>
                </div>
            </div>

            {/* 1. Devocional do Dia (Hero Principal) */}
            <DevotionalHero 
              devotional={devotional} 
              onAction={() => onNavigate('devocional')} 
            />

            {/* Central de Liderança e Secretaria (Protegida por Senha) */}
            {currentUser && (
              <div className="bg-[#001220] p-5 rounded-[32px] text-white shadow-xl flex flex-col gap-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#FDB813] text-[10px] font-bold uppercase tracking-widest">Painel Administrativo</span>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md text-white/80 font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-[#FDB813]" /> Senha de Líder
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Central de Liderança & Secretaria</h3>
                  <p className="text-xs text-white/60">Acesse o painel integrado de líderes: cadastro de membros, tesouraria, louvor e agenda.</p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('painel')}
                    className="w-full p-3.5 bg-[#FDB813] hover:bg-[#e5a610] active:scale-95 text-[#001220] rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FDB813]/20"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Entrar no Painel do Líder</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Ações Rápidas */}
            <QuickActions 
              onNavigate={onNavigate} 
              onCheckIn={() => setShowCheckIn(true)}
            />

            {/* 4. Movimento da Comunidade */}
            <CommunityMovement 
              events={timeline} 
              onNavigate={() => onNavigate('perfil')} 
            />

            {/* 5. Jornada do Usuário (Progresso) */}
            {currentUser && (
              <UserJourney 
                user={currentUser} 
                onNavigate={() => onNavigate('perfil')} 
              />
            )}

            {/* 6. Desafios */}
            <ChallengesSection 
              challenges={challenges} 
              onNavigate={() => onNavigate('desafios')} 
            />

            {/* 3. Feed Direto */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-brand font-black text-lg uppercase flex items-center gap-2">
                  <PlusCircle size={20} className="text-primary" />
                  Feed da Comunidade
                </h2>
              </div>

              <div className="space-y-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sincronizando feed...</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isLiked={likedPostIds.has(post.id)}
                      onLike={handleLike}
                      onShare={handleShare}
                      onDownload={handleDownload}
                      onNavigate={onNavigate}
                    />
                  ))
                )}

                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                  {loadingMore && <Loader2 className="animate-spin text-primary" size={24} />}
                </div>
              </div>
            </div>

            {/* Check-in Modal */}
            <AnimatePresence>
              {showCheckIn && (
                <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-brand font-black text-2xl uppercase">Check-in Diário</h3>
                      <button onClick={() => setShowCheckIn(false)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors">
                        <PlusCircle className="w-6 h-6 rotate-45 text-zinc-400" />
                      </button>
                    </div>
                    <CheckInForm onComplete={() => {
                      setShowCheckIn(false);
                      if (currentUser?.uid) {
                        firebaseService.getTimeline(currentUser.uid).then(setTimeline);
                      }
                    }} />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
        </div>
    );
};
