import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getZones } from '@/actions/zones';
import { BookingCalendar } from '@/components/bookings/BookingCalendar';
import { MyBookings } from '@/components/bookings/MyBookings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const { zones } = await getZones();
  const zoneOptions = zones.map((z) => ({ id: z.id, name: z.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Book desks and manage your reservations
        </p>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <BookingCalendar initialZones={zoneOptions} />
        </TabsContent>
        <TabsContent value="my-bookings" className="mt-4">
          <MyBookings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
