'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

type ZoneOverlayProps = {
  zone: {
    id: string;
    name: string;
    color: string;
    boundary_path: string | null;
  };
  isHighlighted: boolean;
  isEditMode?: boolean;
  onEditClick?: () => void;
  onClearBoundary?: () => void;
};

/**
 * Extracts the center and top-left of the bounding box from an SVG path.
 */
function parseBounds(path: string): {
  labelX: number;
  labelY: number;
  centerX: number;
  centerY: number;
} {
  const numbers: number[] = [];
  const regex = /[\d.]+/g;
  let m;
  while ((m = regex.exec(path)) !== null) {
    numbers.push(parseFloat(m[0]));
  }

  if (numbers.length < 4) {
    return { labelX: 0, labelY: 0, centerX: 0, centerY: 0 };
  }

  const xs = numbers.filter((_, i) => i % 2 === 0);
  const ys = numbers.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    labelX: minX + 12,
    labelY: minY + 18,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export function ZoneOverlay({
  zone,
  isHighlighted,
  isEditMode = false,
  onEditClick,
  onClearBoundary,
}: ZoneOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!zone.boundary_path) return null;

  const bounds = parseBounds(zone.boundary_path);
  const showActions = isEditMode && isHovered;

  return (
    <g
      data-zone-id={zone.id}
      onPointerEnter={() => isEditMode && setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <path
        d={zone.boundary_path}
        fill={zone.color}
        fillOpacity={isHighlighted ? 0.2 : isHovered ? 0.18 : 0.1}
        stroke={zone.color}
        strokeOpacity={isHighlighted ? 0.6 : isHovered ? 0.5 : 0.4}
        strokeWidth={isHighlighted ? 3 : isHovered ? 2.5 : 2}
        strokeDasharray="6 3"
        style={{
          transition: 'fill-opacity 0.25s ease, stroke-opacity 0.25s ease, stroke-width 0.25s ease',
          pointerEvents: isEditMode ? 'all' : 'none',
          cursor: isEditMode ? 'pointer' : 'default',
        }}
      />
      <text
        x={bounds.labelX}
        y={bounds.labelY}
        fontSize={11}
        fill={zone.color}
        fontWeight={500}
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {zone.name}
      </text>

      {/* Edit actions — shown on hover in edit mode */}
      {showActions && (
        <foreignObject
          x={bounds.centerX - 52}
          y={bounds.centerY - 16}
          width={104}
          height={32}
          style={{ pointerEvents: 'all' }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #d6d3d1',
                backgroundColor: 'white',
                fontSize: '11px',
                fontWeight: 500,
                color: '#44403c',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                lineHeight: '1',
              }}
            >
              <Pencil style={{ width: 12, height: 12 }} />
              Redraw
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearBoundary?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                backgroundColor: '#fff1f2',
                fontSize: '11px',
                fontWeight: 500,
                color: '#dc2626',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                lineHeight: '1',
              }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              Clear
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
