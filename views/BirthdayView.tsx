import React, { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, User, Calendar } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { geminiService } from '../services/gemini';
import { ChatRoomView } from './ChatRoomView';
import { User as UserType } from '../types';

export const BirthdayView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [birthdaysToday, setBirthdaysToday] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGreeting, setIsGreeting] = useState<string | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<UserType | null>(null);

    useEffect(() => {
        const unsub = firebaseService.subscribeAllMembers((members) => {
            const today = new Date();
            const currentDay = String(today.getDate()).padStart(2, '0');
            const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
            const todayString = `${currentDay}/${currentMonth}`;

            const filtered = members.filter(m => {
                if (!m.birthday) return false;
                return m.birthday === todayString;
            });
            
            setBirthdaysToday(filtered);
            setLoading(false);
        });
        return () => { if (unsub) unsub(); };
    }, []);

    if (selectedPerson) return <ChatRoomView recipient={selectedPerson} onBack={() => setSelectedPerson(null)} />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] animate-appear pt-24">
            <div className="bg-[#001220] p-8 text-white rounded-b-[48px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-5 right-10 w-4 h-4 bg-[#FDB813] rounded-full opacity-50 animate-bounce" />
                <div className="absolute bottom-10 left-5 w-2 h-2 bg-rose-500 rounded-full opacity-50 animate-bounce delay-100" />
                
                <button onClick={onBack} className="mb-4 p-2 bg-white/10 rounded-xl relative z-10"><ChevronLeft size={20} /></button>
                <h2 className="font-brand font-black text-2xl relative z-10">ANIVERSARIANTES</h2>
                <p className="text-[#FDB813] text-[9px] font-black relative z-10">CELEBRANDO HOJE</p>
            </div>
            <div className="p-8 space-y-6 pb-20">
              {loading ? (
                  <Loader2 className="animate-spin mx-auto text-[#001220] mt-10" />
              ) : birthdaysToday.length > 0 ? (
                  <div>
                     {birthdaysToday.map((p, i) => (
                          <div key={i} className="bg-gradient-to-br from-[#FDB813] to-amber-500 p-6 rounded-[32px] shadow-xl animate-bounce-slow text-[#001220] text-center mb-6">
                            <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-inner mb-4 overflow-hidden">
                                {p.photo ? <img src={p.photo} className="w-full h-full rounded-full object-cover" /> : <User className="w-full h-full text-slate-300 p-4" />}
                            </div>
                            <h3 className="font-black text-2xl uppercase mb-1">{p.name}</h3>
                            <p className="font-bold text-sm opacity-80 mb-4">🎂 Feliz Aniversário!</p>
                            <p className="text-xs font-medium leading-relaxed mb-6">A Juventude UMADW celebra a sua vida! Que Deus derrame bençãos sem medidas sobre você.</p>
                            <button onClick={async () => {
                                if (!p.uid) return;
                                setIsGreeting(p.uid);
                                const currentUser = firebaseService.getCurrentUser();
                                if (!currentUser || !currentUser.uid) return;
                                const greeting = await geminiService.getBirthdayGreeting(p.name);
                                const room = await firebaseService.getOrCreateChatRoom([currentUser.uid, p.uid]);
                                if (room) {
                                  await firebaseService.sendChatMessage(room.id, `🎉 PARABÉNS! ${greeting}`);
                                }
                                setSelectedPerson(p);
                                setIsGreeting(null);
                            }} className="bg-[#001220] text-white w-full py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg" disabled={isGreeting === p.uid}>
                                {isGreeting === p.uid ? <Loader2 className="animate-spin mx-auto" size={20} /> : "ENVIAR MENSAGEM"}
                            </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center text-center mt-10 opacity-60">
                      <Calendar size={64} className="text-slate-300 mb-4" />
                      <h3 className="font-bold text-lg text-slate-600">Ninguém sopra velas hoje.</h3>
                      <p className="text-sm text-slate-400 max-w-xs mt-2">Mas todos os dias são dias de agradecer a Deus pela vida dos nossos irmãos! Vamos orar por todos.</p>
                  </div>
              )}
            </div>
        </div>
    );
};
