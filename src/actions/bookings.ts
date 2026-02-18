'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import type { Booking, Desk, Zone, User } from '@/lib/db/types';

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function bookDesk(formData: FormData): Promise<{
  success: boolean;
  booking?: Booking;
  error?: string;
}> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const deskId = formData.get('desk_id') as string;
    const date = formData.get('date') as string;
    const timeSlot = formData.get('time_slot') as Booking['time_slot'];
    const notes = (formData.get('notes') as string) || null;

    if (!deskId || !date || !timeSlot) {
      return { success: false, error: 'Desk, date, and time slot are required.' };
    }

    // Check desk exists and get its zone
    const { data: desk, error: deskError } = await db
      .from('desks')
      .select('id, zone_id, status')
      .eq('id', deskId)
      .single();

    if (deskError || !desk) {
      return { success: false, error: 'Desk not found.' };
    }

    if (desk.status === 'maintenance') {
      return { success: false, error: 'This desk is currently under maintenance.' };
    }

    // Check team access (admin bypasses)
    if (session.user.role !== 'admin') {
      const { data: zoneTeams } = await db
        .from('zone_teams')
        .select('team_id')
        .eq('zone_id', desk.zone_id);

      if (zoneTeams && zoneTeams.length > 0) {
        const zoneTeamIds = zoneTeams.map((zt: { team_id: string }) => zt.team_id);

        const { data: memberships } = await db
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .in('team_id', zoneTeamIds);

        if (!memberships || memberships.length === 0) {
          return {
            success: false,
            error: 'You do not have access to book desks in this zone.',
          };
        }
      }
    }

    const { data: booking, error } = await db
      .from('bookings')
      .insert({
        desk_id: deskId,
        user_id: userId,
        date,
        time_slot: timeSlot,
        status: 'confirmed',
        notes,
      })
      .select()
      .single();

    if (error) {
      // PostgreSQL unique constraint violation = double booking
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This desk is already booked for the selected time slot.',
        };
      }
      throw error;
    }

    revalidatePath('/bookings');
    revalidatePath('/dashboard');
    revalidatePath(`/spaces/${desk.zone_id}`);
    return { success: true, booking };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function cancelBooking(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await requireAuth();

    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('id, user_id, desk_id')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return { success: false, error: 'Booking not found.' };
    }

    // Users can cancel their own bookings; admins can cancel any
    if (session.user.role !== 'admin' && booking.user_id !== session.user.id) {
      return { success: false, error: 'You can only cancel your own bookings.' };
    }

    const { error } = await db
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;

    revalidatePath('/bookings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getBookings(filters?: {
  date?: string;
  deskId?: string;
  userId?: string;
  zoneId?: string;
}): Promise<{
  bookings: (Booking & {
    desk: Pick<Desk, 'id' | 'label' | 'zone_id'>;
    user: Pick<User, 'id' | 'display_name'>;
  })[];
  error?: string;
}> {
  try {
    await requireAuth();

    let query = db
      .from('bookings')
      .select('*, desks:desk_id(id, label, zone_id), users:user_id(id, display_name)')
      .eq('status', 'confirmed')
      .order('date', { ascending: true });

    if (filters?.date) {
      query = query.eq('date', filters.date);
    }
    if (filters?.deskId) {
      query = query.eq('desk_id', filters.deskId);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    let result = (bookings || []).map((b: Record<string, unknown>) => ({
      ...b,
      desk: b.desks || { id: '', label: '', zone_id: '' },
      user: b.users || { id: '', display_name: '' },
    }));

    // Filter by zone if specified (requires join through desk)
    if (filters?.zoneId) {
      result = result.filter(
        (b: Record<string, unknown>) =>
          (b.desk as Pick<Desk, 'id' | 'label' | 'zone_id'>).zone_id === filters.zoneId
      );
    }

    return {
      bookings: result as (Booking & {
        desk: Pick<Desk, 'id' | 'label' | 'zone_id'>;
        user: Pick<User, 'id' | 'display_name'>;
      })[],
    };
  } catch (e) {
    return { bookings: [], error: (e as Error).message };
  }
}

export async function getMyBookings(): Promise<{
  bookings: (Booking & {
    desk: Pick<Desk, 'id' | 'label'> & { zone: Pick<Zone, 'id' | 'name'> };
  })[];
  error?: string;
}> {
  try {
    const session = await requireAuth();

    const { data: bookings, error } = await db
      .from('bookings')
      .select('*, desks:desk_id(id, label, zones:zone_id(id, name))')
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .order('date', { ascending: true });

    if (error) throw error;

    const result = (bookings || []).map((b: Record<string, unknown>) => {
      const deskData = b.desks as Record<string, unknown> | null;
      return {
        ...b,
        desk: {
          id: deskData?.id || '',
          label: deskData?.label || '',
          zone: deskData?.zones || { id: '', name: '' },
        },
      };
    });

    return {
      bookings: result as (Booking & {
        desk: Pick<Desk, 'id' | 'label'> & { zone: Pick<Zone, 'id' | 'name'> };
      })[],
    };
  } catch (e) {
    return { bookings: [], error: (e as Error).message };
  }
}

export async function getBookingsForDate(date: string): Promise<{
  bookings: (Booking & {
    desk: Pick<Desk, 'id' | 'label' | 'zone_id'>;
    user: Pick<User, 'id' | 'display_name'>;
  })[];
  error?: string;
}> {
  return getBookings({ date });
}
