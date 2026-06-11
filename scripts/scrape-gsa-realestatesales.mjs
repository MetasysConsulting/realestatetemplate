/**
 * Scrapes GSA Real Estate Sales auction listings.
 * Source: https://www.realestatesales.gov/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://www.realestatesales.gov";
const LISTINGS_URL = `${BASE_URL}/our-listing`;
const OUT_JSON = path.join(ROOT, "src/data/gsa-realestatesales.json");

function decodeHtml(text) {
  return text.replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
}

function parseListings(html) {
  const listings = [];
  const cardRe = /href="\/asset-details\/\?property_id=(\d+)"([\s\S]*?)(?=href="\/asset-details\/\?property_id=|<\/ul>\s*<\/div>\s*<\/section>|$)/g;

  let match;
  while ((match = cardRe.exec(html)) !== null) {
    const propertyId = match[1];
    const block = match[2];

    const imageMatch = block.match(/class="slide-img"[^>]+src="(https:\/\/[^"]+)"/);
    const priceMatch = block.match(/property-price[\s\S]*?\$\s*([0-9,]+)/);
    const titleMatch = block.match(/<h2>([^<]+)<\/h2>/);
    const streetMatch = block.match(/<h5[^>]*>[\s\S]*?<span>\s*([^<]+)/);
    const cityStateZipMatch = block.match(/<\/span>\s*([^<]+,\s*[A-Z]{2}\s*\d{5})/);
    const statusMatch = block.match(/class="stripe">\s*([^<]+)/);
    const auctionTypeMatch = block.match(/<ul class="tags">[\s\S]*?<h3>\s*([^<]+)/);
    const propertyTypeMatch = block.match(/<ul class="tags">[\s\S]*?<h3>[\s\S]*?<\/h3>[\s\S]*?<h3>\s*([^<]+)/);

    const cityLine = cityStateZipMatch?.[1]?.trim() ?? "";
    const cityParts = cityLine.match(/^(.+),\s*([A-Z]{2})\s*(\d{5})/);

    listings.push({
      id: `gsa-sale-${propertyId}`,
      propertyId,
      title: decodeHtml(titleMatch?.[1] ?? ""),
      address: decodeHtml(streetMatch?.[1] ?? ""),
      city: cityParts?.[1]?.trim() ?? "",
      state: cityParts?.[2] ?? "",
      zip: cityParts?.[3] ?? "",
      startingBid: parseInt((priceMatch?.[1] ?? "0").replace(/,/g, ""), 10) || 0,
      status: decodeHtml(statusMatch?.[1] ?? "Available"),
      auctionType: decodeHtml(auctionTypeMatch?.[1] ?? "Online Auction"),
      propertyType: decodeHtml(propertyTypeMatch?.[1] ?? ""),
      imageUrl: imageMatch?.[1] ?? null,
      detailUrl: `${BASE_URL}/asset-details/?property_id=${propertyId}`,
      sourceUrl: BASE_URL,
      sourceAgency: "U.S. General Services Administration",
    });
  }

  return listings;
}

async function main() {
  console.log("Fetching GSA Real Estate Sales listings…");
  const res = await fetch(LISTINGS_URL, {
    headers: {
      "User-Agent": "REOVANA-DataSync/1.0 (public federal property aggregator)",
      Accept: "text/html",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const listings = parseListings(html);

  const payload = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: LISTINGS_URL,
    count: listings.length,
    listings,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));

  console.log(`✓ Parsed ${listings.length} auction listings`);
  console.log(`✓ Wrote ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
