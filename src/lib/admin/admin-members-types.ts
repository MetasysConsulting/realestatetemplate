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

export type AdminMembersData = {
  available: boolean;
  total: number;
  members: AdminMember[];
};

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
