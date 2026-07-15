"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type PropertyMapPinInnerProps = {
  lat: number | null;
  lng: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
};

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RecenterOnPin({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);
  return null;
}

export default function PropertyMapPinInner({
  lat,
  lng,
  onChange,
}: PropertyMapPinInnerProps) {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const center: [number, number] =
    lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div className="reovana-map-pin">
      <p className="reovana-map-pin__hint">Click the map to drop a pin for this property.</p>
      <MapContainer
        center={center}
        zoom={lat != null && lng != null ? 15 : 4}
        className="reovana-map-pin__map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnPin lat={lat} lng={lng} />
        <ClickHandler onPick={(nextLat, nextLng) => onChange({ lat: nextLat, lng: nextLng })} />
        {lat != null && lng != null ? <Marker position={[lat, lng]} /> : null}
      </MapContainer>
      {lat != null && lng != null ? (
        <p className="reovana-map-pin__coords">
          Pin: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : (
        <p className="reovana-map-pin__coords">No pin set yet.</p>
      )}
    </div>
  );
}
