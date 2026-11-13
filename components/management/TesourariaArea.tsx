import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Wallet,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebase';
import { Transaction } from '../../types';

export const TesourariaArea: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    amount: 0,
    description: '',
    category: 'Oferta',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const data = await firebaseService.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || !newTransaction.description) return;

    await firebaseService.addTransaction({
      ...newTransaction,
      communityId: firebaseService.getCurrentUser()?.communityId || 'umadw',
      createdBy: firebaseService.getCurrentUser()?.uid || ''
    });

    setNewTransaction({ 
      type: 'income', 
      amount: 0, 
      description: '', 
      category: 'Oferta', 
      date: new Date().toISOString().split('T')[0] 
    });
    setShowAddModal(false);
    fetchTransactions();
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold italic serif text-zinc-900">Tesouraria</h2>
          <p className="text-zinc-500 text-sm">Controle financeiro e transparência do grupo.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors">
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Lançamento
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-6 rounded-[32px] text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/10 rounded-xl">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Saldo Atual</span>
            </div>
            <h3 className="text-3xl font-bold italic serif mb-1">
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-white/60">Saldo consolidado do grupo</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              Entradas
            </div>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 italic serif">
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Total de Arrecadação</p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-red-600">
              <ArrowDownRight className="w-3 h-3" />
              Saídas
            </div>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 italic serif">
            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Total de Despesas</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-bottom border-zinc-50 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 italic serif">Últimas Movimentações</h3>
          <button className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-12 bg-zinc-50/20" />
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-900">{t.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold italic serif">Novo Lançamento</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-6">
                  <div className="flex p-1 bg-zinc-100 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${newTransaction.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500'}`}
                    >
                      Entrada (+)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${newTransaction.type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500'}`}
                    >
                      Saída (-)
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Valor (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={newTransaction.amount || ''}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                      className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-2xl font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Descrição</label>
                    <input 
                      type="text"
                      required
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Ex: Oferta do Culto de Jovens"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Categoria</label>
                      <select 
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      >
                        <option>Oferta</option>
                        <option>Dízimo</option>
                        <option>Evento</option>
                        <option>Manutenção</option>
                        <option>Alimentação</option>
                        <option>Outros</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Data</label>
                      <input 
                        type="date"
                        required
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                    >
                      Confirmar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
