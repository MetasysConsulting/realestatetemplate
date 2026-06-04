"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuctionProperty } from "@/lib/generate-auction-properties";

/** Continental US — pan/zoom constrained to this region */
const US_BOUNDS: [[number, number], [number, number]] = [
  [24.396308, -124.848974],
  [49.384358, -66.885444],
];

const US_CENTER: [number, number] = [39.8283, -98.5795];

type AuctionsMapProps = {
  properties: AuctionProperty[];
  mapView: "map" | "satellite";
};

type LeafletModules = {
  MapContainer: typeof import("react-leaflet").MapContainer;
  TileLayer: typeof import("react-leaflet").TileLayer;
  Marker: typeof import("react-leaflet").Marker;
  Popup: typeof import("react-leaflet").Popup;
  useMap: typeof import("react-leaflet").useMap;
  divIcon: typeof import("leaflet").divIcon;
};

export function AuctionsMap({ properties, mapView }: AuctionsMapProps) {
  const [leaflet, setLeaflet] = useState<LeafletModules | null>(null);

  useEffect(() => {
    void import("leaflet/dist/leaflet.css");

    void Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      const primary =
        getComputedStyle(document.documentElement).getPropertyValue("--Primary").trim() ||
        "#7695ff";

      const markerIcon = L.divIcon({
        className: "auctions-leaflet-marker",
        html: `<span style="background:${primary}"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      setLeaflet({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        useMap: rl.useMap,
        divIcon: () => markerIcon,
      });
    });
  }, []);

  const tileUrl = useMemo(
    () =>
      mapView === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    [mapView],
  );

  const tileAttribution =
    mapView === "satellite"
      ? "&copy; Esri"
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  if (!leaflet) {
    return <div className="auctions-map-loading">Loading map…</div>;
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap, divIcon } = leaflet;
  const icon = divIcon();

  function BoundsLock() {
    const map = useMap();
    useEffect(() => {
      map.setMaxBounds(US_BOUNDS);
      map.setMinZoom(4);
      map.options.maxBoundsViscosity = 1;
    }, [map]);
    return null;
  }

  return (
    <MapContainer
      center={US_CENTER}
      zoom={5}
      className="auctions-leaflet-map"
      scrollWheelZoom
      zoomControl
    >
      <BoundsLock />
      <TileLayer attribution={tileAttribution} url={tileUrl} />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
          <Popup>
            <strong>{p.address}</strong>
            <br />
            {p.city}, {p.state}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
