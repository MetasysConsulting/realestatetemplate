import { NextResponse, type NextRequest } from "next/server";
import { createSellerPropertyDraft } from "@/lib/seller/properties";
import { getAuthUser } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

function numOrNull(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.map((u) => String(u))
    : [];

  const result = await createSellerPropertyDraft({
    title: strOrNull(body.title),
    address: String(body.address ?? ""),
    city: String(body.city ?? ""),
    state: String(body.state ?? ""),
    zip: String(body.zip ?? ""),
    county: strOrNull(body.county),
    price: numOrNull(body.price),
    bedrooms: numOrNull(body.bedrooms),
    bathrooms: numOrNull(body.bathrooms),
    squareFootage: numOrNull(body.squareFootage),
    lotSize: numOrNull(body.lotSize),
    yearBuilt: numOrNull(body.yearBuilt),
    garage: numOrNull(body.garage),
    propertyType: strOrNull(body.propertyType),
    listingStatus: strOrNull(body.listingStatus),
    description: strOrNull(body.description),
    videoUrl: strOrNull(body.videoUrl),
    virtualTourUrl: strOrNull(body.virtualTourUrl),
    lat: numOrNull(body.lat),
    lng: numOrNull(body.lng),
    imageUrls,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
