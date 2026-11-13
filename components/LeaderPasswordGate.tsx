import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  ChevronLeft, 
  AlertCircle, 
  Sparkles,
  Delete,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Community, User } from '../types';

interface LeaderPasswordGateProps {
  children: React.ReactNode;
  community?: Community | null;
  user?: User | null;
  onBack?: () => void;
}

export const LeaderPasswordGate: React.FC<LeaderPasswordGateProps> = ({
  children,
  community,
  user,
  onBack
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('umadw_leader_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  const correctPin = community?.leaderPin || '1234';
  const isOwnerOrSuper = user && ['dono', 'superadmin'].includes(user.role?.toLowerCase() || '');

  // Listener de teclado físico
  useEffect(() => {
    if (isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isUnlocked, correctPin]);

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      
      // Auto-submit se atingir o tamanho do PIN
      if (nextPin.length === correctPin.length) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPin = (inputPin: string) => {
    const trimmed = inputPin.trim();
    // Aceita o PIN configurado da comunidade ou o padrão 1234 / lider123
    if (trimmed === correctPin || trimmed === '1234' || trimmed === 'lider123') {
      try {
        sessionStorage.setItem('umadw_leader_unlocked', 'true');
      } catch (e) {
        console.error(e);
      }
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setErrorMessage('Senha de liderança incorreta.');
      if (navigator.vibrate) navigator.vibrate(200);
      setPin('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) return;
    verifyPin(pin);
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem('umadw_leader_unlocked');
    } catch (e) {
      console.error(e);
    }
    setIsUnlocked(false);
    setPin('');
  };

  const handleQuickUnlockAsOwner = () => {
    try {
      sessionStorage.setItem('umadw_leader_unlocked', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsUnlocked(true);
  };

  // Se já estiver desbloqueado, exibe os filhos com barra de segurança
  if (isUnlocked) {
    return (
      <div className="space-y-4">
        {/* Barra superior de segurança */}
        <div className="bg-[#001220] border-b border-amber-500/30 px-4 py-2.5 rounded-2xl flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FDB813]" />
              Área de Liderança Desbloqueada
            </span>
          </div>

          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 rounded-xl text-[11px] font-bold transition-all border border-white/10"
            title="Bloquear painel agora"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Bloquear</span>
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Tela de bloqueio por senha/PIN
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 animate-appear">
      <div className="w-full max-w-sm bg-white rounded-[36px] p-7 border border-zinc-200/80 shadow-2xl space-y-6 text-center">
        {/* Top Back and Icon */}
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="p-2 hover:bg-zinc-100 rounded-2xl text-zinc-400 transition-colors"
              title="Voltar ao Início"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-9" />}

          <div className="w-14 h-14 bg-[#001220] text-[#FDB813] rounded-3xl flex items-center justify-center shadow-xl shadow-blue-900/20">
            <Lock className="w-7 h-7" />
          </div>

          <div className="w-9" />
        </div>

        <div>
          <h2 className="text-xl font-black text-zinc-900 tracking-tight">
            Área de Liderança & Secretaria
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            Digite a senha de líder para ter acesso às funções de secretaria, membros, finanças e agenda.
          </p>
        </div>

        {/* PIN Indicators */}
        <motion.div 
          animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-3 py-2"
        >
          {Array.from({ length: 4 }).map((_, i) => {
            const isFilled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110'
                    : isFilled
                    ? 'bg-[#001220] scale-125 shadow-sm'
                    : 'bg-zinc-200'
                }`}
              />
            );
          })}
        </motion.div>

        {error && (
          <div className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Text Alternativo */}
        <div className="relative">
          <input
            type={showPasswordText ? "text" : "password"}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Digite o PIN de 4 dígitos"
            maxLength={8}
            className="w-full text-center tracking-[0.4em] font-bold text-lg py-2.5 px-10 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#001220]"
          />
          <button
            type="button"
            onClick={() => setShowPasswordText(!showPasswordText)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
          >
            {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Teclado Numérico Touch Ergonômico */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-12 rounded-2xl bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 active:scale-95 text-zinc-900 font-bold text-lg transition-all border border-zinc-200/60 shadow-sm flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-12 rounded-2xl bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 active:scale-95 text-zinc-500 font-bold text-xs transition-all border border-zinc-200/60 flex items-center justify-center"
          >
            Limpar
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 active:scale-95 text-zinc-900 font-bold text-lg transition-all border border-zinc-200/60 shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 active:scale-95 text-zinc-600 font-bold text-sm transition-all border border-zinc-200/60 flex items-center justify-center"
            title="Apagar"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={pin.length === 0}
          className="w-full py-3.5 bg-[#001220] hover:bg-slate-900 active:scale-[0.98] disabled:opacity-40 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4 text-[#FDB813]" />
          <span>Acessar Painel</span>
        </button>

        {/* Dica de Acesso */}
        <div className="pt-2 border-t border-zinc-100 text-center">
          <p className="text-[11px] text-zinc-400">
            Dica para Líderes: Senha padrão <span className="font-bold text-zinc-700">1234</span>
          </p>
        </div>

        {/* Desbloqueio direto para Dono / Admin */}
        {isOwnerOrSuper && (
          <button
            onClick={handleQuickUnlockAsOwner}
            className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Desbloquear direto como {user?.role}</span>
          </button>
        )}
      </div>
    </div>
  );
};
