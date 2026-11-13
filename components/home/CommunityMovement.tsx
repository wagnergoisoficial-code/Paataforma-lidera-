import React from 'react';
import { Activity, History, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TimelineEvent } from '../../types';
import { Timeline } from '../../src/components/Timeline';

interface CommunityMovementProps {
  events: TimelineEvent[];
  onNavigate: () => void;
}

export const CommunityMovement: React.FC<CommunityMovementProps> = ({ events, onNavigate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-brand font-black text-lg uppercase flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          Movimento da Comunidade
        </h2>
        <button 
          onClick={onNavigate} 
          className="text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
        >
          Ver Tudo
          <ChevronRight size={12} />
        </button>
      </div>
      
      <div className="bg-white border border-zinc-100 rounded-[32px] p-6 shadow-sm overflow-hidden max-h-[300px] relative">
        <Timeline events={events.slice(0, 3)} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
