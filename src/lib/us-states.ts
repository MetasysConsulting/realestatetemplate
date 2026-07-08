const STATE_NAME_TO_ABBR: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

export function matchStateSuggestions(
  query: string,
  limit = 3,
): { name: string; abbr: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const matches: { name: string; abbr: string }[] = [];
  for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
    const title = name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    if (name.includes(q) || abbr.toLowerCase().startsWith(q)) {
      matches.push({ name: title, abbr });
    }
    if (matches.length >= limit) break;
  }
  return matches;
}

/** Normalize a state filter to a 2-letter code when possible. */
export function normalizeStateQuery(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^(province|states?)\s*\/\s*states?$/i.test(trimmed)) return "";
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed.toLowerCase()] ?? trimmed;
}
