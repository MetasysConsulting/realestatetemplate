export type HomeNeighborhood = {
  id: string;
  city: string;
  state: string;
  count: number;
  countLabel: string;
  imageUrl: string;
  href: string;
};

/** Optional stock photos for cities we already have assets for. */
const STOCK_NEIGHBORHOOD_IMAGES: Record<string, string> = {
  "tampa|fl": "/images/neighborhoods/tampa-florida.jpg",
  "austin|tx": "/images/neighborhoods/austin-texas.jpg",
  "phoenix|az": "/images/neighborhoods/phoenix-arizona.jpg",
  "denver|co": "/images/neighborhoods/denver-colorado.jpg",
  "atlanta|ga": "/images/neighborhoods/atlanta-georgia.jpg",
  "houston|tx": "/images/neighborhoods/houston-texas.jpg",
  "cleveland|oh": "/images/neighborhoods/cleveland-ohio.jpg",
  "miami|fl": "/images/neighborhoods/miami-florida.jpg",
};

const STATE_ABBR_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

export function titleCaseCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => {
      if (part === "of" || part === "the" || part === "and") return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function formatNeighborhoodLabel(city: string, stateAbbr: string): string {
  const stateName = STATE_ABBR_TO_NAME[stateAbbr.toUpperCase()] ?? stateAbbr.toUpperCase();
  return `${titleCaseCity(city)}, ${stateName}`;
}

export function formatPropertyCount(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}

export function resolveNeighborhoodImage(
  city: string,
  stateAbbr: string,
  listingImageUrl?: string | null,
): string {
  const key = `${city.trim().toLowerCase()}|${stateAbbr.trim().toLowerCase()}`;
  if (STOCK_NEIGHBORHOOD_IMAGES[key]) return STOCK_NEIGHBORHOOD_IMAGES[key];
  if (listingImageUrl && listingImageUrl.trim()) return listingImageUrl.trim();
  return "/images/neighborhoods/miami-florida.jpg";
}

export function buildNeighborhoodHref(city: string, stateAbbr: string): string {
  const params = new URLSearchParams({
    q: titleCaseCity(city),
    state: stateAbbr.toUpperCase(),
  });
  return `/search?${params.toString()}`;
}

export function chunkNeighborhoodRows(
  neighborhoods: HomeNeighborhood[],
  rowSize = 4,
): HomeNeighborhood[][] {
  if (!neighborhoods.length) return [];
  const rows: HomeNeighborhood[][] = [];
  for (let i = 0; i < neighborhoods.length; i += rowSize) {
    rows.push(neighborhoods.slice(i, i + rowSize));
  }
  return rows;
}
