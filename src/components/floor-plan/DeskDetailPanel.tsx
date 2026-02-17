'use client';

import React, { useState, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, X, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TIME_SLOT_LABELS, type TimeSlot } from '@/lib/constants';
import { bookDesk, cancelBooking } from '@/actions/bookings';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type DeskDetailPanelProps = {
  desk: {
    id: string;
    label: string;
    desk_type: 'standard' | 'standing' | 'private' | 'shared';
    status: 'available' | 'maintenance' | 'reserved';
    equipment: string[] | null;
    zone_name: string;
    zone_color: string;
  } | null;
  bookings: {
    id: string;
    user_id: string;
    user_name: string;
    date: string;
    time_slot: 'morning' | 'afternoon' | 'full_day';
    status: 'confirmed' | 'cancelled';
  }[];
  selectedDate: string;
  selectedSlot: 'morning' | 'afternoon' | 'full_day' | 'any';
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onBook: () => void;
};

const DESK_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  standing: 'Standing',
  private: 'Private',
  shared: 'Shared',
};

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  reserved: 'bg-sky-100 text-sky-700 border-sky-200',
};

const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'full_day'];

function getSlotAvailability(
  slot: TimeSlot,
  bookings: DeskDetailPanelProps['bookings'],
  currentUserId: string,
  date: string
) {
  const dateBookings = bookings.filter(
    (b) => b.date === date && b.status === 'confirmed'
  );

  // Check if this specific slot is directly booked
  const directBooking = dateBookings.find((b) => b.time_slot === slot);
  if (directBooking) {
    return {
      available: false,
      isCurrentUser: directBooking.user_id === currentUserId,
      userName: directBooking.user_name,
    };
  }

  // full_day booking blocks morning and afternoon
  if (slot === 'morning' || slot === 'afternoon') {
    const fullDayBooking = dateBookings.find((b) => b.time_slot === 'full_day');
    if (fullDayBooking) {
      return {
        available: false,
        isCurrentUser: fullDayBooking.user_id === currentUserId,
        userName: fullDayBooking.user_name,
      };
    }
  }

  // morning or afternoon booking blocks full_day
  if (slot === 'full_day') {
    const partialBooking = dateBookings.find(
      (b) => b.time_slot === 'morning' || b.time_slot === 'afternoon'
    );
    if (partialBooking) {
      return {
        available: false,
        isCurrentUser: partialBooking.user_id === currentUserId,
        userName: partialBooking.user_name,
      };
    }
  }

  return { available: true, isCurrentUser: false, userName: '' };
}

function DeskDetailPanel({
  desk,
  bookings,
  selectedDate,
  selectedSlot,
  currentUserId,
  isOpen,
  onClose,
  onBook,
}: DeskDetailPanelProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | ''>(
    selectedSlot !== 'any' ? selectedSlot : ''
  );
  const [notes, setNotes] = useState('');
  const [isBooking, startBooking] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Reset form when slot filter changes
  React.useEffect(() => {
    setSelectedTimeSlot(selectedSlot !== 'any' ? selectedSlot : '');
  }, [selectedSlot]);

  // Reset form when desk changes
  React.useEffect(() => {
    setNotes('');
  }, [desk?.id]);

  const dateBookings = bookings.filter(
    (b) => b.date === selectedDate && b.status === 'confirmed'
  );

  function handleBook() {
    if (!desk || !selectedTimeSlot) return;

    startBooking(async () => {
      const formData = new FormData();
      formData.set('desk_id', desk.id);
      formData.set('date', selectedDate);
      formData.set('time_slot', selectedTimeSlot);
      if (notes.trim()) {
        formData.set('notes', notes.trim());
      }

      const result = await bookDesk(formData);

      if (result.success) {
        toast.success('Desk booked successfully');
        setNotes('');
        onBook();
      } else {
        toast.error(result.error || 'Failed to book desk');
      }
    });
  }

  async function handleCancel(bookingId: string) {
    if (!window.confirm('Cancel this booking?')) return;

    setCancellingId(bookingId);
    try {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        toast.success('Booking cancelled');
        onBook();
      } else {
        toast.error(result.error || 'Failed to cancel booking');
      }
    } finally {
      setCancellingId(null);
    }
  }

  const formattedDate = (() => {
    try {
      return format(parseISO(selectedDate), 'EEEE, MMM d');
    } catch {
      return selectedDate;
    }
  })();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="overflow-y-auto">
        {!desk ? (
          <SheetHeader>
            <SheetTitle>Select a desk</SheetTitle>
            <SheetDescription>
              Click on a desk in the floor plan to view its details.
            </SheetDescription>
          </SheetHeader>
        ) : (
          <>
            {/* Header */}
            <SheetHeader>
              <SheetTitle className="text-xl font-[family-name:var(--font-display)]">
                {desk.label}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Desk details and booking
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-stone-600">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: desk.zone_color }}
                  />
                  {desk.zone_name}
                </span>
                <Badge variant="outline">{DESK_TYPE_LABELS[desk.desk_type]}</Badge>
                <Badge className={cn('border', STATUS_STYLES[desk.status])}>
                  {desk.status.charAt(0).toUpperCase() + desk.status.slice(1)}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-4">
              {/* Equipment */}
              {desk.equipment && desk.equipment.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">
                      Equipment
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {desk.equipment.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Availability */}
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-stone-700 mb-2">
                  Availability for {formattedDate}
                </h4>
                <div className="space-y-1.5">
                  {SLOTS.map((slot) => {
                    const availability = getSlotAvailability(
                      slot,
                      bookings,
                      currentUserId,
                      selectedDate
                    );
                    return (
                      <div
                        key={slot}
                        className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
                      >
                        <span className="text-stone-600">
                          {TIME_SLOT_LABELS[slot]}
                        </span>
                        {availability.available ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : availability.isCurrentUser ? (
                          <Badge className="bg-sky-100 text-sky-700 border-sky-200 border text-xs">
                            You
                          </Badge>
                        ) : (
                          <X className="size-4 text-red-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Book form */}
              {desk.status !== 'maintenance' && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-3">
                      Quick Book
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="time-slot" className="text-xs text-stone-500">
                          Time Slot
                        </Label>
                        <Select
                          value={selectedTimeSlot}
                          onValueChange={(v) => setSelectedTimeSlot(v as TimeSlot)}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="Select time slot" />
                          </SelectTrigger>
                          <SelectContent>
                            {SLOTS.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                {TIME_SLOT_LABELS[slot]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-xs text-stone-500">
                          Notes (optional)
                        </Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any special requirements..."
                          className="mt-1 resize-none"
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={handleBook}
                        disabled={isBooking || !selectedTimeSlot}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          'Book Desk'
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Current bookings */}
              {dateBookings.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">
                      Bookings on {formattedDate}
                    </h4>
                    <div className="space-y-2">
                      {dateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="size-4 text-stone-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-stone-700 truncate">
                                {booking.user_name}
                              </p>
                              <p className="text-xs text-stone-500">
                                {TIME_SLOT_LABELS[booking.time_slot].split(' (')[0]}
                              </p>
                            </div>
                          </div>
                          {booking.user_id === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                              disabled={cancellingId === booking.id}
                              onClick={() => handleCancel(booking.id)}
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                'Cancel'
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export { DeskDetailPanel };
export type { DeskDetailPanelProps };
