'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sun, Sunset, Clock } from 'lucide-react';

type TimeSlotPickerProps = {
  value: string;
  onChange: (slot: string) => void;
  bookedSlots?: string[];
};

const slots = [
  { value: 'morning', label: 'Morning', description: '8:00 - 12:00', icon: Sun },
  { value: 'afternoon', label: 'Afternoon', description: '12:00 - 18:00', icon: Sunset },
  { value: 'full_day', label: 'Full Day', description: '8:00 - 18:00', icon: Clock },
];

export function TimeSlotPicker({ value, onChange, bookedSlots = [] }: TimeSlotPickerProps) {
  function isDisabled(slot: string) {
    if (bookedSlots.includes(slot)) return true;
    if (bookedSlots.includes('full_day')) return true;
    if (slot === 'full_day' && (bookedSlots.includes('morning') || bookedSlots.includes('afternoon'))) return true;
    return false;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const disabled = isDisabled(slot.value);
        const Icon = slot.icon;
        return (
          <Button
            key={slot.value}
            type="button"
            variant={value === slot.value ? 'default' : 'outline'}
            className={cn(
              'h-auto flex-col gap-1 py-3',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
            onClick={() => onChange(slot.value)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{slot.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {disabled ? 'Booked' : slot.description}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
