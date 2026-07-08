#!/usr/bin/env node
/**
 * Upload PropertyRadar JPGs → Supabase Storage, update listings.image_url.
 *
 * Requires a server secret key in .env.local (Dashboard → Settings → API → Secret keys).
 *
 * Accepts SUPABASE_SECRET_KEY (new sb_secret_… keys) or SUPABASE_SERVICE_ROLE_KEY (legacy).
 *
 * Usage:
 *   pnpm db:migrate supabase/migrations/005_listing_images_storage.sql
 *   pnpm upload-propertyradar-photos
 *   pnpm upload-propertyradar-photos -- --limit 100
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { HARVEST_FILE } from "./lib/propertyradar-supabase-batch.mjs";
import { PILOT_ROOT } from "./lib/propertyradar-pilot-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BUCKET = "listing-images";
const STORAGE_PREFIX = "propertyradar";
const PUBLIC_PHOTOS = path.join(ROOT, "public", "listings", "propertyradar");
const PROGRESS_FILE = path.join(PILOT_ROOT, "photo-upload-progress.json");

function parseArgs(argv) {
  const args = { limit: Infinity, offset: 0, concurrency: 8, resume: true };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--offset") args.offset = Number(argv[++i]);
    else if (arg === "--concurrency") args.concurrency = Number(argv[++i]);
    else if (arg === "--no-resume") args.resume = false;
  }
  return args;
}

function publicStorageUrl(supabaseUrl, objectPath) {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

function readProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeProgress(state) {
  fs.mkdirSync(PILOT_ROOT, { recursive: true });
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2),
  );
}

async function ensureBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((b) => b.id === BUCKET || b.name === BUCKET)) return;

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (createError && !/already exists/i.test(createError.message)) {
    throw createError;
  }
}

async function uploadOne(supabase, listingId, filePath) {
  const objectPath = `${STORAGE_PREFIX}/${listingId}.jpg`;
  const body = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, body, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return objectPath;
}

async function updateListingImage(pool, listingId, imageUrl) {
  await pool.query(
    `UPDATE listings
     SET image_url = $1,
         metadata = metadata || $2::jsonb,
         updated_at = NOW()
     WHERE id = $3 AND source_id = 'propertyradar'`,
    [
      imageUrl,
      JSON.stringify({ imageUrl, hasImage: true, pendingImage: false, storagePath: `${STORAGE_PREFIX}/${listingId}.jpg` }),
      listingId,
    ],
  );
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  async function next() {
    while (index < items.length) {
      const i = index++;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!serviceKey) {
    throw new Error(
      "Server secret key missing — add SUPABASE_SECRET_KEY to .env.local (Dashboard → API → Secret keys, sb_secret_…)",
    );
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

  const args = parseArgs(process.argv);
  const harvest = JSON.parse(fs.readFileSync(HARVEST_FILE, "utf8"));
  const listingIds = harvest.listings
    .slice(args.offset, args.offset + (Number.isFinite(args.limit) ? args.limit : harvest.listings.length))
    .map((l) => l.listingId)
    .filter((id) => {
      const file = path.join(PUBLIC_PHOTOS, `${id}.jpg`);
      return fs.existsSync(file) && fs.statSync(file).size > 1000;
    });

  let startIndex = 0;
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  if (args.resume) {
    const prev = readProgress();
    if (prev?.status === "running" || prev?.status === "done") {
      startIndex = prev.processedIndex ?? 0;
      uploaded = prev.uploaded ?? 0;
      skipped = prev.skipped ?? 0;
      errors = prev.errors ?? 0;
      console.log(`Resuming photo upload at ${startIndex}/${listingIds.length}`);
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await ensureBucket(supabase);

  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: args.concurrency,
  });

  const queue = listingIds.slice(startIndex);
  console.log(`Uploading ${queue.length} photos (~1.2GB total) to Supabase Storage bucket "${BUCKET}"`);
  console.log(`Concurrency: ${args.concurrency}`);
  console.log(`Live counter: pnpm upload-propertyradar-photos-watch\n`);

  writeProgress({
    status: "running",
    goal: listingIds.length,
    processedIndex: startIndex,
    uploaded,
    skipped,
    errors,
  });

  const started = Date.now();

  await runPool(queue, args.concurrency, async (listingId, offsetInQueue) => {
    const filePath = path.join(PUBLIC_PHOTOS, `${listingId}.jpg`);
    const processedIndex = startIndex + offsetInQueue + 1;

    try {
      const objectPath = await uploadOne(supabase, listingId, filePath);
      const imageUrl = publicStorageUrl(supabaseUrl, objectPath);
      await updateListingImage(pgPool, listingId, imageUrl);
      uploaded++;
    } catch (error) {
      if (/already exists/i.test(error.message)) {
        const imageUrl = publicStorageUrl(supabaseUrl, `${STORAGE_PREFIX}/${listingId}.jpg`);
        await updateListingImage(pgPool, listingId, imageUrl);
        skipped++;
      } else {
        errors++;
        console.error(`  error ${listingId}: ${error.message}`);
      }
    }

    if (processedIndex % 10 === 0 || processedIndex === listingIds.length) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = (processedIndex - startIndex) / Math.max(elapsed, 1);
      const remaining = listingIds.length - processedIndex;
      const etaMin = Math.ceil(remaining / Math.max(rate, 0.1) / 60);
      writeProgress({
        status: "running",
        goal: listingIds.length,
        processedIndex,
        uploaded,
        skipped,
        errors,
        etaMinutes: etaMin,
      });
      console.log(
        `  … ${processedIndex}/${listingIds.length} | uploaded ${uploaded} | skip ${skipped} | err ${errors} | ~${etaMin}m left`,
      );
    }
  });

  await pgPool.end();

  writeProgress({
    status: "done",
    goal: listingIds.length,
    processedIndex: listingIds.length,
    uploaded,
    skipped,
    errors,
  });

  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\nDone in ${mins} min — uploaded ${uploaded}, skipped ${skipped}, errors ${errors}`);
  console.log(`Public URL pattern: ${publicStorageUrl(supabaseUrl, `${STORAGE_PREFIX}/<listingId>.jpg`)}`);
}

main().catch((error) => {
  writeProgress({ status: "error", message: error.message });
  console.error(error);
  process.exit(1);
});
