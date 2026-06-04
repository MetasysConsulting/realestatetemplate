/**
 * REOVANA site navigation — desktop header + mobile offcanvas.
 */

const LISTING_LAYOUT_LINKS = [
  ["/listing/grid-full-width", "Grid — Full Width"],
  ["/listing/grid-top-search", "Grid — Top Search"],
  ["/listing/grid-left-sidebar", "Grid — Sidebar Left"],
  ["/listing/grid-right-sidebar", "Grid — Sidebar Right"],
  ["/listing/list-full-width", "List — Full Width"],
  ["/listing/list-top-search", "List — Top Search"],
  ["/listing/list-left-sidebar", "List — Sidebar Left"],
  ["/listing/list-right-sidebar", "List — Sidebar Right"],
];

const LISTING_MAP_LINKS = [
  ["/listing/half-map-grid", "Half Map — Grid"],
  ["/listing/half-map-list", "Half Map — List"],
  ["/listing/half-top-map", "Half Map — Top Search"],
  ["/listing/filter-popup", "Filter Popup"],
  ["/listing/filter-popup-left", "Filter Popup — Left"],
  ["/listing/filter-popup-right", "Filter Popup — Right"],
];

const LISTING_DETAIL_LINKS = [
  ["/property/detail/v1", "Property Details 1"],
  ["/property/detail/v2", "Property Details 2"],
  ["/property/detail/v3", "Property Details 3"],
  ["/property/detail/v4", "Property Details 4"],
  ["/property/detail/v5", "Property Details 5"],
];

function desktopLinks(items) {
  return items
    .map(
      ([href, label]) =>
        `                                                        <li><a href="${href}">${label}</a></li>`,
    )
    .join("\n");
}

function desktopListingSubmenu() {
  return `                                                <li>
                                                    <a href="#">Layout</a>
                                                    <ul class="submenu2">
${desktopLinks(LISTING_LAYOUT_LINKS)}
                                                    </ul>
                                                </li>
                                                <li>
                                                    <a href="#">Map &amp; Filters</a>
                                                    <ul class="submenu2">
${desktopLinks(LISTING_MAP_LINKS)}
                                                    </ul>
                                                </li>
                                                <li>
                                                    <a href="#">Property Details</a>
                                                    <ul class="submenu2">
${desktopLinks(LISTING_DETAIL_LINKS)}
                                                    </ul>
                                                </li>`;
}

function desktopSellExtras() {
  return `                                                <li>
                                                    <a href="#">Seller Tools</a>
                                                    <ul class="submenu2">
                                                        <li><a href="/add-property">List Your Property</a></li>
                                                        <li><a href="/dashboard">Seller Dashboard</a></li>
                                                    </ul>
                                                </li>`;
}

function desktopPlaceholderLinks(labels) {
  return labels
    .map((label) => `                                                <li><a href="#">${label}</a></li>`)
    .join("\n");
}

const LEARN_PLACEHOLDERS = ["Placeholder 1", "Placeholder 2", "Placeholder 3"];
const RESOURCES_PLACEHOLDERS = ["Placeholder 1", "Placeholder 2", "Placeholder 3"];

export function buildDesktopMainMenu() {
  return `<nav class="main-menu">
                                    <ul class="navigation ">
                                        <li class="has-child style-2"><a href="#">Buy</a>
                                            <ul class="submenu">
${desktopListingSubmenu()}
                                            </ul>
                                        </li>
                                        <li class="has-child style-2"><a href="#">Sell</a>
                                            <ul class="submenu">
${desktopSellExtras()}
${desktopListingSubmenu()}
                                            </ul>
                                        </li>
                                        <li class="has-child"><a href="#">Learn</a>
                                            <ul class="submenu">
${desktopPlaceholderLinks(LEARN_PLACEHOLDERS)}
                                            </ul>
                                        </li>
                                        <li class="has-child"><a href="#">Resources</a>
                                            <ul class="submenu">
${desktopPlaceholderLinks(RESOURCES_PLACEHOLDERS)}
                                            </ul>
                                        </li>
                                    </ul>
                                </nav>`;
}

function mobileLinks(items, linkClass = "") {
  const cls = linkClass ? ` class="${linkClass}"` : "";
  return items
    .map(
      ([href, label]) =>
        `                                            <li class="menu-item"><a href="${href}"${cls}>${label}</a></li>`,
    )
    .join("\n");
}

