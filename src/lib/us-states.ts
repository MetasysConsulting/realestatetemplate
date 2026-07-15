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

const STATE_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

export const US_STATE_OPTIONS = Object.entries(STATE_NAME_TO_ABBR)
  .map(([name, abbr]) => ({
    abbr,
    name: name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function stateNameForAbbr(abbr: string): string {
  const code = abbr.trim().toUpperCase();
  const hit = US_STATE_OPTIONS.find((s) => s.abbr === code);
  return hit?.name ?? code;
}

export function matchStateSuggestions(
  query: string,
  limit = 3,
): { name: string; abbr: string }[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const matches: { name: string; abbr: string; score: number }[] = [];
  for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
    const title = name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    if (name.startsWith(q) || abbr.toLowerCase().startsWith(q)) {
      matches.push({
        name: title,
        abbr,
        score: name.startsWith(q) ? 0 : abbr.toLowerCase().startsWith(q) ? 1 : 2,
      });
    } else if (name.includes(q)) {
      matches.push({ name: title, abbr, score: 3 });
    }
  }

  return matches
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ name, abbr }) => ({ name, abbr }));
}

/** Normalize a state filter to a 2-letter code when possible. */
export function normalizeStateQuery(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^(province|states?)\s*\/\s*states?$/i.test(trimmed)) return "";
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_NAME_TO_ABBR[trimmed.toLowerCase()] ?? trimmed;
}

function asValidStateAbbr(value: string): string {
  const normalized = normalizeStateQuery(value);
  if (normalized.length === 2 && STATE_ABBRS.has(normalized)) return normalized;
  return "";
}

/** True when the whole token is only a US state name or 2-letter code. */
export function isBareStateQuery(query: string): boolean {
  const trimmed = query.trim().replace(/\s+/g, " ");
  if (!trimmed) return false;
  return Boolean(asValidStateAbbr(trimmed));
}

export type ParsedLocationQuery = {
  q: string;
  state: string;
  zip: string;
};

/**
 * Realtor-style location parse:
 * - "california" / "CA" → state only
 * - "Miami, FL" / "Miami Florida" → city + state
 * - "90210" / trailing ZIP → zip
 * - "Los Angeles, CA 90012" → city + state + zip
 */
export function parseLocationQuery(query: string): ParsedLocationQuery {
  let trimmed = query.trim().replace(/\s+/g, " ");
  if (!trimmed) return { q: "", state: "", zip: "" };

  let zip = "";
  const pureZip = trimmed.match(/^(\d{5})(?:-\d{4})?$/);
  if (pureZip) {
    return { q: "", state: "", zip: pureZip[1] };
  }

  const trailingZip = trimmed.match(/^(.*?)[,\s]+(\d{5})(?:-\d{4})?$/);
  if (trailingZip) {
    zip = trailingZip[2];
    trimmed = trailingZip[1].trim();
  }

  if (!trimmed) {
    return { q: "", state: "", zip };
  }

  // Bare state / abbr (e.g. "california", "CA", "New York")
  const bareState = asValidStateAbbr(trimmed);
  if (bareState) {
    return { q: "", state: bareState, zip };
  }

  // Comma: "Miami, FL" or "Miami, Florida"
  const commaIndex = trimmed.lastIndexOf(",");
  if (commaIndex !== -1) {
    const potentialState = trimmed.slice(commaIndex + 1).trim();
    const normalizedState = asValidStateAbbr(potentialState);
    if (normalizedState) {
      return {
        q: trimmed.slice(0, commaIndex).trim(),
        state: normalizedState,
        zip,
      };
    }
  }

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    // Multi-word states: "Buffalo New York", "Asheville North Carolina"
    const lastTwoWords = words.slice(-2).join(" ");
    const normalizedLastTwo = asValidStateAbbr(lastTwoWords);
    if (normalizedLastTwo) {
      return {
        q: words.slice(0, -2).join(" ").trim(),
        state: normalizedLastTwo,
        zip,
      };
    }

    // Trailing 2-letter only for spaced form ("Miami FL").
    // Full names like "Florida" need a comma ("Miami, Florida") so we do not
    // mis-parse places such as "Fort Washington".
    const lastWord = words[words.length - 1];
    if (lastWord.length === 2) {
      const normalizedLast = asValidStateAbbr(lastWord);
      if (normalizedLast) {
        return {
          q: words.slice(0, -1).join(" ").trim(),
          state: normalizedLast,
          zip,
        };
      }
    }
  }

  return { q: trimmed, state: "", zip };
}
