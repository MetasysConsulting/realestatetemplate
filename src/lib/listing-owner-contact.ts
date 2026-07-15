/** Owner-of-record / seller contact — member-only when present. */

export type ListingOwnerContact = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

function firstString(meta: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  if (!meta) return null;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/** Pull owner fields from listing metadata when enrichment has populated them. */
export function ownerContactFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): ListingOwnerContact | null {
  if (!metadata || typeof metadata !== "object") return null;

  const nested =
    metadata.owner && typeof metadata.owner === "object" && !Array.isArray(metadata.owner)
      ? (metadata.owner as Record<string, unknown>)
      : null;

  const name =
    firstString(metadata, ["ownerName", "owner_name", "owner"]) ||
    firstString(nested, ["name", "fullName", "full_name"]);
  const phone =
    firstString(metadata, ["ownerPhone", "owner_phone", "sellerPhone", "seller_phone"]) ||
    firstString(nested, ["phone", "phoneNumber", "phone_number"]);
  const email =
    firstString(metadata, ["ownerEmail", "owner_email", "sellerEmail", "seller_email"]) ||
    firstString(nested, ["email"]);

  if (!name && !phone && !email) return null;
  return { name, phone, email };
}

export function hasOwnerContact(owner: ListingOwnerContact | null | undefined): boolean {
  if (!owner) return false;
  return Boolean(owner.name?.trim() || owner.phone?.trim() || owner.email?.trim());
}

export function redactOwnerContact(owner: ListingOwnerContact): ListingOwnerContact {
  return {
    name: owner.name ? "••••••••" : null,
    phone: owner.phone ? "••••••••••" : null,
    email: owner.email ? "••••@••••.•••" : null,
  };
}
