export type SearchSuggestionType = "city" | "county" | "zip" | "state" | "address";

export type SearchSuggestion = {
  id: string;
  type: SearchSuggestionType;
  label: string;
  sublabel?: string;
  href: string;
  count?: number;
};

const TYPE_LABELS: Record<SearchSuggestionType, string> = {
  city: "Cities",
  county: "Counties",
  zip: "ZIP codes",
  state: "States",
  address: "Addresses",
};

export function suggestionTypeLabel(type: SearchSuggestionType): string {
  return TYPE_LABELS[type];
}

export function buildSearchHref(q?: string, state?: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (state) params.set("state", state);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
