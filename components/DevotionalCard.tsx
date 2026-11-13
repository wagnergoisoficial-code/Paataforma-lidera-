import React from 'react';
import { BookHeart, Star } from 'lucide-react';
import { Devotional } from '../types';

export const DevotionalCard: React.FC<{ data: Devotional | null }> = ({ data }) => {
  if (!data) return null;
  return (
    <div className="w-full animate-appear">
      <div className="bg-gradient-to-br from-[#FDB813] via-[#B8860B] to-[#FDB813] p-[1px] rounded-[32px] shadow-2xl relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[#FDB813] blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
        
        <div className="bg-[#001220] rounded-[31px] p-8 relative overflow-hidden">
          {/* Background Watermark */}
          <BookHeart className="absolute -bottom-6 -right-6 text-[#FDB813] opacity-5 w-48 h-48 rotate-[-15deg]" />
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <span className="w-1 h-8 bg-[#FDB813] rounded-full" />
              <span className="text-[#FDB813] text-[10px] font-black uppercase tracking-[0.2em]">{data.data_postagem || "HOJE"}</span>
            </div>
            <div className="bg-[#FDB813]/10 p-2 rounded-full border border-[#FDB813]/20">
              <Star size={16} className="text-[#FDB813] fill-[#FDB813]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="font-brand font-black text-3xl text-white uppercase leading-tight mb-2 tracking-tight">{data.titulo}</h2>
          
          {/* Reference */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-[1px] w-8 bg-[#FDB813]" />
            <p className="font-serif italic text-[#FDB813] text-sm font-semibold">{data.referencia_biblica}</p>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-gradient-to-r from-white/10 to-transparent mb-6" />

          {/* Message */}
          <div className="relative">
            <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">{data.mensagem}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
