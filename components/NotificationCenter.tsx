import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, MessageSquare, Heart, Gift, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Notification as AppNotification } from '../types';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastNotificationId = React.useRef<string | null>(null);

  useEffect(() => {
    let isFirstLoad = true;
    const unsubscribe = firebaseService.subscribeNotifications((newNotifications) => {
      // Check for new unread notifications to trigger browser push
      const latest = newNotifications[0];
      
      if (isFirstLoad) {
        if (latest) lastNotificationId.current = latest.id || null;
        isFirstLoad = false;
      } else if (latest && !latest.read && latest.id !== lastNotificationId.current) {
        lastNotificationId.current = latest.id || null;
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(latest.title, {
            body: latest.body,
            icon: '/favicon.ico'
          });
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await firebaseService.markNotificationAsRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'birthday': return <Gift className="w-4 h-4 text-pink-500" />;
      case 'devotional': return <BookOpen className="w-4 h-4 text-emerald-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'encouragement': return <Sparkles className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#001220]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 max-h-[400px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-slate-100"
            >
              <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-slate-900">Notificações</h3>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma notificação por aqui.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`p-4 border-bottom border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => n.id && handleMarkAsRead(n.id)}
                    >
                      <div className="mt-1">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {n.timestamp?.toDate ? n.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 self-start" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-slate-50 text-center border-top border-slate-100">
                  <button className="text-xs font-medium text-blue-600 hover:underline">
                    Ver todas
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
