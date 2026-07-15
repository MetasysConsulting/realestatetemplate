import { NextResponse, type NextRequest } from "next/server";
import { searchListings } from "@/lib/listings-repository";
import { maybeRedactPropertyListings } from "@/lib/listing-browse-redact";
import { shouldRevealBrowseDetails } from "@/lib/listing-browse-access";
import { parseMapBoundsParams } from "@/lib/map-bounds";
import { normalizeStateQuery } from "@/lib/us-states";

export const dynamic = "force-dynamic";

function readParam(url: URL, key: string): string {
  return url.searchParams.get(key)?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const q = readParam(url, "q");
  const state = normalizeStateQuery(readParam(url, "state"));
  const propertyType = readParam(url, "propertyType");
  const beds = Number(readParam(url, "beds")) || 0;
  const baths = Number(readParam(url, "baths")) || 0;
  const minPrice = Number(readParam(url, "minPrice")) || 0;
  const maxPrice = Number(readParam(url, "maxPrice")) || 0;
  const page = Math.max(1, Number(readParam(url, "page")) || 1);
  const pageSize = Math.min(100, Math.max(20, Number(readParam(url, "pageSize")) || 40));
  const bounds = parseMapBoundsParams({
    minLat: readParam(url, "minLat"),
    maxLat: readParam(url, "maxLat"),
    minLng: readParam(url, "minLng"),
    maxLng: readParam(url, "maxLng"),
  });

  const { listings, total } = await searchListings({
    q,
    state,
    propertyType,
    beds,
    baths,
    minPrice,
    maxPrice,
    bounds,
    page,
    pageSize,
  });

  const reveal = await shouldRevealBrowseDetails();
  const gatedListings = maybeRedactPropertyListings(listings, reveal);

  return NextResponse.json({
    listings: gatedListings,
    total: typeof total === "number" ? total : null,
    page,
    pageSize,
  });
}
