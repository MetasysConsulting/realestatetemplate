/**
 * Parse listings from a saved PropertyRadar "List to be exported" HTML page.
 * Grid columns: Address, City, Sq Ft, Beds, Baths, Est Value, Est Equity,
 * Owner, Owner Occ?, Listed for Sale?, Listed By Owner?, Distress Score
 */
import fs from "fs";
import { createHash } from "crypto";

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

export function listingIdFor(address, city) {
  const key = `${String(address).trim().toUpperCase()}|${String(city).trim().toUpperCase()}`;
  return `propertyradar-${createHash("sha256").update(key).digest("hex").slice(0, 16)}`;
}

function parseMoney(value) {
  const n = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseNumber(value) {
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseGridCells(cells) {
  const cleaned = cells.map((c) => c.trim()).filter(Boolean);
  if (cleaned.length < 2) return null;

  let i = 0;
  const address = cleaned[i++];
  const city = cleaned[i++];

  let squareFootage = null;
  let bedrooms = null;
  let bathrooms = null;
  let estValue = null;
  let estEquity = null;
  let owner = null;
  let ownerOccupied = null;
  let listedForSale = null;
  let listedByOwner = null;
  let distressScore = null;

  const readYesNo = (value) => {
    if (value === "Yes") return true;
    if (value === "No") return false;
    return null;
  };

  while (i < cleaned.length) {
    const c = cleaned[i];

    if (c === "Yes" || c === "No") {
      if (ownerOccupied == null) ownerOccupied = readYesNo(c);
      else if (listedForSale == null) listedForSale = readYesNo(c);
      else if (listedByOwner == null) listedByOwner = readYesNo(c);
      i++;
      continue;
    }

    if (/^\$/.test(c)) {
      const money = parseMoney(c);
      if (estValue == null) estValue = money;
      else if (estEquity == null) estEquity = money;
      i++;
      continue;
    }

    if (/^[\d,]+$/.test(c)) {
      const n = parseNumber(c);
      if (squareFootage == null && n >= 100) {
        squareFootage = n;
      } else if (bedrooms == null && n <= 99) {
        bedrooms = n;
      } else if (bathrooms == null && n <= 99) {
        bathrooms = n;
      } else if (distressScore == null && n <= 100) {
        distressScore = n;
      }
      i++;
      continue;
    }

    if (/^\d+(\.\d+)?$/.test(c)) {
      const n = Number(c);
      if (bathrooms == null) bathrooms = n;
      else if (distressScore == null) distressScore = n;
      i++;
      continue;
    }

    if (/^\d{1,3}$/.test(c) && distressScore == null) {
      distressScore = Number(c);
      i++;
      continue;
    }

    if (!owner && /[A-Z]/i.test(c) && c.length > 3) {
      owner = c;
    }
    i++;
  }

  return {
    address,
    city,
    squareFootage,
    bedrooms,
    bathrooms,
    estValue,
    estEquity,
    owner,
    ownerOccupied,
    listedForSale,
    listedByOwner,
    distressScore,
  };
}

export function parsePropertyRadarExportHtml(html) {
  const listings = [];
  const parts = html.split(/<table[^>]*data-recordid="(\d+)"/);

  for (let i = 1; i < parts.length; i += 2) {
    const recordId = parts[i];
    const chunk = parts[i + 1]?.slice(0, 12_000) ?? "";
    const cells = [...chunk.matchAll(/<div unselectable="on" class="x-grid-cell-inner[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
      .map((m) => stripTags(m[1]))
      .filter((c) => c && !c.includes("properties_") && c !== " ");

    const parsed = parseGridCells(cells);
    if (!parsed?.address || !parsed?.city) continue;

    const radarMatch = chunk.match(
      /displayAttributePopup\(event,\s*(?:&#39;|'|")(P[A-F0-9]+)(?:&#39;|'|")/i,
    );
    const radarId = radarMatch ? radarMatch[1] : null;

    listings.push({
      recordId,
      radarId,
      listingId: listingIdFor(parsed.address, parsed.city),
      ...parsed,
    });
  }

  return listings;
}

export function readPropertyRadarExportHtml(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  return parsePropertyRadarExportHtml(html);
}
