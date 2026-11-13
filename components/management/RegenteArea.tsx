import React, { useState, useEffect } from 'react';
import { Music, Plus, Search, BookOpen, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebase';
import { Hymn } from '../../types';

export const RegenteArea: React.FC = () => {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newHymn, setNewHymn] = useState({
    title: '',
    lyrics: '',
    category: 'Adoração',
    videoUrl: ''
  });

  useEffect(() => {
    fetchHymns();
  }, []);

  const fetchHymns = async () => {
    setLoading(true);
    const data = await firebaseService.getHymns();
    setHymns(data);
    setLoading(false);
  };

  const handleAddHymn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHymn.title || !newHymn.lyrics) return;

    await firebaseService.publishHymn({
      ...newHymn,
      communityId: firebaseService.getCurrentUser()?.communityId || 'umadw',
      postedBy: firebaseService.getCurrentUser()?.uid || ''
    });

    setNewHymn({ title: '', lyrics: '', category: 'Adoração', videoUrl: '' });
    setShowAddModal(false);
    fetchHymns();
  };

  const filteredHymns = hymns.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold italic serif text-zinc-900">Área do Regente</h2>
          <p className="text-zinc-500 text-sm">Gerencie o repertório e as letras dos hinos.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Hino
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input 
          type="text"
          placeholder="Buscar por título ou letra..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Hymns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-zinc-100 animate-pulse rounded-3xl" />
          ))
        ) : filteredHymns.length > 0 ? (
          filteredHymns.map((hymn) => (
            <motion.div 
              key={hymn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{hymn.title}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{hymn.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hymn.videoUrl && (
                    <a href={hymn.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors">
                      <Play className="w-4 h-4" />
                    </a>
                  )}
                  <button className="p-2 bg-zinc-50 text-zinc-400 hover:text-emerald-600 rounded-lg transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 italic leading-relaxed">
                {hymn.lyrics}
              </p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-zinc-400 italic">
            Nenhum hino encontrado.
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold italic serif">Adicionar Novo Hino</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleAddHymn} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Título</label>
                      <input 
                        type="text"
                        required
                        value={newHymn.title}
                        onChange={(e) => setNewHymn({...newHymn, title: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Ex: Alvo mais que a neve"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Categoria</label>
                      <select 
                        value={newHymn.category}
                        onChange={(e) => setNewHymn({...newHymn, category: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      >
                        <option>Adoração</option>
                        <option>Louvor</option>
                        <option>Celebração</option>
                        <option>Guerra</option>
                        <option>Hino da Harpa</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Link do Vídeo (Opcional)</label>
                    <input 
                      type="url"
                      value={newHymn.videoUrl}
                      onChange={(e) => setNewHymn({...newHymn, videoUrl: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Letra Completa</label>
                    <textarea 
                      required
                      rows={8}
                      value={newHymn.lyrics}
                      onChange={(e) => setNewHymn({...newHymn, lyrics: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      placeholder="Digite ou cole a letra do hino aqui..."
                    />
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
                      Salvar Hino
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
