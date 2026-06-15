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
    newImg: "tampa-florida.jpg",
    city: "Tampa, Florida",
    count: "1,842",
  },
  {
    oldImg: "location-10.jpg",
    newImg: "austin-texas.jpg",
    city: "Austin, Texas",
    count: "2,156",
  },
  {
    oldImg: "location-11.jpg",
    newImg: "phoenix-arizona.jpg",
    city: "Phoenix, Arizona",
    count: "1,973",
  },
  {
    oldImg: "location-12.jpg",
    newImg: "denver-colorado.jpg",
    city: "Denver, Colorado",
    count: "1,508",
  },
  {
    oldImg: "location-13.jpg",
    newImg: "atlanta-georgia.jpg",
    city: "Atlanta, Georgia",
    count: "2,304",
  },
  {
    oldImg: "location-14.jpg",
    newImg: "houston-texas.jpg",
    city: "Houston, Texas",
    count: "2,617",
  },
  {
    oldImg: "location-15.jpg",
    newImg: "cleveland-ohio.jpg",
    city: "Cleveland, Ohio",
    count: "1,126",
  },
];

const OLD_NEIGHBORHOOD_PROPERTY_IMAGES = [
  "08-lakefront-cottage.jpg",
  "09-wood-siding-bungalow.jpg",
  "10-red-brick-two-story.jpg",
  "12-gray-siding-split-level.jpg",
  "13-farmhouse-white.jpg",
  "14-condo-townhome-row.jpg",
  "20-vacant-lot-house.jpg",
  "21-duplex-side-by-side.jpg",
];

const EIGHTH_NEIGHBORHOOD = {
  newImg: "miami-florida.jpg",
  city: "Miami, Florida",
  count: "1,894",
};

function neighborhoodCardMarkup(itemClass, img, city, count) {
  const imgPath = `/images/neighborhoods/${img}`;
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
      `/images/neighborhoods/${loc.newImg}`,
    );

    const imgPath = `/images/neighborhoods/${loc.newImg}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  for (const [index, oldFile] of OLD_NEIGHBORHOOD_PROPERTY_IMAGES.entries()) {
    const cityFile =
      index < NEIGHBORHOOD_LOCATIONS.length
        ? NEIGHBORHOOD_LOCATIONS[index].newImg
        : EIGHTH_NEIGHBORHOOD.newImg;
    section = section.replaceAll(
      `/images/auction-properties/${oldFile}`,
      `/images/neighborhoods/${cityFile}`,
    );
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

const PRE_APPROVED_STEPS_HTML = `
                                <div class="heading-section reovana-loan-steps__header">
                                    <h2 class="title">Confidently pursue distressed deals with verified financing.</h2>
                                    <p class="text-1">REOVANA connects investors with lenders who specialize in foreclosures, REO properties, and auction purchases.</p>
                                </div>
                                <button type="button" class="tf-btn bg-color-primary reovana-find-lenders-btn reovana-cta--pending" disabled>Find lenders</button>
                                <ol class="reovana-loan-steps__list">
                                    <li class="reovana-loan-steps__item is-active">
                                        <span class="reovana-loan-steps__marker" aria-hidden="true">1</span>
                                        <span class="reovana-loan-steps__icon reovana-loan-steps__icon--green" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/></svg>
                                        </span>
                                        <div class="reovana-loan-steps__body">
                                            <h3>Get pre-approved</h3>
                                            <p>Get matched with hard money and private lenders who fund distressed property deals.</p>
                                        </div>
                                    </li>
                                    <li class="reovana-loan-steps__item">
                                        <span class="reovana-loan-steps__marker" aria-hidden="true">2</span>
                                        <span class="reovana-loan-steps__icon reovana-loan-steps__icon--amber" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/></svg>
                                        </span>
                                        <div class="reovana-loan-steps__body">
                                            <h3>Find a property</h3>
                                            <p>Browse foreclosures, bank-owned homes, and auction listings across the country.</p>
                                        </div>
                                    </li>
                                    <li class="reovana-loan-steps__item">
                                        <span class="reovana-loan-steps__marker" aria-hidden="true">3</span>
                                        <span class="reovana-loan-steps__icon reovana-loan-steps__icon--blue" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M5 10h14"/><path d="M7 6h10v12H7z"/></svg>
                                        </span>
                                        <div class="reovana-loan-steps__body">
                                            <h3>Make an offer</h3>
                                            <p>Confirm the deal fits your budget and move quickly with funding already in place.</p>
                                        </div>
                                    </li>
                                    <li class="reovana-loan-steps__item">
                                        <span class="reovana-loan-steps__marker" aria-hidden="true">4</span>
                                        <span class="reovana-loan-steps__icon reovana-loan-steps__icon--indigo" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                                        </span>
                                        <div class="reovana-loan-steps__body">
                                            <h3>Close on your investment</h3>
                                            <p>Finalize your loan, complete closing, and take ownership of the property.</p>
                                        </div>
                                    </li>
                                </ol>`;

function applyHomePreApprovedSection(html) {
  const block = sliceSection(html, "<!-- .section-pre-approved -->", "<!-- /.section-pre-approved -->");
  if (!block) return html;

  let { section } = block;

  // Replace entire inner content with a single mount point for the React component
  section = section.replace(
    /<section class="section-pre-approved[^"]*"[^>]*>[\s\S]*?<\/section>/,
    `<section class="section-pre-approved reovana-pre-approved tf-spacing-1" style="padding:0;background:transparent"><div id="reovana-loan-steps-mount"></div></section>`,
  );

  return html.slice(0, block.start) + section + html.slice(block.end);
}

function injectHomeCategoryRowsMount(html) {
  const marker = "</section><!-- /.section-pre-approved -->";
  if (!html.includes(marker) || html.includes('id="reovana-home-category-rows"')) {
    return html;
  }

  return html.replace(
    marker,
    `${marker}
            <div id="reovana-home-category-rows" class="reovana-home-category-rows-anchor" aria-hidden="true"></div>`,
  );
}

/** All homepage listing / neighborhood / open-house content updates. */
export function applyHomePageContent(html) {
  let out = applyHomeCategoryLabels(html);
  out = applyHomeListingImages(out);
  out = applyHomeNeighborhoods(out);
  out = applyHomePreApprovedSection(out);
  out = injectHomeCategoryRowsMount(out);
  out = stripLuxuryEnthusiastsText(out);
  out = stripHomeSections(out);
  return out;
}
