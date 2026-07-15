export type SavedSearchRow = {
  id: string;
  title: string;
  searchUrl: string;
  queryJson: Record<string, unknown>;
  emailAlerts: boolean;
  createdAt: string;
};

export function describeSavedSearchQuery(query: Record<string, unknown>): string {
  const parts: string[] = [];
  const q = String(query.q ?? "").trim();
  const state = String(query.state ?? "").trim();
  const propertyType = String(query.propertyType ?? "").trim();
  const beds = Number(query.beds) || 0;
  const baths = Number(query.baths) || 0;
  const minPrice = Number(query.minPrice) || 0;
  const maxPrice = Number(query.maxPrice) || 0;

  if (q) parts.push(`Location: ${q}`);
  if (state) parts.push(`State: ${state}`);
  if (propertyType) parts.push(`Type: ${propertyType}`);
  if (beds) parts.push(`Beds: ${beds}+`);
  if (baths) parts.push(`Baths: ${baths}+`);
  if (minPrice) parts.push(`Min $${minPrice.toLocaleString()}`);
  if (maxPrice) parts.push(`Max $${maxPrice.toLocaleString()}`);
  if (query.bounds) parts.push("Map area");

  return parts.length ? parts.join(" · ") : "All listings";
}
