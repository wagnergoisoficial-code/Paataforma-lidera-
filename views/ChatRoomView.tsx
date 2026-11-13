import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, User as UserIcon } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { ChatMessage, User, ChatRoom } from '../types';

interface ChatRoomProps {
    room?: ChatRoom;
    recipient?: User;
    onBack: () => void;
}

export const ChatRoomView: React.FC<ChatRoomProps> = ({ room: initialRoom, recipient, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(initialRoom || null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUser = firebaseService.getCurrentUser();

  useEffect(() => {
    if (room) return;
    
    const initChat = async () => {
      if (recipient?.uid && currentUser?.uid) {
        const chatRoom = await firebaseService.getOrCreateChatRoom([currentUser.uid, recipient.uid]);
        if (chatRoom) {
          setRoom(chatRoom);
        }
      }
    };

    initChat();
  }, [recipient?.uid, room]);

  useEffect(() => {
    if (!room?.id) return;
    const unsub = firebaseService.subscribeChatMessages(room.id, (newMessages) => {
      setMessages(newMessages);
    });
    return () => { if (unsub) unsub(); };
  }, [room?.id]);

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !room?.id) return;
    const text = input.trim();
    setInput('');
    await firebaseService.sendChatMessage(room.id, text);
  };

  const getHeaderTitle = () => {
    if (room?.isCommunityGroup) return room.name || 'Chat da Comunidade';
    if (recipient) return recipient.name;
    return 'Chat';
  };

  const getHeaderSubtitle = () => {
    if (room?.isCommunityGroup) return 'GRUPO PÚBLICO';
    return 'CHAT PRIVADO';
  };

  return (
    <div className="fixed inset-0 z-[400] bg-[#F8FAFC] flex flex-col animate-appear">
      <div className="bg-[#001220] pt-14 pb-6 px-6 text-white shadow-2xl flex items-center gap-4 rounded-b-[40px]">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h2 className="font-brand font-black text-sm uppercase tracking-wider">{getHeaderTitle()}</h2>
            <p className="text-[#FDB813] text-[8px] font-black tracking-widest uppercase">{getHeaderSubtitle()}</p>
          </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-4 no-scrollbar">
          {messages.length > 0 ? (
            messages.map((m, i) => {
              const isMe = m.senderUid === currentUser?.uid;
              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && room?.type === 'group' && (
                    <span className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-2 tracking-widest">
                      {m.senderName}
                    </span>
                  )}
                  <div className={`max-w-[80%] px-5 py-3 rounded-[24px] text-sm shadow-sm ${
                    isMe 
                      ? 'bg-[#001220] text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 rounded-tl-none text-slate-700'
                  }`}>
                      {m.text}
                  </div>
                  <span className="text-[7px] text-slate-300 mt-1 mx-2 font-bold">
                    {m.timestamp ? (m.timestamp as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Send size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Inicie a conversa</p>
            </div>
          )}
      </div>

      <div className="p-6 bg-white/80 backdrop-blur-md border-t border-slate-100">
        <div className="bg-slate-50 rounded-3xl p-2 shadow-inner border border-slate-100 flex items-center gap-2">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            className="flex-1 px-4 outline-none text-sm h-12 bg-transparent" 
            placeholder="Sua mensagem..." 
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim()} 
            className="bg-[#001220] text-[#FDB813] p-3 rounded-2xl active:scale-90 transition-transform disabled:opacity-30 shadow-lg shadow-blue-900/20"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
