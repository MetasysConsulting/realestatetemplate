import type { AuctionProperty } from "@/lib/generate-auction-properties";

export type MapLayerCategory =
  | "value"
  | "home"
  | "environment"
  | "market"
  | "transportation";

export type MapLayerKey =
  | "value-estimate"
  | "value-estimate-sqft"
  | "home-lot-size"
  | "home-lot-slope"
  | "home-size"
  | "home-year-built"
  | "env-flood"
  | "env-wildfire"
  | "env-heat"
  | "env-wind"
  | "env-air"
  | "env-noise"
  | "market-hotness"
  | "market-sold-vs-list"
  | "market-sold-sqft"
  | "market-dom"
  | "transit-public"
  | "transit-bike";

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
    id: "environment",
    title: "Environment",
    icon: "🌿",
    options: [
      {
        key: "env-flood",
        label: "Flood",
        description: "Mock flood risk exposure for the parcel.",
        scaleMin: "Low risk",
        scaleMax: "High risk",
      },
      {
        key: "env-wildfire",
        label: "Wildfire",
        description: "Mock wildfire hazard index.",
        scaleMin: "Low",
        scaleMax: "High",
      },
      {
        key: "env-heat",
        label: "Heat",
        description: "Mock extreme heat exposure.",
        scaleMin: "Cooler",
        scaleMax: "Hotter",
      },
      {
        key: "env-wind",
        label: "Wind",
        description: "Mock wind/storm exposure.",
        scaleMin: "Sheltered",
        scaleMax: "Exposed",
      },
      {
        key: "env-air",
        label: "Air",
        description: "Mock air quality score.",
        scaleMin: "Poor",
        scaleMax: "Good",
      },
      {
        key: "env-noise",
        label: "Noise",
        description: "Mock noise pollution level.",
        scaleMin: "Quiet",
        scaleMax: "Loud",
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
  {
    id: "transportation",
    title: "Transportation",
    icon: "🚌",
    options: [
      {
        key: "transit-public",
        label: "Public transit",
        description: "Mock access to bus, rail, and transit stops.",
        scaleMin: "Limited",
        scaleMax: "Excellent",
      },
      {
        key: "transit-bike",
        label: "Bike lanes",
        description: "Mock bike lane and trail connectivity.",
        scaleMin: "Few lanes",
        scaleMax: "Bike-friendly",
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
