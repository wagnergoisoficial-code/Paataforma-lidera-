import React, { useState, useEffect, useRef } from 'react';
import { Plus, Key, Calendar, CheckCircle } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { AgendaEvent } from '../types';

declare global {
  interface Window {
    FullCalendar: any;
  }
}

export const AgendaView: React.FC = () => {
    const calendarRef = useRef<HTMLDivElement>(null);
    const calendarInstance = useRef<any>(null);
    
    // Admin States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [hasConfirmed, setHasConfirmed] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [newEvent, setNewEvent] = useState<AgendaEvent>({ title: '', start: '', description: '' });

    useEffect(() => {
        const unsub = firebaseService.subscribeEvents((data) => {
            if (calendarInstance.current) {
                calendarInstance.current.removeAllEvents();
                calendarInstance.current.addEventSource(data);
            }
        });

        if (calendarRef.current && window.FullCalendar) {
            calendarInstance.current = new window.FullCalendar.Calendar(calendarRef.current, {
                initialView: 'listMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listMonth'
                },
                locale: 'pt-br',
                buttonText: {
                    today: 'Hoje',
                    month: 'Mês',
                    list: 'Lista'
                },
                height: 'auto',
                events: [],
                eventColor: '#FDB813',
                eventTextColor: '#001220',
                eventClick: (info: any) => {
                    const event = {
                        id: info.event.id,
                        title: info.event.title,
                        start: info.event.start.toISOString(),
                        description: info.event.extendedProps.description
                    };
                    setSelectedEvent(event);
                    setShowDetailModal(true);
                    checkUserPresence(event.id);
                }
            });
            calendarInstance.current.render();
        }

        return () => unsub();
    }, []);

    const checkUserPresence = async (eventId: string) => {
        const user = firebaseService.getCurrentUser();
        if (!user?.uid) return;
        
        const presences = await firebaseService.getEventPresence(eventId);
        const confirmed = presences.some(p => p.userUid === user.uid);
        setHasConfirmed(confirmed);
    };

    const handleConfirmPresence = async () => {
        if (!selectedEvent?.id || hasConfirmed) return;
        
        const user = firebaseService.getCurrentUser();
        if (!user?.uid) return alert("Você precisa estar logado.");

        setIsConfirming(true);
        try {
            await firebaseService.recordPresence({
                userUid: user.uid,
                eventId: selectedEvent.id,
                eventTitle: selectedEvent.title,
                communityId: user.communityId || 'umadw',
                verifiedBy: 'user_self' // Self-confirmation
            });
            setHasConfirmed(true);
            alert("Presença confirmada!");
        } catch (error) {
            console.error("Erro ao confirmar presença:", error);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleAdminClick = () => {
        setPasswordInput('');
        setShowPasswordModal(true);
    };

    const handleVerifyPassword = () => {
        if (passwordInput === 'ADMIN123') {
            setShowPasswordModal(false);
            setShowAddModal(true);
        } else {
            alert('Senha incorreta.');
        }
    };

    const handleSaveEvent = async () => {
        if (!newEvent.title || !newEvent.start) return alert("Preencha o título e a data.");
        await firebaseService.publishEvent({
            title: newEvent.title,
            start: newEvent.start,
            description: newEvent.description,
            color: '#FDB813'
        });
        setShowAddModal(false);
        setNewEvent({ title: '', start: '', description: '' });
        alert("Evento adicionado!");
    };

    return (
        <div className="min-h-screen bg-[#001220] animate-appear pt-24 pb-20 relative">
            <div className="px-6 mb-6 flex justify-between items-end">
               <div>
                    <h1 className="font-brand font-black text-2xl uppercase tracking-tighter text-white">AGENDA</h1>
                    <p className="text-[#FDB813] text-[9px] font-black uppercase tracking-widest">PROGRAMAÇÃO UMADW</p>
               </div>
            </div>
            
            <div className="px-2">
                <div ref={calendarRef} id="calendar" className="bg-[#001220] rounded-xl" />
            </div>

            <button 
                onClick={handleAdminClick}
                className="fixed bottom-24 right-6 w-14 h-14 bg-[#FDB813] rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
            >
                <Plus size={28} className="text-[#001220]" />
            </button>

            {showDetailModal && selectedEvent && (
                <div className="fixed inset-0 z-[530] bg-[#001220]/90 backdrop-blur-sm flex items-center justify-center p-6 animate-appear">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#FDB813]" />
                        <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">X</button>
                        
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-[#FDB813]/20 rounded-2xl flex items-center justify-center mb-4 text-[#FDB813]">
                                <Calendar size={24} />
                            </div>
                            <h3 className="font-black text-2xl text-[#001220] leading-tight mb-2">{selectedEvent.title}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Key size={12} className="text-[#FDB813]" /> {new Date(selectedEvent.start).toLocaleString('pt-BR')}
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 mb-8">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {selectedEvent.description || 'Sem detalhes adicionais para este evento.'}
                            </p>
                        </div>

                        <button 
                            onClick={handleConfirmPresence}
                            disabled={hasConfirmed || isConfirming}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                hasConfirmed 
                                ? 'bg-emerald-500 text-white cursor-default' 
                                : 'bg-[#001220] text-[#FDB813] active:scale-95 hover:shadow-xl'
                            }`}
                        >
                            {isConfirming ? (
                                <div className="w-5 h-5 border-2 border-[#FDB813] border-t-transparent rounded-full animate-spin" />
                            ) : hasConfirmed ? (
                                <>CONFIRMADO <CheckCircle size={18} /></>
                            ) : (
                                <>CONFIRMAR PRESENÇA <CheckCircle size={18} /></>
                            )}
                        </button>
                        
                        {hasConfirmed && (
                            <p className="text-center text-[10px] font-bold text-emerald-600 uppercase mt-3 tracking-widest">
                                Sua participação foi registrada!
                            </p>
                        )}
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="fixed inset-0 z-[510] bg-[#001220]/90 backdrop-blur-sm flex items-center justify-center p-6 animate-appear">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">X</button>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-12 h-12 bg-[#FDB813]/20 rounded-full flex items-center justify-center mb-3 text-[#FDB813]">
                                <Key size={24} />
                            </div>
                            <h3 className="font-black text-lg text-[#001220] uppercase">ACESSO RESTRITO</h3>
                            <p className="text-xs text-slate-400">Senha do Líder para adicionar eventos</p>
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

            {showAddModal && (
                <div className="fixed inset-0 z-[520] bg-[#001220]/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-appear">
                     <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-lg text-[#001220] flex items-center gap-2">
                                <Calendar size={20} /> NOVO EVENTO
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-100 rounded-full">X</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nome do Evento</label>
                                <input 
                                    value={newEvent.title} 
                                    onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                                    placeholder="Ex: Culto de Jovens" 
                                    className="w-full p-4 bg-slate-50 rounded-xl border outline-none focus:border-[#FDB813] font-bold" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Data e Hora</label>
                                <input 
                                    type="datetime-local"
                                    value={newEvent.start} 
                                    onChange={e => setNewEvent({...newEvent, start: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-xl border outline-none focus:border-[#FDB813]" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Detalhes</label>
                                <textarea 
                                    value={newEvent.description} 
                                    onChange={e => setNewEvent({...newEvent, description: e.target.value})} 
                                    placeholder="Informações adicionais..." 
                                    className="w-full p-4 bg-slate-50 rounded-xl border outline-none focus:border-[#FDB813] h-24 resize-none" 
                                />
                            </div>
                            <button onClick={handleSaveEvent} className="w-full bg-[#001220] text-[#FDB813] py-4 rounded-xl font-black shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                                SALVAR NA AGENDA <CheckCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
