import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smile, Frown, Meh, Heart, Zap, Send } from 'lucide-react';
import { firebaseService } from '../../services/firebase';

interface CheckInFormProps {
  onComplete: () => void;
}

const moods = [
  { id: 'great', icon: <Heart className="w-6 h-6" />, label: 'Excelente', color: 'text-pink-500 bg-pink-50' },
  { id: 'good', icon: <Smile className="w-6 h-6" />, label: 'Bem', color: 'text-emerald-500 bg-emerald-50' },
  { id: 'neutral', icon: <Meh className="w-6 h-6" />, label: 'Neutro', color: 'text-amber-500 bg-amber-50' },
  { id: 'bad', icon: <Frown className="w-6 h-6" />, label: 'Difícil', color: 'text-indigo-500 bg-indigo-50' },
  { id: 'struggling', icon: <Zap className="w-6 h-6" />, label: 'Lutando', color: 'text-rose-500 bg-rose-50' },
];

export const CheckInForm: React.FC<CheckInFormProps> = ({ onComplete }) => {
  const [type, setType] = useState<'emotional' | 'spiritual'>('emotional');
  const [mood, setMood] = useState<string>('neutral');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status.trim()) return;

    setLoading(true);
    try {
      const user = firebaseService.currentUser;
      if (!user) return;

      await firebaseService.addCheckIn({
        userUid: user.uid!,
        type,
        mood: mood as any,
        status,
        communityId: user.communityId
      });
      
      onComplete();
    } catch (error) {
      console.error("Error submitting check-in:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex p-1 bg-zinc-100 rounded-xl">
        <button
          type="button"
          onClick={() => setType('emotional')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            type === 'emotional' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
          }`}
        >
          Emocional
        </button>
        <button
          type="button"
          onClick={() => setType('spiritual')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            type === 'spiritual' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
          }`}
        >
          Espiritual
        </button>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Como você está se sentindo?</label>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all border-2 ${
                mood === m.id 
                  ? `${m.color.replace('bg-', 'border-')} border-current` 
                  : 'border-transparent bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
              }`}
            >
              <div className={mood === m.id ? m.color.split(' ')[0] : ''}>{m.icon}</div>
              <span className="text-[10px] mt-1 font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          {type === 'emotional' ? 'O que está em seu coração hoje?' : 'Como está sua caminhada com Deus?'}
        </label>
        <textarea
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Escreva aqui..."
          className="w-full p-4 rounded-2xl border border-zinc-200 focus:border-zinc-900 focus:ring-0 transition-all min-h-[120px] text-sm resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !status.trim()}
        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar Check-in
          </>
        )}
      </button>
    </form>
  );
};