function mobilePlaceholderLinks(labels, linkClass = "item-menu-mobile") {
  return labels
    .map(
      (label) =>
        `                                <li class="menu-item"><a href="#" class="${linkClass}">${label}</a></li>`,
    )
    .join("\n");
}

function mobilePlaceholderSection(menuId, title, labels) {
  return `                    <li class="menu-item menu-item-has-children-mobile">
                        <a href="#${menuId}" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                            aria-expanded="false" aria-controls="${menuId}">${title}</a>
                        <div id="${menuId}" class="collapse" data-bs-parent="#menu-mobile-menu">
                            <ul class="sub-mobile">
${mobilePlaceholderLinks(labels)}
                            </ul>
                        </div>
                    </li>`;
}

function mobileListingBlock(parentId, layoutId, mapId, detailsId) {
  return `                                <li class="menu-item menu-item-has-children-mobile-2">
                                    <a href="#${layoutId}" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                                        aria-expanded="false" aria-controls="${layoutId}">Layout</a>
                                    <div id="${layoutId}" class="collapse" data-bs-parent="#${parentId}">
                                        <ul class="sub-mobile">
${mobileLinks(LISTING_LAYOUT_LINKS, "item-menu-mobile")}
                                        </ul>
                                    </div>
                                </li>
                                <li class="menu-item menu-item-has-children-mobile-2">
                                    <a href="#${mapId}" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                                        aria-expanded="false" aria-controls="${mapId}">Map &amp; Filters</a>
                                    <div id="${mapId}" class="collapse" data-bs-parent="#${parentId}">
                                        <ul class="sub-mobile">
${mobileLinks(LISTING_MAP_LINKS, "item-menu-mobile")}
                                        </ul>
                                    </div>
                                </li>
                                <li class="menu-item menu-item-has-children-mobile-2">
                                    <a href="#${detailsId}" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                                        aria-expanded="false" aria-controls="${detailsId}">Property Details</a>
                                    <div id="${detailsId}" class="collapse" data-bs-parent="#${parentId}">
                                        <ul class="sub-mobile">
${mobileLinks(LISTING_DETAIL_LINKS, "item-menu-mobile")}
                                        </ul>
                                    </div>
                                </li>`;
}

export function buildMobileMenu() {
  return `<ul id="menu-mobile-menu">
                    <li class="menu-item menu-item-has-children-mobile">
                        <a href="#dropdown-menu-buy" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                            aria-expanded="false" aria-controls="dropdown-menu-buy">Buy</a>
                        <div id="dropdown-menu-buy" class="collapse" data-bs-parent="#menu-mobile-menu">
                            <ul class="sub-mobile">
${mobileListingBlock("dropdown-menu-buy", "sub-buy-layout", "sub-buy-map", "sub-buy-details")}
                            </ul>
                        </div>
                    </li>
                    <li class="menu-item menu-item-has-children-mobile">
                        <a href="#dropdown-menu-sell" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                            aria-expanded="false" aria-controls="dropdown-menu-sell">Sell</a>
                        <div id="dropdown-menu-sell" class="collapse" data-bs-parent="#menu-mobile-menu">
                            <ul class="sub-mobile">
                                <li class="menu-item"><a href="/add-property" class="item-menu-mobile">List Your Property</a></li>
                                <li class="menu-item"><a href="/dashboard" class="item-menu-mobile">Seller Dashboard</a></li>
${mobileListingBlock("dropdown-menu-sell", "sub-sell-layout", "sub-sell-map", "sub-sell-details")}
                            </ul>
                        </div>
                    </li>
${mobilePlaceholderSection("dropdown-menu-learn", "Learn", LEARN_PLACEHOLDERS)}
${mobilePlaceholderSection("dropdown-menu-resources", "Resources", RESOURCES_PLACEHOLDERS)}
                </ul>`;
}

export function replaceSiteNavigation(html) {
  let out = html.replace(/<nav class="main-menu">[\s\S]*?<\/nav>/gi, buildDesktopMainMenu());
  out = out.replace(/<ul id="menu-mobile-menu">[\s\S]*?<\/ul>/i, buildMobileMenu());
  return out;
}
