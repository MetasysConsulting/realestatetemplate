export type AdminSearchSuggestion = {
  id: string;
  type: "listing" | "member";
  label: string;
  sublabel: string;
  href: string;
};

export type AdminSearchSuggestResult = {
  listings: AdminSearchSuggestion[];
  members: AdminSearchSuggestion[];
  seeAllListingsHref: string | null;
};
