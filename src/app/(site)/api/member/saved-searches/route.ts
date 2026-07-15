import { NextResponse, type NextRequest } from "next/server";
import {
  createSavedSearch,
  deleteSavedSearch,
  listMySavedSearches,
} from "@/lib/member/saved-searches";
import { getAuthUser } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const searches = await listMySavedSearches();
  return NextResponse.json({ searches });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    searchUrl?: string;
    queryJson?: Record<string, unknown>;
    emailAlerts?: boolean;
  };

  const result = await createSavedSearch({
    title: String(body.title ?? ""),
    searchUrl: String(body.searchUrl ?? ""),
    queryJson: body.queryJson,
    emailAlerts: body.emailAlerts,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const result = await deleteSavedSearch(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
