import { NextResponse } from "next/server";
import { fetchSearchSuggestions } from "@/lib/search-suggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await fetchSearchSuggestions(q);
    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("[api/search/suggest] failed:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
