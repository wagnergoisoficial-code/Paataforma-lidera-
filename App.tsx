import React, { useState, useEffect } from 'react';
import { NotificationCenter } from './components/NotificationCenter';
import { firebaseService } from './services/firebase';
import { Navigation } from './components/Navigation';
import { WelcomeView } from './views/WelcomeView';
import { HomeView } from './views/HomeView';

const AgendaView = React.lazy(() => import('./views/AgendaView').then(m => ({ default: m.AgendaView })));
const DevotionalView = React.lazy(() => import('./views/DevotionalView').then(m => ({ default: m.DevotionalView })));
const BibleView = React.lazy(() => import('./views/BibleView').then(m => ({ default: m.BibleView })));
const CommunityChatView = React.lazy(() => import('./views/CommunityChatView').then(m => ({ default: m.CommunityChatView })));
const BirthdayView = React.lazy(() => import('./views/BirthdayView').then(m => ({ default: m.BirthdayView })));
const ProfileView = React.lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const FeedView = React.lazy(() => import('./views/FeedView').then(m => ({ default: m.FeedView })));
const PainelView = React.lazy(() => import('./views/PainelView').then(m => ({ default: m.PainelView })));
const DiscipuladoView = React.lazy(() => import('./views/DiscipuladoView').then(m => ({ default: m.DiscipuladoView })));
const BocaDeDeus = React.lazy(() => import('./src/components/BocaDeDeus').then(m => ({ default: m.BocaDeDeus })));
const CommunitySettingsView = React.lazy(() => import('./views/CommunitySettingsView').then(m => ({ default: m.CommunitySettingsView })));
const RedeView = React.lazy(() => import('./views/RedeView').then(m => ({ default: m.RedeView })));
const SecretariaView = React.lazy(() => import('./views/SecretariaView').then(m => ({ default: m.SecretariaView })));
const PainelLiderancaView = React.lazy(() => import('./views/PainelLiderancaView').then(m => ({ default: m.PainelLiderancaView })));

import { OnboardingView } from './src/components/OnboardingView';
import { User, Community, PLAN_FEATURES, PlanType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles } from 'lucide-react';

