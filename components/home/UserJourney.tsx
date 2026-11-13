import React from 'react';
import { Star, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';

interface UserJourneyProps {
  user: User;
  onNavigate: () => void;
}

export const UserJourney: React.FC<UserJourneyProps> = ({ user, onNavigate }) => {
  const nextLevelXp = Math.pow(user.level, 2) * 100;
  const progress = Math.min((user.experience / nextLevelXp) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onNavigate}
      className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm space-y-6 cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-4 rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} className="text-dark" />
          </div>
          <div>
            <h3 className="font-brand font-black text-lg uppercase leading-tight">Sua Jornada</h3>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nível {user.level} • {user.experience} XP</p>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-primary transition-colors">
          <ChevronRight size={20} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black uppercase text-slate-400">Progresso do Nível</span>
          <span className="text-[10px] font-black uppercase text-primary tracking-widest">{Math.round(progress)}%</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary rounded-full shadow-sm shadow-primary/30"
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
          <span>{user.experience} XP</span>
          <span>{nextLevelXp} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <Star size={16} className="text-primary fill-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Conquistas</p>
            <p className="text-xs font-black uppercase text-slate-800">{user.badges?.length || 0}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Ofensiva</p>
            <p className="text-xs font-black uppercase text-slate-800">{user.streak || 0} Dias</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
