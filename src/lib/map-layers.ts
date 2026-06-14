import type { AuctionProperty } from "@/lib/generate-auction-properties";

export type MapLayerCategory = "value" | "home" | "market";

export type MapLayerKey =
  | "value-estimate"
  | "value-estimate-sqft"
  | "home-lot-size"
  | "home-lot-slope"
  | "home-size"
  | "home-year-built"
  | "market-hotness"
  | "market-sold-vs-list"
  | "market-sold-sqft"
  | "market-dom";

export type MapLayerOption = {
  key: MapLayerKey;
  label: string;
  description: string;
  scaleMin: string;
  scaleMax: string;
};

export type MapLayerGroup = {
  id: MapLayerCategory;
  title: string;
  icon: string;
  options: MapLayerOption[];
};

export const MAP_LAYER_GROUPS: MapLayerGroup[] = [
  {
    id: "value",
    title: "Value",
    icon: "$",
    options: [
      {
        key: "value-estimate",
        label: "Estimate",
        description: "Mock estimated total market value for each listing.",
        scaleMin: "<$180K",
        scaleMax: "$850K+",
      },
      {
        key: "value-estimate-sqft",
        label: "Estimate / sqft",
        description:
          "The home's current estimated total value divided by its total square footage.",
        scaleMin: "<$680 / sqft",
        scaleMax: "$2.9K / sqft+",
      },
    ],
  },
  {
    id: "home",
    title: "Home",
    icon: "⌂",
    options: [
      {
        key: "home-lot-size",
        label: "Lot size",
        description: "Mock lot acreage for surrounding parcels.",
        scaleMin: "<0.12 ac",
        scaleMax: "1.2 ac+",
      },
      {
        key: "home-lot-slope",
        label: "Lot slope",
        description: "Mock terrain slope — flatter lots vs steeper lots.",
        scaleMin: "Flat",
        scaleMax: "Steep",
      },
      {
        key: "home-size",
        label: "Home size",
        description: "Interior living area in square feet.",
        scaleMin: "<900 sqft",
        scaleMax: "3.5K sqft+",
      },
      {
        key: "home-year-built",
        label: "Year built",
        description: "Mock construction year for each home.",
        scaleMin: "Pre-1960",
        scaleMax: "2020+",
      },
    ],
  },
  {
    id: "market",
    title: "Market",
    icon: "📈",
    options: [
      {
        key: "market-hotness",
        label: "Market Hotness",
        description: "Mock buyer demand intensity in the area.",
        scaleMin: "Cool",
        scaleMax: "Hot",
      },
      {
        key: "market-sold-vs-list",
        label: "Sold price vs. list price*",
        description: "Mock sale-to-list ratio for nearby comps.",
        scaleMin: "Below list",
        scaleMax: "Above list",
      },
      {
        key: "market-sold-sqft",
        label: "Sold price / sqft*",
        description: "Mock recent sold price per square foot.",
        scaleMin: "<$120 / sqft",
        scaleMax: "$420 / sqft+",
      },
      {
        key: "market-dom",
        label: "Days on market*",
        description: "Mock average days on market.",
        scaleMin: "Fast (<14d)",
        scaleMax: "Slow (90d+)",
      },
    ],
  },
];

export const MAP_LAYER_BY_KEY = Object.fromEntries(
  MAP_LAYER_GROUPS.flatMap((g) => g.options.map((o) => [o.key, o])),
) as Record<MapLayerKey, MapLayerOption>;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function rand() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normalized 0–1 mock layer value per property (stable for demo). */
export function getMockLayerValue(property: AuctionProperty, layerKey: MapLayerKey): number {
  const rng = mulberry32(hashString(`${property.id}:${layerKey}`));
  const base = rng();

  if (layerKey === "value-estimate" && property.openingBid > 0) {
    const min = 120_000;
    const max = 900_000;
    const normalized = (property.openingBid - min) / (max - min);
    return Math.min(1, Math.max(0, normalized * 0.75 + base * 0.25));
  }

  if (layerKey === "value-estimate-sqft" && property.sqft > 0 && property.openingBid > 0) {
    const perSqft = property.openingBid / property.sqft;
    const min = 80;
    const max = 520;
    const normalized = (perSqft - min) / (max - min);
    return Math.min(1, Math.max(0, normalized * 0.8 + base * 0.2));
  }

  if (layerKey === "home-size" && property.sqft > 0) {
    const min = 700;
    const max = 3800;
    return Math.min(1, Math.max(0, (property.sqft - min) / (max - min)));
  }

  if (layerKey === "home-lot-size" && property.lotAcres) {
    return Math.min(1, Math.max(0, property.lotAcres / 1.2));
  }

  return base;
}

