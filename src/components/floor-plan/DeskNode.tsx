'use client';

import { useCallback, useRef, useState } from 'react';
import { Monitor, ArrowUpFromLine, Lock, Users, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type DeskDisplayStatus = 'available' | 'mine' | 'occupied' | 'reserved' | 'maintenance';

type DeskNodeProps = {
  desk: {
    id: string;
    label: string;
    desk_type: 'standard' | 'standing' | 'private' | 'shared';
    status: 'available' | 'maintenance' | 'reserved';
    pos_x: number;
    pos_y: number;
    rotation: number;
    equipment: string[] | null;
  };
  displayStatus: DeskDisplayStatus;
  bookedBy?: string;
  isEditMode: boolean;
  isSelected: boolean;
  onClick: () => void;
  onDragStart?: () => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
  onDrag?: (pos: { x: number; y: number }) => void;
};

const statusStyles: Record<DeskDisplayStatus, { band: string; border: string; bg: string }> = {
  available:   { band: 'bg-emerald-500', border: 'border-emerald-500/40', bg: 'bg-emerald-50' },
  mine:        { band: 'bg-sky-500',     border: 'border-sky-500/40',     bg: 'bg-sky-50' },
  occupied:    { band: 'bg-stone-400',   border: 'border-stone-400/40',   bg: 'bg-stone-50' },
  reserved:    { band: 'bg-amber-500',   border: 'border-amber-500/40',   bg: 'bg-amber-50' },
  maintenance: { band: 'bg-rose-500',    border: 'border-rose-500/40',    bg: 'bg-rose-50' },
};

const deskTypeIcons: Record<string, typeof Monitor> = {
  standard: Monitor,
  standing: ArrowUpFromLine,
  private: Lock,
  shared: Users,
};

const deskTypeLabels: Record<string, string> = {
  standard: 'Standard',
  standing: 'Standing',
  private: 'Private',
  shared: 'Shared',
};

const DRAG_THRESHOLD = 5;

export function DeskNode({
  desk,
  displayStatus,
  bookedBy,
  isEditMode,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  onDrag,
}: DeskNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
  } | null>(null);

  const style = statusStyles[displayStatus];
  const Icon = deskTypeIcons[desk.desk_type] ?? Monitor;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isEditMode) return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragState.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPosX: desk.pos_x,
        startPosY: desk.pos_y,
        hasMoved: false,
      };
    },
    [isEditMode, desk.pos_x, desk.pos_y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragState.current;
      if (!state) return;

      const dx = e.clientX - state.startClientX;
      const dy = e.clientY - state.startClientY;

      if (!state.hasMoved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
        return;
      }

      if (!state.hasMoved) {
        state.hasMoved = true;
        setIsDragging(true);
        onDragStart?.();
      }

      const newX = state.startPosX + dx;
      const newY = state.startPosY + dy;

      // Update position directly via DOM for performance
      if (nodeRef.current) {
        nodeRef.current.style.left = `${newX}px`;
        nodeRef.current.style.top = `${newY}px`;
      }

      onDrag?.({ x: newX, y: newY });
    },
    [onDrag, onDragStart],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = dragState.current;
      if (!state) return;

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (state.hasMoved) {
        const dx = e.clientX - state.startClientX;
        const dy = e.clientY - state.startClientY;
        onDragEnd?.({ x: state.startPosX + dx, y: state.startPosY + dy });
      }

      const wasDrag = state.hasMoved;
      dragState.current = null;
      setIsDragging(false);

      if (!wasDrag) {
        onClick();
      }
    },
    [onClick, onDragEnd],
  );

  const handleClick = useCallback(() => {
    if (!isEditMode) {
      onClick();
    }
    // In edit mode, click is handled in pointerUp
  }, [isEditMode, onClick]);

  const deskElement = (
    <div
      ref={nodeRef}
      role="button"
      tabIndex={0}
      className={cn(
        'pointer-events-auto absolute flex w-[72px] flex-col overflow-hidden rounded-lg border transition-all duration-150',
        style.border,
        style.bg,
        // Hover
        'hover:scale-105 hover:shadow-md hover:cursor-pointer',
        // Selected
        isSelected && 'ring-2 ring-teal-500 shadow-lg scale-105',
        // Edit mode
        isEditMode && !isDragging && 'cursor-move',
        // Dragging
        isDragging && 'opacity-80 ring-2 ring-teal-400 z-50',
        // Default z
        !isDragging && 'z-10',
      )}
      style={{
        left: desk.pos_x,
        top: desk.pos_y,
        transform: `rotate(${desk.rotation}deg)`,
        height: 48,
      }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Status color band */}
      <div className={cn('h-1 w-full shrink-0', style.band)} />

      {/* Body */}
      <div className="flex flex-1 items-center gap-1 px-1.5">
        <Icon className="h-3 w-3 shrink-0 text-stone-400" />
        <span className="truncate text-xs font-semibold text-stone-700">
          {desk.label}
        </span>
      </div>

      {/* Booked by name */}
      {bookedBy && (
        <div className="truncate px-1.5 pb-0.5 text-[10px] leading-tight text-stone-400">
          {bookedBy}
        </div>
      )}

      {/* Edit mode drag handle */}
      {isEditMode && (
        <div className="absolute right-0.5 top-1.5 text-stone-300">
          <GripVertical className="h-3 w-3" />
        </div>
      )}
    </div>
  );

  // Wrap with tooltip only in view mode and not during drag
  if (!isEditMode && !isDragging) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{deskElement}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          <p className="font-semibold">{desk.label}</p>
          <p className="text-xs opacity-80">
            {deskTypeLabels[desk.desk_type]} &middot;{' '}
            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
          </p>
          {bookedBy && (
            <p className="text-xs opacity-70">Booked by {bookedBy}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return deskElement;
}
