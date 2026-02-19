'use server';

import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export type OccupancyBooking = {
  id: string;
  userName: string;
  floor: number;
  zoneName: string;
  deskLabel: string;
  date: string;
  timeSlot: string;
};

export async function getOccupancyForDate(date: string): Promise<OccupancyBooking[]> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { data: bookings } = await db
    .from('bookings')
    .select('id, date, time_slot, desks:desk_id(label, zones:zone_id(name, floor)), users:user_id(display_name)')
    .eq('date', date)
    .eq('status', 'confirmed')
    .order('time_slot', { ascending: true });

  return (bookings || []).map((b: Record<string, unknown>) => {
    const desk = b.desks as Record<string, unknown> | null;
    const user = b.users as Record<string, unknown> | null;
    const zone = desk?.zones as Record<string, unknown> | null;
    return {
      id: b.id as string,
      userName: (user?.display_name as string) || 'Unknown',
      floor: (zone?.floor as number) ?? 0,
      zoneName: (zone?.name as string) || 'Unknown',
      deskLabel: (desk?.label as string) || 'Unknown',
      date: b.date as string,
      timeSlot: b.time_slot as string,
    };
  }).sort((a, b) => {
    const slotOrder = a.timeSlot.localeCompare(b.timeSlot);
    if (slotOrder !== 0) return slotOrder;
    return a.userName.localeCompare(b.userName);
  });
}
