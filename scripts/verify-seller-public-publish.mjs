/**
 * Deep integration checks for seller → public listings publish flow.
 * Usage: node scripts/verify-seller-public-publish.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvLocal();

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const PROP_ID = "00000000-0000-4000-8000-000000000088";
const LISTING_ID = `seller-${PROP_ID}`;
const USER_ID = "00000000-0000-4000-8000-000000000077";

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  await client.connect();

  // --- 1) Ensure source ---
  await client.query(`
    INSERT INTO listing_sources (id, name, source_url)
    VALUES ('seller', 'REOVANA Seller Listings', 'https://www.reovana.com/sell')
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, source_url = EXCLUDED.source_url, updated_at = NOW()
  `);
  console.log("OK 1 listing_sources.seller");

  // --- 2) Upsert matching app payload shape ---
  const metadata = {
    sellerPropertyId: PROP_ID,
    userId: USER_ID,
    title: "Coral Gables FSBO",
    description: "Bright 3/2 with updated kitchen.",
    imageUrls: [
      "https://example.com/a.jpg",
      "https://example.com/b.jpg",
    ],
    videoUrl: null,
    virtualTourUrl: null,
    garage: 1,
  };

  await client.query(
    `
    INSERT INTO listings (
      id, source_id, category, external_id,
      address, city, state, zip, county,
      price, price_label, bedrooms, bathrooms, square_footage, lot_size, year_built,
      property_type, status, tags, lat, lng,
      image_url, detail_url, source_agency,
      is_new, is_active, metadata, scraped_at, updated_at
    ) VALUES (
      $1, 'seller', 'off-market', $2,
      '2100 Test Seller St', 'Miami', 'FL', '33133', 'Miami-Dade',
      725000, 'List Price', 3, 2, 1680, 5000, '1998',
      'Single Family', 'For Sale',
      ARRAY['Seller listing','FSBO','REOVANA'],
      25.72, -80.26,
      $3, $4, 'REOVANA Seller',
      true, true, $5::jsonb, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      is_active = true,
      status = 'For Sale',
      price = EXCLUDED.price,
      metadata = EXCLUDED.metadata,
      image_url = EXCLUDED.image_url,
      updated_at = NOW()
    `,
    [
      LISTING_ID,
      PROP_ID,
      metadata.imageUrls[0],
      `/buy/off-market/${LISTING_ID}`,
      JSON.stringify(metadata),
    ],
  );
  console.log("OK 2 upsert seller listing", LISTING_ID);

  // --- 3) Anon RLS can read active ---
  assert(SUPABASE_URL && ANON_KEY, "Supabase anon credentials missing");
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: pub, error: pubErr } = await anon
    .from("listings")
    .select("id, is_active, source_id, category, address, price, metadata, detail_url, image_url")
    .eq("id", LISTING_ID)
    .eq("is_active", true)
    .maybeSingle();
  assert(!pubErr, `anon read error: ${pubErr?.message}`);
  assert(pub, "anon cannot see active seller listing");
  assert(pub.source_id === "seller", "source_id mismatch");
  assert(pub.category === "off-market", "category mismatch");
  assert(pub.detail_url === `/buy/off-market/${LISTING_ID}`, "detail_url mismatch");
  assert(pub.metadata?.title === "Coral Gables FSBO", "metadata title missing");
  assert(Array.isArray(pub.metadata?.imageUrls) && pub.metadata.imageUrls.length === 2, "gallery missing");
  console.log("OK 3 anon RLS + metadata shape");

  // --- 4) Search-style filters (map/search API path) ---
  const { data: searchHits, error: searchErr } = await anon
    .from("listings")
    .select("id")
    .eq("is_active", true)
    .ilike("city", "%Miami%")
    .gte("price", 700000)
    .lte("price", 800000);
  assert(!searchErr, `search error: ${searchErr?.message}`);
  assert(
    (searchHits || []).some((r) => r.id === LISTING_ID),
    "seller listing missing from price+city search",
  );
  console.log("OK 4 search filters include seller listing");

  // --- 5) Off-market category query ---
  const { data: offMarket, error: omErr } = await anon
    .from("listings")
    .select("id")
    .eq("is_active", true)
    .eq("source_id", "seller")
    .eq("category", "off-market");
  assert(!omErr, `off-market error: ${omErr?.message}`);
  assert((offMarket || []).some((r) => r.id === LISTING_ID), "missing from seller off-market");
  console.log("OK 5 off-market seller category");

  // --- 6) Map bounds query ---
  const { data: boundsHits, error: boundsErr } = await anon
    .from("listings")
    .select("id")
    .eq("is_active", true)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .gte("lat", 25.5)
    .lte("lat", 26.0)
    .gte("lng", -80.5)
    .lte("lng", -80.0);
  assert(!boundsErr, `bounds error: ${boundsErr?.message}`);
  assert(
    (boundsHits || []).some((r) => r.id === LISTING_ID),
    "seller listing missing from map bounds",
  );
  console.log("OK 6 map bounds include seller listing");

  // --- 7) Deactivate by id list (cancel-sub path) ---
  await client.query(
    `UPDATE listings SET is_active = false, status = 'Inactive', updated_at = NOW()
     WHERE id = ANY($1::text[])`,
    [[LISTING_ID]],
  );
  const { data: hidden } = await anon
    .from("listings")
    .select("id")
    .eq("id", LISTING_ID)
    .eq("is_active", true)
    .maybeSingle();
  assert(!hidden, "still visible after deactivate");
  console.log("OK 7 deactivate hides from anon");

  // --- 8) Reactivate (renew-sub path) ---
  await client.query(
    `UPDATE listings SET is_active = true, status = 'For Sale', updated_at = NOW() WHERE id = $1`,
    [LISTING_ID],
  );
  const { data: again } = await anon
    .from("listings")
    .select("id")
    .eq("id", LISTING_ID)
    .eq("is_active", true)
    .maybeSingle();
  assert(again, "not visible after reactivate");
  console.log("OK 8 reactivate restores public visibility");

  // --- 9) UNIQUE(source_id, external_id) still holds ---
  const dup = await client.query(
    `SELECT id FROM listings WHERE source_id = 'seller' AND external_id = $1`,
    [PROP_ID],
  );
  assert(dup.rows.length === 1, `expected 1 row for external_id, got ${dup.rows.length}`);
  console.log("OK 9 unique source+external_id");

  // cleanup
  await client.query(`DELETE FROM listings WHERE id = $1`, [LISTING_ID]);
  console.log("OK cleanup");
  console.log("ALL_CHECKS_PASSED");
} catch (err) {
  console.error("FAIL", err instanceof Error ? err.message : err);
  try {
    await client.query(`DELETE FROM listings WHERE id = $1`, [LISTING_ID]);
  } catch {
    /* ignore */
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
