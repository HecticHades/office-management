'use client';

import React, { useImperativeHandle, useRef, useCallback } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';

export type FloorPlanCanvasRef = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
};

type FloorPlanCanvasProps = {
  children: React.ReactNode;
  isEditMode: boolean;
  onZoomChange?: (scale: number) => void;
  backgroundImageUrl?: string | null;
};

function ZoomControls({
  controlsRef,
}: {
  controlsRef: React.RefObject<FloorPlanCanvasRef | null>;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  useImperativeHandle(controlsRef, () => ({
    zoomIn: () => zoomIn(),
    zoomOut: () => zoomOut(),
    resetTransform: () => resetTransform(),
  }));

  return null;
}

const FloorPlanCanvas = React.forwardRef<FloorPlanCanvasRef, FloorPlanCanvasProps>(
  function FloorPlanCanvas({ children, isEditMode, onZoomChange, backgroundImageUrl }, ref) {
    const controlsRef = useRef<FloorPlanCanvasRef | null>(null);
    const wrapperRef = useRef<ReactZoomPanPinchRef | null>(null);

    useImperativeHandle(ref, () => ({
      zoomIn: () => controlsRef.current?.zoomIn(),
      zoomOut: () => controlsRef.current?.zoomOut(),
      resetTransform: () => controlsRef.current?.resetTransform(),
    }));

    const handleTransformed = useCallback(
      (_ref: ReactZoomPanPinchRef, state: { scale: number }) => {
        onZoomChange?.(state.scale);
      },
      [onZoomChange],
    );

    return (
      <div
        className="relative overflow-hidden rounded-xl border border-stone-200 bg-white"
        style={{ height: 'calc(100vh - 220px)' }}
      >
        <TransformWrapper
          ref={wrapperRef}
          initialScale={0.8}
          minScale={0.3}
          maxScale={3}
          panning={{ disabled: isEditMode }}
          smooth
          onTransformed={handleTransformed}
        >
          <ZoomControls controlsRef={controlsRef} />
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '1200px', height: '800px' }}
          >
            <div
              className={cn(
                'relative',
                'h-[800px] w-[1200px]',
                !backgroundImageUrl && 'bg-blueprint',
              )}
            >
              {/* Workspace image */}
              {backgroundImageUrl && (
                <img
                  src={backgroundImageUrl}
                  alt="Workspace layout"
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                  draggable={false}
                />
              )}
              {children}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    );
  },
);

export { FloorPlanCanvas };
