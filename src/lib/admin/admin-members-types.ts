export type AdminMember = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  unlockIntents: number;
  pageViews: number;
};

export type AdminMembersQuery = {
  q: string;
  page: number;
  pageSize: number;
};

export type AdminMembersData = {
  available: boolean;
  total: number;
  confirmedTotal: number;
  signedIn30dTotal: number;
  unlockIntentsTotal: number;
  filteredTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: AdminMembersQuery;
  members: AdminMember[];
};

export const ADMIN_MEMBERS_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_MEMBERS_MAX_PAGE_SIZE = 100;

export function formatMemberCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatMemberDate(iso: string | null): string {
  if (!iso) return "Never";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

export function formatMemberRelative(iso: string | null): string {
  if (!iso) return "Never";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d ago`;
  return formatMemberDate(iso);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseAdminMembersQuery(
  searchParams: Record<string, string | string[] | undefined>,
): AdminMembersQuery {
  const q = (firstParam(searchParams.q) ?? "").trim();
  const pageRaw = Number(firstParam(searchParams.page) ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const sizeRaw = Number(
    firstParam(searchParams.pageSize) ?? String(ADMIN_MEMBERS_DEFAULT_PAGE_SIZE),
  );
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(
        ADMIN_MEMBERS_MAX_PAGE_SIZE,
        Math.max(10, Math.floor(sizeRaw)),
      )
    : ADMIN_MEMBERS_DEFAULT_PAGE_SIZE;
  return { q, page, pageSize };
}

export function buildAdminMembersHref(
  query: Partial<AdminMembersQuery>,
  base: AdminMembersQuery,
): string {
  const next: AdminMembersQuery = {
    q: query.q ?? base.q,
    page: query.page ?? base.page,
    pageSize: query.pageSize ?? base.pageSize,
  };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== ADMIN_MEMBERS_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(next.pageSize));
  }
  const qs = params.toString();
  return qs ? `/admin/members?${qs}` : "/admin/members";
}

export function escapeMemberIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
