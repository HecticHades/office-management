'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

type ZoneDrawingLayerProps = {
  isActive: boolean;
  scale: number;
  targetZone: {
    id: string;
    name: string;
    color: string;
  } | null;
  onDrawComplete: (zoneId: string, boundaryPath: string) => void;
  onCancel: () => void;
};

type DrawingState = {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

function clientToSvg(
  e: React.PointerEvent,
  svgEl: SVGSVGElement,
): { x: number; y: number } {
  const rect = svgEl.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  return { x, y };
}

function toPath(x1: number, y1: number, x2: number, y2: number): string {
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  return `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`;
}

export function ZoneDrawingLayer({
  isActive,
  scale,
  targetZone,
  onDrawComplete,
  onCancel,
}: ZoneDrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [flash, setFlash] = useState<{
    path: string;
    color: string;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const { x, y } = clientToSvg(e, svgRef.current);
      setDrawing({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!drawing.isDrawing || !svgRef.current) return;
      const { x, y } = clientToSvg(e, svgRef.current);
      setDrawing((prev) => ({ ...prev, currentX: x, currentY: y }));
    },
    [drawing.isDrawing],
  );

  const handlePointerUp = useCallback(() => {
    if (!drawing.isDrawing || !targetZone) return;

    const path = toPath(
      drawing.startX,
      drawing.startY,
      drawing.currentX,
      drawing.currentY,
    );

    setDrawing({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });

    setFlash({ path, color: targetZone.color });

    const zoneId = targetZone.id;
    setTimeout(() => {
      setFlash(null);
      onDrawComplete(zoneId, path);
    }, 350);
  }, [drawing, targetZone, onDrawComplete]);

  if (!isActive || !targetZone) return null;

  const previewRect =
    drawing.isDrawing
      ? {
          x: Math.min(drawing.startX, drawing.currentX),
          y: Math.min(drawing.startY, drawing.currentY),
          width: Math.abs(drawing.currentX - drawing.startX),
          height: Math.abs(drawing.currentY - drawing.startY),
        }
      : null;

  return (
    <div className="absolute inset-0 z-40" style={{ cursor: 'crosshair' }}>
      {/* Instruction banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-white/95 backdrop-blur px-4 py-2.5 shadow-lg border border-stone-200">
        <span
          className="inline-block size-3 rounded-full"
          style={{ backgroundColor: targetZone.color }}
        />
        <span className="text-sm font-medium text-stone-700">
          Draw boundary for <strong>{targetZone.name}</strong>
        </span>
        <button
          onClick={onCancel}
          className="text-xs text-stone-400 hover:text-stone-600 ml-2"
        >
          Cancel
        </button>
      </div>

      {/* SVG drawing surface */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: 'all' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Semi-transparent overlay */}
        <rect
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="black"
          fillOpacity={0.05}
        />

        {/* Live preview rectangle */}
        {previewRect && (
          <rect
            x={previewRect.x}
            y={previewRect.y}
            width={previewRect.width}
            height={previewRect.height}
            fill={targetZone.color}
            fillOpacity={0.15}
            stroke={targetZone.color}
            strokeWidth={2}
            strokeDasharray="6 3"
          />
        )}

        {/* Flash animation after drawing */}
        {flash && (
          <path
            d={flash.path}
            fill={flash.color}
            fillOpacity={0.25}
            stroke={flash.color}
            strokeWidth={2}
          >
            <animate
              attributeName="fill-opacity"
              values="0.25;0.05;0.25"
              dur="0.35s"
              repeatCount="1"
            />
          </path>
        )}
      </svg>
    </div>
  );
}
