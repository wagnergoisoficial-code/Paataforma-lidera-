import React, { useState, useEffect } from 'react';
import { User, Heart, Star, Calendar, ArrowRight, MessageCircle, Shield, CheckCircle2, Clock, Activity, TrendingUp, Sparkles, BookOpen, Users } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Discipleship, CheckIn, TimelineEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DiscipuladoView: React.FC = () => {
    const [discipleship, setDiscipleship] = useState<Discipleship | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'meu' | 'mentoria'>('meu');
    const currentUser = firebaseService.getCurrentUser();

    useEffect(() => {
        const fetchDiscipleship = async () => {
            if (!currentUser) return;
            try {
                const data = await firebaseService.getDiscipleship(currentUser.uid);
                if (Array.isArray(data)) {
                    setDiscipleship(data[0] || null);
                } else {
                    setDiscipleship(data);
                }
            } catch (error) {
                console.error("Error fetching discipleship:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDiscipleship();
    }, [currentUser?.uid]);

    const growthMetrics = [
        { label: 'Constância', value: '85%', icon: <Activity size={16} />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Engajamento', value: '92%', icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Impacto', value: '12', icon: <Star size={16} />, color: 'text-amber-500', bg: 'bg-amber-50' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FDB813]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-24 animate-appear">
            <div className="px-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-brand font-black text-3xl uppercase tracking-tighter">Discipulado</h2>
                        <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Crescimento e Mentoria</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-zinc-100 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('meu')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'meu' ? 'bg-white shadow-sm text-[#001220]' : 'text-zinc-400'
                        }`}
                    >
                        <User size={16} />
                        Meu Caminho
                    </button>
                    <button
                        onClick={() => setActiveTab('mentoria')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'mentoria' ? 'bg-white shadow-sm text-[#001220]' : 'text-zinc-400'
                        }`}
                    >
                        <Shield size={16} />
                        Mentoria
                    </button>
                </div>

                {activeTab === 'meu' ? (
                    <div className="space-y-8">
                        {/* Mentor Card */}
                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-md">
                                    <img 
                                        src={discipleship?.mentorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(discipleship?.mentorName || 'Mentor')}&background=6366f1&color=fff`} 
                                        alt="Mentor" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Seu Discipulador</p>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{discipleship?.mentorName || 'Aguardando Atribuição'}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conectado</span>
                                    </div>
                                </div>
                                <button className="p-4 bg-indigo-50 rounded-2xl text-indigo-500 hover:bg-indigo-100 transition-colors">
                                    <MessageCircle size={20} />
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-50 grid grid-cols-3 gap-4">
                                {growthMetrics.map((metric, idx) => (
                                    <div key={idx} className="text-center space-y-1">
                                        <div className={`w-10 h-10 ${metric.bg} ${metric.color} rounded-xl flex items-center justify-center mx-auto`}>
                                            {metric.icon}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                                        <p className="text-sm font-black text-slate-900">{metric.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Personal Growth Report */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Sparkles size={16} className="text-[#FDB813]" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Relatório de Evolução</h3>
                            </div>
                            <div className="bg-[#001220] p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDB813]/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#FDB813]/20 transition-colors"></div>
                                <div className="relative space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Nível Atual</p>
                                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Nível {currentUser?.level || 1}</h4>
                                        </div>
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-[#FDB813] backdrop-blur-sm border border-white/10">
                                            <Star size={32} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-white/40">Progresso para o Nível {(currentUser?.level || 1) + 1}</span>
                                            <span className="text-[#FDB813]">{currentUser?.experience || 0} / 1000 XP</span>
                                        </div>
                                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((currentUser?.experience || 0) / 1000) * 100}%` }}
                                                className="h-full bg-gradient-to-r from-[#FDB813] to-amber-400 rounded-full shadow-[0_0_10px_rgba(253,184,19,0.3)]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Contribuições</p>
                                            <p className="text-xl font-black text-white">
                                                {((currentUser?.contributions?.posts || 0) + 
                                                  (currentUser?.contributions?.comments || 0) + 
                                                  (currentUser?.contributions?.likes || 0) + 
                                                  (currentUser?.contributions?.ritualsCompleted || 0))}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Ofensiva</p>
                                            <p className="text-xl font-black text-white">{currentUser?.streak || 0} Dias</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <BookOpen size={16} className="text-slate-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Próximos Passos</h3>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                                        <Star size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-tight">Ritual de Consagração</h4>
                                        <p className="text-xs text-slate-500">Faltam 2 dias para completar o ciclo.</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-slate-300 group-hover:text-[#001220] transition-colors" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Mentorship Overview */}
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto">
                                <Shield size={40} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Painel de Mentoria</h3>
                                <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">Acompanhe o crescimento daqueles que Deus confiou sob seu cuidado.</p>
                            </div>
                        </div>

                        {/* Mentees List (Mocked for now) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <Users size={16} className="text-slate-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Seus Liderados</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: 'Lucas Oliveira', status: 'Excelente', lastCheckIn: 'Hoje', mood: '😊' },
                                    { name: 'Sarah Martins', status: 'Atenção', lastCheckIn: '3 dias atrás', mood: '😔' },
                                    { name: 'Gabriel Costa', status: 'Bom', lastCheckIn: 'Ontem', mood: '😐' }
                                ].map((mentee, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                                                {mentee.mood}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-tight">{mentee.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                        mentee.status === 'Excelente' ? 'text-emerald-500' :
                                                        mentee.status === 'Atenção' ? 'text-amber-500' :
                                                        'text-indigo-500'
                                                    }`}>{mentee.status}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mentee.lastCheckIn}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#001220] transition-colors">
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
