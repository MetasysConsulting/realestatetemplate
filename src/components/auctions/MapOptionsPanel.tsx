"use client";

import { useMemo, useState } from "react";
import {
  MAP_LAYER_GROUPS,
  type MapLayerKey,
  type MapLayerOption,
} from "@/lib/map-layers";

type MapOptionsPanelProps = {
  selectedLayer: MapLayerKey | null;
  onSelectLayer: (key: MapLayerKey | null) => void;
  open: boolean;
};

export function MapOptionsPanel({
  selectedLayer,
  onSelectLayer,
  open,
}: MapOptionsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    value: true,
    home: true,
    market: true,
  });

  const activeOption: MapLayerOption | null = selectedLayer
    ? MAP_LAYER_GROUPS.flatMap((g) => g.options).find((o) => o.key === selectedLayer) ?? null
    : null;

  const toggleGroup = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!open) return null;

  return (
    <aside className="map-options-panel">
      <div className="map-options-panel__tabs">
        <button type="button" className="is-active">
          Map Options
        </button>
        <button type="button" className="is-disabled" disabled>
          Value Comparisons
        </button>
        <button type="button" className="is-disabled" disabled>
          Neighborhood
        </button>
      </div>

      <div className="map-options-panel__body">
        {MAP_LAYER_GROUPS.map((group) => (
          <div key={group.id} className="map-options-group">
            <button
              type="button"
              className="map-options-group__head"
              onClick={() => toggleGroup(group.id)}
            >
              <span className="map-options-group__icon">{group.icon}</span>
              <span>{group.title}</span>
              <span className="map-options-group__chevron">
                {expanded[group.id] ? "▾" : "▸"}
              </span>
            </button>
            {expanded[group.id] ? (
              <div className="map-options-group__options">
                {group.options.map((option) => (
                  <label key={option.key} className="map-options-radio">
                    <input
                      type="radio"
                      name="map-layer"
                      checked={selectedLayer === option.key}
                      onChange={() => onSelectLayer(option.key)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {activeOption ? (
        <p className="map-options-panel__desc">{activeOption.description}</p>
      ) : (
        <p className="map-options-panel__desc map-options-panel__desc--muted">
          Select a layer to color-code listings on the map. Mock data for demo preview.
        </p>
      )}

      <button
        type="button"
        className="map-options-panel__reset"
        onClick={() => onSelectLayer(null)}
      >
        Reset
      </button>
    </aside>
  );
}

export function MapLayerLegend({
  layerKey,
  values,
  onClose,
}: {
  layerKey: MapLayerKey;
  values: number[];
  onClose: () => void;
}) {
  const option = useMemo(
    () => MAP_LAYER_GROUPS.flatMap((g) => g.options).find((o) => o.key === layerKey),
    [layerKey],
  );

  const histogram = useMemo(() => {
    const binCount = 14;
    const bins = Array.from({ length: binCount }, () => 0);
    values.forEach((v) => {
      const idx = Math.min(binCount - 1, Math.floor(v * binCount));
      bins[idx] += 1;
    });
    const max = Math.max(...bins, 1);
    return bins.map((b) => b / max);
  }, [values]);

  if (!option) return null;

  return (
    <div className="map-layer-legend">
      <button type="button" className="map-layer-legend__close" onClick={onClose} aria-label="Close layer">
        ×
      </button>
      <p className="map-layer-legend__title">{option.label}</p>
      <div className="map-layer-legend__histogram">
        {histogram.map((h, i) => (
          <span
            key={i}
            className="map-layer-legend__bar"
            style={{ height: `${Math.max(12, h * 100)}%` }}
          />
        ))}
      </div>
      <div className="map-layer-legend__scale">
        <span>{option.scaleMin}</span>
        <div className="map-layer-legend__gradient" />
        <span>{option.scaleMax}</span>
      </div>
    </div>
  );
}
