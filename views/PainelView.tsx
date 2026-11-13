import React from 'react';
import { ManagementDashboard } from '../components/management/ManagementDashboard';
import { LeaderPasswordGate } from '../components/LeaderPasswordGate';
import { User, Community } from '../types';

interface PainelViewProps {
  user?: User | null;
  community?: Community | null;
  initialTab?: 'dashboard' | 'regente' | 'tesouraria' | 'secretaria' | 'membros' | 'lideranca' | 'settings';
  onBack?: () => void;
}

export const PainelView: React.FC<PainelViewProps> = ({ user, community, initialTab, onBack }) => {
  return (
    <LeaderPasswordGate community={community} user={user} onBack={onBack}>
      <ManagementDashboard user={user} initialTab={initialTab} />
    </LeaderPasswordGate>
  );
};
