import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, User, Send, Share2, MessageSquare, Plus, Users } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { ChatRoomView } from './ChatRoomView';
import { ChatMessage, User as UserType, ChatRoom } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const CommunityChatView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [allMembers, setAllMembers] = useState<UserType[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [selectedPrivateUser, setSelectedPrivateUser] = useState<UserType | null>(null);
    const [showMemberSelector, setShowMemberSelector] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const currentUser = firebaseService.getCurrentUser();

    useEffect(() => {
        const unsubRooms = firebaseService.subscribeMyChatRooms(setRooms);
        const unsubMembers = firebaseService.subscribeAllMembers(setAllMembers);
        setLoading(false);
        return () => { 
          if (unsubRooms) unsubRooms(); 
          if (unsubMembers) unsubMembers(); 
        };
    }, []);

    const handleStartPrivateChat = async (recipient: UserType) => {
      if (!currentUser?.uid || !recipient.uid) return;
      const room = await firebaseService.getOrCreateChatRoom([currentUser.uid, recipient.uid]);
      if (room) {
        setSelectedPrivateUser(recipient);
        setShowMemberSelector(false);
      }
    };

    const handleOpenCommunityChat = async () => {
      const room = await firebaseService.getOrCreateCommunityGroupChat();
      if (room) {
        setSelectedRoom(room);
      }
    };

    if (selectedPrivateUser) {
      return <ChatRoomView recipient={selectedPrivateUser} onBack={() => setSelectedPrivateUser(null)} />;
    }

    if (selectedRoom) {
      return <ChatRoomView room={selectedRoom} onBack={() => setSelectedRoom(null)} />;
    }

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC] animate-appear pt-24">
            {/* Header */}
            <div className="bg-[#001220] p-8 text-white rounded-b-[40px] shadow-2xl shrink-0 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                    <h2 className="font-brand font-black text-xl uppercase italic tracking-wider">Conversas</h2>
                  </div>
                  <button 
                    onClick={() => setShowMemberSelector(true)}
                    className="w-10 h-10 bg-[#FDB813] rounded-xl flex items-center justify-center text-[#001220] active:scale-95 transition-transform"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  Conecte-se com sua comunidade
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FDB813]/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar">
              {/* Public Mural Teaser */}
              <button 
                onClick={handleOpenCommunityChat}
                className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[32px] text-white shadow-lg shadow-emerald-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-brand font-black text-sm uppercase tracking-wider">Mural Público</h3>
                    <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest">Toda a comunidade</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 opacity-50 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Chat Rooms List */}
              <div className="space-y-4">
                <h3 className="font-brand font-black text-[10px] uppercase tracking-widest text-slate-400 ml-2">
                  Mensagens Diretas
                </h3>
                
                {rooms.filter(r => r.type === 'private').length > 0 ? (
                  rooms.filter(r => r.type === 'private').map((room) => {
                    const otherParticipantUid = room.participants.find(p => p !== currentUser?.uid);
                    const otherParticipant = allMembers.find(m => m.uid === otherParticipantUid);
                    
                    return (
                      <button 
                        key={room.id}
                        onClick={() => otherParticipant && setSelectedPrivateUser(otherParticipant)}
                        className="w-full bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all hover:shadow-md"
                      >
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-slate-400 border border-slate-50">
                          {otherParticipant?.photo ? (
                            <img src={otherParticipant.photo} alt={otherParticipant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User size={24} />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-brand font-black text-xs uppercase tracking-wider text-slate-800">
                              {otherParticipant?.name || 'Membro'}
                            </h4>
                            <span className="text-[8px] font-bold text-slate-300 uppercase">
                              {room.lastMessageTime ? (room.lastMessageTime as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">
                            {room.lastMessage || 'Inicie uma conversa...'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-slate-400 text-xs italic">Nenhuma conversa ativa ainda.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Member Selector Modal */}
            <AnimatePresence>
              {showMemberSelector && (
                <div className="fixed inset-0 z-[500] flex items-end justify-center">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMemberSelector(false)}
                    className="absolute inset-0 bg-[#001220]/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-2xl p-8 max-h-[80vh] overflow-y-auto no-scrollbar"
                  >
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
                    <h3 className="font-brand font-black text-lg uppercase italic tracking-wider mb-6 text-[#001220]">Nova Conversa</h3>
                    
                    <div className="space-y-3">
                      {allMembers.filter(m => m.uid !== currentUser?.uid).map((member) => (
                        <button 
                          key={member.uid}
                          onClick={() => handleStartPrivateChat(member)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left group"
                        >
                          <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                            {member.photo ? (
                              <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-brand font-black text-xs uppercase tracking-wider text-slate-800">{member.name}</h4>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{member.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
        </div>
    );
};
