/**
 * REOVANA site navigation — desktop header + mobile offcanvas.
 */

/** @type {[string, string][]} */
const BUY_LINKS = [
  ["/auctions", "All Auction Homes"],
  ["/auctions/foreclosure-homes", "Foreclosure Homes"],
  ["/auctions/hud-homes", "HUD Homes"],
  ["/auctions/homesteps", "Freddie Mac HomeSteps"],
  ["/auctions/federal-property-auctions", "Federal Property Auctions"],
  ["/auctions/va-reo", "VA REO Homes"],
  ["/auctions/bank-owned", "Bank Owned"],
  ["/auctions/second-chance-foreclosure", "2nd Chance Foreclosure"],
  ["/auctions/short-sale", "Short Sale"],
  ["/auctions/commercial", "Commercial"],
  ["/auctions/government-disposition", "Government Disposition"],
  ["/auctions/non-bank-owned", "Non-Bank Owned"],
];

/** @type {[string, string][]} */
const LEARN_LINKS = [
  ["/learn/overview", "Overview"],
  ["/learn/glossary", "Glossary"],
  ["/learn/help-center", "Help Center"],
  ["/learn/guides/beginners-guide", "Blog"],
  ["/learn/faq", "FAQ"],
];

/** @type {[string, string][]} */
const RESOURCES_LINKS = [
  ["#", "Overview"],
  ["#", "Leadership"],
  ["#", "Our Values"],
  ["#", "Business Solutions"],
  ["/career", "Careers"],
];

const SELL_PAGE = "/add-property";

function desktopSubmenuLinks(items) {
  return items
    .map(
      ([href, label]) =>
        `                                                <li><a href="${href}">${label}</a></li>`,
    )
    .join("\n");
}

function desktopDropdown(title, items) {
  return `                                        <li class="has-child"><a href="#">${title}</a>
                                            <ul class="submenu">
${desktopSubmenuLinks(items)}
                                            </ul>
                                        </li>`;
}

export function buildDesktopMainMenu() {
  return `<nav class="main-menu">
                                    <ul class="navigation ">
${desktopDropdown("Buy", BUY_LINKS)}
                                        <li><a href="${SELL_PAGE}">Sell</a></li>
${desktopDropdown("Learn", LEARN_LINKS)}
${desktopDropdown("Resources", RESOURCES_LINKS)}
                                    </ul>
                                </nav>`;
}

function mobileSubmenuLinks(items, linkClass = "item-menu-mobile") {
  return items
    .map(
      ([href, label]) =>
        `                                <li class="menu-item"><a href="${href}" class="${linkClass}">${label}</a></li>`,
    )
    .join("\n");
}

function mobileDropdownSection(menuId, title, items) {
  return `                    <li class="menu-item menu-item-has-children-mobile">
                        <a href="#${menuId}" class="item-menu-mobile collapsed" data-bs-toggle="collapse"
                            aria-expanded="false" aria-controls="${menuId}">${title}</a>
                        <div id="${menuId}" class="collapse" data-bs-parent="#menu-mobile-menu">
                            <ul class="sub-mobile">
${mobileSubmenuLinks(items)}
                            </ul>
                        </div>
                    </li>`;
}

export function buildMobileMenu() {
  return `<ul id="menu-mobile-menu">
${mobileDropdownSection("dropdown-menu-buy", "Buy", BUY_LINKS)}
                    <li class="menu-item"><a href="${SELL_PAGE}" class="item-menu-mobile">Sell</a></li>
${mobileDropdownSection("dropdown-menu-learn", "Learn", LEARN_LINKS)}
${mobileDropdownSection("dropdown-menu-resources", "Resources", RESOURCES_LINKS)}
                </ul>`;
}

export function replaceSiteNavigation(html) {
  let out = html.replace(/<nav class="main-menu">[\s\S]*?<\/nav>/gi, buildDesktopMainMenu());
  out = out.replace(/<ul id="menu-mobile-menu">[\s\S]*?<\/ul>/i, buildMobileMenu());
  return out;
}
