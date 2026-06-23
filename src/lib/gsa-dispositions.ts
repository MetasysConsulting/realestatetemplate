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
  hasImage: boolean;
  displayImageUrl: string | null;
};

export type GsaDispositionsDataset = {
  scrapedAt: string;
  sourceUrl: string;
  count: number;
  listings: GsaDispositionListing[];
};

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
