import React, { useState, useEffect } from 'react';
import { Ritual } from '../types';
import { firebaseService } from '../services/firebase';
import { CheckCircle2, Circle, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DailyRitual: React.FC = () => {
    const [rituals, setRituals] = useState<Ritual[]>([]);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState<string[]>([]);
    const user = firebaseService.getCurrentUser();

    useEffect(() => {
        const loadRituals = async () => {
            const active = await firebaseService.getActiveRituals();
            setRituals(active);
            setLoading(false);
        };
        loadRituals();
    }, []);

    const handleComplete = async (ritual: Ritual) => {
        if (!ritual.id || completed.includes(ritual.id)) return;
        
        setCompleted(prev => [...prev, ritual.id!]);
        await firebaseService.completeRitual(ritual.id, ritual.xpReward);
    };

    if (loading) return null;
    if (rituals.length === 0) return null;

    return (
        <div className="px-6 py-4">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-[#FDB813]" />
                        <h3 className="font-brand font-black text-sm uppercase tracking-tight">Rituais Diários</h3>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {completed.length} / {rituals.length} Concluídos
                    </span>
                </div>

                <div className="space-y-3">
                    {rituals.map((ritual) => {
                        const isDone = completed.includes(ritual.id!);
                        return (
                            <motion.button
                                key={ritual.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleComplete(ritual)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                                    isDone 
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                    : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                                    <div className="text-left">
                                        <p className="text-xs font-black uppercase tracking-tight">{ritual.title}</p>
                                        <p className="text-[9px] font-medium opacity-60">{ritual.description}</p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                    isDone ? 'bg-emerald-200/50' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    +{ritual.xpReward} XP
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
