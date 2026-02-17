'use client';

import { useEffect, useState } from 'react';
import { getMyBookings, cancelBooking } from '@/actions/bookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Booking, Desk, Zone } from '@/lib/db/types';

type BookingWithDesk = Booking & {
  desk: Pick<Desk, 'id' | 'label'> & { zone: Pick<Zone, 'id' | 'name'> };
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning (8:00 - 12:00)',
  afternoon: 'Afternoon (12:00 - 18:00)',
  full_day: 'Full Day (8:00 - 18:00)',
};

export function MyBookings() {
  const [bookings, setBookings] = useState<BookingWithDesk[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    const { bookings: data } = await getMyBookings();
    setBookings(data);
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    const result = await cancelBooking(bookingId);
    if (result.success) {
      toast.success('Booking cancelled');
      loadBookings();
    } else {
      toast.error(result.error || 'Failed to cancel booking');
    }
    setCancellingId(null);
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter((b) => b.date >= today);
  const past = bookings.filter((b) => b.date < today);

  // Group by date
  function groupByDate(items: BookingWithDesk[]) {
    const groups: Record<string, BookingWithDesk[]> = {};
    for (const b of items) {
      if (!groups[b.date]) groups[b.date] = [];
      groups[b.date].push(b);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading your bookings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-800">
            <Calendar className="h-5 w-5 text-teal-600" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-stone-500 py-4 text-center">
              No upcoming bookings
            </p>
          ) : (
            <div className="space-y-4">
              {groupByDate(upcoming).map(([date, items]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-stone-500 mb-2">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h4>
                  <div className="space-y-2">
                    {items.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between rounded-xl border border-stone-200 p-3 hover:bg-stone-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-sm text-stone-800">{booking.desk.label}</p>
                            <div className="flex items-center gap-2 text-xs text-stone-400">
                              <MapPin className="h-3 w-3" />
                              {booking.desk.zone.name}
                              <Clock className="h-3 w-3 ml-1" />
                              {TIME_SLOT_LABELS[booking.time_slot]}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="text-stone-500 hover:text-red-600 hover:bg-red-50"
                        >
                          {cancellingId === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card className="rounded-xl border-stone-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-stone-400">Past Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupByDate(past).slice(-5).map(([date, items]) => (
                <div key={date}>
                  <h4 className="text-xs font-medium text-stone-400 mb-1">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h4>
                  {items.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-3 rounded-xl border border-stone-100 p-2 opacity-60"
                    >
                      <p className="text-sm text-stone-600">{booking.desk.label}</p>
                      <Badge variant="outline" className="text-xs rounded-full border-stone-200 text-stone-500">
                        {booking.desk.zone.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
