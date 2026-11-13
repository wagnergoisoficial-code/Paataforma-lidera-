import React from 'react';
import { Heart, MessageSquare, GraduationCap, Sparkles, Book, Cake, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { firebaseService } from '../../services/firebase';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
  onCheckIn: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate, onCheckIn }) => {
  const currentUser = firebaseService.getCurrentUser();
  const isSecretaria = currentUser?.role?.toLowerCase() === 'secretaria';

  const actions = [
    { 
      id: 'biblia', 
      label: 'Bíblia', 
      icon: <Book className="text-rose-500" />, 
      bg: 'bg-rose-50', 
      color: 'text-rose-500',
      action: () => onNavigate('biblia')
    },
    { 
      id: 'aniversariantes', 
      label: 'Parabéns', 
      icon: <Cake className="text-emerald-600" />, 
      bg: 'bg-emerald-50', 
      color: 'text-emerald-600',
      action: () => onNavigate('aniversariantes')
    },
    isSecretaria ? { 
      id: 'secretaria', 
      label: 'Secretaria', 
      icon: <Users className="text-[#001220]" />, 
      bg: 'bg-amber-100', 
      color: 'text-[#001220]',
      action: () => onNavigate('secretaria')
    } : { 
      id: 'boca_de_deus', 
      label: 'Boca de Deus', 
      icon: <Sparkles className="text-amber-500" />, 
      bg: 'bg-amber-50', 
      color: 'text-amber-500',
      action: () => onNavigate('boca_de_deus')
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map((action, idx) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          onClick={action.action}
          className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm active:scale-95 transition-all group"
        >
          <div className={`${action.bg} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
            {action.icon}
          </div>
          <span className="font-brand font-black text-[10px] uppercase tracking-tighter text-slate-800">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
