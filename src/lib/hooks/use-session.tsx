'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/lib/db/types';

type SessionContextType = {
  user: User;
};

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <SessionContext.Provider value={{ user }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
