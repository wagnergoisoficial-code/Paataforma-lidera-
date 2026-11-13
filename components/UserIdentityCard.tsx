import React from 'react';
import { User } from '../types';
import { Zap, Flame, Award, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface UserIdentityCardProps {
  user: User;
}

export const UserIdentityCard: React.FC<UserIdentityCardProps> = ({ user }) => {
  const nextLevelXp = Math.pow(user.level, 2) * 100;
  const progress = (user.experience / nextLevelXp) * 100;

  return (
    <div className="bg-[#001220] p-6 rounded-[40px] shadow-2xl text-white overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDB813]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#FDB813] shadow-lg">
                <img src={user.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#FDB813] text-[#001220] w-8 h-8 rounded-lg flex items-center justify-center font-brand font-black text-xs shadow-md">
                {user.level}
              </div>
            </div>
            <div>
              <h3 className="font-brand font-black text-lg uppercase tracking-tight">{user.name}</h3>
              <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={16} fill="currentColor" />
              <span className="font-brand font-black text-xl">{user.streak}</span>
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Dias Seguidos</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jornada Espiritual</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FDB813]">
              {user.experience} / {nextLevelXp} XP
            </p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#FDB813] to-orange-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
            <Zap size={14} className="mx-auto mb-1 text-amber-400" />
            <p className="text-[14px] font-black">{user.contributions?.posts || 0}</p>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Posts</p>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
            <Award size={14} className="mx-auto mb-1 text-indigo-400" />
            <p className="text-[14px] font-black">{user.contributions?.ritualsCompleted || 0}</p>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Rituais</p>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
            <TrendingUp size={14} className="mx-auto mb-1 text-emerald-400" />
            <p className="text-[14px] font-black">{user.contributions?.likes || 0}</p>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Curtidas</p>
          </div>
        </div>
      </div>
    </div>
  );
};
