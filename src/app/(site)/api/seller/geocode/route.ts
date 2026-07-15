import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ error: "Address query is required." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ReovanaSellerListings/1.0 (seller map pin)",
        },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoder unavailable." }, { status: 502 });
    }
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) {
      return NextResponse.json({ lat: null, lng: null });
    }
    return NextResponse.json({
      lat: Number(hit.lat),
      lng: Number(hit.lon),
    });
  } catch {
    return NextResponse.json({ error: "Geocode failed." }, { status: 502 });
  }
}
