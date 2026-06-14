"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuctionProperty } from "@/lib/generate-auction-properties";
import { MapPropertyPopup } from "@/components/auctions/MapPropertyPopup";
import { MapLayerLegend, MapOptionsPanel } from "@/components/auctions/MapOptionsPanel";
import {
  getLayerValues,
  getMockLayerValue,
  layerValueToColor,
  type MapLayerKey,
} from "@/lib/map-layers";

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
  Circle: typeof import("react-leaflet").Circle;
  Popup: typeof import("react-leaflet").Popup;
  useMap: typeof import("react-leaflet").useMap;
  divIcon: typeof import("leaflet").divIcon;
};

function createMarkerIcon(
  divIcon: LeafletModules["divIcon"],
  color: string,
  active: boolean,
  layered: boolean,
) {
  const ring = active ? "box-shadow:0 0 0 3px #fff,0 0 0 5px rgba(22,30,45,0.25);" : "";
  const size = layered ? 12 : 14;
  return divIcon({
    className: `auctions-leaflet-marker${active ? " is-active" : ""}${layered ? " is-layered" : ""}`,
    html: `<span style="background:${color};width:${size}px;height:${size}px;${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function AuctionsMap({ properties, mapView }: AuctionsMapProps) {
  const [leaflet, setLeaflet] = useState<LeafletModules | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [markerColor, setMarkerColor] = useState("#7695ff");
  const [selectedLayer, setSelectedLayer] = useState<MapLayerKey | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    void import("leaflet/dist/leaflet.css");

    void Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      const primary =
        getComputedStyle(document.documentElement).getPropertyValue("--Primary").trim() ||
        "#7695ff";
      setMarkerColor(primary);

      setLeaflet({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Circle: rl.Circle,
        Popup: rl.Popup,
        useMap: rl.useMap,
        divIcon: L.divIcon,
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

  const layerValues = useMemo(
    () => (selectedLayer ? getLayerValues(properties, selectedLayer) : []),
    [properties, selectedLayer],
  );

  const propertyStyles = useMemo(() => {
    const styles = new Map<string, { color: string; value: number }>();
    if (!selectedLayer) return styles;

    properties.forEach((p) => {
      const value = getMockLayerValue(p, selectedLayer);
      styles.set(p.id, { color: layerValueToColor(value), value });
    });
    return styles;
  }, [properties, selectedLayer]);

  const defaultIcons = useMemo(() => {
    if (!leaflet) return null;
    return {
      default: createMarkerIcon(leaflet.divIcon, markerColor, false, false),
      active: createMarkerIcon(leaflet.divIcon, markerColor, true, false),
    };
  }, [leaflet, markerColor]);

  if (!leaflet || !defaultIcons) {
    return <div className="auctions-map-loading">Loading map…</div>;
  }

  const { MapContainer, TileLayer, Marker, Circle, Popup, useMap } = leaflet;

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
    <div className="auctions-map-root">
      <MapOptionsPanel
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
        open={panelOpen}
        onToggleOpen={() => setPanelOpen((v) => !v)}
      />

      {selectedLayer ? (
        <MapLayerLegend
          layerKey={selectedLayer}
          values={layerValues}
          onClose={() => setSelectedLayer(null)}
        />
      ) : null}

      <MapContainer
        center={US_CENTER}
        zoom={5}
        className="auctions-leaflet-map"
        scrollWheelZoom
        zoomControl
      >
        <BoundsLock />
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        {selectedLayer
          ? properties.map((p) => {
              const style = propertyStyles.get(p.id);
              if (!style) return null;
              return (
                <Circle
                  key={`layer-${p.id}`}
                  center={[p.lat, p.lng]}
                  radius={18000}
                  pathOptions={{
                    fillColor: style.color,
                    fillOpacity: 0.42,
                    color: style.color,
                    weight: 1,
                    opacity: 0.55,
                  }}
                />
              );
            })
          : null}

        {properties.map((p) => {
          const layered = Boolean(selectedLayer);
          const layerColor = propertyStyles.get(p.id)?.color ?? markerColor;
          const icon = layered
            ? createMarkerIcon(
                leaflet.divIcon,
                layerColor,
                activeId === p.id,
                true,
              )
            : activeId === p.id
              ? defaultIcons.active
              : defaultIcons.default;

          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={icon}
              eventHandlers={{
                click: () => setActiveId(p.id),
                popupclose: () => setActiveId((id) => (id === p.id ? null : id)),
              }}
            >
              <Popup
                className="map-property-popup-container"
                closeButton={false}
                offset={[0, -12]}
                minWidth={248}
                maxWidth={268}
              >
                <MapPropertyPopup property={p} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
