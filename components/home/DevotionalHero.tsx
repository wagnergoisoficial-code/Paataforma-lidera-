import React from 'react';
import { BookOpen, Play, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Devotional } from '../../types';

interface DevotionalHeroProps {
  devotional: Devotional | null;
  onAction: () => void;
}

export const DevotionalHero: React.FC<DevotionalHeroProps> = ({ devotional, onAction }) => {
  if (!devotional) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[40px] bg-dark p-8 shadow-2xl group cursor-pointer"
      onClick={onAction}
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <BookOpen size={120} fill="white" />
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full">
            Devocional do Dia
          </span>
        </div>
        
        <h2 className="text-2xl font-brand font-black text-white uppercase leading-tight">
          {devotional.titulo}
        </h2>
        
        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed max-w-[80%]">
          {devotional.mensagem}
        </p>

        <div className="flex items-center gap-4 pt-2">
          <button className="flex items-center gap-2 bg-primary text-dark px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Play size={16} fill="currentColor" />
            Ler Agora
          </button>
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
            {devotional.referencia_biblica}
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
