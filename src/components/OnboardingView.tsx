import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Church, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layout, 
  ShieldCheck,
  Zap,
  Star,
  Globe,
  CreditCard
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { Community } from '../../types';

interface OnboardingViewProps {
  onComplete: (communityId: string) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    planId: 'free' as 'free' | 'premium' | 'enterprise',
    primaryColor: '#4F46E5',
    templateId: 'default'
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const communityId = await firebaseService.createCommunity({
        name: formData.name,
        planId: formData.planId,
        primaryColor: formData.primaryColor,
        secondaryColor: '#FFFFFF',
        leaderUid: '', // Will be set by service
        subscriptionStatus: 'Ativo'
      }, formData.templateId);
      
      if (communityId) {
        onComplete(communityId);
      }
    } catch (error) {
      console.error("Error creating community:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        
        {/* Left Side: Info */}
        <div className="bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Sparkles className="text-white" size={32} />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight">Expanda o Reino com Tecnologia.</h1>
              <p className="text-indigo-100 text-lg leading-relaxed">
                Crie sua comunidade em segundos e comece a engajar seus jovens com rituais, desafios e discipulado inteligente.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Layout size={20} />
              </div>
              <p className="font-medium">Estrutura Pronta (Templates)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <p className="font-medium">Gestão de Liderança Segura</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Globe size={20} />
              </div>
              <p className="font-medium">Conexão Global entre Igrejas</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Nome da Comunidade</h2>
                  <p className="text-slate-500 text-sm">Como sua igreja ou grupo de jovens é conhecido?</p>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Church className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text"
                      placeholder="Ex: Juventude Lagoinha, UMADW..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <button 
                    disabled={!formData.name}
                    onClick={() => setStep(2)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                  >
                    Escolher Template <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Escolha um Template</h2>
                  <p className="text-slate-500 text-sm">Comece com uma estrutura pronta para sua necessidade.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'default', name: 'Padrão', icon: Layout, desc: 'Estrutura equilibrada para qualquer igreja.' },
                    { id: 'discipleship', name: 'Foco em Discipulado', icon: Users, desc: 'Rituais e tarefas focadas em mentoria.' },
                    { id: 'evangelism', name: 'Foco em Evangelismo', icon: Globe, desc: 'Eventos e desafios de alcance externo.' }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setFormData({ ...formData, templateId: tpl.id })}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                        formData.templateId === tpl.id 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600`}>
                        <tpl.icon size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{tpl.name}</p>
                        <p className="text-xs text-slate-500">{tpl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Próximo Passo <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Escolha seu Plano</h2>
                  <p className="text-slate-500 text-sm">Comece grátis ou turbine sua gestão.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'free', name: 'Gratuito', price: 'R$ 0', icon: Zap, color: 'text-amber-500', desc: 'Até 50 membros' },
                    { id: 'premium', name: 'Premium', price: 'R$ 49/mês', icon: Star, color: 'text-indigo-500', desc: 'Até 500 membros + Rede' },
                    { id: 'enterprise', name: 'Enterprise', price: 'R$ 199/mês', icon: Globe, color: 'text-emerald-500', desc: 'Membros ilimitados + Suporte' }
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, planId: plan.id as any })}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${
                        formData.planId === plan.id 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${plan.color}`}>
                          <plan.icon size={24} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500">{plan.desc}</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900">{plan.price}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    {loading ? 'Criando...' : 'Finalizar Setup'} <CheckCircle2 size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
