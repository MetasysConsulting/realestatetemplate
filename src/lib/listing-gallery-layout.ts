export type GalleryImageLayout = "landscape" | "portrait" | "square" | "small";

export type GalleryImageFit = "cover" | "contain";

export type GalleryImageMeta = {
  width: number;
  height: number;
  layout: GalleryImageLayout;
  fit: GalleryImageFit;
};

export type GalleryFrameVariant = "hero" | "thumb";

export type GalleryFrameStyle = {
  width?: string;
  maxWidth?: string;
  maxHeight?: number | string;
  height?: string;
  aspectRatio?: string;
  margin?: string;
};

const SMALL_MAX_DIMENSION = 520;
const SMALL_MAX_WIDTH = 640;
const SMALL_MAX_HEIGHT = 480;

export function classifyGalleryImage(width: number, height: number): GalleryImageMeta {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0, layout: "landscape", fit: "cover" };
  }

  const ratio = width / height;
  const maxDim = Math.max(width, height);

  if (maxDim < SMALL_MAX_DIMENSION || (width < SMALL_MAX_WIDTH && height < SMALL_MAX_HEIGHT)) {
    return { width, height, layout: "small", fit: "contain" };
  }

  if (ratio >= 1.3) {
    return { width, height, layout: "landscape", fit: "cover" };
  }

  if (ratio <= 0.82) {
    return { width, height, layout: "portrait", fit: "contain" };
  }

  return { width, height, layout: "square", fit: "cover" };
}

export function galleryFrameStyle(
  meta: GalleryImageMeta | null,
  variant: GalleryFrameVariant,
): GalleryFrameStyle | undefined {
  if (!meta || meta.width <= 0 || meta.height <= 0) return undefined;

  const hero = variant === "hero";
  const maxHeight = hero ? 520 : 220;

  if (meta.layout === "small") {
    const cap = hero ? 960 : 320;
    const width = Math.min(meta.width, cap);
    const height = Math.round((width / meta.width) * meta.height);
    return {
      width: `${width}px`,
      maxWidth: "100%",
      height: `${height}px`,
      maxHeight: hero ? 420 : 180,
    };
  }

  if (meta.layout === "portrait") {
    return {
      aspectRatio: `${meta.width} / ${meta.height}`,
      maxHeight: hero ? 480 : 200,
      maxWidth: hero ? `min(100%, ${Math.min(meta.width, 520)}px)` : "100%",
      width: hero ? "auto" : "100%",
    };
  }

  if (meta.layout === "square") {
    const cap = hero ? 480 : 200;
    const size = Math.min(meta.width, meta.height, cap);
    return {
      aspectRatio: "1 / 1",
      maxWidth: hero ? `min(100%, ${size}px)` : "100%",
      maxHeight: hero ? size : 200,
      width: hero ? "auto" : "100%",
    };
  }

  return {
    aspectRatio: `${meta.width} / ${meta.height}`,
    maxHeight,
    width: "100%",
  };
}
