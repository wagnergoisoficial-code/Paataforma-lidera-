import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  Trophy, 
  Users, 
  Zap, 
  ArrowRight, 
  Star, 
  Shield,
  LayoutGrid,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { User, Network, GlobalChallenge } from '../types';

export const RedeView: React.FC = () => {
  const [globalRanking, setGlobalRanking] = useState<User[]>([]);
  const [network, setNetwork] = useState<Network | null>(null);
  const [globalChallenges, setGlobalChallenges] = useState<GlobalChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ranking, challenges] = await Promise.all([
          firebaseService.getGlobalRanking(5),
          // In a real app, we'd fetch global challenges from a collection
          // For now, let's mock some or fetch if implemented
          Promise.resolve([]) 
        ]);
        
        setGlobalRanking(ranking);
        
        // If user has a networkId, fetch it
        const user = firebaseService.getCurrentUser();
        if (user?.networkId) {
          const netData = await firebaseService.getNetworkData(user.networkId);
          setNetwork(netData);
        }
      } catch (error) {
        console.error('Error fetching network data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-zinc-900 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Rede Global</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 italic serif">Conectando o Reino</h1>
          <p className="text-zinc-400 max-w-md">
            Sua igreja faz parte de algo muito maior. Explore conexões, desafios e o impacto global da nossa rede.
          </p>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl -mr-20 -mt-20 rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-3xl -ml-20 -mb-20 rounded-full" />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Ranking */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 italic serif">
              <Trophy className="w-5 h-5 text-amber-400" />
              Ranking Global de Engajamento
            </h2>
            <button className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            {globalRanking.map((user, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={user.uid}
                className="flex items-center justify-between p-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-zinc-100 text-zinc-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-zinc-50 text-zinc-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden border-2 border-white shadow-sm">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{user.name}</h4>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Nível {user.level || 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Zap className="w-4 h-4 fill-current" />
                    {user.experience?.toLocaleString()} XP
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Network Communities */}
          {network && (
            <div className="space-y-6 pt-4">
              <h2 className="text-xl font-bold flex items-center gap-2 italic serif">
                <Users className="w-5 h-5 text-blue-500" />
                Comunidades na Rede: {network.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {network.communities.map((commId) => (
                  <div key={commId} className="p-4 bg-white rounded-2xl border border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">Igreja Parceira</h4>
                      <p className="text-xs text-zinc-500">ID: {commId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Global Challenges */}
          <section className="space-y-4">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2 italic serif">
              <Star className="w-5 h-5 text-amber-500" />
              Desafios Globais
            </h3>
            
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200 relative overflow-hidden group">
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full mb-3 inline-block">
                    Evento Especial
                  </span>
                  <h4 className="font-bold text-lg mb-1">Missões 2026</h4>
                  <p className="text-emerald-50 text-xs mb-4">
                    Todas as igrejas unidas para alcançar 1 milhão de orações este mês.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>PROGRESSO GLOBAL</span>
                      <span>65%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-[65%]" />
                    </div>
                  </div>
                </div>
                <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform" />
              </div>

              <div className="p-4 bg-white rounded-2xl border border-zinc-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-900">Conferência Global</h5>
                    <p className="text-[10px] text-zinc-500 uppercase">25 de Abril • Online</p>
                  </div>
                </div>
                <button className="w-full py-2 bg-zinc-50 text-zinc-600 text-xs font-bold rounded-xl hover:bg-zinc-100 transition-colors">
                  Saber mais
                </button>
              </div>
            </div>
          </section>

          {/* Network Stats */}
          <section className="p-6 bg-zinc-50 rounded-3xl space-y-6">
            <h3 className="font-bold text-zinc-900 italic serif">Impacto da Rede</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Igrejas</span>
                <div className="text-2xl font-bold text-zinc-900 italic">120+</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Membros</span>
                <div className="text-2xl font-bold text-zinc-900 italic">15k+</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Orações</span>
                <div className="text-2xl font-bold text-zinc-900 italic">450k</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Vidas</span>
                <div className="text-2xl font-bold text-zinc-900 italic">2.4k</div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-zinc-900 uppercase">Selo de Qualidade</p>
                  <p className="text-[9px] text-zinc-500">Sua igreja é uma Comunidade Ativa</p>
                </div>
              </div>
            </div>
          </section>

          {/* Global Chat / Forum Teaser */}
          <section className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
            <div className="p-2 bg-blue-500 rounded-xl text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-blue-900 italic serif">Fórum de Líderes</h5>
              <p className="text-[10px] text-blue-700">Troque experiências com outros pastores.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
