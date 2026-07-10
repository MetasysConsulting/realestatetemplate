import { NextResponse } from "next/server";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
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
    const reveal = await shouldRevealBrowseDetails();
    const suggestions = await fetchSearchSuggestions(q);
    const gated = reveal
      ? suggestions
      : suggestions.filter((item) => item.type !== "address");

    return NextResponse.json(
      { suggestions: gated },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("[api/search/suggest] failed:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
