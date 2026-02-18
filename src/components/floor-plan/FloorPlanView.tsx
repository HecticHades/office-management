'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FloorPlanCanvas, type FloorPlanCanvasRef } from './FloorPlanCanvas';
import { FloorPlanToolbar, type SlotOption } from './FloorPlanToolbar';
import { FloorPlanLegend } from './FloorPlanLegend';
import { DeskNode, type DeskDisplayStatus } from './DeskNode';
import { ZoneOverlay } from './ZoneOverlay';
import { DeskDetailPanel } from './DeskDetailPanel';
import { ZoneDrawingLayer } from './ZoneDrawingLayer';
import { getFloorPlanData, updateDeskPosition } from '@/actions/floor-plan';
import { getFloorPlanConfig, updateZoneBoundary } from '@/actions/floor-plan-config';
import { useRealtimeBookings } from '@/lib/hooks/use-realtime-bookings';
import type { Desk, TimeSlot } from '@/lib/db/types';

type FloorPlanDataZone = {
  id: string;
  name: string;
  color: string;
  boundary_path: string | null;
  team_name?: string;
};

type FloorPlanDataDesk = Desk & {
  zone_name: string;
  zone_color: string;
};

type FloorPlanDataBooking = {
  id: string;
  desk_id: string;
  user_id: string;
  user_name: string;
  date: string;
  time_slot: TimeSlot;
  status: 'confirmed' | 'cancelled';
};

function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Check whether a booking's time_slot overlaps with the selected slot filter.
 * 'any' matches everything. full_day overlaps with both halves and vice versa.
 */
function slotsOverlap(bookingSlot: TimeSlot, filterSlot: SlotOption): boolean {
  if (filterSlot === 'any') return true;
  if (bookingSlot === filterSlot) return true;
  if (bookingSlot === 'full_day') return true;
  if (filterSlot === 'full_day') return true;
  return false;
}

