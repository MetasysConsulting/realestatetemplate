export type GsaRealEstateSale = {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  startingBid: number;
  status: string;
  auctionType: string;
  propertyType: string;
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

export type GsaRealEstateSalesDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: GsaRealEstateSale[];
};

export function getGsaSalesFilterOptions(listings: GsaRealEstateSale[]) {
  const states = [...new Set(listings.map((l) => l.state))].sort();
  const propertyTypes = [...new Set(listings.map((l) => l.propertyType).filter(Boolean))].sort();
  const statuses = [...new Set(listings.map((l) => l.status).filter(Boolean))].sort();
  return { states, propertyTypes, statuses };
}

export function formatGsaSalePrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatGsaSalesScrapedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
