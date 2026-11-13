import React from 'react';
import { motion } from 'motion/react';
import { TimelineEvent } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Trophy, 
  Star, 
  Users, 
  Calendar, 
  Activity,
  CheckCircle2
} from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'achievement': return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 'milestone': return <Star className="w-5 h-5 text-purple-500" />;
    case 'contribution': return <Users className="w-5 h-5 text-blue-500" />;
    case 'presence': return <Calendar className="w-5 h-5 text-green-500" />;
    case 'ritual': return <Activity className="w-5 h-5 text-orange-500" />;
    default: return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
  }
};

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>Sua história está começando. Participe da comunidade para criar memórias!</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
      {events.map((event, index) => (
        <motion.div
          key={event.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-zinc-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            {getEventIcon(event.type)}
          </div>

          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[45%] p-4 rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <time className="font-mono text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                {event.timestamp?.toDate ? format(event.timestamp.toDate(), "dd 'de' MMMM", { locale: ptBR }) : 'Recentemente'}
              </time>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{event.impactScore} XP
              </span>
            </div>
            <h3 className="font-bold text-zinc-900">{event.title}</h3>
            <p className="text-sm text-zinc-600 mt-1">{event.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
