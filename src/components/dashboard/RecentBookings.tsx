import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Monitor, MapPin, User } from 'lucide-react';

type RecentBooking = {
  id: string;
  userName: string;
  deskLabel: string;
  zoneName: string;
  date: string;
  timeSlot: string;
};

type RecentBookingsProps = {
  bookings: RecentBooking[];
};

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

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <Card className="rounded-xl border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle className="font-medium">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mb-3 text-stone-300" />
            <p className="text-sm">No recent bookings</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="pb-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Desk</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Zone</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Date</th>
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
                        <Monitor className="h-3.5 w-3.5" />
                        {booking.deskLabel}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.zoneName}
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