const PlanGate: React.FC<{ 
  feature: keyof typeof PLAN_FEATURES.free; 
  planId: PlanType; 
  userRole?: string;
  children: React.ReactNode 
}> = ({ feature, planId, userRole, children }) => {
  const isPrivileged = userRole && ['dono', 'superadmin', 'admin', 'lider', 'leader', 'secretaria', 'tesoureiro', 'regente'].includes(userRole.toLowerCase());
  const hasAccess = isPrivileged || PLAN_FEATURES[planId]?.[feature];

  if (hasAccess) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-amber-500" />
      </div>
      <h2 className="font-brand font-black text-2xl uppercase mb-2">Recurso Premium</h2>
      <p className="text-slate-500 mb-8 max-w-xs">
        Este recurso está disponível apenas nos planos Premium e Enterprise. 
        Evolua sua comunidade para desbloquear!
      </p>
      <button className="bg-[#001220] text-white px-8 py-4 rounded-2xl font-brand font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/20">
        <Sparkles className="w-5 h-5 text-amber-400" />
        Ver Planos
      </button>
    </div>
  );
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [hasStarted, setHasStarted] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [community, setCommunity] = useState<Community | null>(null);

    useEffect(() => {
        firebaseService.onAuthChange(async (u) => {
            if (u && u.email) { 
                setUser(u); 
                setHasStarted(true); 
                // Carregar dados da comunidade
                const comm = await firebaseService.getCommunity(u.communityId || 'umadw');
                setCommunity(comm);
                
                // Request notification permission
                await firebaseService.requestNotificationPermission();
                
                // Check birthdays if admin
                if (['admin', 'lider', 'leader', 'dono', 'superadmin', 'secretaria', 'tesoureiro'].includes(u.role.toLowerCase())) {
                  await firebaseService.checkBirthdays();
                }
            } else {
                setUser(null);
                setHasStarted(false);
                setCommunity(null);
            }
        });
    }, []);

    // Apply community theme if available
    useEffect(() => {
        if (community) {
            document.documentElement.style.setProperty('--primary-color', community.primaryColor || '#FDB813');
            document.documentElement.style.setProperty('--secondary-color', community.secondaryColor || '#001220');
        }
    }, [community]);

    const renderContent = () => {
        switch(activeTab) {
            case 'home': return <HomeView onNavigate={setActiveTab} community={community} />;
            case 'feed': return <FeedView onNavigate={setActiveTab} />;
            case 'agenda': return <AgendaView />;
            case 'biblia': return <BibleView onBack={() => setActiveTab('home')} />;
            case 'chat': return <CommunityChatView onBack={() => setActiveTab('home')} />;
            case 'aniversariantes': return <BirthdayView onBack={() => setActiveTab('home')} />;
            case 'devocional': return <DevotionalView onBack={() => setActiveTab('home')} />; 
            case 'discipulado': return <DiscipuladoView />;
            case 'boca_de_deus': return <BocaDeDeus />;
            case 'rede': return (
              <PlanGate feature="allowGlobalRanking" planId={community?.planId || 'free'} userRole={user?.role}>
                <RedeView />
              </PlanGate>
            );
            case 'painel': return <PainelView user={user} community={community} onBack={() => setActiveTab('home')} />;
            case 'painel_lideranca': return <PainelLiderancaView user={user} onBack={() => setActiveTab('home')} onNavigateTab={(tab) => setActiveTab(tab === 'membros' ? 'secretaria' : 'painel')} />;
            case 'secretaria': return <SecretariaView onBack={() => setActiveTab('home')} />;
            case 'configuracoes_comunidade': return <CommunitySettingsView onBack={() => setActiveTab('painel')} />;
            case 'perfil': return user ? <ProfileView 
                user={user} 
                onLogout={() => { if(confirm("Deseja realmente encerrar sua sessão?")) firebaseService.logout(); }}
                onUpdate={(updatedUser) => setUser(updatedUser)}
            /> : null;
            default: return <HomeView onNavigate={setActiveTab} community={community} />;
        }
    };

    if (!hasStarted) return <WelcomeView onStart={(u) => { setUser(u); setHasStarted(true); }} />;

    if (user && !user.communityId) {
        return <OnboardingView onComplete={async (id) => {
            const comm = await firebaseService.getCommunity(id);
            setCommunity(comm);
            const updatedUser = await firebaseService.getUserProfile(user.uid!);
            if (updatedUser) setUser(updatedUser);
        }} />;
    }

    return (
        <ErrorBoundary>
            <div className="max-w-lg mx-auto min-h-screen bg-[#F8FAFC] shadow-2xl relative flex flex-col">
                {user && (
                  <header className="bg-[#001220] p-4 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FDB813] rounded-xl flex items-center justify-center font-brand font-black text-[#001220] overflow-hidden">
                        {community?.logo ? (
                          <img src={community.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          community?.name?.substring(0, 2).toUpperCase() || 'UM'
                        )}
                      </div>
                      <div>
                        <h1 className="text-white font-brand font-black text-sm uppercase tracking-wider">
                          {community?.name || 'Portal UMADW'}
                        </h1>
                        <p className="text-[#FDB813] text-[10px] font-medium uppercase tracking-widest leading-none">
                          {community?.planId === 'premium' ? 'Premium ✨' : 'Comunidade Viva'}
                        </p>
                      </div>
                    </div>
                    <NotificationCenter />
                  </header>
                )}
                <div className="flex-1 overflow-y-auto pb-24">
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="w-10 h-10 border-4 border-[#FDB813] border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    {renderContent()}
                  </React.Suspense>
                </div>
                <Navigation activeTab={activeTab} onTabChange={setActiveTab} user={user} />
            </div>
        </ErrorBoundary>
    );
};

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-center">
                    <div className="bg-white p-8 rounded-[40px] shadow-xl border border-red-100 max-w-sm">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <h2 className="font-brand font-black text-xl uppercase mb-2">Ops! Algo deu errado</h2>
                        <p className="text-slate-500 text-sm mb-6">Ocorreu um erro inesperado. Por favor, tente recarregar a página.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#001220] text-white py-4 rounded-2xl font-brand font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            Recarregar App
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <pre className="mt-4 p-4 bg-slate-100 rounded-xl text-[10px] text-left overflow-auto max-h-32 text-red-600">
                                {this.state.error?.message}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default App;
