import "server-only";

import pg from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";
import { offMarketDetailPath } from "@/lib/property-categories";
import type { SellerPropertyRow } from "@/lib/seller/property-types";

export const SELLER_LISTING_SOURCE_ID = "seller";
export const SELLER_PUBLIC_CATEGORY = "off-market";

const { Client } = pg;

export function sellerPublicListingId(sellerPropertyId: string): string {
  return `seller-${sellerPropertyId.trim()}`;
}

export function sellerPropertyIdFromPublicListingId(listingId: string): string | null {
  const id = listingId.trim();
  if (!id.startsWith("seller-")) return null;
  const uuid = id.slice("seller-".length);
  return uuid || null;
}

function serviceClient(): SupabaseClient | null {
  const url = getSupabaseProjectUrl();
  const key = getSupabaseServiceRoleKey()?.trim();
  // Reject empty / placeholder keys (local stub values are often 0–2 chars).
  if (!url || !key || key.length < 20) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

async function withPg<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("Neither a valid service role key nor DATABASE_URL is configured.");
  }
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

function buildListingPayload(
  property: SellerPropertyRow,
  userId: string,
  isActive: boolean,
) {
  const imageUrls = (property.imageUrls ?? []).filter(Boolean).slice(0, 12);
  const listingId = sellerPublicListingId(property.id);
  const yearBuilt =
    property.yearBuilt != null && Number.isFinite(property.yearBuilt)
      ? String(Math.round(property.yearBuilt))
      : null;

  const stateRaw = (property.state || "").trim().toUpperCase();
  const state = stateRaw.length >= 2 ? stateRaw.slice(0, 2) : "FL";

  return {
    id: listingId,
    source_id: SELLER_LISTING_SOURCE_ID,
    category: SELLER_PUBLIC_CATEGORY,
    external_id: property.id,
    address: property.address,
    city: property.city,
    state,
    zip: property.zip,
    county: property.county,
    price: property.price ?? 0,
    price_label: "List Price",
    bedrooms: Math.max(0, Math.round(property.bedrooms ?? 0)),
    bathrooms: property.bathrooms ?? 0,
    square_footage: Math.max(0, Math.round(property.squareFootage ?? 0)),
    lot_size: property.lotSize,
    year_built: yearBuilt,
    property_type: property.propertyType || "Residential",
    status: property.listingStatus || (isActive ? "For Sale" : "Inactive"),
    tags: ["Seller listing", "FSBO", "REOVANA"],
    lat: property.lat,
    lng: property.lng,
    image_url: imageUrls[0] ?? null,
    detail_url: offMarketDetailPath(listingId),
    source_agency: "REOVANA Seller",
    is_new: true,
    is_active: isActive,
    metadata: {
      sellerPropertyId: property.id,
      userId,
      title: property.title,
      description: property.description,
      imageUrls,
      videoUrl: property.videoUrl,
      virtualTourUrl: property.virtualTourUrl,
      garage: property.garage,
    },
    scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function upsertViaPg(
  payload: ReturnType<typeof buildListingPayload>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await withPg(async (client) => {
      await client.query(
        `
        INSERT INTO listings (
          id, source_id, category, external_id,
          address, city, state, zip, county,
          price, price_label, bedrooms, bathrooms, square_footage, lot_size, year_built,
          property_type, status, tags,
          lat, lng, image_url, detail_url, source_agency,
          is_new, is_active, metadata, scraped_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19,
          $20, $21, $22, $23, $24,
          $25, $26, $27::jsonb, $28::timestamptz, $29::timestamptz
        )
        ON CONFLICT (id) DO UPDATE SET
          source_id = EXCLUDED.source_id,
          category = EXCLUDED.category,
          external_id = EXCLUDED.external_id,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip = EXCLUDED.zip,
          county = EXCLUDED.county,
          price = EXCLUDED.price,
          price_label = EXCLUDED.price_label,
          bedrooms = EXCLUDED.bedrooms,
          bathrooms = EXCLUDED.bathrooms,
          square_footage = EXCLUDED.square_footage,
          lot_size = EXCLUDED.lot_size,
          year_built = EXCLUDED.year_built,
          property_type = EXCLUDED.property_type,
          status = EXCLUDED.status,
          tags = EXCLUDED.tags,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          image_url = EXCLUDED.image_url,
          detail_url = EXCLUDED.detail_url,
          source_agency = EXCLUDED.source_agency,
          is_new = EXCLUDED.is_new,
          is_active = EXCLUDED.is_active,
          metadata = EXCLUDED.metadata,
          scraped_at = EXCLUDED.scraped_at,
          updated_at = NOW()
        `,
        [
          payload.id,
          payload.source_id,
          payload.category,
          payload.external_id,
          payload.address,
          payload.city,
          payload.state,
          payload.zip,
          payload.county,
          payload.price,
          payload.price_label,
          payload.bedrooms,
          payload.bathrooms,
          payload.square_footage,
          payload.lot_size,
          payload.year_built,
          payload.property_type,
          payload.status,
          payload.tags,
          payload.lat,
          payload.lng,
          payload.image_url,
          payload.detail_url,
          payload.source_agency,
          payload.is_new,
          payload.is_active,
          JSON.stringify(payload.metadata),
          payload.scraped_at,
          payload.updated_at,
        ],
      );
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Postgres upsert failed.";
    console.error("[seller-public] pg upsert failed", message);
    return { ok: false, error: message };
  }
}

/** Upsert or refresh the public `listings` row for an active seller property. */
export async function upsertPublicListingFromSellerProperty(input: {
  property: SellerPropertyRow;
  userId: string;
  isActive?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const isActive = input.isActive ?? input.property.status === "active";
  const payload = buildListingPayload(input.property, input.userId, isActive);

  const client = serviceClient();
  if (client) {
    const { error } = await client.from("listings").upsert(payload, { onConflict: "id" });
    if (!error) return { ok: true };
    console.error("[seller-public] upsert failed, trying DATABASE_URL", error.message);
  }

  return upsertViaPg(payload);
}

export async function deactivatePublicListingForSellerProperty(
  sellerPropertyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const listingId = sellerPublicListingId(sellerPropertyId);
  const client = serviceClient();
  if (client) {
    const { error } = await client
      .from("listings")
      .update({ is_active: false, updated_at: new Date().toISOString(), status: "Inactive" })
      .eq("id", listingId);
    if (!error) return { ok: true };
    console.error("[seller-public] deactivate failed, trying DATABASE_URL", error.message);
  }

  try {
    await withPg(async (pgClient) => {
      await pgClient.query(
        `UPDATE listings SET is_active = false, status = 'Inactive', updated_at = NOW() WHERE id = $1`,
        [listingId],
      );
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Postgres deactivate failed.";
    return { ok: false, error: message };
  }
}

export async function deactivatePublicListingsForSellerUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Prefer explicit IDs — JSONB `.contains` can match 0 rows with no error.
  const client = serviceClient();
  if (client) {
    const { data: props, error: propsError } = await client
      .from("seller_properties")
      .select("id")
      .eq("user_id", userId);

    if (!propsError) {
      const ids = (props ?? []).map((p) => sellerPublicListingId(String(p.id)));
      if (ids.length) {
        const { error } = await client
          .from("listings")
          .update({ is_active: false, updated_at: new Date().toISOString(), status: "Inactive" })
          .in("id", ids);
        if (!error) return { ok: true };
        console.error("[seller-public] bulk deactivate failed, trying DATABASE_URL", error.message);
      } else {
        const { error } = await client
          .from("listings")
          .update({ is_active: false, updated_at: new Date().toISOString(), status: "Inactive" })
          .eq("source_id", SELLER_LISTING_SOURCE_ID)
          .contains("metadata", { userId });
        if (!error) return { ok: true };
      }
    }
  }

  try {
    await withPg(async (pgClient) => {
      const props = await pgClient.query<{ id: string }>(
        `SELECT id FROM seller_properties WHERE user_id = $1`,
        [userId],
      );
      const ids = props.rows.map((r) => sellerPublicListingId(String(r.id)));
      if (ids.length) {
        await pgClient.query(
          `UPDATE listings
           SET is_active = false, status = 'Inactive', updated_at = NOW()
           WHERE id = ANY($1::text[])`,
          [ids],
        );
      } else {
        await pgClient.query(
          `UPDATE listings
           SET is_active = false, status = 'Inactive', updated_at = NOW()
           WHERE source_id = $1 AND metadata->>'userId' = $2`,
          [SELLER_LISTING_SOURCE_ID, userId],
        );
      }
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Postgres bulk deactivate failed.";
    return { ok: false, error: message };
  }
}

export async function syncPublicListingForSellerPropertyId(input: {
  userId: string;
  propertyId: string;
  isActive: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const propertyId = input.propertyId.trim();
  let property: SellerPropertyRow | null = null;

  const client = serviceClient();
  if (client) {
    const { data, error } = await client
      .from("seller_properties")
      .select(
        "id, title, address, city, state, zip, county, price, bedrooms, bathrooms, square_footage, lot_size, year_built, garage, property_type, listing_status, description, video_url, virtual_tour_url, lat, lng, image_urls, status, created_at, updated_at",
      )
      .eq("user_id", input.userId)
      .eq("id", propertyId)
      .maybeSingle();

    if (!error && data) {
      property = mapSellerRow(data as Record<string, unknown>);
    }
  }

  if (!property) {
    try {
      property = await withPg(async (pgClient) => {
        const { rows } = await pgClient.query(
          `SELECT id, title, address, city, state, zip, county, price, bedrooms, bathrooms,
                  square_footage, lot_size, year_built, garage, property_type, listing_status,
                  description, video_url, virtual_tour_url, lat, lng, image_urls, status,
                  created_at, updated_at
           FROM seller_properties
           WHERE user_id = $1 AND id = $2
           LIMIT 1`,
          [input.userId, propertyId],
        );
        if (!rows[0]) return null;
        return mapSellerRow(rows[0] as Record<string, unknown>);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load seller property.";
      return { ok: false, error: message };
    }
  }

  if (!property) {
    return { ok: false, error: "Seller property not found." };
  }

  if (!input.isActive) {
    return deactivatePublicListingForSellerProperty(property.id);
  }
  return upsertPublicListingFromSellerProperty({
    property: { ...property, status: "active" },
    userId: input.userId,
    isActive: true,
  });
}

function mapSellerRow(row: Record<string, unknown>): SellerPropertyRow {
  const images = Array.isArray(row.image_urls)
    ? row.image_urls.map((u) => String(u)).filter(Boolean)
    : [];
  return {
    id: String(row.id),
    title: row.title == null ? null : String(row.title),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zip: String(row.zip ?? ""),
    county: row.county == null ? null : String(row.county),
    price: row.price == null ? null : Number(row.price),
    bedrooms: row.bedrooms == null ? null : Number(row.bedrooms),
    bathrooms: row.bathrooms == null ? null : Number(row.bathrooms),
    squareFootage: row.square_footage == null ? null : Number(row.square_footage),
    lotSize: row.lot_size == null ? null : Number(row.lot_size),
    yearBuilt: row.year_built == null ? null : Number(row.year_built),
    garage: row.garage == null ? null : Number(row.garage),
    propertyType: row.property_type == null ? null : String(row.property_type),
    listingStatus: row.listing_status == null ? null : String(row.listing_status),
    description: row.description == null ? null : String(row.description),
    videoUrl: row.video_url == null ? null : String(row.video_url),
    virtualTourUrl: row.virtual_tour_url == null ? null : String(row.virtual_tour_url),
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    imageUrls: images,
    status: String(row.status ?? "draft") as SellerPropertyRow["status"],
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
