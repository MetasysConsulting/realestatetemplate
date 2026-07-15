"use client";

import dynamic from "next/dynamic";

const PropertyMapPinInner = dynamic(() => import("./PropertyMapPinInner"), {
  ssr: false,
  loading: () => <div className="reovana-map-pin reovana-map-pin--loading">Loading map…</div>,
});

type PropertyMapPinPickerProps = {
  lat: number | null;
  lng: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
};

export function PropertyMapPinPicker(props: PropertyMapPinPickerProps) {
  return <PropertyMapPinInner {...props} />;
}

export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetch(`/api/seller/geocode?q=${encodeURIComponent(q)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: number | null; lng?: number | null };
    if (data.lat == null || data.lng == null) return null;
    if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return null;
    return { lat: data.lat, lng: data.lng };
  } catch {
    return null;
  }
}
