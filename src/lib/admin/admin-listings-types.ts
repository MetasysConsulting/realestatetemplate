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
  updatedAt: string | null;
};

export type AdminListingsActiveFilter = "1" | "0" | "all";

export type AdminListingsQuery = {
  q: string;
  sourceId: string;
  category: string;
  active: AdminListingsActiveFilter;
  page: number;
  pageSize: number;
};

export type AdminListingsData = {
  available: boolean;
  totalActive: number;
  totalInactive: number;
  bySource: Array<{ sourceId: string; name: string; count: number }>;
  byCategory: Array<{ category: string; label: string; count: number }>;
  listings: AdminListingRow[];
  filteredTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: AdminListingsQuery;
};

export const ADMIN_LISTINGS_DEFAULT_PAGE_SIZE = 50;
export const ADMIN_LISTINGS_MAX_PAGE_SIZE = 100;

export function formatAdminListingsCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatAdminListingsDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseAdminListingsQuery(
  searchParams: Record<string, string | string[] | undefined>,
): AdminListingsQuery {
  const q = (firstParam(searchParams.q) ?? "").trim();
  const sourceId = (firstParam(searchParams.source) ?? "all").trim() || "all";
  const category = (firstParam(searchParams.category) ?? "all").trim() || "all";
  const activeRaw = (firstParam(searchParams.active) ?? "1").trim();
  const active: AdminListingsActiveFilter =
    activeRaw === "0" || activeRaw === "all" ? activeRaw : "1";

  const pageRaw = Number(firstParam(searchParams.page) ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const sizeRaw = Number(
    firstParam(searchParams.pageSize) ?? String(ADMIN_LISTINGS_DEFAULT_PAGE_SIZE),
  );
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(
        ADMIN_LISTINGS_MAX_PAGE_SIZE,
        Math.max(20, Math.floor(sizeRaw)),
      )
    : ADMIN_LISTINGS_DEFAULT_PAGE_SIZE;

  return { q, sourceId, category, active, page, pageSize };
}

export function buildAdminListingsHref(
  query: Partial<AdminListingsQuery> & {
    q?: string;
    sourceId?: string;
    category?: string;
    active?: AdminListingsActiveFilter;
    page?: number;
    pageSize?: number;
  },
  base: AdminListingsQuery,
): string {
  const next: AdminListingsQuery = {
    q: query.q ?? base.q,
    sourceId: query.sourceId ?? base.sourceId,
    category: query.category ?? base.category,
    active: query.active ?? base.active,
    page: query.page ?? base.page,
    pageSize: query.pageSize ?? base.pageSize,
  };

  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.sourceId && next.sourceId !== "all") params.set("source", next.sourceId);
  if (next.category && next.category !== "all") params.set("category", next.category);
  if (next.active !== "1") params.set("active", next.active);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== ADMIN_LISTINGS_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(next.pageSize));
  }

  const qs = params.toString();
  return qs ? `/admin/listings?${qs}` : "/admin/listings";
}

export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
