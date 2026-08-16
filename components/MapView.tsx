'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customMarkerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface Activity {
  id: string;
  timeSlot: string;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  estimatedCostINR: number;
  category: string;
  imageUrl?: string;
}

function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

export default function MapView({ activities = [] }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="h-full w-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm min-h-[400px] border border-slate-200">
        No map coordinates available for this day.
      </div>
    );
  }

  const validActivities = activities.filter(
    (act) => typeof act.lat === 'number' && typeof act.lng === 'number'
  );

  if (validActivities.length === 0) {
    return (
      <div className="h-full w-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm min-h-[400px] border border-slate-200">
        No valid coordinates to display.
      </div>
    );
  }

  const bounds: L.LatLngBoundsExpression = validActivities.map((act) => [
    act.lat,
    act.lng,
  ]);

  const center: [number, number] = [
    validActivities[0].lat,
    validActivities[0].lng,
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl border border-slate-200 shadow-sm"
      style={{ height: '100%', minHeight: '450px', width: '100%' }}
    >
      <ChangeView bounds={bounds} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validActivities.map((act, index) => (
        <Marker key={act.id || index} position={[act.lat, act.lng]} icon={customMarkerIcon}>
          <Popup>
            <div className="p-1 font-sans">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">
                {act.timeSlot}
              </span>
              <strong className="text-sm font-bold text-slate-800 block">{act.title}</strong>
              <span className="text-xs text-slate-500 block mt-0.5">
                📍 {act.locationName}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}