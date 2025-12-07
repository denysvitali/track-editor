import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import type { JsTrackpoint, TrimRange } from '../types/tcx';

interface TrackMapProps {
  trackpoints: JsTrackpoint[];
  trimRange: TrimRange;
}

function MapBoundsUpdater({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, bounds]);

  return null;
}

export function TrackMap({ trackpoints, trimRange }: TrackMapProps) {
  const mapRef = useRef<L.Map>(null);

  const { positions, trimmedPositions, bounds, startPos, endPos } = useMemo(() => {
    const allPositions: LatLngTuple[] = [];
    const trimmed: LatLngTuple[] = [];

    trackpoints.forEach((tp, idx) => {
      if (tp.latitude !== null && tp.longitude !== null) {
        const pos: LatLngTuple = [tp.latitude, tp.longitude];
        allPositions.push(pos);

        if (idx >= trimRange.start && idx <= trimRange.end) {
          trimmed.push(pos);
        }
      }
    });

    const start = trimmed[0] || null;
    const end = trimmed[trimmed.length - 1] || null;

    let bounds: LatLngBoundsExpression | null = null;
    if (allPositions.length >= 2) {
      const lats = allPositions.map((p) => p[0]);
      const lngs = allPositions.map((p) => p[1]);
      bounds = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ];
    }

    return {
      positions: allPositions,
      trimmedPositions: trimmed,
      bounds,
      startPos: start,
      endPos: end,
    };
  }, [trackpoints, trimRange]);

  if (positions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
        <p className="text-slate-500 dark:text-slate-400">No GPS data available</p>
      </div>
    );
  }

  const center = positions[Math.floor(positions.length / 2)] || positions[0];

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={14}
      className="h-full w-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBoundsUpdater bounds={bounds} />

      {/* Full track (grayed out) */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#94a3b8',
          weight: 4,
          opacity: 0.5,
        }}
      />

      {/* Trimmed track (highlighted) */}
      {trimmedPositions.length > 0 && (
        <Polyline
          positions={trimmedPositions}
          pathOptions={{
            color: '#3b82f6',
            weight: 5,
            opacity: 1,
          }}
        />
      )}

      {/* Start marker */}
      {startPos && (
        <CircleMarker
          center={startPos}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#22c55e',
            fillOpacity: 1,
            weight: 3,
          }}
        />
      )}

      {/* End marker */}
      {endPos && (
        <CircleMarker
          center={endPos}
          radius={8}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 3,
          }}
        />
      )}
    </MapContainer>
  );
}