export function FloorPlanView() {
  // --- State ---
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption>('any');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [zones, setZones] = useState<FloorPlanDataZone[]>([]);
  const [desks, setDesks] = useState<FloorPlanDataDesk[]>([]);
  const [bookings, setBookings] = useState<FloorPlanDataBooking[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Floor plan image & scale
  const [floorPlanImageUrl, setFloorPlanImageUrl] = useState<string | null>(null);
  const [currentScale, setCurrentScale] = useState(0.8);

  // Zone drawing mode
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [drawingZoneId, setDrawingZoneId] = useState<string | null>(null);

  const canvasRef = useRef<FloorPlanCanvasRef>(null);

  // --- Data loading ---
  const fetchData = useCallback(async (date: string) => {
    const result = await getFloorPlanData(date);
    if (result.error) {
      toast.error(result.error);
    }
    setZones(result.zones);
    setDesks(result.desks as FloorPlanDataDesk[]);
    setBookings(result.bookings as FloorPlanDataBooking[]);
    setCurrentUserId(result.currentUserId);
    setIsAdmin(result.isAdmin);
    setIsLoading(false);
  }, []);

  // Load floor plan config once on mount
  useEffect(() => {
    getFloorPlanConfig().then((cfg) => {
      if (!cfg.error) {
        setFloorPlanImageUrl(cfg.image_url);
      }
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // --- Realtime ---
  const handleRealtimeUpdate = useCallback(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  useRealtimeBookings(selectedDate, handleRealtimeUpdate);

  // --- Zone filtering ---
  const filteredDesks = useMemo(() => {
    if (!selectedZoneId) return desks;
    return desks.filter((d) => d.zone_id === selectedZoneId);
  }, [desks, selectedZoneId]);

  // --- Desk display status computation ---
  const deskStatuses = useMemo(() => {
    const map = new Map<string, { status: DeskDisplayStatus; bookedBy?: string }>();

    for (const desk of desks) {
      if (desk.status === 'maintenance') {
        map.set(desk.id, { status: 'maintenance' });
        continue;
      }
      if (desk.status === 'reserved') {
        map.set(desk.id, { status: 'reserved' });
        continue;
      }

      const deskBookings = bookings.filter(
        (b) => b.desk_id === desk.id && b.status === 'confirmed'
      );

      const matchingBooking = deskBookings.find((b) =>
        slotsOverlap(b.time_slot, selectedSlot)
      );

      if (matchingBooking) {
        if (matchingBooking.user_id === currentUserId) {
          map.set(desk.id, { status: 'mine', bookedBy: matchingBooking.user_name });
        } else {
          map.set(desk.id, { status: 'occupied', bookedBy: matchingBooking.user_name });
        }
      } else {
        map.set(desk.id, { status: 'available' });
      }
    }

    return map;
  }, [desks, bookings, selectedSlot, currentUserId]);

  // --- Handlers ---
  const handleDeskClick = useCallback((deskId: string) => {
    setSelectedDeskId(deskId);
    setIsPanelOpen(true);
  }, []);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const handleBook = useCallback(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const handleEditModeToggle = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const handleDragEnd = useCallback(
    async (deskId: string, pos: { x: number; y: number }) => {
      const result = await updateDeskPosition(deskId, pos.x, pos.y);
      if (result.success) {
        toast.success('Desk position updated');
        fetchData(selectedDate);
      } else {
        toast.error(result.error || 'Failed to update desk position');
        fetchData(selectedDate);
      }
    },
    [selectedDate, fetchData]
  );

  const handleRotationEnd = useCallback(
    async (deskId: string, rotation: number) => {
      const desk = desks.find((d) => d.id === deskId);
      if (!desk) return;
      const result = await updateDeskPosition(deskId, desk.pos_x, desk.pos_y, rotation);
      if (result.success) {
        toast.success('Desk rotation updated');
        fetchData(selectedDate);
      } else {
        toast.error(result.error || 'Failed to update rotation');
        fetchData(selectedDate);
      }
    },
    [desks, selectedDate, fetchData]
  );

  const handleZoomChange = useCallback((scale: number) => {
    setCurrentScale(scale);
  }, []);

  const handleImageSaved = useCallback((url: string | null) => {
    setFloorPlanImageUrl(url);
  }, []);

  const handleDrawZoneToggle = useCallback(() => {
    setIsDrawingZone((prev) => {
      if (prev) {
        setDrawingZoneId(null);
      }
      return !prev;
    });
  }, []);

  const handleDrawComplete = useCallback(
    async (zoneId: string, boundaryPath: string) => {
      const result = await updateZoneBoundary(zoneId, boundaryPath);
      if (result.success) {
        toast.success('Zone boundary updated');
        fetchData(selectedDate);
      } else {
        toast.error(result.error || 'Failed to update zone boundary');
      }
      setIsDrawingZone(false);
      setDrawingZoneId(null);
    },
    [selectedDate, fetchData]
  );

  const handleDrawCancel = useCallback(() => {
    setIsDrawingZone(false);
    setDrawingZoneId(null);
  }, []);

  const handleZoomIn = useCallback(() => canvasRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => canvasRef.current?.zoomOut(), []);
  const handleResetZoom = useCallback(() => canvasRef.current?.resetTransform(), []);

  // --- Selected desk data for panel ---
  const selectedDesk = useMemo(() => {
    if (!selectedDeskId) return null;
    const desk = desks.find((d) => d.id === selectedDeskId);
    if (!desk) return null;
    return {
      id: desk.id,
      label: desk.label,
      desk_type: desk.desk_type,
      status: desk.status,
      equipment: desk.equipment,
      zone_name: desk.zone_name,
      zone_color: desk.zone_color,
    };
  }, [selectedDeskId, desks]);

  const selectedDeskBookings = useMemo(() => {
    if (!selectedDeskId) return [];
    return bookings.filter(
      (b) => b.desk_id === selectedDeskId && b.status === 'confirmed'
    );
  }, [selectedDeskId, bookings]);

  // --- Drawing target zone ---
  const drawingTargetZone = useMemo(() => {
    if (!isDrawingZone || !drawingZoneId) return null;
    const zone = zones.find((z) => z.id === drawingZoneId);
    if (!zone) return null;
    return { id: zone.id, name: zone.name, color: zone.color };
  }, [isDrawingZone, drawingZoneId, zones]);

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <FloorPlanToolbar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedSlot={selectedSlot}
          onSlotChange={setSelectedSlot}
          isEditMode={isEditMode}
          onEditModeToggle={handleEditModeToggle}
          isAdmin={isAdmin}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZoneFilter={setSelectedZoneId}
          imageUrl={floorPlanImageUrl}
          onImageSaved={handleImageSaved}
          isDrawingZone={isDrawingZone}
          onDrawZoneToggle={handleDrawZoneToggle}
          drawingZoneId={drawingZoneId}
          onDrawingZoneChange={setDrawingZoneId}
        />

        <FloorPlanCanvas
          ref={canvasRef}
          isEditMode={isEditMode}
          onZoomChange={handleZoomChange}
          backgroundImageUrl={floorPlanImageUrl}
        >
          {desks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="max-w-sm text-center text-sm text-stone-400">
                No desks have been placed yet. Create desks in the Spaces section,
                then position them here.
              </p>
            </div>
          ) : (
            <>
              {/* SVG layer for zone overlays */}
              <svg
                className="absolute inset-0 h-full w-full pointer-events-none"
                viewBox="0 0 1200 800"
              >
                {zones.map((zone) => (
                  <ZoneOverlay
                    key={zone.id}
                    zone={zone}
                    isHighlighted={selectedZoneId === zone.id}
                  />
                ))}
              </svg>

              {/* Desk nodes */}
              {filteredDesks.map((desk) => {
                const info = deskStatuses.get(desk.id);
                return (
                  <DeskNode
                    key={desk.id}
                    desk={desk}
                    displayStatus={info?.status ?? 'available'}
                    bookedBy={info?.bookedBy}
                    isEditMode={isEditMode}
                    isSelected={desk.id === selectedDeskId}
                    scale={currentScale}
                    onClick={() => handleDeskClick(desk.id)}
                    onDragEnd={(pos) => handleDragEnd(desk.id, pos)}
                    onRotationEnd={(rotation) => handleRotationEnd(desk.id, rotation)}
                  />
                );
              })}

              {/* Zone drawing overlay */}
              <ZoneDrawingLayer
                isActive={isDrawingZone && !!drawingTargetZone}
                scale={currentScale}
                targetZone={drawingTargetZone}
                onDrawComplete={handleDrawComplete}
                onCancel={handleDrawCancel}
              />
            </>
          )}
        </FloorPlanCanvas>

        <FloorPlanLegend />
      </div>

      <DeskDetailPanel
        desk={selectedDesk}
        bookings={selectedDeskBookings}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        currentUserId={currentUserId}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onBook={handleBook}
      />
    </TooltipProvider>
  );
}
