/** First six approved residential photos for the homepage listing carousel. */
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

/** Swap template listing thumbnails and rename Featured → New on the homepage. */
export function applyHomeListingImages(html) {
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
