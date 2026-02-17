'use client';

import { useState } from 'react';
import { bookDesk } from '@/actions/bookings';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TimeSlotPicker } from './TimeSlotPicker';
import { Loader2, Monitor } from 'lucide-react';
import { toast } from 'sonner';

type BookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deskId: string;
  deskLabel: string;
  zoneName: string;
  deskType: string;
  date: string;
  bookedSlots?: string[];
};

export function BookingDialog({
  open,
  onOpenChange,
  deskId,
  deskLabel,
  zoneName,
  deskType,
  date,
  bookedSlots = [],
}: BookingDialogProps) {
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!timeSlot) {
      setError('Please select a time slot.');
      return;
    }

    setIsPending(true);
    setError('');

    const formData = new FormData();
    formData.set('desk_id', deskId);
    formData.set('date', date);
    formData.set('time_slot', timeSlot);
    formData.set('notes', notes);

    const result = await bookDesk(formData);

    if (result.success) {
      toast.success('Desk booked successfully');
      onOpenChange(false);
      setTimeSlot('');
      setNotes('');
    } else {
      setError(result.error || 'Failed to book desk');
    }

    setIsPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Desk</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/50">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{deskLabel}</p>
              <p className="text-sm text-muted-foreground">
                {zoneName} &middot; <Badge variant="outline" className="text-xs">{deskType}</Badge>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <p className="text-sm font-medium">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Time Slot</Label>
            <TimeSlotPicker
              value={timeSlot}
              onChange={setTimeSlot}
              bookedSlots={bookedSlots}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements..."
              rows={2}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !timeSlot}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
