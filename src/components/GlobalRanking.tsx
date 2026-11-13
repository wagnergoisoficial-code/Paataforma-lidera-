import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Globe, 
  Star, 
  TrendingUp, 
  Users, 
  Zap,
  Medal,
  Crown,
  Search,
  Filter
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { User } from '../../types';

export const GlobalRanking: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'global' | 'network'>('global');

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const data = await firebaseService.getGlobalRanking(20);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching global ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-indigo-600 p-8 rounded-[40px] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Globe size={24} />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter('global')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === 'global' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Global
              </button>
              <button 
                onClick={() => setFilter('network')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === 'network' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Rede
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tight">Ranking de Impacto</h2>
            <p className="text-indigo-100 text-xs font-medium opacity-80">Os jovens mais engajados de todas as igrejas conectadas.</p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {!loading && users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end pt-8 pb-4">
          {/* 2nd Place */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <img 
                src={users[1].photo} 
                alt={users[1].name}
                className="w-16 h-16 rounded-2xl object-cover border-4 border-slate-200"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-black shadow-lg">
                2
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900 truncate">{users[1].name.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 font-bold">{users[1].experience} XP</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                <Crown size={24} />
              </div>
              <img 
                src={users[0].photo} 
                alt={users[0].name}
                className="w-24 h-24 rounded-[32px] object-cover border-4 border-amber-400 shadow-xl shadow-amber-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                1
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 truncate">{users[0].name.split(' ')[0]}</p>
              <p className="text-xs text-amber-600 font-black">{users[0].experience} XP</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <img 
                src={users[2].photo} 
                alt={users[2].name}
                className="w-16 h-16 rounded-2xl object-cover border-4 border-amber-700/20"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-700/20 rounded-lg flex items-center justify-center text-amber-800 font-black shadow-lg">
                3
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900 truncate">{users[2].name.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 font-bold">{users[2].experience} XP</p>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Carregando Ranking...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.slice(3).map((user, idx) => (
              <motion.div 
                key={user.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center font-black text-slate-300 group-hover:text-indigo-600 transition-colors">
                    {idx + 4}
                  </div>
                  <img 
                    src={user.photo} 
                    alt={user.name}
                    className="w-10 h-10 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-black text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nível {user.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600">{user.experience}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">XP</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
