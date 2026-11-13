import React from 'react';
import { Star, Trophy, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Challenge } from '../../types';

interface ChallengesSectionProps {
  challenges: Challenge[];
  onNavigate: () => void;
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({ challenges, onNavigate }) => {
  if (challenges.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-brand font-black text-lg uppercase flex items-center gap-2">
          <Trophy size={20} className="text-primary" />
          Desafios Ativos
        </h2>
        <button 
          onClick={onNavigate} 
          className="text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
        >
          Ver Todos
          <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {challenges.map((challenge, idx) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 rounded-[32px] shadow-lg text-white flex items-center justify-between group cursor-pointer"
            onClick={onNavigate}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Star size={24} className="fill-white" />
              </div>
              <div>
                <h4 className="font-brand font-black text-sm uppercase leading-tight">{challenge.title}</h4>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  {challenge.participants?.length || 0} Participantes
                </p>
              </div>
            </div>
            <div className="bg-white text-indigo-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-md group-hover:scale-105 transition-transform">
              Participar
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
