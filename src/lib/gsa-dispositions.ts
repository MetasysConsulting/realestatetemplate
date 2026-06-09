import gsaData from "@/data/gsa-dispositions.json";
import { DEFAULT_AUCTION_PROPERTY_IMAGE } from "@/lib/auction-property-images";

export type GsaDispositionStatus = "Available" | "UNDER CONTRACT" | "SOLD";

export type GsaDispositionListing = {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  rentableSqFt: number;
  dateListed: string;
  status: GsaDispositionStatus;
  sourceUrl: string;
  sourceAgency: string;
  imageUrl: string | null;
  imageNote?: string;
  lat: number;
  lng: number;
  displayImageUrl: string;
};

export type GsaDispositionsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: GsaDispositionListing[];
};

const US_STATE_COORDS: Record<string, [number, number]> = {
  AL: [32.806671, -86.79113],
  AK: [61.370716, -152.404419],
  AZ: [33.729759, -111.431221],
  AR: [34.969704, -92.373123],
  CA: [36.116203, -119.681564],
  CO: [39.059811, -105.311104],
  CT: [41.597782, -72.755371],
  DC: [38.907192, -77.036871],
  DE: [39.318523, -75.507141],
  FL: [27.766279, -81.686783],
  GA: [33.040619, -83.643074],
  HI: [21.094318, -157.498337],
  IA: [42.011539, -93.210526],
  ID: [44.240459, -114.478828],
  IL: [40.349457, -88.986137],
  IN: [39.849426, -86.258278],
  KS: [38.5266, -96.726486],
  KY: [37.66814, -84.670067],
  LA: [31.169546, -91.867805],
  MA: [42.230171, -71.530106],
  MD: [39.063946, -76.802101],
  ME: [44.693947, -69.381927],
  MI: [43.326618, -84.536095],
  MN: [45.694454, -93.900192],
  MO: [38.456085, -92.288368],
  MS: [32.741646, -89.678696],
  MT: [46.921925, -110.454353],
  NC: [35.630066, -79.806419],
  ND: [47.528912, -99.784012],
  NE: [41.12537, -98.268082],
  NH: [43.452492, -71.563896],
  NJ: [40.298904, -74.521011],
  NM: [34.840515, -106.248482],
  NV: [38.313515, -117.055374],
  NY: [42.165726, -74.948051],
  OH: [40.388783, -82.764915],
  OK: [35.565342, -96.928917],
  OR: [44.572021, -122.070938],
  PA: [40.590752, -77.209755],
  RI: [41.680893, -71.51178],
  SC: [33.856892, -80.945007],
  SD: [44.299782, -99.438828],
  TN: [35.747845, -86.692345],
  TX: [31.054487, -97.563461],
  UT: [40.150032, -111.862434],
  VA: [37.769337, -78.169968],
  VT: [44.045876, -72.710686],
  WA: [47.400902, -121.490494],
  WI: [44.268543, -89.616508],
  WV: [38.491226, -80.954453],
  WY: [42.755966, -107.30249],
};

const COMMERCIAL_FALLBACK = "/images/auction-properties/29-commercial-office-glass.jpg";

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function coordsForListing(id: string, state: string, index: number): [number, number] {
  const base = US_STATE_COORDS[state] ?? [39.8283, -98.5795];
  const spread = hashString(id) % 40;
  const angle = (spread / 40) * Math.PI * 2;
  const radius = 0.15 + (index % 7) * 0.04;
  return [base[0] + Math.sin(angle) * radius, base[1] + Math.cos(angle) * radius];
}

function normalizeStatus(status: string): GsaDispositionStatus {
  if (status === "UNDER CONTRACT" || status === "SOLD") return status;
  return "Available";
}

function enrichListing(
  raw: (typeof gsaData.listings)[number],
  index: number,
): GsaDispositionListing {
  const [lat, lng] = coordsForListing(raw.id, raw.state, index);
  const displayImageUrl =
    raw.imageUrl ?? (raw.propertyType.toLowerCase().includes("office") ? COMMERCIAL_FALLBACK : DEFAULT_AUCTION_PROPERTY_IMAGE);

  return {
    ...raw,
    status: normalizeStatus(raw.status),
    lat,
    lng,
    displayImageUrl,
  };
}

export function loadGsaDispositions(): GsaDispositionsDataset {
  const listings = gsaData.listings.map(enrichListing);

  return {
    scrapedAt: gsaData.scrapedAt,
    sourceUrl: gsaData.sourceUrl,
    count: gsaData.count,
    listings,
  };
}

export function getGsaFilterOptions(listings: GsaDispositionListing[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  const propertyTypes = [...new Set(listings.map((l) => l.propertyType))].sort();
  const statuses: GsaDispositionStatus[] = ["Available", "UNDER CONTRACT", "SOLD"];

  return { states, propertyTypes, statuses };
}

export function formatGsaSqFt(sqft: number): string {
  return `${sqft.toLocaleString()} rentable sq ft`;
}

export function formatGsaScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
