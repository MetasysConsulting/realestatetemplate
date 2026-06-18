/**
 * Removes embedded Proty template demo property cards from converted HTML pages.
 */

function removeBetweenComments(html, startComment, endComment) {
  let out = html;
  let safety = 0;

  while (out.includes(startComment) && safety < 30) {
    const start = out.indexOf(startComment);
    const end = out.indexOf(endComment, start);
    if (start < 0 || end < 0) break;
    out = out.slice(0, start) + out.slice(end + endComment.length);
    safety += 1;
  }

  return out;
}

function removeDivBlockAt(html, start) {
  let i = html.indexOf(">", start) + 1;
  let depth = 1;

  while (i < html.length) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);
    if (nextClose < 0) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return html.slice(0, start) + html.slice(nextClose + 6);
    }

    i = nextClose + 6;
  }

  return html;
}

function removeDivBlock(html, className) {
  let out = html;
  let safety = 0;

  while (safety < 30) {
    const start = out.indexOf(`<div class="${className}`);
    if (start < 0) break;
    out = removeDivBlockAt(out, start);
    safety += 1;
  }

  return out;
}

export function removeAllSectionListingBlocks(html) {
  return removeBetweenComments(html, "<!-- .section-listing", "<!-- /.section-listing -->");
}

export function removeWgListingWidgets(html) {
  return removeDivBlock(html, "wg-listing");
}

export function removeBoxHouseGrids(html) {
  let out = html;
  let safety = 0;

  while (out.includes('class="box-house') && safety < 50) {
    const start = out.indexOf('<div class="box-house');
    if (start < 0) break;
    out = removeDivBlockAt(out, start);
    safety += 1;
  }

  return out;
}

export function removeCompareTable(html) {
  return removeDivBlock(html, "tf-compare-table");
}

/** Strip demo listing cards from any template page. */
export function stripTemplateMockListings(html) {
  let out = html;
  out = removeAllSectionListingBlocks(out);
  out = removeWgListingWidgets(out);
  out = removeBoxHouseGrids(out);
  out = removeCompareTable(out);
  return out;
}
