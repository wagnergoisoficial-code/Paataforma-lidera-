import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Challenge } from '../types';
import { motion } from 'motion/react';

export const ChallengesView: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = firebaseService.getCurrentUser();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    const data = await firebaseService.getChallenges();
    setChallenges(data);
    setLoading(false);
  };

  const handleJoin = async (challengeId: string) => {
    await firebaseService.joinChallenge(challengeId);
    loadChallenges();
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Carregando desafios...</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-1">
        <h2 className="font-brand font-black text-3xl uppercase tracking-tighter">Desafios</h2>
        <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Unidos por um propósito</p>
      </div>

      <div className="grid gap-6">
        {challenges.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] text-center space-y-4 border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
              <Trophy size={32} />
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum desafio ativo no momento</p>
          </div>
        ) : challenges.map(challenge => {
          const isParticipant = challenge.participants.includes(currentUser?.uid || '');
          const progress = (challenge.currentProgress / challenge.targetGoal) * 100;

          return (
            <motion.div 
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-[#FDB813]" />
                    <h3 className="font-black text-xl uppercase tracking-tight">{challenge.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{challenge.description}</p>
                </div>
                {isParticipant && (
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black uppercase">
                    <CheckCircle2 size={12} />
                    Participando
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Progresso da Comunidade</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{challenge.currentProgress} alcançados</span>
                  <span>Meta: {challenge.targetGoal}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{challenge.participants.length} Participantes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 justify-end">
                  <Calendar size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Expira em {new Date(challenge.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              {!isParticipant && (
                <button 
                  onClick={() => handleJoin(challenge.id)}
                  className="w-full py-4 bg-[#001220] text-[#FDB813] rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  Aceitar Desafio
                  <ArrowRight size={16} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
