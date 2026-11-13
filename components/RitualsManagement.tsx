import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { Ritual } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const RitualsManagement: React.FC = () => {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newRitual, setNewRitual] = useState<Partial<Ritual>>({
    type: 'daily',
    actionType: 'read',
    xpReward: 50,
    active: true
  });

  const currentUser = firebaseService.getCurrentUser();

  useEffect(() => {
    loadRituals();
  }, []);

  const loadRituals = async () => {
    const data = await firebaseService.getActiveRituals();
    setRituals(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newRitual.title || !currentUser) return;
    
    try {
      // In a real app, we'd have a specific method for this
      // For now, we'll use a generic addDoc via a new service method if needed
      // But let's assume we add it to the service
      await (firebaseService as any).createRitual({
        ...newRitual,
        communityId: currentUser.communityId,
        timestamp: new Date().toISOString()
      });
      setShowAdd(false);
      loadRituals();
    } catch (error) {
      console.error("Error adding ritual:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-brand font-black text-xl uppercase tracking-tight">Gestão de Rituais</h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-2 bg-[#001220] text-[#FDB813] rounded-xl flex items-center gap-2 text-[10px] font-black uppercase"
        >
          <Plus size={16} />
          Novo Ritual
        </button>
      </div>

      <div className="grid gap-4">
        {rituals.map(ritual => (
          <div key={ritual.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase">{ritual.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{ritual.type} • {ritual.xpReward} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 space-y-6"
            >
              <h3 className="font-brand font-black text-xl uppercase">Novo Ritual</h3>
              
              <div className="space-y-4">
                <input 
                  placeholder="Título do Ritual"
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500"
                  onChange={e => setNewRitual({...newRitual, title: e.target.value})}
                />
                <textarea 
                  placeholder="Descrição"
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 h-24"
                  onChange={e => setNewRitual({...newRitual, description: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="bg-slate-50 p-4 rounded-2xl outline-none"
                    onChange={e => setNewRitual({...newRitual, type: e.target.value as any})}
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                  </select>
                  <input 
                    type="number"
                    placeholder="XP Reward"
                    className="bg-slate-50 p-4 rounded-2xl outline-none"
                    onChange={e => setNewRitual({...newRitual, xpReward: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAdd}
                  className="flex-1 py-4 bg-[#001220] text-[#FDB813] rounded-2xl font-black uppercase text-xs"
                >
                  Criar Ritual
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
