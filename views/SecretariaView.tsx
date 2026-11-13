import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  Mail, 
  Shield, 
  Edit3, 
  Download, 
  Check, 
  X, 
  Cake, 
  Heart,
  Droplet,
  FileText,
  AlertCircle,
  ChevronLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../services/firebase';
import { User, UserRole } from '../types';

interface SecretariaViewProps {
  onBack?: () => void;
}

export const SecretariaView: React.FC<SecretariaViewProps> = ({ onBack }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(firebaseService.getCurrentUser());
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    role: 'Membro' as UserRole,
    status: 'Ativo' as 'Ativo' | 'Inativo',
    baptismDate: '',
    notes: ''
  });

  // Edit member form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    role: 'Membro' as UserRole,
    status: 'Ativo' as 'Ativo' | 'Inativo',
    baptismDate: '',
    notes: ''
  });

  useEffect(() => {
    const user = firebaseService.getCurrentUser();
    setCurrentUser(user);

    // Subscribe to all community members
    const unsubscribe = firebaseService.subscribeCommunityMembers((data) => {
      setMembers(data);
      setLoading(false);
    }, 300);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check role authorization
  const currentRole = currentUser?.role?.toLowerCase() || '';
  const isAuthorized = [
    'secretaria', 
    'admin', 
    'dono', 
    'superadmin', 
    'leader', 
    'lider'
  ].includes(currentRole);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => (m.status || 'Ativo') === 'Ativo').length;
    const inactive = total - active;
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

    // Current month birthdays
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const birthdaysThisMonth = members.filter(m => {
      if (!m.birthday) return false;
      // Expecting DD/MM or DD/MM/YYYY
      const parts = m.birthday.split('/');
      if (parts.length >= 2) {
        return parts[1] === currentMonth;
      }
      return false;
    }).length;

    // Role counts
    const leaders = members.filter(m => ['leader', 'Lider', 'admin', 'Admin', 'Dono', 'SuperAdmin'].includes(m.role)).length;
    const regents = members.filter(m => m.role.toLowerCase() === 'regente').length;
    const treasurers = members.filter(m => m.role.toLowerCase() === 'tesoureiro').length;
    const secretaries = members.filter(m => m.role.toLowerCase() === 'secretaria').length;

    return {
      total,
      active,
      inactive,
      activePercentage,
      birthdaysThisMonth,
      leaders,
      regents,
      treasurers,
      secretaries
    };
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchSearch = 
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.role || '').toLowerCase().includes(searchTerm.toLowerCase());

      const memberStatus = member.status || 'Ativo';
      const matchStatus = statusFilter === 'all' ? true : memberStatus === statusFilter;

      const matchRole = roleFilter === 'all' ? true : member.role?.toLowerCase() === roleFilter.toLowerCase();

      return matchSearch && matchStatus && matchRole;
    });
  }, [members, searchTerm, statusFilter, roleFilter]);

  // Open edit modal
  const handleOpenEdit = (member: User) => {
    setEditingMember(member);
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      birthday: member.birthday || '',
      role: member.role || 'Membro',
      status: member.status || 'Ativo',
      baptismDate: member.baptismDate || '',
      notes: member.notes || ''
    });
  };

  // Submit edit member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.uid) return;

    try {
      setActionLoading(true);
      await firebaseService.updateMemberRecord(editingMember.uid, {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        birthday: editFormData.birthday.trim(),
        role: editFormData.role,
        status: editFormData.status,
        baptismDate: editFormData.baptismDate.trim(),
        notes: editFormData.notes.trim()
      });

      showToast(`Cadastro de ${editFormData.name} atualizado com sucesso!`);
      setEditingMember(null);
    } catch (err) {
      console.error('Erro ao atualizar membro:', err);
      showToast('Erro ao atualizar cadastro. Verifique suas permissões.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit new member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;

    try {
      setActionLoading(true);
      await firebaseService.createMemberRecord({
        name: newMember.name.trim(),
        email: newMember.email.trim() || `membro_${Date.now()}@umadw.com`,
        phone: newMember.phone.trim(),
        birthday: newMember.birthday.trim() || '01/01',
        role: newMember.role,
        status: newMember.status,
        baptismDate: newMember.baptismDate.trim(),
        notes: newMember.notes.trim()
      });

      showToast(`Membro ${newMember.name} cadastrado com sucesso!`);
      setShowAddModal(false);
      setNewMember({
        name: '',
        email: '',
        phone: '',
        birthday: '',
        role: 'Membro',
        status: 'Ativo',
        baptismDate: '',
        notes: ''
      });
    } catch (err) {
      console.error('Erro ao cadastrar membro:', err);
      showToast('Erro ao cadastrar membro.');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick toggle active/inactive status
  const handleToggleStatus = async (member: User) => {
    if (!member.uid) return;
    const current = member.status || 'Ativo';
    const nextStatus = current === 'Ativo' ? 'Inativo' : 'Ativo';
    
    try {
      await firebaseService.updateMemberRecord(member.uid, { status: nextStatus });
      showToast(`${member.name} marcado como ${nextStatus}`);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      showToast('Não foi possível alterar o status.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Nome', 'E-mail', 'Telefone', 'Aniversário', 'Cargo', 'Status', 'Data Batismo', 'Observações'];
    const rows = filteredMembers.map(m => [
      `"${m.name || ''}"`,
      `"${m.email || ''}"`,
      `"${m.phone || ''}"`,
      `"${m.birthday || ''}"`,
      `"${m.role || ''}"`,
      `"${m.status || 'Ativo'}"`,
      `"${m.baptismDate || ''}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `membros_umadw_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
    showToast('Relatório CSV exportado com sucesso!');
  };

  // If user is not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Acesso Restrito à Secretaria</h2>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          Esta área é reservada para a secretária e liderança da igreja. Para solicitar permissão, fale com o administrador.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#001220] text-white font-medium text-sm rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            Voltar ao Início
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#001220] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium"
          >
            <Check className="w-4 h-4 text-[#FDB813]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="p-2.5 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Secretaria Eclesiástica</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FDB813] bg-[#001220] px-2 py-0.5 rounded-md">
                Gestão
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Controle cadastral, estatísticas e acompanhamento de membros
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowExportModal(true)}
            title="Exportar Relatório"
            className="p-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-2xl hover:bg-zinc-50 transition-colors flex items-center gap-1.5 text-xs shadow-sm"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#001220] text-white font-medium rounded-2xl hover:bg-zinc-800 transition-colors flex items-center gap-2 text-xs shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-[#FDB813]" />
            <span>Novo Membro</span>
          </button>
        </div>
      </header>

      {/* Statistical KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Total de Membros</span>
            <div className="p-2 bg-zinc-100 rounded-xl text-zinc-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900 font-mono tabular-nums">
            {stats.total}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span>Comunidade cadastrada</span>
          </div>
        </div>

        {/* Card 2: Ativos */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Membros Ativos</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 font-mono tabular-nums">
            {stats.active}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600 font-mono">{stats.activePercentage}%</span>
            <span>de engajamento ({stats.inactive} inativos)</span>
          </div>
        </div>

        {/* Card 3: Aniversariantes do Mês */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Nivers do Mês</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Cake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-zinc-900 font-mono tabular-nums">
            {stats.birthdaysThisMonth}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            <span>Celebrações em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</span>
          </div>
        </div>

        {/* Card 4: Distribuição Ministerial */}
        <div className="bg-[#001220] text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-300">Quadro Ministerial</span>
              <Sparkles className="w-4 h-4 text-[#FDB813]" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Líderes</span>
                <span className="text-lg font-bold font-mono tabular-nums text-white">{stats.leaders}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Regência</span>
                <span className="text-lg font-bold font-mono tabular-nums text-[#FDB813]">{stats.regents}</span>
              </div>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              {stats.treasurers} tesouraria · {stats.secretaries} secretaria
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, telefone ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FDB813]/40 focus:border-[#FDB813] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter Selector */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#FDB813]/40 focus:border-[#FDB813] transition-all"
            >
              <option value="all">Todos os Cargos</option>
              <option value="Membro">Membro</option>
              <option value="Lider">Líder</option>
              <option value="regente">Regente</option>
              <option value="tesoureiro">Tesoureiro</option>
              <option value="secretaria">Secretaria</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('Ativo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                statusFilter === 'Ativo'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Ativos ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('Inativo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                statusFilter === 'Inativo'
                  ? 'bg-white text-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Inativos ({stats.inactive})
            </button>
          </div>

          <span className="text-[11px] text-zinc-400 font-mono tabular-nums pr-1">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'membro' : 'membros'}
          </span>
        </div>
      </section>

      {/* Member Directory List */}
      <section className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-zinc-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Nenhum membro encontrado</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Não encontramos resultados para os filtros selecionados. Tente ajustar o termo de busca ou adicione um novo membro.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#001220] text-white text-xs font-medium rounded-xl hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#FDB813]" />
              Cadastrar Primeiro Membro
            </button>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isMemberActive = (member.status || 'Ativo') === 'Ativo';
            return (
              <motion.div
                key={member.uid}
                layout
                className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <img
                    src={member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=001220&color=FDB813`}
                    alt={member.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-zinc-100 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-zinc-900 text-sm leading-snug">{member.name}</h4>
                      
                      {/* Status indicator unboxed text */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isMemberActive ? 'text-emerald-600' : 'text-zinc-400'
                      }`}>
                        · {isMemberActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Unboxed Metadata Line with typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                      <span className="font-medium text-zinc-700">{member.role}</span>
                      {member.birthday && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-[11px] font-mono tabular-nums">
                            <Cake className="w-3 h-3 text-amber-500" />
                            {member.birthday}
                          </span>
                        </>
                      )}
                      {member.baptismDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-[11px] text-blue-600 font-mono tabular-nums">
                            <Droplet className="w-3 h-3" />
                            Batismo: {member.baptismDate}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Contact row */}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap pt-0.5">
                      {member.phone && (
                        <a
                          href={`https://wa.me/55${member.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 hover:text-zinc-800 transition-colors"
                        >
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span className="truncate max-w-[180px]">{member.email}</span>
                        </a>
                      )}
                    </div>

                    {member.notes && (
                      <p className="text-[11px] text-zinc-400 italic pt-1 line-clamp-1">
                        "{member.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Member action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleToggleStatus(member)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                      isMemberActive 
                        ? 'border-zinc-200 text-zinc-600 hover:bg-zinc-50' 
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {isMemberActive ? 'Desativar' : 'Reativar'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="px-3.5 py-2 bg-[#001220] text-white text-xs font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#FDB813]" />
                    <span>Editar Ficha</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </section>

      {/* Modal: Novo Membro */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Novo Cadastro de Membro</h3>
                  <p className="text-xs text-zinc-500">Adicione os dados cadastrais para o registro da igreja</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="joao@exemplo.com"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Data de Nascimento (DD/MM)
                    </label>
                    <input
                      type="text"
                      value={newMember.birthday}
                      onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
                      placeholder="Ex: 15/08"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Data de Batismo
                    </label>
                    <input
                      type="text"
                      value={newMember.baptismDate}
                      onChange={(e) => setNewMember({ ...newMember, baptismDate: e.target.value })}
                      placeholder="Ex: 2022 ou 12/04/2022"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Cargo / Função
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    >
                      <option value="Membro">Membro</option>
                      <option value="Lider">Líder</option>
                      <option value="regente">Regente</option>
                      <option value="tesoureiro">Tesoureiro</option>
                      <option value="secretaria">Secretaria</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Status Cadastral
                    </label>
                    <select
                      value={newMember.status}
                      onChange={(e) => setNewMember({ ...newMember, status: e.target.value as 'Ativo' | 'Inativo' })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Observações Internas (Secretaria)
                  </label>
                  <textarea
                    rows={2}
                    value={newMember.notes}
                    onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                    placeholder="Anotações pastorais, ministério de interesse, etc..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-[#001220] text-white text-xs font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? 'Salvando...' : 'Cadastrar Membro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Cadastro */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={editingMember.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingMember.name)}&background=001220&color=FDB813`}
                    alt={editingMember.name}
                    className="w-10 h-10 rounded-2xl object-cover border border-zinc-100"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Ficha Cadastral</h3>
                    <p className="text-xs text-zinc-500">{editingMember.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingMember(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Aniversário (DD/MM)
                    </label>
                    <input
                      type="text"
                      value={editFormData.birthday}
                      onChange={(e) => setEditFormData({ ...editFormData, birthday: e.target.value })}
                      placeholder="Ex: 25/12"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Data de Batismo
                    </label>
                    <input
                      type="text"
                      value={editFormData.baptismDate}
                      onChange={(e) => setEditFormData({ ...editFormData, baptismDate: e.target.value })}
                      placeholder="Ex: 2021 ou 10/10/2021"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Cargo / Função
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    >
                      <option value="Membro">Membro</option>
                      <option value="Lider">Líder</option>
                      <option value="regente">Regente</option>
                      <option value="tesoureiro">Tesoureiro</option>
                      <option value="secretaria">Secretaria</option>
                      <option value="admin">Admin</option>
                      <option value="Dono">Dono</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                      Status Cadastral
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'Ativo' | 'Inativo' })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Anotações e Histórico Eclesiástico
                  </label>
                  <textarea
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Observações da secretaria..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#FDB813]/40 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="flex-1 py-3 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-[#001220] text-white text-xs font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Exportação */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Exportar Ficha de Membros</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                Você pode baixar a listagem atual com {filteredMembers.length} registros filtrados em formato CSV (compatível com Excel e Google Planilhas).
              </p>

              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1.5 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Registros a exportar:</span>
                  <span className="font-bold font-mono">{filteredMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtro de Status:</span>
                  <span className="font-bold">{statusFilter === 'all' ? 'Todos' : statusFilter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtro de Cargo:</span>
                  <span className="font-bold">{roleFilter === 'all' ? 'Todos' : roleFilter}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex-1 py-3 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar CSV</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
