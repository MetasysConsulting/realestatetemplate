export type AdminListingRow = {
  id: string;
  sourceId: string;
  sourceName: string;
  category: string;
  categoryLabel: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  priceLabel: string;
  status: string | null;
  isActive: boolean;
  hasImage: boolean;
  detailUrl: string | null;
};

export type AdminListingsData = {
  available: boolean;
  totalActive: number;
  totalInactive: number;
  bySource: Array<{ sourceId: string; name: string; count: number }>;
  byCategory: Array<{ category: string; label: string; count: number }>;
  listings: AdminListingRow[];
};

export function formatAdminListingsCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}
