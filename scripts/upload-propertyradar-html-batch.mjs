#!/usr/bin/env node
/**
 * Upload PropertyRadar listings from saved HTML → Supabase (batched, resumable).
 *
 * Usage:
 *   pnpm upload-propertyradar-batch
 *   pnpm upload-propertyradar-batch -- --limit 5000 --import-source propertyradar-html-batch1
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  extractListingFromHarvestSeed,
  HARVEST_FILE,
  mapRawToSyncListing,
  readUploadProgress,
  writeUploadProgress,
  ensurePublicPhoto,
} from "./lib/propertyradar-supabase-batch.mjs";
import {
  resolvePropertyRadarCategory,
  upsertPropertyRadarListings,
} from "./lib/listings-db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function parseArgs(argv) {
  const args = {
    limit: 5000,
    offset: 0,
    importSource: "propertyradar-html-batch1",
    dbBatch: 25,
    resume: true,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--offset") args.offset = Number(argv[++i]);
    else if (arg === "--import-source") args.importSource = argv[++i];
    else if (arg === "--db-batch") args.dbBatch = Number(argv[++i]);
    else if (arg === "--no-resume") args.resume = false;
  }
  return args;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — use --env-file=.env.local");
  }

  const args = parseArgs(process.argv);
  const harvest = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
  const pool = harvest.listings.slice(args.offset, args.offset + args.limit);

  let startIndex = 0;
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;
  let photos = 0;
  const categoryCounts = {};

  if (args.resume) {
    const prev = readUploadProgress();
    if (prev?.importSource === args.importSource && prev?.status !== "done") {
      startIndex = prev.processedIndex ?? 0;
      uploaded = prev.uploaded ?? 0;
      skipped = prev.skipped ?? 0;
      errors = prev.errors ?? 0;
      photos = prev.photos ?? 0;
      Object.assign(categoryCounts, prev.categoryCounts ?? {});
      console.log(`Resuming ${args.importSource} at index ${startIndex}/${pool.length}`);
    }
  }

  const scrapedAt = new Date().toISOString();
  console.log(`Upload batch: ${pool.length} listings (harvest offset ${args.offset})`);
  console.log(`importSource: ${args.importSource}`);
  console.log(`Categories: distress score → pre-foreclosure / foreclosure / motivated-seller / off-market\n`);

  writeUploadProgress({
    status: "running",
    importSource: args.importSource,
    goal: pool.length,
    processedIndex: startIndex,
    uploaded,
    skipped,
    errors,
    photos,
    categoryCounts,
    lastAddress: null,
    lastCity: null,
  });

  let pending = [];

  for (let i = startIndex; i < pool.length; i++) {
    const seed = pool[i];
    const extracted = extractListingFromHarvestSeed(ROOT, seed, args.importSource);

    if (extracted.error) {
      skipped++;
      writeUploadProgress({
        status: "running",
        importSource: args.importSource,
        goal: pool.length,
        processedIndex: i + 1,
        uploaded,
        skipped,
        errors,
        photos,
        categoryCounts,
        lastAddress: seed.address,
        lastCity: seed.city,
      });
      continue;
    }

    try {
      const imageUrl = await ensurePublicPhoto(ROOT, seed.listingId, extracted.raw.overviewPhotoUrl);
      if (imageUrl) photos++;
      const listing = mapRawToSyncListing(extracted.raw, imageUrl);
      const cat = resolvePropertyRadarCategory(listing);
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
      pending.push(listing);

      if (pending.length >= args.dbBatch) {
        await upsertPropertyRadarListings(pending, scrapedAt);
        uploaded += pending.length;
        pending = [];
      }
    } catch (error) {
      errors++;
      console.error(`  error ${seed.listingId}: ${error.message}`);
    }

    if ((i + 1) % 50 === 0 || i === pool.length - 1) {
      writeUploadProgress({
        status: "running",
        importSource: args.importSource,
        goal: pool.length,
        processedIndex: i + 1,
        uploaded: uploaded + pending.length,
        skipped,
        errors,
        photos,
        categoryCounts,
        lastAddress: seed.address,
        lastCity: seed.city,
      });
      console.log(
        `  … ${i + 1}/${pool.length} processed | uploaded ~${uploaded + pending.length} | skip ${skipped} | err ${errors}`,
      );
    }
  }

  if (pending.length) {
    await upsertPropertyRadarListings(pending, scrapedAt);
    uploaded += pending.length;
  }

  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(
    `UPDATE listing_sources SET last_scraped_at = $1, updated_at = NOW() WHERE id = 'propertyradar'`,
    [scrapedAt],
  );
  await client.end();

  writeUploadProgress({
    status: "done",
    importSource: args.importSource,
    goal: pool.length,
    processedIndex: pool.length,
    uploaded,
    skipped,
    errors,
    photos,
    categoryCounts,
  });

  console.log(`\nDone — uploaded ${uploaded}, skipped ${skipped}, errors ${errors}, photos ${photos}`);
  console.log("Categories:", categoryCounts);
  console.log(`\nIdentify in Supabase: metadata->>'importSource' = '${args.importSource}'`);
  console.log(`              OR source_id = 'propertyradar' AND tags @> ARRAY['PropertyRadar']`);
}

main().catch((error) => {
  writeUploadProgress({ status: "error", message: error.message });
  console.error(error);
  process.exit(1);
});
