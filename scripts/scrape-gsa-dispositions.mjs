/**
 * Scrapes GSA "Assets identified for accelerated disposition" listings.
 * Source: https://www.gsa.gov/real-estate/real-property-disposition/assets-identified-for-accelerated-disposition
 *
 * Public federal disposition data. Images are downloaded locally for stable hosting.
 * Re-run periodically: pnpm scrape-gsa
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE_URL =
  "https://www.gsa.gov/real-estate/real-property-disposition/assets-identified-for-accelerated-disposition";
const OUT_JSON = path.join(ROOT, "src/data/gsa-dispositions.json");
const OUT_IMAGES = path.join(ROOT, "public/images/gsa-dispositions");

const PLACEHOLDER = "disposition_missing_image_final";

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseAddress(addressRaw) {
  const match = addressRaw.match(/^(.+),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
  if (!match) {
    return { address: addressRaw, city: "", state: "", zip: "" };
  }
  return {
    address: match[1].trim(),
    city: match[2].trim(),
    state: match[3],
    zip: match[4],
  };
}

function parseCards(html) {
  const cards = [];
  const blocks = html.split(/<h3 class="usa-card__heading/);
  blocks.shift();

  for (const block of blocks) {
    const titleMatch = block.match(/[^>]*>([\s\S]*?)<\/h3>/);
    const imgMatch = block.match(/<img src="([^"]+)"/);
    const addrMatch = block.match(/<p><a[^>]*>([\s\S]*?)<\/a><\/p>/);
    const typeMatch = block.match(/Type:\s*<strong>([\s\S]*?)<\/strong>/);
    const areaMatch = block.match(/Rentable Area:\s*<strong>([\s\S]*?)<\/strong>/);
    const dateMatch = block.match(/Date listed:\s*([^<]+)/i);
    const statusMatch = block.match(/usa-tag[^>]*>\s*(UNDER CONTRACT|SOLD)\s*</i);

    if (!titleMatch || !imgMatch || !addrMatch) continue;

    const addressRaw = decodeHtml(addrMatch[1]);
    const { address, city, state, zip } = parseAddress(addressRaw);
    const sqftRaw = decodeHtml(areaMatch?.[1] ?? "").replace(/,/g, "");

    cards.push({
      id: `gsa-${cards.length + 1}`,
      title: decodeHtml(titleMatch[1]),
      imageSourceUrl: imgMatch[1],
      address,
      city,
      state,
      zip,
      propertyType: decodeHtml(typeMatch?.[1] ?? ""),
      rentableSqFt: parseInt(sqftRaw, 10) || 0,
      dateListed: dateMatch?.[1]?.trim() ?? "",
      status: statusMatch?.[1]?.trim() ?? "Available",
      sourceUrl: SOURCE_URL,
      sourceAgency: "U.S. General Services Administration",
    });
  }

  return cards;
}

function slugify(title, index) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || `property-${index}`
  );
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

async function main() {
  console.log("Fetching GSA disposition page…");
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Failed to fetch GSA page: ${res.status}`);
  const html = await res.text();

  const cards = parseCards(html);
  if (!cards.length) throw new Error("No listings parsed — page structure may have changed.");

  fs.mkdirSync(OUT_IMAGES, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

  let downloaded = 0;
  let placeholders = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const ext = path.extname(new URL(card.imageSourceUrl).pathname) || ".jpg";
    const filename = `${String(i + 1).padStart(2, "0")}-${slugify(card.title, i)}${ext}`;
    const localPath = path.join(OUT_IMAGES, filename);

    if (card.imageSourceUrl.includes(PLACEHOLDER)) {
      card.imageUrl = null;
      card.imageNote = "No photo provided by GSA";
      placeholders++;
    } else {
      try {
        await downloadImage(card.imageSourceUrl, localPath);
        card.imageUrl = `/images/gsa-dispositions/${filename}`;
        downloaded++;
      } catch (err) {
        console.warn(`  skip image ${card.title}: ${err.message}`);
        card.imageUrl = null;
        card.imageNote = "Download failed";
      }
    }
    delete card.imageSourceUrl;
  }

  const payload = {
    scrapedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    count: cards.length,
    listings: cards,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));
  console.log(`✓ Parsed ${cards.length} listings`);
  console.log(`✓ Downloaded ${downloaded} images (${placeholders} placeholders)`);
  console.log(`✓ Wrote ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
