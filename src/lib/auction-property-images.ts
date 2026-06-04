import type { BuyCategoryKey } from "@/lib/buy-categories";

/** User-rejected review images (not houses or off-brand). */
const REJECTED_FILES = new Set([
  "03-modern-glass-facade.jpg",
  "11-new-construction.jpg",
  "15-blue-trim-cottage.jpg",
  "16-stone-accent-facade.jpg",
  "17-older-wood-siding.jpg",
  "18-peeling-paint-older.jpg",
  "19-overgrown-yard.jpg",
  "31-commercial-warehouse.jpg",
]);

type ApprovedImage = {
  file: string;
  categories: BuyCategoryKey[];
};

const SOURCES: ApprovedImage[] = [
  { file: "01-suburban-two-story.jpg", categories: ["all", "bank-owned", "non-bank-owned"] },
  { file: "02-white-colonial.jpg", categories: ["all", "non-bank-owned"] },
  { file: "04-brick-ranch.jpg", categories: ["all", "bank-owned", "short-sale"] },
  { file: "05-craftsman-porch.jpg", categories: ["all", "non-bank-owned"] },
  { file: "06-mediterranean-stucco.jpg", categories: ["all", "short-sale"] },
  { file: "07-yellow-victorian.jpg", categories: ["all", "second-chance-foreclosure"] },
  { file: "08-lakefront-cottage.jpg", categories: ["all", "non-bank-owned"] },
  { file: "09-wood-siding-bungalow.jpg", categories: ["all", "foreclosure-homes"] },
  { file: "10-red-brick-two-story.jpg", categories: ["all", "bank-owned"] },
  { file: "12-gray-siding-split-level.jpg", categories: ["all", "short-sale"] },
  { file: "13-farmhouse-white.jpg", categories: ["all", "second-chance-foreclosure"] },
  { file: "14-condo-townhome-row.jpg", categories: ["all", "short-sale"] },
  { file: "20-vacant-lot-house.jpg", categories: ["foreclosure-homes", "short-sale"] },
  { file: "21-duplex-side-by-side.jpg", categories: ["all", "short-sale"] },
  { file: "22-urban-row-homes.jpg", categories: ["all", "foreclosure-homes"] },
  { file: "23-snow-cape-cod.jpg", categories: ["all", "bank-owned"] },
  { file: "24-pool-backyard-view.jpg", categories: ["all", "non-bank-owned"] },
  { file: "25-driveway-garage.jpg", categories: ["all", "bank-owned"] },
  { file: "26-corner-lot-bungalow.jpg", categories: ["all", "second-chance-foreclosure"] },
  { file: "27-hillside-home.jpg", categories: ["all", "non-bank-owned"] },
  { file: "28-palm-tree-suburban.jpg", categories: ["all", "short-sale"] },
  { file: "29-commercial-office-glass.jpg", categories: ["commercial"] },
  { file: "30-commercial-retail-strip.jpg", categories: ["commercial"] },
  { file: "32-commercial-mixed-use.jpg", categories: ["commercial"] },
];

export const APPROVED_AUCTION_IMAGES = SOURCES.filter((img) => !REJECTED_FILES.has(img.file));

const RESIDENTIAL_POOL = APPROVED_AUCTION_IMAGES.filter((img) =>
  img.categories.includes("commercial") ? false : true,
);

const COMMERCIAL_POOL = APPROVED_AUCTION_IMAGES.filter((img) =>
  img.categories.includes("commercial"),
);

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function poolForBuyType(buyType: BuyCategoryKey): ApprovedImage[] {
  if (buyType === "commercial") {
    return COMMERCIAL_POOL.length ? COMMERCIAL_POOL : APPROVED_AUCTION_IMAGES;
  }

  const matched = APPROVED_AUCTION_IMAGES.filter(
    (img) => img.categories.includes(buyType) || img.categories.includes("all"),
  );

  return matched.length ? matched : RESIDENTIAL_POOL;
}

/** Public URL for an approved auction listing thumbnail. */
export function getAuctionPropertyImageUrl(propertyId: string, buyType: BuyCategoryKey): string {
  const pool = poolForBuyType(buyType);
  const index = hashString(propertyId) % pool.length;
  return `/images/auction-properties/${pool[index].file}`;
}
