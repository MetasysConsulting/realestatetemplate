/**
 * Parse a saved PropertyRadar detail-page HTML snapshot.
 * Extracts the overview-card aerial photo (top-left) and property fields.
 */
import fs from "fs";

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractOverviewSection(html) {
  const start = html.search(/propertyOverview|fr-property-overview|overview-card/i);
  if (start < 0) return "";
  return html.slice(start, start + 20_000);
}

/** The 134×134 property preview (top-left) — not the large leaflet map. */
export function extractOverviewPhotoUrl(html) {
  const section = extractOverviewSection(html);
  if (!section) return null;

  const imgTags = [...section.matchAll(/<img[^>]+>/gi)];
  for (const tag of imgTags) {
    const srcMatch = tag[0].match(/src="([^"]+)"/i);
    const widthMatch = tag[0].match(/width="(\d+)"/i);
    const src = srcMatch ? decodeHtml(srcMatch[1]) : null;
    if (!src) continue;

    const isOverviewTile =
      /virtualearth\.net\/tiles\/(?:hs|a\d)/i.test(src) ||
      (widthMatch && Number(widthMatch[1]) <= 200);

    const isMapLeaflet = tag[0].includes("leaflet-tile");

    if (isOverviewTile && !isMapLeaflet) return src;
  }

  return null;
}

function fieldAfterLabel(text, label) {
  const re = new RegExp(`${label}\\s+([^\\n]+?)(?=\\s+(?:Property Type|Beds|Year Built|Square Feet|Est\\. Value|Equity|Lot Size|Purchase Price|Owned Since|Distress Score|Explore|Radar ID|$))`, "i");
  const match = text.match(re);
  return match?.[1]?.trim() ?? null;
}

export function extractOverviewFields(html) {
  const section = extractOverviewSection(html);
  const text = stripTags(section);
  const fullText = stripTags(html);

  const bedsBaths = text.match(/Beds\s*\/\s*Baths\s+(\d+)\s*\/\s*([\d.]+)/i);
  const estValue = text.match(/Est\.\s*Value\s+\$?([\d,]+)/i);
  const equity = text.match(/Equity\s+\$?([\d,]+)/i);
  const sqft = text.match(/Square Feet\s+([\d,]+)/i);
  const lotSize = text.match(/Lot Size\s+([\d,]+)/i);
  const distress = text.match(/Distress Score\s+(\d+)/i);
  const radarId =
    fullText.match(/Radar\s*ID[:\s#]*(P[A-F0-9]{5,12})/i)?.[1] ??
    html.match(/detail\/(P[A-F0-9]{5,12})/i)?.[1] ??
    null;

  return {
    address: fieldAfterLabel(text, "Address"),
    propertyType: fieldAfterLabel(text, "Property Type"),
    bedrooms: bedsBaths ? Number(bedsBaths[1]) : null,
    bathrooms: bedsBaths ? Number(bedsBaths[2]) : null,
    yearBuilt: fieldAfterLabel(text, "Year Built"),
    squareFootage: sqft ? Number(sqft[1].replace(/,/g, "")) : null,
    estValue: estValue ? Number(estValue[1].replace(/,/g, "")) : null,
    estEquity: equity ? Number(equity[1].replace(/,/g, "")) : null,
    lotSize: lotSize ? Number(lotSize[1].replace(/,/g, "")) : null,
    distressScore: distress ? Number(distress[1]) : null,
    radarId,
  };
}

export function parsePropertyRadarDetailHtml(html) {
  return {
    overviewPhotoUrl: extractOverviewPhotoUrl(html),
    ...extractOverviewFields(html),
  };
}

export function parsePropertyRadarDetailHtmlFile(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  return parsePropertyRadarDetailHtml(html);
}
