"use client";

type AuctionsMapToolbarProps = {
  mapView: "map" | "satellite";
  onMapViewChange: (view: "map" | "satellite") => void;
  layersOpen: boolean;
  onLayersOpenChange: (open: boolean) => void;
};

export function AuctionsMapToolbar({
  mapView,
  onMapViewChange,
  layersOpen,
  onLayersOpenChange,
}: AuctionsMapToolbarProps) {
  return (
    <div className="auctions-map-toolbar">
      <div className="auctions-map-toggle">
        <button
          type="button"
          className={mapView === "map" ? "is-active" : ""}
          onClick={() => {
            onMapViewChange("map");
            onLayersOpenChange(false);
          }}
        >
          Map
        </button>
        <button
          type="button"
          className={mapView === "satellite" ? "is-active" : ""}
          onClick={() => {
            onMapViewChange("satellite");
            onLayersOpenChange(false);
          }}
        >
          Satellite
        </button>
        <button
          type="button"
          className={layersOpen ? "is-active" : ""}
          onClick={() => onLayersOpenChange(!layersOpen)}
        >
          Map Options
        </button>
      </div>
    </div>
  );
}
