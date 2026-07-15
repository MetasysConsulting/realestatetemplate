"use client";

type AuctionsMapToolbarProps = {
  mapView: "map" | "satellite";
  onMapViewChange: (view: "map" | "satellite") => void;
  layersOpen: boolean;
  onLayersOpenChange: (open: boolean) => void;
  /** Search-page only: refetch listings as the map moves. */
  searchAsIMove?: boolean;
  onSearchAsIMoveChange?: (enabled: boolean) => void;
};

export function AuctionsMapToolbar({
  mapView,
  onMapViewChange,
  layersOpen,
  onLayersOpenChange,
  searchAsIMove,
  onSearchAsIMoveChange,
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

      {typeof searchAsIMove === "boolean" && onSearchAsIMoveChange ? (
        <label className="search-map-move-toggle">
          <input
            type="checkbox"
            checked={searchAsIMove}
            onChange={(event) => onSearchAsIMoveChange(event.target.checked)}
          />
          <span>Search as I move</span>
        </label>
      ) : null}
    </div>
  );
}
