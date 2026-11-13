import React from 'react';
import { Home, LayoutGrid, ShieldCheck, UserCircle, Heart, MessageSquare, Globe, Users } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { User } from '../types';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: User | null;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, user }) => {
  const currentUser = user || firebaseService.getCurrentUser();
  const userRole = currentUser?.role?.toLowerCase() || '';
  const isLeader = ['dono', 'lider', 'admin', 'superadmin', 'leader', 'regente', 'tesoureiro', 'secretaria'].includes(userRole);
  const isSecretaria = userRole === 'secretaria';
  const isAdminOrOwner = ['dono', 'admin', 'superadmin'].includes(userRole);

  const tabs = [
      { id: 'home', icon: Home, label: 'Início' },
      { id: 'feed', icon: LayoutGrid, label: 'Feed' },
      { id: 'chat', icon: MessageSquare, label: 'Chat' },
      { id: 'painel', icon: ShieldCheck, label: 'Líder' },
      { id: 'perfil', icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto z-[300]">
      <div className="bg-[#001220] rounded-[32px] flex justify-around py-4 px-2 shadow-2xl border border-white/5">
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => onTabChange(t.id)} 
            className={`flex flex-col items-center gap-1 transition-all duration-300 relative px-2 ${activeTab === t.id ? 'text-[#FDB813] scale-110' : 'text-white/40 hover:text-white/60'}`}
          >
            <t.icon size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">{t.label}</span>
            {activeTab === t.id && (
              <div className="absolute -bottom-2 w-6 h-1 bg-[#FDB813] rounded-full shadow-[0_0_10px_rgba(253,184,19,0.5)]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
