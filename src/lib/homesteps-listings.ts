export type HomeStepsListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  browseLocked?: boolean;
  listPrice: number;
  lat: number;
  lng: number;
  hasRealCoordinates: boolean;
  imageUrl: string | null;
  hasImage: boolean;
  displayImageUrl: string | null;
  detailUrl: string;
  sourceUrl: string;
  sourceAgency: string;
  searchState: string;
};

export type HomeStepsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: HomeStepsListing[];
};

export function getHomeStepsFilterOptions(listings: HomeStepsListing[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  return { states };
}

export function formatHomeStepsPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatHomeStepsScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
