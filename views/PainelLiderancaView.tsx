import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Wallet, 
  Music, 
  Calendar, 
  ShieldCheck, 
  UserPlus, 
  PlusCircle, 
  FileText, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Settings, 
  Sparkles,
  Phone,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebase';
import { User, UserRole, AgendaEvent, Transaction, Hymn } from '../types';

export interface PainelLiderancaViewProps {
  user?: User | null;
  onNavigateTab?: (tab: 'dashboard' | 'regente' | 'tesouraria' | 'secretaria' | 'membros' | 'lideranca' | 'settings', action?: string) => void;
  onBack?: () => void;
}

export const PainelLiderancaView: React.FC<PainelLiderancaViewProps> = ({ 
  user: propUser, 
  onNavigateTab, 
  onBack 
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(propUser || firebaseService.getCurrentUser());
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais de ação rápida
  const [activeModal, setActiveModal] = useState<'none' | 'new_member' | 'new_transaction' | 'new_event' | 'new_hymn'>('none');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Membro' as UserRole,
    birthday: '',
    notes: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    category: 'Oferta',
    date: new Date().toISOString().split('T')[0]
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start: new Date().toISOString().slice(0, 16),
    location: 'Templo Sede',
    color: '#FDB813'
  });

  const [hymnForm, setHymnForm] = useState({
    title: '',
    number: '',
    lyrics: '',
    youtubeUrl: '',
    category: 'Jovens'
  });

  // Atualizar usuário se a prop mudar
  useEffect(() => {
    if (propUser) setCurrentUser(propUser);
    else setCurrentUser(firebaseService.getCurrentUser());
  }, [propUser]);

  // Carregar dados reais do Firestore
  useEffect(() => {
    let unsubscribeMembers: (() => void) | undefined;
    let unsubscribeEvents: (() => void) | undefined;

    const initData = async () => {
      setLoading(true);
      try {
        // Membros em tempo real
        unsubscribeMembers = firebaseService.subscribeCommunityMembers((users) => {
          setMembers(users);
        }, 150);

        // Eventos da agenda
        unsubscribeEvents = firebaseService.subscribeEvents((evts) => {
          setEvents(evts);
        });

        // Transações (se tiver permissão de tesouraria/dono/admin)
        const role = (currentUser?.role || '').toLowerCase();
        if (['dono', 'admin', 'superadmin', 'tesoureiro'].includes(role)) {
          const trans = await firebaseService.getTransactions();
          setTransactions(trans);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do PainelLiderancaView:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeEvents) unsubscribeEvents();
    };
  }, [currentUser]);

  // Papéis e permissões no Painel de Liderança desbloqueado
  const userRole = (currentUser?.role || '').toLowerCase();
  const isAdminOrOwner = ['dono', 'admin', 'superadmin'].includes(userRole);
  // Todos que acessam a área de liderança protegida por senha têm acesso às funções de Secretaria, Tesouraria, Regência e Agenda
  const isSecretaria = true;
  const isTesouraria = true;
  const isRegente = true;
  const isLider = true;
  const isAnyLeader = true;

  // Cálculos de KPIs em tempo real
  const activeMembersCount = useMemo(() => {
    return members.filter(m => (m.status || 'Ativo') === 'Ativo').length;
  }, [members]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => new Date(e.start) >= new Date(now.getTime() - 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [events]);

  const financialSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      const isIncome = t.type === 'income' || t.type === 'entrada';
      const val = Number(t.amount) || 0;
      if (isIncome) income += val;
      else expense += val;
    });
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Submissão rápida de novo membro
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) return;

    setActionLoading(true);
    try {
      await firebaseService.createMemberRecord({
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        phone: memberForm.phone.trim(),
        role: memberForm.role,
        birthday: memberForm.birthday,
        notes: memberForm.notes.trim(),
        status: 'Ativo'
      });
      showToast('Membro cadastrado com sucesso!');
      setMemberForm({
        name: '',
        email: '',
        phone: '',
        role: 'Membro',
        birthday: '',
        notes: ''
      });
      setActiveModal('none');
    } catch (err: any) {
      showToast('Erro ao cadastrar membro.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submissão rápida de nova transação financeira
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transactionForm.amount.replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0 || !transactionForm.description.trim()) {
      showToast('Informe um valor e descrição válidos.');
      return;
    }

    setActionLoading(true);
    try {
      await firebaseService.addTransaction({
        type: transactionForm.type,
        amount: amountNum,
        description: transactionForm.description.trim(),
        category: transactionForm.category,
        date: transactionForm.date,
        communityId: currentUser?.communityId || 'umadw',
        createdBy: currentUser?.uid || ''
      });
      const updatedTrans = await firebaseService.getTransactions();
      setTransactions(updatedTrans);
      showToast('Lançamento registrado na tesouraria!');
      setTransactionForm({
        type: 'income',
        amount: '',
        description: '',
        category: 'Oferta',
        date: new Date().toISOString().split('T')[0]
      });
      setActiveModal('none');
    } catch (err: any) {
      showToast('Erro ao registrar transação.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submissão rápida de novo evento
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.start) {
      showToast('Preencha o título e a data do evento.');
      return;
    }

    setActionLoading(true);
    try {
      await firebaseService.publishEvent({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start: eventForm.start,
        location: eventForm.location.trim(),
        color: eventForm.color,
        communityId: currentUser?.communityId || 'umadw'
      });
      showToast('Evento agendado com sucesso!');
      setEventForm({
        title: '',
        description: '',
        start: new Date().toISOString().slice(0, 16),
        location: 'Templo Sede',
        color: '#FDB813'
      });
      setActiveModal('none');
    } catch (err: any) {
      showToast('Erro ao criar evento na agenda.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submissão rápida de novo hino
  const handleCreateHymn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hymnForm.title.trim()) {
      showToast('Informe o título do hino.');
      return;
    }

    setActionLoading(true);
    try {
      await firebaseService.publishHymn({
        title: hymnForm.title.trim(),
        number: hymnForm.number.trim(),
        lyrics: hymnForm.lyrics.trim(),
        youtubeUrl: hymnForm.youtubeUrl.trim(),
        category: hymnForm.category,
        communityId: currentUser?.communityId || 'umadw',
        postedBy: currentUser?.name || 'Regência'
      });
      showToast('Hino adicionado ao repertório com sucesso!');
      setHymnForm({
        title: '',
        number: '',
        lyrics: '',
        youtubeUrl: '',
        category: 'Jovens'
      });
      setActiveModal('none');
    } catch (err: any) {
      showToast('Erro ao publicar hino.');
    } finally {
      setActionLoading(false);
    }
  };

  // Caso não tenha nenhum papel de liderança
  if (!isAnyLeader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[32px] border border-zinc-200/80 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Painel de Liderança Restrito</h2>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          Esta área é reservada para a diretoria, secretaria, tesouraria, regência e líderes de departamento da igreja.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-[#001220] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Voltar ao Início
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 animate-appear">
      {/* Toast de notificação */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-6 right-6 max-w-md mx-auto z-[400] bg-[#001220] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#FDB813]/30"
          >
            <CheckCircle2 className="w-5 h-5 text-[#FDB813] shrink-0" />
            <span className="text-xs font-medium flex-1">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Executivo de Liderança */}
      <div className="bg-[#001220] p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#FDB813] text-[10px] font-black uppercase tracking-widest">Painel de Liderança</span>
              <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full text-white/90 font-bold border border-white/10">
                {currentUser?.role || 'Líder'}
              </span>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 rounded-xl transition-all"
                title="Voltar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Olá, {currentUser?.name?.split(' ')[0] || 'Líder'} 👋
            </h1>
            <p className="text-xs text-white/60 mt-0.5">
              Hub executivo com atalhos rápidos e gestão integrada dos departamentos.
            </p>
          </div>

          {/* Quick department pills if handler provided */}
          {onNavigateTab && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider shrink-0">Áreas:</span>
              {isSecretaria && (
                <button
                  onClick={() => onNavigateTab('membros')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  Secretaria & Membros
                </button>
              )}
              {isTesouraria && (
                <button
                  onClick={() => onNavigateTab('tesouraria')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  Tesouraria
                </button>
              )}
              {isRegente && (
                <button
                  onClick={() => onNavigateTab('regente')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  Regência
                </button>
              )}
              {isSecretaria && (
                <button
                  onClick={() => onNavigateTab('secretaria')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  Agenda
                </button>
              )}
              {isAdminOrOwner && (
                <button
                  onClick={() => onNavigateTab('settings')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                >
                  Configurações
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Indicadores em Tempo Real (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* KPI Membros (visível para quem gerencia membros/liderança) */}
        {isSecretaria && (
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Membros</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-zinc-900 tabular-nums">
                {loading ? '...' : activeMembersCount}
              </div>
              <span className="text-[10px] text-zinc-400">Ativos cadastrados</span>
            </div>
          </div>
        )}

        {/* KPI Tesouraria (visível para tesouraria e admin) */}
        {isTesouraria && (
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Balanço</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-zinc-900 tabular-nums truncate">
                {loading ? '...' : `R$ ${financialSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Caixa atual</span>
            </div>
          </div>
        )}

        {/* KPI Agenda & Cultos */}
        <div className={`bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between ${!isTesouraria ? 'col-span-2 sm:col-span-1' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Próx. Eventos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-900 tabular-nums">
              {loading ? '...' : upcomingEvents.length}
            </div>
            <span className="text-[10px] text-zinc-400">Na agenda da semana</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: SECRETARIA & GESTÃO DE MEMBROS */}
      {isSecretaria && (
        <div className="bg-white p-5 rounded-[28px] border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Secretaria & Gestão de Membros</h3>
                <p className="text-[11px] text-zinc-500">Cadastros, fichas ministeriais e relatórios</p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('membros')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal('new_member')}
              className="p-3.5 bg-blue-50/60 hover:bg-blue-100/60 active:scale-[0.98] rounded-2xl text-left border border-blue-200/60 transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">Cadastrar Novo Membro</div>
                <div className="text-[11px] text-zinc-500">Cadastro rápido com contato e dados</div>
              </div>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('membros')}
                className="p-3.5 bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] rounded-2xl text-left border border-zinc-200/70 transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#001220] text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-5 h-5 text-[#FDB813]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Fichas & Estatísticas</div>
                  <div className="text-[11px] text-zinc-500">Filtrar por status, cargo e exportar CSV</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: TESOURARIA & GESTÃO FINANCEIRA */}
      {isTesouraria && (
        <div className="bg-white p-5 rounded-[28px] border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Tesouraria & Finanças</h3>
                <p className="text-[11px] text-zinc-500">Entradas, saídas e controle de dízimos/ofertas</p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('tesouraria')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <span>Extrato Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal('new_transaction')}
              className="p-3.5 bg-emerald-50/60 hover:bg-emerald-100/60 active:scale-[0.98] rounded-2xl text-left border border-emerald-200/60 transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">Novo Lançamento</div>
                <div className="text-[11px] text-zinc-500">Registrar dízimo, oferta ou despesa</div>
              </div>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('tesouraria')}
                className="p-3.5 bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] rounded-2xl text-left border border-zinc-200/70 transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Relatório Financeiro</div>
                  <div className="text-[11px] text-zinc-500">Saldo por categorias e comprovantes</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: REGÊNCIA & LOUVOR */}
      {isRegente && (
        <div className="bg-white p-5 rounded-[28px] border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Regência & Louvor</h3>
                <p className="text-[11px] text-zinc-500">Repertório de hinos, escalas e letras</p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('regente')}
                className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
              >
                <span>Repertório</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal('new_hymn')}
              className="p-3.5 bg-amber-50/60 hover:bg-amber-100/60 active:scale-[0.98] rounded-2xl text-left border border-amber-200/60 transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">Adicionar Hino</div>
                <div className="text-[11px] text-zinc-500">Cadastrar letra e link de ensaio</div>
              </div>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('regente')}
                className="p-3.5 bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] rounded-2xl text-left border border-zinc-200/70 transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Escala de Louvor</div>
                  <div className="text-[11px] text-zinc-500">Gerenciar hinos ativos para o culto</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO 4: AGENDA, CULTOS & EVENTOS */}
      {(isSecretaria || isLider) && (
        <div className="bg-white p-5 rounded-[28px] border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Agenda & Eventos</h3>
                <p className="text-[11px] text-zinc-500">Cultos, ensaios e confirmação de presença</p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('secretaria')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <span>Ver Agenda</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal('new_event')}
              className="p-3.5 bg-indigo-50/60 hover:bg-indigo-100/60 active:scale-[0.98] rounded-2xl text-left border border-indigo-200/60 transition-all flex items-center gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-900">Agendar Culto / Evento</div>
                <div className="text-[11px] text-zinc-500">Criar evento com data, hora e local</div>
              </div>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('secretaria')}
                className="p-3.5 bg-zinc-50 hover:bg-zinc-100 active:scale-[0.98] rounded-2xl text-left border border-zinc-200/70 transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Lista de Presenças</div>
                  <div className="text-[11px] text-zinc-500">Acompanhar confirmações de irmãos</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO 5: CONFIGURAÇÕES DA IGREJA (APENAS DONO E ADMIN) */}
      {isAdminOrOwner && onNavigateTab && (
        <div className="p-4 bg-zinc-900 rounded-[28px] text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#FDB813]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Configurações Gerais da Igreja</h4>
              <p className="text-[11px] text-white/50">Personalização de tema, brasão e parâmetros do sistema</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-4 py-2 bg-[#FDB813] hover:bg-amber-400 text-[#001220] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
          >
            Ajustar
          </button>
        </div>
      )}

      {/* ================= MODAIS DE AÇÃO RÁPIDA ================= */}

      {/* MODAL 1: CADASTRAR NOVO MEMBRO */}
      <AnimatePresence>
        {activeModal === 'new_member' && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-zinc-900">Cadastrar Novo Membro</h3>
                </div>
                <button 
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={e => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: João Silva Santos"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">WhatsApp / Telefone</label>
                    <input
                      type="tel"
                      value={memberForm.phone}
                      onChange={e => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Data de Aniversário</label>
                    <input
                      type="date"
                      value={memberForm.birthday}
                      onChange={e => setMemberForm(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={e => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Cargo / Ministério</label>
                  <select
                    value={memberForm.role}
                    onChange={e => setMemberForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Membro">Membro</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="tesoureiro">Tesouraria</option>
                    <option value="regente">Regente / Louvor</option>
                    <option value="leader">Líder de Grupo</option>
                    {isAdminOrOwner && <option value="admin">Administrador</option>}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Observações Ministeriais</label>
                  <textarea
                    rows={2}
                    value={memberForm.notes}
                    onChange={e => setMemberForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ex: Toca teclado, batizado nas águas em 2022..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal('none')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    {actionLoading ? 'Salvando...' : 'Salvar Membro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: LANÇAMENTO NA TESOURARIA */}
      <AnimatePresence>
        {activeModal === 'new_transaction' && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-zinc-900">Novo Lançamento Financeiro</h3>
                </div>
                <button 
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-3">
                {/* Tipo de Transação */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTransactionForm(p => ({ ...p, type: 'income', category: 'Oferta' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      transactionForm.type === 'income'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    + Entrada (Receita)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionForm(p => ({ ...p, type: 'expense', category: 'Material' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      transactionForm.type === 'expense'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    - Saída (Despesa)
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    value={transactionForm.amount}
                    onChange={e => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Ex: 150,00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Descrição / Finalidade *</label>
                  <input
                    type="text"
                    required
                    value={transactionForm.description}
                    onChange={e => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={transactionForm.type === 'income' ? 'Ex: Oferta de culto de domingo' : 'Ex: Compra de cabos de áudio'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Categoria</label>
                    <select
                      value={transactionForm.category}
                      onChange={e => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                      {transactionForm.type === 'income' ? (
                        <>
                          <option value="Oferta">Oferta</option>
                          <option value="Dízimo">Dízimo</option>
                          <option value="Doação">Doação</option>
                          <option value="Venda Cantina">Cantina / Bazar</option>
                          <option value="Outros">Outros</option>
                        </>
                      ) : (
                        <>
                          <option value="Material">Material / Som</option>
                          <option value="Alimentação">Alimentação</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Transporte">Transporte</option>
                          <option value="Ajuda de Custo">Ajuda de Custo</option>
                          <option value="Outros">Outros</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Data</label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={e => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal('none')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    {actionLoading ? 'Registrando...' : 'Confirmar Lançamento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: AGENDAR CULTO OU EVENTO */}
      <AnimatePresence>
        {activeModal === 'new_event' && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-zinc-900">Agendar Evento / Culto</h3>
                </div>
                <button 
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Título do Evento *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Culto de Jovens UMADW"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Data e Horário de Início *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.start}
                    onChange={e => setEventForm(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Local</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={e => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Templo Sede / Sala de Jovens"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={eventForm.description}
                    onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Traga sua Bíblia e convide um amigo!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal('none')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                  >
                    {actionLoading ? 'Agendando...' : 'Publicar na Agenda'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: NOVO HINO DE REGÊNCIA */}
      <AnimatePresence>
        {activeModal === 'new_hymn' && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-bold text-zinc-900">Adicionar Hino ao Repertório</h3>
                </div>
                <button 
                  onClick={() => setActiveModal('none')}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHymn} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Título do Louvor *</label>
                    <input
                      type="text"
                      required
                      value={hymnForm.title}
                      onChange={e => setHymnForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Bondade de Deus"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Nº / Cifra</label>
                    <input
                      type="text"
                      value={hymnForm.number}
                      onChange={e => setHymnForm(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="Ex: 01"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Link do Vídeo / Áudio (YouTube)</label>
                  <input
                    type="url"
                    value={hymnForm.youtubeUrl}
                    onChange={e => setHymnForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Letra do Hino</label>
                  <textarea
                    rows={4}
                    value={hymnForm.lyrics}
                    onChange={e => setHymnForm(prev => ({ ...prev, lyrics: e.target.value }))}
                    placeholder="Cole a letra do hino para os irmãos ensaiarem..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal('none')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    {actionLoading ? 'Publicando...' : 'Salvar Hino'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
