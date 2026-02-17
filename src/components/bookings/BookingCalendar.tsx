'use client';

import { useCallback, useEffect, useState } from 'react';
import { getBookingsForDate } from '@/actions/bookings';
import { getDesks } from '@/actions/desks';
import { useRealtimeBookings } from '@/lib/hooks/use-realtime-bookings';
import { useSession } from '@/lib/hooks/use-session';
import { BookingDialog } from './BookingDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { Booking, Desk, Zone, User } from '@/lib/db/types';

type BookingWithDetails = Booking & {
  desk: Pick<Desk, 'id' | 'label' | 'zone_id'>;
  user: Pick<User, 'id' | 'display_name'>;
};

type DeskWithZone = Desk & {
  zone: Pick<Zone, 'id' | 'name'>;
};

type BookingCalendarProps = {
  initialZones: Pick<Zone, 'id' | 'name'>[];
};

const TIME_SLOTS = ['morning', 'afternoon', 'full_day'] as const;
const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'AM',
  afternoon: 'PM',
  full_day: 'Full',
};

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  start.setDate(diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function BookingCalendar({ initialZones }: BookingCalendarProps) {
  const { user } = useSession();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedZone, setSelectedZone] = useState('all');
  const [desks, setDesks] = useState<DeskWithZone[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, BookingWithDetails[]>>({});
  const [loading, setLoading] = useState(true);

  // Booking dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState<DeskWithZone | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBookedSlots, setSelectedBookedSlots] = useState<string[]>([]);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);
  const todayKey = formatDateKey(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);

    const deskFilters = selectedZone !== 'all' ? { zoneId: selectedZone } : undefined;
    const { desks: deskData } = await getDesks(deskFilters);
    setDesks(deskData);

    const bookingsMap: Record<string, BookingWithDetails[]> = {};
    await Promise.all(
      weekDates.map(async (date) => {
        const dateKey = formatDateKey(date);
        const { bookings } = await getBookingsForDate(dateKey);
        bookingsMap[dateKey] = bookings;
      })
    );
    setBookingsByDate(bookingsMap);
    setLoading(false);
  }, [weekOffset, selectedZone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime updates for current day
  useRealtimeBookings(todayKey, loadData);

  function getSlotStatus(deskId: string, dateKey: string, slot: string) {
    const dayBookings = bookingsByDate[dateKey] || [];
    const booking = dayBookings.find(
      (b) =>
        b.desk_id === deskId &&
        (b.time_slot === slot || b.time_slot === 'full_day' || slot === 'full_day')
    );

    if (!booking) return 'available';
    if (booking.user_id === user.id) return 'mine';
    return 'booked';
  }

  function getDeskBookedSlots(deskId: string, dateKey: string): string[] {
    const dayBookings = bookingsByDate[dateKey] || [];
    return dayBookings
      .filter((b) => b.desk_id === deskId)
      .map((b) => b.time_slot);
  }

  function handleSlotClick(desk: DeskWithZone, dateKey: string) {
    if (desk.status === 'maintenance') return;
    const bookedSlots = getDeskBookedSlots(desk.id, dateKey);
    setSelectedDesk(desk);
    setSelectedDate(dateKey);
    setSelectedBookedSlots(bookedSlots);
    setDialogOpen(true);
  }

  const filteredDesks = selectedZone === 'all'
    ? desks
    : desks.filter((d) => d.zone_id === selectedZone);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)} className="border-stone-200 text-stone-600 hover:bg-stone-50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            This Week
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)} className="border-stone-200 text-stone-600 hover:bg-stone-50">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-stone-500 ml-2">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' - '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-[200px] border-stone-200">
            <SelectValue placeholder="Filter by zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {initialZones.map((z) => (
              <SelectItem key={z.id} value={z.id}>
                {z.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-stone-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-teal-500" />
          <span>My Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-stone-400" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-500" />
          <span>Maintenance</span>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading bookings...
          </CardContent>
        </Card>
      ) : filteredDesks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No desks found for the selected zone.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-r border-stone-200 p-2 text-left text-sm font-medium text-stone-600 bg-stone-50 min-w-[120px]">
                  Desk
                </th>
                {weekDates.map((date) => {
                  const dateKey = formatDateKey(date);
                  const isToday = dateKey === todayKey;
                  return (
                    <th
                      key={dateKey}
                      className={cn(
                        'border-b border-r border-stone-200 p-2 text-center text-sm font-medium min-w-[100px] last:border-r-0',
                        isToday ? 'bg-teal-50' : 'bg-stone-50'
                      )}
                    >
                      <div className="text-stone-600">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={cn('text-xs', isToday ? 'text-teal-600 font-semibold' : 'text-stone-400')}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredDesks.map((desk) => (
                <tr key={desk.id} className="hover:bg-stone-50/50">
                  <td className="border-b border-r border-stone-200 p-2">
                    <div className="font-medium text-sm text-stone-800">{desk.label}</div>
                    <div className="text-xs text-stone-400">{desk.zone.name}</div>
                  </td>
                  {weekDates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const isToday = dateKey === todayKey;
                    const isMaintenance = desk.status === 'maintenance';

                    return (
                      <td
                        key={dateKey}
                        className={cn(
                          'border-b border-r border-stone-200 p-1 last:border-r-0',
                          isToday && 'bg-teal-50/30'
                        )}
                      >
                        {isMaintenance ? (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="rounded-full bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              Maintenance
                            </Badge>
                          </div>
                        ) : (
                          <div
                            className="flex gap-0.5 justify-center cursor-pointer"
                            onClick={() => handleSlotClick(desk, dateKey)}
                          >
                            {TIME_SLOTS.filter(s => s !== 'full_day').map((slot) => {
                              const status = getSlotStatus(desk.id, dateKey, slot);
                              return (
                                <div
                                  key={slot}
                                  className={cn(
                                    'rounded px-1.5 py-0.5 text-[10px] font-medium text-white',
                                    status === 'available' && 'bg-emerald-500',
                                    status === 'mine' && 'bg-teal-500',
                                    status === 'booked' && 'bg-stone-400'
                                  )}
                                  title={`${TIME_SLOT_LABELS[slot]}: ${status}`}
                                >
                                  {TIME_SLOT_LABELS[slot]}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedDesk && (
        <BookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          deskId={selectedDesk.id}
          deskLabel={selectedDesk.label}
          zoneName={selectedDesk.zone.name}
          deskType={selectedDesk.desk_type}
          date={selectedDate}
          bookedSlots={selectedBookedSlots}
        />
      )}
    </div>
  );
}
