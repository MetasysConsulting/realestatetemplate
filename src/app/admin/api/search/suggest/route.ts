import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/require-admin";
import { fetchAdminSearchSuggestions } from "@/lib/admin/admin-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const result = await fetchAdminSearchSuggestions(q);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
