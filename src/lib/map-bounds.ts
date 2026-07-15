export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export function isValidMapBounds(bounds: MapBounds | null | undefined): bounds is MapBounds {
  if (!bounds) return false;
  const { minLat, maxLat, minLng, maxLng } = bounds;
  return (
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat) &&
    Number.isFinite(minLng) &&
    Number.isFinite(maxLng) &&
    minLat < maxLat &&
    minLng < maxLng &&
    minLat >= -90 &&
    maxLat <= 90 &&
    minLng >= -180 &&
    maxLng <= 180
  );
}

export function parseMapBoundsParams(input: {
  minLat?: string;
  maxLat?: string;
  minLng?: string;
  maxLng?: string;
}): MapBounds | null {
  const minLat = Number(input.minLat);
  const maxLat = Number(input.maxLat);
  const minLng = Number(input.minLng);
  const maxLng = Number(input.maxLng);
  const bounds = { minLat, maxLat, minLng, maxLng };
  return isValidMapBounds(bounds) ? bounds : null;
}

export function appendMapBoundsParams(
  params: URLSearchParams,
  bounds: MapBounds | null | undefined,
): void {
  if (!isValidMapBounds(bounds)) return;
  params.set("minLat", bounds.minLat.toFixed(5));
  params.set("maxLat", bounds.maxLat.toFixed(5));
  params.set("minLng", bounds.minLng.toFixed(5));
  params.set("maxLng", bounds.maxLng.toFixed(5));
}

export function mapBoundsKey(bounds: MapBounds | null | undefined): string {
  if (!isValidMapBounds(bounds)) return "";
  return [
    bounds.minLat.toFixed(4),
    bounds.maxLat.toFixed(4),
    bounds.minLng.toFixed(4),
    bounds.maxLng.toFixed(4),
  ].join("|");
}
