import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  Heart, 
  Zap, 
  PartyPopper,
  ChevronRight,
  Send
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { LeaderTask, User } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeaderTasksProps {
  leaderUid: string;
}

const getTaskIcon = (type: LeaderTask['type']) => {
  switch (type) {
    case 'follow_up': return <Clock className="w-5 h-5 text-blue-500" />;
    case 'encouragement': return <Heart className="w-5 h-5 text-pink-500" />;
    case 'intervention': return <AlertCircle className="w-5 h-5 text-rose-500" />;
    case 'celebration': return <PartyPopper className="w-5 h-5 text-amber-500" />;
    default: return <CheckCircle2 className="w-5 h-5 text-zinc-500" />;
  }
};

const getPriorityColor = (priority: LeaderTask['priority']) => {
  switch (priority) {
    case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'low': return 'bg-blue-50 text-blue-600 border-blue-100';
    default: return 'bg-zinc-50 text-zinc-600 border-zinc-100';
  }
};

export const LeaderTasks: React.FC<LeaderTasksProps> = ({ leaderUid }) => {
  const [tasks, setTasks] = useState<LeaderTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<LeaderTask | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  useEffect(() => {
    loadTasks();
  }, [leaderUid]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getLeaderTasks(leaderUid);
      setTasks(data);
    } catch (error) {
      console.error("Error loading leader tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await firebaseService.updateLeaderTaskStatus(taskId, 'completed');
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleDismiss = async (taskId: string) => {
    try {
      await firebaseService.updateLeaderTaskStatus(taskId, 'dismissed');
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error("Error dismissing task:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Ações Sugeridas</h2>
          <p className="text-sm text-zinc-500">O sistema identificou estas prioridades para você.</p>
        </div>
        <div className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold text-zinc-600">
          {tasks.length} pendentes
        </div>
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setSelectedTask(task)}
              className="group relative p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getPriorityColor(task.priority)}`}>
                  {getTaskIcon(task.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Urgente' : task.priority === 'medium' ? 'Importante' : 'Normal'}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-400">
                      Vence em: {task.dueDate?.toDate ? format(task.dueDate.toDate(), "dd/MM") : 'Hoje'}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 truncate">{task.title}</h3>
                  <p className="text-sm text-zinc-500 line-clamp-1">{task.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
            <Zap className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium">Tudo em dia! Nenhuma ação pendente.</p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${getPriorityColor(selectedTask.priority)}`}>
                    {getTaskIcon(selectedTask.type)}
                  </div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 rotate-90 text-zinc-400" />
                  </button>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-zinc-900">{selectedTask.title}</h3>
                  <p className="text-zinc-600 mt-2 leading-relaxed">{selectedTask.description}</p>
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
                    <UserPlus className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Membro Alvo</p>
                    <p className="font-bold text-zinc-900">Carregando dados do membro...</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDismiss(selectedTask.id!)}
                    className="py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-all"
                  >
                    Ignorar
                  </button>
                  <button
                    onClick={() => handleComplete(selectedTask.id!)}
                    className="py-4 rounded-2xl font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Concluir Ação
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
