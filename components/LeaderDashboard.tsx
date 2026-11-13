import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, Send, Loader2, BarChart3, PieChart as PieChartIcon, Activity, UserMinus } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { User, Community } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const LeaderDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingNotify, setSendingNotify] = useState<string | null>(null);
    const currentUser = firebaseService.getCurrentUser();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [s, inactive] = await Promise.all([
                    firebaseService.getCommunityStats(),
                    firebaseService.getInactiveUsers(7)
                ]);
                setStats(s);
                setInactiveUsers(inactive);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleReengage = async (user: User) => {
        if (!user.uid) return;
        setSendingNotify(user.uid);
        try {
            await firebaseService.sendReengagementNotification(user.uid, user.name);
            alert(`Notificação enviada para ${user.name}!`);
        } catch (error) {
            console.error("Error sending re-engagement:", error);
        } finally {
            setSendingNotify(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-[#FDB813]" size={40} />
            </div>
        );
    }

    const chartData = [
        { name: 'Posts', value: stats?.totalPosts || 0 },
        { name: 'Comentários', value: stats?.totalComments || 0 },
        { name: 'Curtidas', value: stats?.totalLikes || 0 },
    ];

    const COLORS = ['#FDB813', '#001220', '#6366F1', '#EC4899'];

    return (
        <div className="space-y-8 animate-appear">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-brand font-black text-3xl uppercase tracking-tighter">Dashboard Inteligente</h2>
                    <p className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Cuidando das pessoas com dados</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Activity size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sistema Ativo</span>
                </div>
            </div>

            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-2">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                        <TrendingUp size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engajamento Total</p>
                    <h3 className="text-3xl font-black">{(stats?.totalLikes || 0) + (stats?.totalComments || 0)}</h3>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-2">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                        <Users size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuários Ativos (7d)</p>
                    <h3 className="text-3xl font-black">{stats?.activeUsers7d || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-2">
                    <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                        <AlertCircle size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membros em Risco</p>
                    <h3 className="text-3xl font-black text-rose-500">{inactiveUsers.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-2">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                        <BarChart3 size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Retenção</p>
                    <h3 className="text-3xl font-black">84%</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Atividade */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-brand font-black text-xl uppercase tracking-tight">Atividade da Comunidade</h3>
                        <BarChart3 size={20} className="text-slate-300" />
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="value" fill="#FDB813" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lista de Membros em Risco */}
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-brand font-black text-xl uppercase tracking-tight text-rose-500">Membros em Risco</h3>
                        <UserMinus size={20} className="text-rose-300" />
                    </div>
                    
                    <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar">
                        {inactiveUsers.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <p className="text-xs font-bold uppercase tracking-widest">Todos os membros estão ativos! ✨</p>
                            </div>
                        ) : inactiveUsers.map((user) => (
                            <div key={user.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                        <img src={user.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight">{user.name}</h4>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Inativo há 7+ dias</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleReengage(user)}
                                    disabled={sendingNotify === user.uid}
                                    className="p-3 bg-white text-indigo-500 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
                                    title="Enviar incentivo"
                                >
                                    {sendingNotify === user.uid ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="bg-amber-50 p-4 rounded-2xl flex gap-3">
                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Sugestão de Ação</p>
                                <p className="text-xs text-amber-600 leading-relaxed">Envie uma mensagem de encorajamento ou um versículo personalizado para os membros inativos para aumentar a retenção em até 30%.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
