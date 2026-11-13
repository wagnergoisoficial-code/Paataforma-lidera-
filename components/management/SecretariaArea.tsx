import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Plus, 
  Clock, 
  MapPin, 
  Youtube, 
  CheckCircle2, 
  XCircle,
  Search,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../../services/firebase';
import { AgendaEvent, User, Presence } from '../../types';

interface SecretariaAreaProps {
  onNavigateToMembers?: () => void;
}

export const SecretariaArea: React.FC<SecretariaAreaProps> = ({ onNavigateToMembers }) => {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [eventPresences, setEventPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const [presenceLoading, setPresenceLoading] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: new Date().toISOString().slice(0, 16),
    location: '',
    youtubeLink: '',
    color: '#FDB813'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchEventPresences(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchData = async () => {
    setLoading(true);
    const [eventsData, membersData] = await Promise.all([
      new Promise<AgendaEvent[]>((resolve) => firebaseService.subscribeEvents(resolve)),
      firebaseService.getMembers(100)
    ]);
    setEvents(eventsData);
    setMembers(membersData);
    setLoading(false);
  };

  const fetchEventPresences = async (eventId: string) => {
    setPresenceLoading(true);
    const presences = await firebaseService.getEventPresence(eventId);
    setEventPresences(presences);
    setPresenceLoading(false);
  };

  const handleTogglePresence = async (member: User) => {
    if (!selectedEvent?.id || !member.uid) return;
    
    const isPresent = eventPresences.some(p => p.userUid === member.uid);
    
    if (isPresent) {
      // In a real app, we might want to remove presence, but for now we just record
      // To keep it simple, we only add. If we wanted to remove, we'd need a deletePresence method.
      return;
    }

    await firebaseService.recordPresence({
      userUid: member.uid,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      communityId: firebaseService.getCurrentUser()?.communityId || 'umadw',
      verifiedBy: firebaseService.getCurrentUser()?.uid
    });

    fetchEventPresences(selectedEvent.id);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start) return;

    await firebaseService.publishEvent({
      ...newEvent,
      allDay: false,
      communityId: firebaseService.getCurrentUser()?.communityId || 'umadw'
    } as AgendaEvent);

    setNewEvent({ 
      title: '', 
      description: '', 
      start: new Date().toISOString().slice(0, 16), 
      location: '', 
      youtubeLink: '', 
      color: '#FDB813' 
    });
    setShowAddEventModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold italic serif text-zinc-900">Secretaria & Agenda</h2>
          <p className="text-zinc-500 text-sm">Gestão de agenda, eventos e frequência.</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToMembers && (
            <button 
              onClick={onNavigateToMembers}
              className="flex items-center gap-2 px-4 py-2 bg-[#001220] text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors text-xs"
            >
              <Users className="w-4 h-4 text-[#FDB813]" />
              Ficha de Membros
            </button>
          )}
          <button 
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-xs"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-zinc-900 italic serif flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Próximos Eventos
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-zinc-100 animate-pulse rounded-3xl" />
              ))
            ) : events.length > 0 ? (
              events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        {new Date(event.start).toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-zinc-900 leading-none">
                        {new Date(event.start).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.youtubeLink && (
                      <a 
                        href={event.youtubeLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedEvent(event)}
                      className="p-2 bg-zinc-50 text-zinc-400 hover:text-emerald-600 rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-400 italic">
                Nenhum evento agendado.
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats / Members Summary */}
        <div className="space-y-6">
          <section className="bg-zinc-900 p-6 rounded-[32px] text-white">
            <h3 className="font-bold italic serif mb-4">Resumo de Membros</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Total de Membros</span>
                <span className="text-lg font-bold">{members.length}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-3/4" />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">75% de presença média</p>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
            <h3 className="font-bold text-zinc-900 italic serif mb-4">Links Úteis</h3>
            <div className="space-y-3">
              <QuickLink icon={<Youtube className="text-red-500" />} label="Canal do YouTube" />
              <QuickLink icon={<Calendar className="text-blue-500" />} label="Calendário Anual" />
              <QuickLink 
                icon={<Users className="text-emerald-500" />} 
                label="Ficha de Membros" 
                onClick={onNavigateToMembers}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Presence Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold italic serif">Chamada: {selectedEvent.title}</h3>
                  <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-zinc-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <p className="text-zinc-500 text-sm">
                  {new Date(selectedEvent.start).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {new Date(selectedEvent.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  <span>Membro</span>
                  <span>Status</span>
                </div>
                
                {members.map((member) => {
                  const isPresent = eventPresences.some(p => p.userUid === member.uid);
                  return (
                    <div key={member.uid} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{member.name}</p>
                          <p className="text-[10px] text-zinc-400 uppercase font-bold">{member.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleTogglePresence(member)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                          isPresent 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-white text-zinc-400 hover:bg-zinc-100 border border-zinc-200'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Presente
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Falta
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{eventPresences.length}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Presentes</p>
                  </div>
                  <div className="h-8 w-px bg-zinc-200" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">{members.length - eventPresences.length}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Faltas</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors"
                >
                  Concluir Chamada
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold italic serif">Novo Evento</h3>
                  <button onClick={() => setShowAddEventModal(false)} className="text-zinc-400 hover:text-zinc-600">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Título do Evento</label>
                    <input 
                      type="text"
                      required
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Ex: Culto de Jovens"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Data e Hora</label>
                      <input 
                        type="datetime-local"
                        required
                        value={newEvent.start}
                        onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Cor</label>
                      <input 
                        type="color"
                        value={newEvent.color}
                        onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                        className="w-full h-[46px] p-1 bg-zinc-50 border border-zinc-200 rounded-2xl cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Local</label>
                    <input 
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Ex: Templo Principal"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Link YouTube (Live)</label>
                    <input 
                      type="url"
                      value={newEvent.youtubeLink}
                      onChange={(e) => setNewEvent({...newEvent, youtubeLink: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="https://youtube.com/live/..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowAddEventModal(false)}
                      className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                    >
                      Criar Evento
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

const QuickLink: React.FC<{ icon: React.ReactNode, label: string, onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-colors group text-left"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-xl shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-bold text-zinc-700">{label}</span>
    </div>
    <ExternalLink className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
  </button>
);
