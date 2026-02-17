import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Upload, Layers, MousePointer } from 'lucide-react';

export function FloorPlanPlaceholder() {
  return (
    <div className="space-y-6">
      {/* SVG Placeholder */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-muted p-6">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Floor Plan Visualization</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Upload your office floor plan image to enable the interactive desk booking view
            with drag-and-drop desk placement.
          </p>

          {/* Mock SVG office layout */}
          <div className="w-full max-w-2xl border-2 border-dashed border-muted rounded-lg p-4">
            <svg
              viewBox="0 0 600 400"
              className="w-full h-auto text-muted-foreground/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* Outer walls */}
              <rect x="10" y="10" width="580" height="380" rx="4" />

              {/* Meeting room 1 */}
              <rect x="20" y="20" width="120" height="100" rx="2" />
              <text x="80" y="75" textAnchor="middle" className="text-xs fill-muted-foreground/40" stroke="none" fontSize="10">
                Meeting Room
              </text>

              {/* Meeting room 2 */}
              <rect x="20" y="130" width="120" height="80" rx="2" />
              <text x="80" y="175" textAnchor="middle" className="text-xs fill-muted-foreground/40" stroke="none" fontSize="10">
                Conference
              </text>

              {/* Open office area */}
              <rect x="160" y="20" width="280" height="190" rx="2" strokeDasharray="6 3" />
              <text x="300" y="120" textAnchor="middle" className="fill-muted-foreground/40" stroke="none" fontSize="12">
                Open Office Area
              </text>

              {/* Desk rows (placeholder) */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3, 4].map((col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={180 + col * 50}
                    y={40 + row * 40}
                    width="30"
                    height="20"
                    rx="2"
                    className="fill-muted/20"
                  />
                ))
              )}

              {/* Kitchen */}
              <rect x="460" y="20" width="120" height="80" rx="2" />
              <text x="520" y="65" textAnchor="middle" className="fill-muted-foreground/40" stroke="none" fontSize="10">
                Kitchen
              </text>

              {/* Lounge */}
              <rect x="460" y="110" width="120" height="100" rx="2" />
              <text x="520" y="165" textAnchor="middle" className="fill-muted-foreground/40" stroke="none" fontSize="10">
                Lounge
              </text>

              {/* Bottom section */}
              <rect x="20" y="230" width="200" height="150" rx="2" strokeDasharray="6 3" />
              <text x="120" y="310" textAnchor="middle" className="fill-muted-foreground/40" stroke="none" fontSize="12">
                Team Zone A
              </text>

              <rect x="240" y="230" width="200" height="150" rx="2" strokeDasharray="6 3" />
              <text x="340" y="310" textAnchor="middle" className="fill-muted-foreground/40" stroke="none" fontSize="12">
                Team Zone B
              </text>

              <rect x="460" y="230" width="120" height="150" rx="2" />
              <text x="520" y="310" textAnchor="middle" className="fill-muted-foreground/40" stroke="none" fontSize="10">
                Server Room
              </text>
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4 text-blue-500" />
              Upload Floor Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Upload an image of your office layout (PNG, SVG, or PDF) to serve as the
              background for desk placement.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MousePointer className="h-4 w-4 text-green-500" />
              Drag &amp; Drop Desks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Place desks on the floor plan with drag-and-drop positioning.
              Rotate and align desks to match your office layout.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-purple-500" />
              Live Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              See real-time desk availability on the map. Click any desk to
              view details or make a booking instantly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
