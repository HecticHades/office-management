'use client';

import { useEffect } from 'react';
import { realtimeClient } from '@/lib/db/realtime';

export function useRealtimeBookings(date: string, onUpdate: () => void) {
  useEffect(() => {
    const channel = realtimeClient
      .channel(`bookings-${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `date=eq.${date}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      realtimeClient.removeChannel(channel);
    };
  }, [date, onUpdate]);
}
