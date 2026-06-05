/** First six approved residential photos for the homepage luxury carousel. */
export const HOME_LISTING_IMAGES = [
  "01-suburban-two-story.jpg",
  "02-white-colonial.jpg",
  "04-brick-ranch.jpg",
  "05-craftsman-porch.jpg",
  "06-mediterranean-stucco.jpg",
  "07-yellow-victorian.jpg",
];

const TEMPLATE_LISTING_IMAGES = [
  "box-house.jpg",
  "box-house-2.jpg",
  "box-house-3.jpg",
  "box-house-4.jpg",
  "box-house-5.jpg",
  "box-house-6.jpg",
];

const NEIGHBORHOOD_LOCATIONS = [
  {
    oldImg: "location-9.jpg",
    newImg: "08-lakefront-cottage.jpg",
    city: "Tampa, Florida",
    count: "1,842",
  },
  {
    oldImg: "location-10.jpg",
    newImg: "09-wood-siding-bungalow.jpg",
    city: "Austin, Texas",
    count: "2,156",
  },
  {
    oldImg: "location-11.jpg",
    newImg: "10-red-brick-two-story.jpg",
    city: "Phoenix, Arizona",
    count: "1,973",
  },
  {
    oldImg: "location-12.jpg",
    newImg: "12-gray-siding-split-level.jpg",
    city: "Denver, Colorado",
    count: "1,508",
  },
  {
    oldImg: "location-13.jpg",
    newImg: "13-farmhouse-white.jpg",
    city: "Atlanta, Georgia",
    count: "2,304",
  },
  {
    oldImg: "location-14.jpg",
    newImg: "14-condo-townhome-row.jpg",
    city: "Houston, Texas",
    count: "2,617",
  },
  {
    oldImg: "location-15.jpg",
    newImg: "20-vacant-lot-house.jpg",
    city: "Cleveland, Ohio",
    count: "1,126",
  },
];

const OPEN_HOUSE_LISTINGS = [
  {
    oldImg: "box-house-list-1.jpg",
    newImg: "21-duplex-side-by-side.jpg",
    location: "Bonita Springs, Florida 34135",
  },
  {
    oldImg: "box-house-list-2.jpg",
    newImg: "22-urban-row-homes.jpg",
    location: "Houston, Texas 77002",
  },
  {
    oldImg: "box-house-list-3.jpg",
    newImg: "23-snow-cape-cod.jpg",
    location: "Denver, Colorado 80203",
  },
  {
    oldImg: "box-house-list-4.jpg",
    newImg: "24-pool-backyard-view.jpg",
    location: "Atlanta, Georgia 30309",
  },
];

function sliceSection(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start < 0) return null;
  const end = html.indexOf(endMarker, start);
  if (end < 0) return null;
  return { start, end, section: html.slice(start, end) };
}

function applyHomeListingImages(html) {
  let out = html;

  TEMPLATE_LISTING_IMAGES.forEach((oldFile, index) => {
    const newPath = `/images/auction-properties/${HOME_LISTING_IMAGES[index]}`;
    out = out.replaceAll(`/images/section/${oldFile}`, newPath);
  });

  out = out.replace(
    /<li class="flat-tag text-4 bg-main fw-6 text_white">Featured<\/li>/g,
    '<li class="flat-tag text-4 bg-main fw-6 text_white">New</li>',
  );

  return out;
}

function applyHomeNeighborhoods(html) {
  const block = sliceSection(html, "section-neighborhoods", "<!-- /.section-neighborhoods");
  if (!block) return html;

  let { section } = block;

  section = section.replace(
    /Find your dream apartment with our\s+listing/g,
    "Browse auction and bank-owned homes across the United States",
  );

  for (const loc of NEIGHBORHOOD_LOCATIONS) {
    section = section.replaceAll(
      `/images/section/${loc.oldImg}`,
      `/images/auction-properties/${loc.newImg}`,
    );
    section = section.replace(
      /<h6 class="text_white">New York<\/h6>/,
      `<h6 class="text_white">${loc.city}</h6>`,
    );
    section = section.replace(/2\.491\s*Properties/, `${loc.count} Properties`);
    section = section.replace(/href="#"/, 'href="/auctions"');
  }

  return html.slice(0, block.start) + section + html.slice(block.end);
}

function applyHomeCategoryLabels(html) {
  let out = html;

  out = out.replace(/<h5>Villa<\/h5>/g, "<h5>House</h5>");
  out = out.replace(/<i class="icon icon-office1">/g, '<i class="icon icon-land">');
  out = out.replace(/<h5>Office<\/h5>/g, "<h5>Land</h5>");
  out = out.replace(/Today’s Luxury Listings/g, "New Listings");
  out = out.replace(/Today's Luxury Listings/g, "New Listings");

  return out;
}

function applyOpenHouseListings(html) {
  const block = sliceSection(html, "Open Houses Listings", "<!-- /.section-listing");
  if (!block) return html;

  let { section } = block;

  for (const listing of OPEN_HOUSE_LISTINGS) {
    section = section.replaceAll(
      `/images/section/${listing.oldImg}`,
      `/images/auction-properties/${listing.newImg}`,
    );
    section = section.replace(
      /<i class="icon-location"><\/i>\s*Los Angeles, California 91604/,
      `<i class="icon-location"></i> ${listing.location}`,
    );
  }

  return html.slice(0, block.start) + section + html.slice(block.end);
}

/** All homepage listing / neighborhood / open-house content updates. */
export function applyHomePageContent(html) {
  let out = applyHomeCategoryLabels(html);
  out = applyHomeListingImages(out);
  out = applyHomeNeighborhoods(out);
  out = applyOpenHouseListings(out);
  return out;
}
