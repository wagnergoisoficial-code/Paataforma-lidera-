import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Star, 
  Users, 
  Calendar, 
  Activity,
  Heart,
  MessageSquare,
  Share2
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { TimelineEvent, User, UserRole } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface SocialFeedProps {
  communityId: string;
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'achievement': return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 'milestone': return <Star className="w-4 h-4 text-purple-500" />;
    case 'contribution': return <Users className="w-4 h-4 text-blue-500" />;
    case 'presence': return <Calendar className="w-4 h-4 text-green-500" />;
    case 'ritual': return <Activity className="w-4 h-4 text-orange-500" />;
    default: return <Activity className="w-4 h-4 text-zinc-500" />;
  }
};

export const SocialFeed: React.FC<SocialFeedProps> = ({ communityId }) => {
  const [events, setEvents] = useState<(TimelineEvent & { user?: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseService.db) return;

    const q = query(
      collection(firebaseService.db, 'communities', communityId, 'timeline'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineEvent));
      
      // Use denormalized user data from the event itself for better performance
      const eventsWithUsers = eventData.map(event => ({
        ...event,
        user: {
          name: event.userName || 'Membro',
          photo: event.userPhoto || '',
          uid: event.userUid,
          email: '',
          birthday: '',
          role: 'Membro' as UserRole,
          level: 1,
          experience: 0,
          streak: 0,
          badges: [],
          contributions: { posts: 0, comments: 0, likes: 0, ritualsCompleted: 0 },
          communityId: event.communityId
        } as User
      }));

      setEvents(eventsWithUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [communityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-zinc-900">Atividade da Comunidade</h2>
        <div className="flex -space-x-2 overflow-hidden">
          {events.slice(0, 5).map((e, i) => (
            <img
              key={i}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
              src={e.user?.photo || `https://ui-avatars.com/api/?name=${e.user?.name || 'User'}`}
              alt=""
              referrerPolicy="no-referrer"
            />
          ))}
          {events.length > 5 && (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 ring-2 ring-white text-[10px] font-bold text-zinc-500">
              +{events.length - 5}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {events.map((event, index) => (
            <motion.div
              key={event.id || index}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={event.user?.photo || `https://ui-avatars.com/api/?name=${event.user?.name || 'User'}`}
                    alt={event.user?.name}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-zinc-100">
                    {getEventIcon(event.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-zinc-900 truncate">{event.user?.name || 'Membro'}</span>
                    <span className="text-[10px] font-medium text-zinc-400">
                      {event.timestamp?.toDate ? formatDistanceToNow(event.timestamp.toDate(), { addSuffix: true, locale: ptBR }) : 'Agora'}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 line-clamp-2">
                    <span className="font-medium text-zinc-900">{event.title}</span>: {event.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-pink-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      Apoiar
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-blue-500 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>Nenhuma atividade recente na comunidade.</p>
          </div>
        )}
      </div>
    </div>
  );
};
