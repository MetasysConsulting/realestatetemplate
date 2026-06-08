import { APPROVED_AUCTION_IMAGE_FILES } from "./approved-auction-images.mjs";

const SECTION_LISTING_IMAGE =
  /\/images\/section\/(?:box-house(?:-list)?|property-detail|compare|project)[^"'()\s]*\.jpg/gi;

const MOCK_OPENING_BIDS = [
  79_500, 92_000, 108_500, 124_000, 89_900, 156_000, 134_500, 98_750, 142_000, 115_600,
  87_200, 168_900, 121_400, 95_800, 149_000, 103_250, 176_500, 88_400, 132_800, 97_600,
  145_900, 112_300, 84_700, 159_200,
];

const LISTING_PAGE_FILES =
  /^property-|^compare\.html$|^agents-details\.html$|^agency-details\.html$|^project-list\.html$|^home(?:0[2-9]|10)\.html$/;

function nextImage(counter) {
  const file = APPROVED_AUCTION_IMAGE_FILES[counter.index % APPROVED_AUCTION_IMAGE_FILES.length];
  counter.index += 1;
  return `/images/auction-properties/${file}`;
}

function nextBid(counter) {
  const value = MOCK_OPENING_BIDS[counter.index % MOCK_OPENING_BIDS.length];
  counter.index += 1;
  return `$${value.toLocaleString("en-US")}`;
}

/** Swap template stock listing photos for approved auction property images. */
export function applyListingPageImages(html) {
  const imageCounter = { index: 0 };
  let out = html.replace(SECTION_LISTING_IMAGE, () => nextImage(imageCounter));

  const bidCounter = { index: 0 };
  out = out.replace(/\$8\.600/g, () => nextBid(bidCounter));
  out = out.replace(/\$8,600/g, () => nextBid(bidCounter));

  out = out.replace(
    /<li class="flat-tag text-4 bg-main fw-6 text_white">Featured\s*<\/li>/g,
    '<li class="flat-tag text-4 bg-main fw-6 text_white">New</li>',
  );
  out = out.replace(
    /<li class="flat-tag text-4 bg-3 fw-6 text_white">For Sale<\/li>/g,
    '<li class="flat-tag text-4 bg-3 fw-6 text_white">Auction</li>',
  );

  return out;
}

export function isListingTemplateFile(filename) {
  return LISTING_PAGE_FILES.test(filename);
}
