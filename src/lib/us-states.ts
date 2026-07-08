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

/** Parses a search query to check for trailing state abbreviations or names. */
export function parseLocationQuery(query: string): { q: string; state: string } {
  const trimmed = query.trim();

  // 1. Check for comma separation: "Miami, FL" or "Miami, Florida"
  const commaIndex = trimmed.lastIndexOf(",");
  if (commaIndex !== -1) {
    const potentialState = trimmed.slice(commaIndex + 1).trim();
    const normalizedState = normalizeStateQuery(potentialState);
    // Verify that the normalized state is a valid 2-letter abbreviation
    if (normalizedState.length === 2 && /^[A-Z]{2}$/.test(normalizedState)) {
      return {
        q: trimmed.slice(0, commaIndex).trim(),
        state: normalizedState,
      };
    }
  }

  // 2. Check for space separation at the end: "Miami FL" or "Miami Florida"
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    // Check last word (e.g. "FL" or "Florida")
    const lastWord = words[words.length - 1];
    const normalizedLast = normalizeStateQuery(lastWord);
    if (normalizedLast.length === 2 && /^[A-Z]{2}$/.test(normalizedLast)) {
      return {
        q: words.slice(0, -1).join(" ").trim(),
        state: normalizedLast,
      };
    }

    // Check last two words (e.g. "New York" or "North Carolina")
    if (words.length > 2) {
      const lastTwoWords = words.slice(-2).join(" ");
      const normalizedLastTwo = normalizeStateQuery(lastTwoWords);
      if (normalizedLastTwo.length === 2 && /^[A-Z]{2}$/.test(normalizedLastTwo)) {
        return {
          q: words.slice(0, -2).join(" ").trim(),
          state: normalizedLastTwo,
        };
      }
    }
  }

  return { q: trimmed, state: "" };
}

