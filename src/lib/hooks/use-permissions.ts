'use client';

import { useSession } from './use-session';

export function usePermissions() {
  const { user } = useSession();
  return {
    isAdmin: user.role === 'admin',
    isTeamLead: user.role === 'team_lead',
    isMember: user.role === 'member',
    canManageTeam: user.role === 'admin' || user.role === 'team_lead',
    canManageUsers: user.role === 'admin',
    canManageSpaces: user.role === 'admin',
  };
}
