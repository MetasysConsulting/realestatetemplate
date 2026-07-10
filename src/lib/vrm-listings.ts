export type VrmListing = {
  id: string;
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  browseLocked?: boolean;
  county: string;
  listPrice: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  status: string;
  isNew: boolean;
  isVendeeFinancing: boolean;
  imageUrl: string | null;
  hasImage: boolean;
  displayImageUrl: string | null;
  detailUrl: string;
  sourceUrl: string;
  sourceAgency: string;
  lat: number;
  lng: number;
  hasRealCoordinates: boolean;
};

export type VrmListingsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: VrmListing[];
};

export function getVrmFilterOptions(listings: VrmListing[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  const statuses = [...new Set(listings.map((l) => l.status).filter(Boolean))].sort();
  return { states, statuses };
}

export function formatVrmPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatVrmScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
