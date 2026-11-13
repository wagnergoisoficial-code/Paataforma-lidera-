import React, { useState, useEffect } from 'react';
import { Loader2, BookHeart, Lock, Key, Edit3, CheckCircle } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { DevotionalCard } from '../components/DevotionalCard';
import { Devotional } from '../types';

export const DevotionalView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [latestDevotional, setLatestDevotional] = useState<Devotional | null>(null);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [adminForm, setAdminForm] = useState<Devotional>({ titulo: '', referencia_biblica: '', mensagem: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = firebaseService.subscribeLatestDevotional((data) => {
            setLatestDevotional(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleUnlockClick = () => {
        setShowPasswordModal(true);
        setPasswordInput('');
    };

    const handleVerifyPassword = () => {
        if (passwordInput === "ADMIN123") {
            setShowPasswordModal(false);
            setIsAdminOpen(true);
        } else {
            alert("Senha incorreta. Tente novamente.");
        }
    };

    const handlePublish = async () => {
        if(!adminForm.titulo || !adminForm.mensagem) return alert("Preencha título e mensagem.");
        await firebaseService.publishDevotional(adminForm);
        setAdminForm({ titulo: '', referencia_biblica: '', mensagem: '' });
        setIsAdminOpen(false);
        alert("Devocional publicado com sucesso!");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-appear pt-24 pb-20">
            <div className="px-8 mb-6">
                <h1 className="font-brand font-black text-2xl uppercase tracking-tighter">DEVOCIONAL</h1>
                <p className="text-[#FDB813] text-[9px] font-black uppercase tracking-widest">ALIMENTO DIÁRIO</p>
            </div>
            
            <div className="px-6">
                {loading ? (
                    <Loader2 className="animate-spin mx-auto text-[#001220] mt-10" />
                ) : latestDevotional ? (
                    <DevotionalCard data={latestDevotional} />
                ) : (
                    <div className="bg-white p-8 rounded-[32px] text-center border border-slate-200 shadow-sm">
                        <BookHeart className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-bold">Aguardando a palavra do dia...</p>
                        <p className="text-xs text-slate-400 mt-2">O líder postará em breve.</p>
                    </div>
                )}
            </div>

            <div className="mt-12 text-center">
                <button onClick={handleUnlockClick} className="text-slate-300 text-xs flex items-center gap-1 mx-auto hover:text-[#001220] transition-colors">
                    <Lock size={12} /> Área do Líder
                </button>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 z-[510] bg-[#001220]/90 backdrop-blur-sm flex items-center justify-center p-6 animate-appear">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">X</button>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 bg-[#FDB813]/20 rounded-full flex items-center justify-center mb-3 text-[#FDB813]">
                                <Key size={24} />
                            </div>
                            <h3 className="font-black text-lg text-[#001220] uppercase">ACESSO RESTRITO</h3>
                            <p className="text-xs text-slate-400">Digite a senha do líder para continuar</p>
                        </div>
                        <input 
                            type="password"
                            value={passwordInput} 
                            onChange={e => setPasswordInput(e.target.value)} 
                            className="w-full bg-slate-100 border-none rounded-xl p-4 text-center font-bold text-lg mb-4 outline-none focus:ring-2 focus:ring-[#FDB813]"
                            placeholder="••••••••"
                        />
                        <button onClick={handleVerifyPassword} className="w-full bg-[#001220] text-white py-4 rounded-xl font-bold uppercase tracking-wide active:scale-95 transition-transform">
                            Desbloquear
                        </button>
                    </div>
                </div>
            )}

            {isAdminOpen && (
                <div className="fixed inset-0 z-[500] bg-[#001220]/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-appear">
                    <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-lg text-[#001220] flex items-center gap-2">
                                <Edit3 size={20} /> NOVO DEVOCIONAL
                            </h3>
                            <button onClick={() => setIsAdminOpen(false)} className="p-2 bg-slate-100 rounded-full">X</button>
                        </div>
                        <div className="space-y-4">
                            <input 
                                value={adminForm.titulo} 
                                onChange={e => setAdminForm({...adminForm, titulo: e.target.value})} 
                                placeholder="Título da Mensagem (Ex: Esperança Viva)" 
                                className="w-full p-4 bg-slate-50 rounded-xl border outline-none focus:border-[#FDB813] font-bold" 
                            />
                            <input 
                                value={adminForm.referencia_biblica} 
                                onChange={e => setAdminForm({...adminForm, referencia_biblica: e.target.value})} 
                                placeholder="Ref. Bíblica (Ex: Salmos 23:1)" 
                                className="w-full p-4 bg-slate-50 rounded-xl border outline-none focus:border-[#FDB813]" 
                            />
                            <textarea 
                                value={adminForm.mensagem} 
                                onChange={e => setAdminForm({...adminForm, mensagem: e.target.value})} 
                                placeholder="Escreva a mensagem edificante aqui..." 
                                className="w-full p-4 bg-slate-50 rounded-xl border outline-none focus:border-[#FDB813] h-32 resize-none" 
                            />
                            <button onClick={handlePublish} className="w-full bg-[#001220] text-[#FDB813] py-4 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                                PUBLICAR AGORA <CheckCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
