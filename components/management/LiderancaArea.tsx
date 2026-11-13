import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  BookOpen, 
  MessageSquare, 
  Users, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebase';
import { Devotional, LeaderTask, User } from '../../types';

export const LiderancaArea: React.FC = () => {
  const [tasks, setTasks] = useState<LeaderTask[]>([]);
  const [showDevotionalModal, setShowDevotionalModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  
  const [newDevotional, setNewDevotional] = useState({
    titulo: '',
    texto: '',
    referencia_biblica: '',
    autor: firebaseService.getCurrentUser()?.name || 'Liderança',
    imagem_url: 'https://picsum.photos/seed/bible/800/400'
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    caption: '',
    toFeed: true,
    toChatRoomId: ''
  });

  useEffect(() => {
    fetchTasks();
    const unsubscribe = firebaseService.subscribeMyChatRooms((rooms) => {
      setChatRooms(rooms);
    });
    return () => unsubscribe();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const leaderUid = firebaseService.getCurrentUser()?.uid;
    if (leaderUid) {
      const data = await firebaseService.getLeaderTasks(leaderUid);
      setTasks(data);
    }
    setLoading(false);
  };

  const handlePublishDevotional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevotional.titulo || !newDevotional.texto) return;

    await firebaseService.publishDevotional({
      ...newDevotional,
      communityId: firebaseService.getCurrentUser()?.communityId || 'umadw'
    } as Devotional);

    setNewDevotional({ 
      titulo: '', 
      texto: '', 
      referencia_biblica: '', 
      autor: firebaseService.getCurrentUser()?.name || 'Liderança',
      imagem_url: 'https://picsum.photos/seed/bible/800/400'
    });
    setShowDevotionalModal(false);
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.caption) return;

    await firebaseService.publishInternalPost(
      { caption: newAnnouncement.caption },
      { toFeed: newAnnouncement.toFeed, toChatRoomId: newAnnouncement.toChatRoomId }
    );

    setNewAnnouncement({ caption: '', toFeed: true, toChatRoomId: '' });
    setShowAnnouncementModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold italic serif text-zinc-900">Liderança</h2>
          <p className="text-zinc-500 text-sm">Gestão estratégica e comunicação interna.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowDevotionalModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Novo Devocional
          </button>
          <button 
            onClick={() => setShowAnnouncementModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Megaphone className="w-4 h-4" />
            Comunicado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 italic serif flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Minhas Tarefas
            </h3>
            <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors">
              Ver Todas
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-zinc-100 animate-pulse rounded-3xl" />
              ))
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${
                      task.priority === 'high' ? 'bg-red-50 text-red-600' :
                      task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{task.title}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {task.dueDate ? (task.dueDate as any).toDate().toLocaleDateString('pt-BR') : 'Sem prazo'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => firebaseService.updateLeaderTaskStatus(task.id!, 'completed')}
                    className="p-3 bg-zinc-50 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-400 italic bg-zinc-50/50 rounded-[32px] border border-dashed border-zinc-200">
                Tudo em dia! Nenhuma tarefa pendente.
              </div>
            )}
          </div>
        </div>

        {/* Insights / Stats */}
        <div className="space-y-6">
          <section className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[32px] text-white shadow-lg shadow-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold italic serif">Engajamento</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold">84%</span>
                  <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-bold">Taxa de Retenção</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-200">
                  <Zap className="w-3 h-3" />
                  +12%
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[84%]" />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
            <h3 className="font-bold text-zinc-900 italic serif mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-zinc-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-100 transition-colors">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Membros</span>
              </button>
              <button className="p-4 bg-zinc-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-100 transition-colors">
                <MessageSquare className="w-5 h-5 text-violet-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Chat Lider</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Devotional Modal */}
      <AnimatePresence>
        {showDevotionalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold italic serif">Novo Devocional</h3>
                  <button onClick={() => setShowDevotionalModal(false)} className="text-zinc-400 hover:text-zinc-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handlePublishDevotional} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Título</label>
                    <input 
                      type="text"
                      required
                      value={newDevotional.titulo}
                      onChange={(e) => setNewDevotional({...newDevotional, titulo: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Ex: O Poder da Oração"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Referência Bíblica</label>
                    <input 
                      type="text"
                      required
                      value={newDevotional.referencia_biblica}
                      onChange={(e) => setNewDevotional({...newDevotional, referencia_biblica: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Ex: Salmos 23:1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Conteúdo</label>
                    <textarea 
                      required
                      rows={6}
                      value={newDevotional.texto}
                      onChange={(e) => setNewDevotional({...newDevotional, texto: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      placeholder="Escreva a mensagem do devocional..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowDevotionalModal(false)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                    >
                      Publicar Devocional
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Announcement Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold italic serif">Novo Comunicado</h3>
                  <button onClick={() => setShowAnnouncementModal(false)} className="text-zinc-400 hover:text-zinc-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handlePublishAnnouncement} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Mensagem</label>
                    <textarea 
                      required
                      rows={6}
                      value={newAnnouncement.caption}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, caption: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      placeholder="Escreva o comunicado para a comunidade..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">Enviar para o Feed</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">Visível para todos os membros</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={newAnnouncement.toFeed}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, toFeed: e.target.checked})}
                        className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Compartilhar no Chat</label>
                      <select 
                        value={newAnnouncement.toChatRoomId}
                        onChange={(e) => setNewAnnouncement({...newAnnouncement, toChatRoomId: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      >
                        <option value="">Não compartilhar no chat</option>
                        {chatRooms.map(room => (
                          <option key={room.id} value={room.id}>
                            {room.name || room.participants.join(', ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAnnouncementModal(false)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                    >
                      Publicar Comunicado
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