/** Purple (low) → blue → green (high), similar to Realtor.com layers */
export function layerValueToColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const stops = [
    { at: 0, color: [76, 29, 149] },
    { at: 0.35, color: [109, 40, 217] },
    { at: 0.55, color: [37, 99, 235] },
    { at: 0.75, color: [13, 148, 136] },
    { at: 1, color: [22, 163, 74] },
  ];

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].at && clamped <= stops[i + 1].at) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const span = upper.at - lower.at || 1;
  const mix = (clamped - lower.at) / span;
  const r = Math.round(lower.color[0] + (upper.color[0] - lower.color[0]) * mix);
  const g = Math.round(lower.color[1] + (upper.color[1] - lower.color[1]) * mix);
  const b = Math.round(lower.color[2] + (upper.color[2] - lower.color[2]) * mix);
  return `rgb(${r}, ${g}, ${b})`;
}

export function getLayerValues(
  properties: AuctionProperty[],
  layerKey: MapLayerKey,
): number[] {
  return properties.map((p) => getMockLayerValue(p, layerKey));
}

export function buildHistogramBins(values: number[], binCount = 12): number[] {
  const bins = Array.from({ length: binCount }, () => 0);
  values.forEach((v) => {
    const idx = Math.min(binCount - 1, Math.floor(v * binCount));
    bins[idx] += 1;
  });
  const max = Math.max(...bins, 1);
  return bins.map((b) => b / max);
}

export type LayerGridCell = {
  south: number;
  west: number;
  north: number;
  east: number;
  value: number;
  color: string;
};

/** Regional mock value for map grid cells (stable per lat/lng). */
export function getMockGridLayerValue(
  lat: number,
  lng: number,
  layerKey: MapLayerKey,
): number {
  const rng = mulberry32(hashString(`grid:${lat.toFixed(3)},${lng.toFixed(3)}:${layerKey}`));
  let v = rng();

  // Light geographic bias so regions look different on the map
  const coastal = Math.abs(lng + 82) < 12 || Math.abs(lng + 118) < 8;

  if (layerKey.startsWith("value-")) v = Math.min(1, v * 0.5 + (coastal ? 0.25 : 0) + (lat > 40 ? 0.15 : 0));
  if (layerKey.startsWith("market-")) v = Math.min(1, v * 0.55 + (coastal ? 0.3 : 0.05));

  return Math.min(1, Math.max(0, v));
}

/** Colored regional grid covering listing areas (mock choropleth). */
export function buildLayerGrid(
  properties: AuctionProperty[],
  layerKey: MapLayerKey,
  maxCells = 160,
): LayerGridCell[] {
  if (properties.length === 0) return [];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  properties.forEach((p) => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  });

  const latPad = Math.max((maxLat - minLat) * 0.15, 0.35);
  const lngPad = Math.max((maxLng - minLng) * 0.15, 0.35);
  minLat -= latPad;
  maxLat += latPad;
  minLng -= lngPad;
  maxLng += lngPad;

  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const aspect = lngSpan / latSpan;
  const rows = Math.max(4, Math.round(Math.sqrt(maxCells / aspect)));
  const cols = Math.max(4, Math.round(maxCells / rows));
  const latStep = latSpan / rows;
  const lngStep = lngSpan / cols;

  const cells: LayerGridCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const south = minLat + r * latStep;
      const north = south + latStep;
      const west = minLng + c * lngStep;
      const east = west + lngStep;
      const centerLat = (south + north) / 2;
      const centerLng = (west + east) / 2;

      const inCell = properties.filter(
        (p) => p.lat >= south && p.lat <= north && p.lng >= west && p.lng <= east,
      );

      let value = getMockGridLayerValue(centerLat, centerLng, layerKey);
      if (inCell.length > 0) {
        const propAvg =
          inCell.reduce((sum, p) => sum + getMockLayerValue(p, layerKey), 0) / inCell.length;
        value = value * 0.35 + propAvg * 0.65;
      }

      // Skip empty ocean cells far from any listing
      const hasNearby = properties.some(
        (p) => Math.abs(p.lat - centerLat) < latStep * 1.2 && Math.abs(p.lng - centerLng) < lngStep * 1.2,
      );
      if (!hasNearby) continue;

      cells.push({
        south,
        west,
        north,
        east,
        value,
        color: layerValueToColor(value),
      });
    }
  }

  return cells;
}

export function getPropertyBounds(properties: AuctionProperty[]): [number, number][] {
  return properties.map((p) => [p.lat, p.lng] as [number, number]);
}
