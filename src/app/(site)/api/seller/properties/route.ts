import { NextResponse, type NextRequest } from "next/server";
import { createSellerPropertyDraft } from "@/lib/seller/properties";
import { getAuthUser } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

function numOrNull(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await createSellerPropertyDraft({
    address: String(body.address ?? ""),
    city: String(body.city ?? ""),
    state: String(body.state ?? ""),
    zip: String(body.zip ?? ""),
    price: numOrNull(body.price),
    bedrooms: numOrNull(body.bedrooms),
    bathrooms: numOrNull(body.bathrooms),
    squareFootage: numOrNull(body.squareFootage),
    description: body.description == null ? null : String(body.description),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
