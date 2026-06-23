export function hasListingImage(imageUrl: string | null | undefined): boolean {
  return Boolean(imageUrl?.trim());
}

export function resolveListingImage(imageUrl: string | null | undefined): {
  hasImage: boolean;
  imageUrl: string | null;
} {
  const trimmed = imageUrl?.trim() ?? "";
  if (!trimmed) {
    return { hasImage: false, imageUrl: null };
  }

  return { hasImage: true, imageUrl: trimmed };
}

/** SQL: `WHERE has_image = false` or `WHERE image_url IS NULL` */
export const LISTINGS_MISSING_IMAGE_FILTER = "has_image = false";
