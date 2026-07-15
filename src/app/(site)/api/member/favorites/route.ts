import { NextResponse, type NextRequest } from "next/server";
import {
  addFavorite,
  listMyFavoriteIds,
  removeFavorite,
} from "@/lib/member/favorites";
import { getAuthUser } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const ids = await listMyFavoriteIds();
  return NextResponse.json({ ids });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { listingId?: string };
  const listingId = String(body.listingId ?? "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  const result = await addFavorite(listingId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const listingId = request.nextUrl.searchParams.get("listingId")?.trim() ?? "";
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  const result = await removeFavorite(listingId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
