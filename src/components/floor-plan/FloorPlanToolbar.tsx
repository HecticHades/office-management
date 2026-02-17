'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  CalendarIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Pencil,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIME_SLOT_LABELS, type TimeSlot } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type SlotOption = TimeSlot | 'any';

type FloorPlanToolbarProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSlot: SlotOption;
  onSlotChange: (slot: SlotOption) => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
  isAdmin: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  zones: { id: string; name: string; color: string }[];
  selectedZoneId: string | null;
  onZoneFilter: (zoneId: string | null) => void;
};

const SLOT_OPTIONS: { value: SlotOption; label: string }[] = [
  { value: 'any', label: 'Any Time' },
  ...(['morning', 'afternoon', 'full_day'] as const).map((slot) => ({
    value: slot as SlotOption,
    label: TIME_SLOT_LABELS[slot].split(' (')[0],
  })),
];

function FloorPlanToolbar({
  selectedDate,
  onDateChange,
  selectedSlot,
  onSlotChange,
  isEditMode,
  onEditModeToggle,
  isAdmin,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  zones,
  selectedZoneId,
  onZoneFilter,
}: FloorPlanToolbarProps) {
  const dateValue = parseISO(selectedDate);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-stone-200">
      {/* Date picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="size-4 text-stone-500" />
            <span>{format(dateValue, 'MMM d, yyyy')}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                onDateChange(format(date, 'yyyy-MM-dd'));
              }
            }}
          />
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      {/* Time slot selector */}
      <div className="flex items-center gap-1">
        {SLOT_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={selectedSlot === option.value ? 'default' : 'ghost'}
            size="xs"
            className={cn(
              selectedSlot === option.value
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'text-stone-500 hover:text-stone-800',
            )}
            onClick={() => onSlotChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      {/* Zone filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="size-4 text-stone-400" />
        <Select
          value={selectedZoneId ?? 'all'}
          onValueChange={(value) =>
            onZoneFilter(value === 'all' ? null : value)
          }
        >
          <SelectTrigger size="sm" className="h-8 min-w-[140px]">
            <SelectValue placeholder="All Zones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  {zone.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5 rounded-lg border border-stone-200 p-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <ZoomIn className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <ZoomOut className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onResetZoom}
          aria-label="Reset zoom"
        >
          <Maximize2 className="size-3.5" />
        </Button>
      </div>

      {/* Edit mode toggle (admin only) */}
      {isAdmin && (
        <>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div className="flex items-center gap-2">
            <Pencil className="size-4 text-stone-400" />
            <Switch checked={isEditMode} onCheckedChange={onEditModeToggle} />
            {isEditMode && (
              <Badge className="bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100">
                Edit Mode
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { FloorPlanToolbar };
export type { FloorPlanToolbarProps, SlotOption };
