import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, User, Shield, Sparkles, MessageCircle } from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { User as UserType, Encouragement } from '../../types';

export const BocaDeDeus: React.FC = () => {
  const [members, setMembers] = useState<UserType[]>([]);
  const [myEncouragements, setMyEncouragements] = useState<Encouragement[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserType | null>(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'received'>('send');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const currentUser = firebaseService.getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allMembers, received] = await Promise.all([
          firebaseService.getMembers(50),
          firebaseService.getMyEncouragements()
        ]);
        setMembers(allMembers.filter(m => m.uid !== currentUser?.uid));
        setMyEncouragements(received);
      } catch (error) {
        console.error('Error fetching Boca de Deus data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSend = async () => {
    if (!selectedMember || !message.trim() || !currentUser) return;
    
    setSending(true);
    try {
      await firebaseService.sendEncouragement({
        fromUid: currentUser.uid,
        toUid: selectedMember.uid!,
        text: message.trim(),
        message: message.trim(),
        isAnonymous,
        communityId: currentUser.communityId || 'umadw'
      });
      
      setMessage('');
      setSelectedMember(null);
      setIsAnonymous(false);
      alert('Mensagem de encorajamento enviada! ✨');
    } catch (error) {
      console.error('Error sending encouragement:', error);
      alert('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-[#001220] p-8 text-white rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#FDB813] rounded-xl flex items-center justify-center">
              <Sparkles className="text-[#001220] w-6 h-6" />
            </div>
            <h1 className="text-2xl font-brand font-black uppercase italic tracking-wider">Boca de Deus</h1>
          </div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
            Seja a voz de Deus para alguém hoje.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FDB813]/10 rounded-full blur-3xl" />
      </div>

      {/* Tabs */}
      <div className="px-6 mt-8">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border flex gap-1">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-3 rounded-xl font-brand font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'send' ? 'bg-[#001220] text-[#FDB813]' : 'text-slate-400'
            }`}
          >
            Enviar Palavra
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 rounded-xl font-brand font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'received' ? 'bg-[#001220] text-[#FDB813]' : 'text-slate-400'
            }`}
          >
            Minhas Mensagens
          </button>
        </div>
      </div>

      <div className="px-6 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'send' ? (
            <motion.div
              key="send"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Member Selection */}
              <div className="space-y-3">
                <h3 className="font-brand font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">
                  Para quem é a mensagem?
                </h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {members.map((member) => (
                    <button
                      key={member.uid}
                      onClick={() => setSelectedMember(member)}
                      className={`shrink-0 flex flex-col items-center gap-2 transition-all ${
                        selectedMember?.uid === member.uid ? 'scale-110' : 'opacity-60'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 overflow-hidden ${
                        selectedMember?.uid === member.uid ? 'border-[#FDB813] bg-white shadow-lg' : 'border-transparent bg-slate-200'
                      }`}>
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-[8px] font-black uppercase text-slate-600 truncate w-14 text-center">
                        {member.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              {selectedMember && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                      <MessageCircle size={18} />
                    </div>
                    <h4 className="font-brand font-black text-xs uppercase tracking-widest text-slate-700">
                      Mensagem para {selectedMember.name}
                    </h4>
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="O que Deus colocou no seu coração para essa pessoa?"
                    className="w-full h-32 p-4 bg-slate-50 rounded-2xl text-sm outline-none focus:ring-2 ring-[#FDB813]/20 transition-all resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isAnonymous ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-transparent'
                      }`}
                    >
                      <Shield size={14} />
                      {isAnonymous ? 'Enviar como Anônimo' : 'Modo Identificado'}
                    </button>

                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || sending}
                      className="bg-[#001220] text-[#FDB813] px-6 py-3 rounded-xl font-brand font-black text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-blue-900/20"
                    >
                      {sending ? 'Enviando...' : 'Enviar'}
                      <Send size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="received"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {myEncouragements.length > 0 ? (
                myEncouragements.map((enc) => (
                  <div key={enc.id} className="bg-white p-6 rounded-[32px] shadow-md border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Heart size={48} className="text-red-500" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                        <Heart size={18} fill="currentColor" />
                      </div>
                      <div>
                        <h4 className="font-brand font-black text-[10px] uppercase tracking-widest text-slate-400">
                          De: {enc.isAnonymous ? 'Anônimo' : 'Alguém especial'}
                        </h4>
                        <p className="text-[8px] text-slate-300 uppercase font-bold">
                          {enc.timestamp ? (enc.timestamp as any).toDate().toLocaleDateString() : 'Recentemente'}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm italic leading-relaxed">
                      "{enc.text || enc.message}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-[40px] text-center space-y-4 border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Heart size={32} />
                  </div>
                  <p className="text-slate-400 text-sm italic">
                    Nenhuma mensagem recebida ainda.<br/>
                    Continue sendo luz!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
