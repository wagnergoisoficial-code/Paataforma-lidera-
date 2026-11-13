import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Wallet, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Settings,
  Shield,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { User, UserRole } from '../../types';
import { RegenteArea } from './RegenteArea';
import { TesourariaArea } from './TesourariaArea';
import { SecretariaArea } from './SecretariaArea';
import { LiderancaArea } from './LiderancaArea';
import { SecretariaView } from '../../views/SecretariaView';
import { PainelLiderancaView } from '../../views/PainelLiderancaView';

type ManagementTab = 'dashboard' | 'regente' | 'tesouraria' | 'secretaria' | 'membros' | 'lideranca' | 'settings';

interface ManagementDashboardProps {
  user?: User | null;
  initialTab?: ManagementTab;
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ user: propUser, initialTab }) => {
  const [user, setUser] = useState<User | null>(propUser || firebaseService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ManagementTab>(initialTab || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const u = propUser || firebaseService.getCurrentUser();
    setUser(u);
    
    // Set default tab based on role
    if (u && !initialTab) {
      const role = u.role?.toLowerCase() || '';
      if (role === 'regente') setActiveTab('regente');
      else if (role === 'tesoureiro') setActiveTab('tesouraria');
      else if (role === 'secretaria') setActiveTab('membros');
      else if (['leader', 'lider', 'admin', 'dono', 'superadmin'].includes(role)) setActiveTab('dashboard');
    }
  }, [propUser, initialTab]);

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, roles: ['leader', 'Lider', 'admin', 'Dono', 'SuperAdmin', 'secretaria', 'tesoureiro', 'regente'] },
    { id: 'membros', label: 'Secretaria & Membros', icon: Users, roles: ['secretaria', 'leader', 'Lider', 'admin', 'Dono', 'SuperAdmin'] },
    { id: 'secretaria', label: 'Agenda & Eventos', icon: Calendar, roles: ['secretaria', 'leader', 'Lider', 'admin', 'Dono', 'SuperAdmin'] },
    { id: 'regente', label: 'Regência / Louvor', icon: Music, roles: ['regente', 'leader', 'Lider', 'admin', 'Dono', 'SuperAdmin'] },
    { id: 'tesouraria', label: 'Tesouraria', icon: Wallet, roles: ['tesoureiro', 'leader', 'Lider', 'admin', 'Dono', 'SuperAdmin'] },
    { id: 'lideranca', label: 'Liderança', icon: Shield, roles: ['leader', 'Lider', 'admin', 'Dono', 'SuperAdmin'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['admin', 'Dono', 'SuperAdmin'] },
  ];

  // Todos que acessam o painel de liderança desbloqueado têm acesso aos departamentos
  const filteredMenu = menuItems;

  const renderContent = () => {
    switch (activeTab) {
      case 'membros': return <SecretariaView />;
      case 'regente': return <RegenteArea />;
      case 'tesouraria': return <TesourariaArea />;
      case 'secretaria': return <SecretariaArea onNavigateToMembers={() => setActiveTab('membros')} />;
      case 'lideranca': return <LiderancaArea />;
      case 'dashboard':
      default:
        return (
          <PainelLiderancaView 
            user={user} 
            onNavigateTab={(tab) => setActiveTab(tab)} 
          />
        );
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-appear">
      {/* Top Header of Management Dashboard */}
      <div className="bg-[#001220] p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#FDB813] text-[10px] font-bold uppercase tracking-widest">Centro de Comando</span>
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-md text-white/80 font-bold">{user.role}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Painel Geral de Liderança</h1>
            <p className="text-xs text-white/60">Gestão integrada da igreja: membros, tesouraria, louvor e agenda.</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#FDB813] text-[#001220] shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Visão Geral
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Department Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filteredMenu.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ManagementTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-[#001220] text-[#FDB813] shadow-md scale-[1.02]'
                  : 'bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-[#FDB813]' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content for the Selected Tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
