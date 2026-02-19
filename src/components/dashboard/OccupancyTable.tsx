'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Monitor, MapPin, User, Building, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { getOccupancyForDate, type OccupancyBooking } from '@/actions/dashboard';

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  full_day: 'Full Day',
};

const TIME_SLOT_STYLES: Record<string, string> = {
  morning: 'bg-teal-50 text-teal-700 border-teal-200',
  afternoon: 'bg-amber-50 text-amber-700 border-amber-200',
  full_day: 'bg-stone-100 text-stone-700 border-stone-300',
};

export function OccupancyTable() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<OccupancyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = await getOccupancyForDate(dateStr);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(selectedDate);
  }, [selectedDate, fetchBookings]);

  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));

  return (
    <Card className="rounded-xl border-stone-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-medium">Today&apos;s Occupancy</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="rounded-md p-1.5 hover:bg-stone-100 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(selectedDate, 'EEE, MMM d, yyyy')}
          </span>
          <button
            onClick={goToNextDay}
            className="rounded-md p-1.5 hover:bg-stone-100 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mb-3 text-stone-300" />
            <p className="text-sm">No bookings for this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Floor</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Zone</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Desk</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Time Slot</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className={`border-b border-stone-100 last:border-0 ${
                      index % 2 === 1 ? 'bg-stone-50/50' : ''
                    }`}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{booking.userName}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building className="h-3.5 w-3.5" />
                        {booking.floor}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.zoneName}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Monitor className="h-3.5 w-3.5" />
                        {booking.deskLabel}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${TIME_SLOT_STYLES[booking.timeSlot] || ''}`}
                      >
                        {TIME_SLOT_LABELS[booking.timeSlot] || booking.timeSlot}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
