#!/usr/bin/env node
/**
 * Backfill metadata.overviewPhotoUrl from saved HTML snapshots.
 * Enables listing photos on deployed sites without shipping public/*.jpg files.
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";
import { parsePropertyRadarDetailHtmlFile } from "./lib/parse-propertyradar-detail-html.mjs";
import { HARVEST_FILE, SNAPSHOT_DIR } from "./lib/propertyradar-supabase-batch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — use --env-file=.env.local");
  }

  const harvest = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
  const pool = harvest.listings.slice(0, 5000);

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let updated = 0;
  let withPhoto = 0;
  let noPhoto = 0;

  for (const seed of pool) {
    const htmlPath = path.join(SNAPSHOT_DIR, `${seed.listingId}.html`);
    if (!fs.existsSync(htmlPath)) continue;

    const parsed = parsePropertyRadarDetailHtmlFile(htmlPath);
    const overviewPhotoUrl = parsed.overviewPhotoUrl ?? null;

    if (overviewPhotoUrl) withPhoto++;
    else noPhoto++;

    await client.query(
      `UPDATE listings
       SET metadata = metadata || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2 AND source_id = 'propertyradar'`,
      [
        JSON.stringify({
          overviewPhotoUrl,
          hasImage: Boolean(overviewPhotoUrl),
          pendingImage: !overviewPhotoUrl,
        }),
        seed.listingId,
      ],
    );
    updated++;
    if (updated % 500 === 0) console.log(`  … ${updated}/${pool.length}`);
  }

  await client.end();
  console.log(`Done — updated ${updated}, with remote photo ${withPhoto}, no photo ${noPhoto}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
