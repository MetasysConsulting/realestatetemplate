import { APPROVED_AUCTION_IMAGE_FILES } from "./approved-auction-images.mjs";

/** First six approved residential photos for the homepage carousel. */
export const HOME_LISTING_IMAGES = APPROVED_AUCTION_IMAGE_FILES.slice(0, 6);

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

const EIGHTH_NEIGHBORHOOD = {
  newImg: "21-duplex-side-by-side.jpg",
  city: "Miami, Florida",
  count: "1,894",
};

function neighborhoodCardMarkup(itemClass, img, city, count) {
  const imgPath = `/images/auction-properties/${img}`;
  return `
                            <div class="box-location hover-img ${itemClass}">
                                <div class="image-wrap">
                                    <a href="/auctions">
                                        <img class="lazyload" data-src="${imgPath}"
                                            src="${imgPath}" alt="${city}">
                                    </a>
                                </div>
                                <div class="content">
                                    <h6 class="text_white">${city}</h6>
                                    <a href="/auctions"
                                        class="text-1 tf-btn style-border pd-23 text_white">${count} Properties <i class="icon-arrow-right"></i></a>
                                </div>
                            </div>`;
}

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
    '<section class="section-neighborhoods ">',
    '<section class="section-neighborhoods reovana-neighborhoods">',
  );
  section = section.replace(
    /Find your dream apartment with our\s+listing/g,
    "Browse auction and bank-owned homes across the United States",
  );

  for (const loc of NEIGHBORHOOD_LOCATIONS) {
    section = section.replaceAll(
      `/images/section/${loc.oldImg}`,
      `/images/auction-properties/${loc.newImg}`,
    );

    const imgPath = `/images/auction-properties/${loc.newImg}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    section = section.replace(
      new RegExp(`(${imgPath}[\\s\\S]*?<h6 class="text_white">)[^<]*(</h6>)`, "i"),
      `$1${loc.city}$2`,
    );
    section = section.replace(
      new RegExp(
        `(${imgPath}[\\s\\S]*?<a href="/auctions"[^>]*>)[\\s\\S]*?(</a>)`,
        "i",
      ),
      `$1${loc.count} Properties <i class="icon-arrow-right"></i>$2`,
    );
    section = section.replace(/href="#"/, 'href="/auctions"');
  }

  if (!section.includes("item-8")) {
    section = section.replace(
      /(<div class="box-location hover-img item-7">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*)/,
      `$1${neighborhoodCardMarkup(
        "item-8",
        EIGHTH_NEIGHBORHOOD.newImg,
        EIGHTH_NEIGHBORHOOD.city,
        EIGHTH_NEIGHBORHOOD.count,
      )}`,
    );
  }

  if (!section.includes("reovana-neighborhoods__more")) {
    section = section.replace(
      /(<div class="box-location hover-img item-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*)/,
      `$1
                        <div class="reovana-neighborhoods__more">
                            <a href="/auctions" class="tf-btn bg-color-primary pd-23 reovana-neighborhoods__more-btn">More</a>
                        </div>`,
    );
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

function removeSectionBetween(html, startComment, endComment) {
  const start = html.indexOf(startComment);
  if (start < 0) return html;
  const end = html.indexOf(endComment, start);
  if (end < 0) return html;
  return html.slice(0, start) + html.slice(end + endComment.length);
}

function removeOpenHousesSection(html) {
  const idx = html.indexOf("Open Houses Listings");
  if (idx < 0) return html;

  const start = html.lastIndexOf("<!-- .section-listing", idx);
  const end = html.indexOf("<!-- /.section-listing", idx);
  if (start < 0 || end < 0) return html;

  return html.slice(0, start) + html.slice(end + "<!-- /.section-listing -->".length);
}

function stripLuxuryEnthusiastsText(html) {
  return html.replace(
    /<p class="text-1 split-text split-lines-transform">Thousands of luxury home[\s\S]*?<\/p>/gi,
    "",
  );
}

function stripHomeSections(html) {
  let out = html;
  out = removeOpenHousesSection(out);
  out = removeSectionBetween(out, "<!-- section-work-together -->", "<!-- /.section-work-together -->");
  out = removeSectionBetween(out, "<!-- section-opinion -->", "<!-- /.section-opinion -->");
  out = removeSectionBetween(out, "<!-- .section-testimonials -->", "<!-- /.section-testimonials -->");
  return out;
}

const HERO_HOUSE_IMAGE = "/images/reovana/hero-house.jpeg";

function applyHomePreApprovedSection(html) {
  const block = sliceSection(html, "<!-- .section-pre-approved -->", "<!-- /.section-pre-approved -->");
  if (!block) return html;

  let { section } = block;

  section = section.replace(
    '<section class="section-pre-approved tf-spacing-1">',
    '<section class="section-pre-approved reovana-pre-approved tf-spacing-1">',
  );

  section = section.replace(
    /Do you need a home loan\?\s*<br>\s*Get pre-approved/gi,
    "Do you need a loan? <br>\n                                        Get pre-approved",
  );

  section = section.replace(
    /<div class="image-wrap img-animation wow animate__animated">\s*<img[^>]*>/,
    `<div class="image-wrap reovana-pre-approved-photo">
                                <img src="${HERO_HOUSE_IMAGE}" alt="REOVANA home" loading="lazy">`,
  );

  return html.slice(0, block.start) + section + html.slice(block.end);
}

/** All homepage listing / neighborhood / open-house content updates. */
export function applyHomePageContent(html) {
  let out = applyHomeCategoryLabels(html);
  out = applyHomeListingImages(out);
  out = applyHomeNeighborhoods(out);
  out = applyHomePreApprovedSection(out);
  out = stripLuxuryEnthusiastsText(out);
  out = stripHomeSections(out);
  return out;
}
