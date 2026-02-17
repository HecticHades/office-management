'use client';

type ZoneOverlayProps = {
  zone: {
    id: string;
    name: string;
    color: string;
    boundary_path: string | null;
  };
  isHighlighted: boolean;
};

/**
 * Extracts an approximate label position from the first M command in an SVG path string.
 * Falls back to (0, 0) if parsing fails.
 */
function parseLabelPosition(path: string): { x: number; y: number } {
  const match = path.match(/M\s*([\d.]+)[,\s]+([\d.]+)/i);
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }
  return { x: 0, y: 0 };
}

export function ZoneOverlay({ zone, isHighlighted }: ZoneOverlayProps) {
  if (!zone.boundary_path) return null;

  const labelPos = parseLabelPosition(zone.boundary_path);

  return (
    <g data-zone-id={zone.id}>
      <path
        d={zone.boundary_path}
        fill={zone.color}
        fillOpacity={isHighlighted ? 0.2 : 0.1}
        stroke={zone.color}
        strokeOpacity={isHighlighted ? 0.6 : 0.4}
        strokeWidth={isHighlighted ? 3 : 2}
        strokeDasharray="6 3"
        style={{ transition: 'fill-opacity 0.25s ease, stroke-opacity 0.25s ease, stroke-width 0.25s ease' }}
      />
      <text
        x={labelPos.x + 12}
        y={labelPos.y + 18}
        fontSize={11}
        fill={zone.color}
        fontWeight={500}
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {zone.name}
      </text>
    </g>
  );
}
