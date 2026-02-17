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

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent bookings
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{booking.userName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {booking.deskLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {booking.zoneName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {TIME_SLOT_LABELS[booking.timeSlot] || booking.timeSlot}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
