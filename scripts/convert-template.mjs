/**
 * Converts Proty HTML template pages to Next.js-ready JSON chunks.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { applyHomePageContent } from "./auction-home-images.mjs";
import { replaceSiteNavigation } from "./reovana-navigation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "..", "proty-package", "proty");
const OUT_DIR = path.join(ROOT, "src", "generated", "pages");
const MANIFEST_OUT = path.join(ROOT, "src", "lib", "template-manifest.ts");

/** @type {Record<string, string>} */
const ROUTE_MAP = {
  "index.html": "/",
  "home02.html": "/home/02",
  "home03.html": "/home/03",
  "home04.html": "/home/04",
  "home05.html": "/home/05",
  "home06.html": "/home/06",
  "home07.html": "/home/07",
  "home08.html": "/home/08",
  "home09.html": "/home/09",
  "home10.html": "/home/10",
  "property-grid-full-width.html": "/listing/grid-full-width",
  "property-gird-top-search.html": "/listing/grid-top-search",
  "property-gird-left-sidebar.html": "/listing/grid-left-sidebar",
  "property-gird-right-sidebar.html": "/listing/grid-right-sidebar",
  "property-list-full-width.html": "/listing/list-full-width",
  "property-list-top-search.html": "/listing/list-top-search",
  "property-list-left-sidebar.html": "/listing/list-left-sidebar",
  "property-list-right-sidebar.html": "/listing/list-right-sidebar",
  "property-half-map-grid.html": "/listing/half-map-grid",
  "property-half-map-list.html": "/listing/half-map-list",
  "property-half-top-map.html": "/listing/half-top-map",
  "property-filter-popup.html": "/listing/filter-popup",
  "property-filter-popup-left.html": "/listing/filter-popup-left",
  "property-filter-popup-right.html": "/listing/filter-popup-right",
  "property-detail-v1.html": "/property/detail/v1",
  "property-detail-v2.html": "/property/detail/v2",
  "property-detail-v3.html": "/property/detail/v3",
  "property-detail-v4.html": "/property/detail/v4",
  "property-detail-v5.html": "/property/detail/v5",
  "agents.html": "/agents",
  "agents-details.html": "/agents/details",
  "agency-grid.html": "/agency/grid",
  "agency-list.html": "/agency/list",
  "agency-details.html": "/agency/details",
  "blog-grid.html": "/blog/grid",
  "blog-list.html": "/blog/list",
  "blog-details.html": "/blog/details",
  "project-list.html": "/project/list",
  "project-details.html": "/project/details",
  "contact.html": "/contact",
  "faq.html": "/faq",
  "career.html": "/career",
  "compare.html": "/compare",
  "home-loan-process.html": "/home-loan-process",
  "dashboard.html": "/dashboard",
  "add-property.html": "/add-property",
  "my-property.html": "/my-property",
  "my-profile.html": "/my-profile",
  "my-favorites.html": "/my-favorites",
  "my-package.html": "/my-package",
  "my-save-search.html": "/my-save-search",
  "review.html": "/review",
  "404.html": "/template-404",
};

/** Reverse map: route -> filename */
const routeToFile = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([f, r]) => [r, f]),
);

/** href replacements (longest first) */
const hrefReplacements = Object.entries(ROUTE_MAP)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([file, route]) => ({ from: file, to: route }));

const REOVANA_LOGO = "/images/reovana/logo.png";
const REOVANA_LOGO_DARK = "/images/reovana/logo-dark.jpeg";

const REOVANA_HEADING_HTML = `<div class="heading-title reovana-heading-title">
                                <h1 class="title reovana-headline">
                                    <span class="reovana-headline__line">DISTRESSED</span>
                                    <span class="reovana-headline__line reovana-headline__line--accent">FORECLOSED</span>
                                    <span class="reovana-headline__line">PROPERTIES</span>
                                </h1>
                                <p class="h6 fw-4 reovana-tagline">FIND GREAT DEALS. CREATE REAL VALUE.</p>
                            </div>
                            `;

/** Replace template orange accent with blue (theme-color-4). */
function applyBlueTheme(html) {
  return html
    .replace(/#f1913d/gi, "#7695ff")
    .replace(/#fef7f1/gi, "#f2f5ff")
    .replace(/rgba?\(\s*241\s*,\s*145\s*,\s*61[^)]*\)/gi, "rgba(118, 149, 255, 0.16)")
    .replace(/rgb\(\s*241\s*,\s*145\s*,\s*61\s*\)/gi, "rgb(118, 149, 255)");
}

function stripPopupSettings(html) {
  return html.replace(
    /<!--\s*popup-setting\s*-->[\s\S]*?<!--\s*popup-setting\s*-->\s*/gi,
    "",
  );
}

function stripPhoneNumbers(html) {
  let out = html;

  /* phone-number contains nested .icons — non-greedy </div> used to break header-right */
  out = out.replace(
    /<div class="phone-number">[\s\S]*?<p>[^<]*<\/p>\s*<\/div>\s*/gi,
    "",
  );

  let prev = "";
  while (prev !== out && out.includes("icon-phone-2")) {
    prev = out;
    out = out.replace(
      /<div class="contact-item">[\s\S]*?<i class="icon-phone-2"><\/i>[\s\S]*?<\/div>\s*<\/div>\s*/gi,
      "",
    );
  }

  out = out.replace(
    /<li>\s*Call Us Now:\s*<span class="number">[^<]*<\/span>\s*<\/li>\s*/gi,
    "",
  );
  out = out.replace(/<li>\s*<i class="icon-phone-1"><\/i>[\s\S]*?<\/li>\s*/gi, "");
  out = out.replace(
    /<li>\s*<i class="icon-phone-1"><\/i>\s*<span>[^<]*<\/span>\s*<\/li>\s*/gi,
    "",
  );
  out = out.replace(
    /<li><i class="icon-phone-1"><\/i><span>[^<]*<\/span><\/li>\s*/gi,
    "",
  );
  out = out.replace(/<a[^>]*href="tel:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "");
  out = out.replace(/<a[^>]*>\s*\(?\d{3}\)?\s*[\d\s.-]{7,}\s*<\/a>/gi, "");
  out = out.replace(
    /<a[^>]*>(?:(?!<\/a>).)*?\(\d{3}\)\s*[\d\s.-]{7,}(?:(?!<\/a>).)*?<\/a>/gi,
    "",
  );
  out = out.replace(/<div class="phone"[^>]*>[\s\S]*?<\/div>\s*/gi, "");
  out = out.replace(/<p>\s*\(\d{3}\)\s*[\d\s.-]+\s*<\/p>\s*/gi, "");
  out = out.replace(
    /<h6>\s*<a[^>]*>\s*\(?\d{3}\)?\s*[\d\s.-]+\s*<\/a>\s*<\/h6>\s*/gi,
    "",
  );
  out = out.replace(
    /<li class="flex gap-8">\s*<i class="icon-phone-1"><\/i>\s*[^<]*<\/li>\s*/gi,
    "",
  );

  out = out.replace(/\(603\)\s*555-0123/g, "");
  out = out.replace(/1-333-345-6868/g, "");
  out = out.replace(/1-555-678-8888/g, "");

  return out;
}

function stripHomeSearchDropdown(html) {
  return html.replace(
    /<div class="tf-dropdown-sort[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*(?=<form>)/i,
    "",
  );
}

const REOVANA_LOGIN_HTML = `<div class="reovana-header-auth"><a href="#modalLogin" class="tf-btn bg-color-primary pd-23 reovana-login-btn" data-bs-toggle="modal">Login</a></div>`;

/**
 * Most template pages ship two headers (sticky clone + visible).
 * Keep one header with header-sticky so main.js scroll behavior still works.
 */
function dedupeTemplateHeaders(html) {
  let out = html.replace(
    /<header[^>]*class="[^"]*header-sticky[^"]*"[^>]*>[\s\S]*?<\/header>\s*(?:<!-- \/\.header -->)?\s*/gi,
    "",
  );

  if (!out.includes("header-sticky")) {
    out = out.replace(
      /<header id="header-main" class="header(\s+dashboard)?\s*">/i,
      '<header id="header-main" class="header header-sticky$1">',
    );
    out = out.replace(
      /<header class="header(\s+dashboard)?\s*">/i,
      '<header id="header-main" class="header header-sticky$1">',
    );
  }

  return out;
}

function replaceHeaderLogin(html) {
  return html.replace(
    /<div class="box-user[^>]*>[\s\S]*?(?=<div class="btn-add">)/gi,
    `${REOVANA_LOGIN_HTML}\n                                    `,
  );
}

/** Keep login icon button flush beside Add property. */
function groupHeaderActions(html) {
  return html.replace(
    /(<div class="reovana-header-auth">[\s\S]*?<\/div>)\s*(<div class="btn-add">[\s\S]*?<\/div>)/gi,
    '<div class="reovana-header-actions">$1$2</div>',
  );
}

function applyFooterLogo(html) {
  return html.replace(
    /<img\s+id="logo_footer"[^>]*>/gi,
    `<img id="logo_footer" class="reovana-logo reovana-footer-logo" src="${REOVANA_LOGO}" alt="REOVANA">`,
  );
}

/** Fix header-right accidentally closed when phone-number strip matched nested </div>. */
function repairHeaderRight(html) {
  return html.replace(
    /<div class="header-right">\s*<\/div>\s*(<div class="reovana-header-actions">)/gi,
    '<div class="header-right">$1',
  );
}

function applyReovanaHomeCopy(html) {
  let out = html;
  out = out.replace(
    /<div class="page-title home01">/,
    '<div class="page-title home01 reovana-home-hero">',
  );
  out = out.replace(
    /<div class="heading-title">\s*<h1 class="title">Search Luxury Homes<\/h1>[\s\S]*?<\/div>\s*(?=<div class="wg-filter">)/i,
    REOVANA_HEADING_HTML,
  );
  return stripHomeSearchDropdown(out);
}

function applyBranding(html, filename) {
  let out = html;

  out = out.replace(/src="\/images\/logo\/logo@2x\.png"/g, `src="${REOVANA_LOGO}"`);
  out = out.replace(/src="\/images\/logo\/logo-2@2x\.png"/g, `src="${REOVANA_LOGO_DARK}"`);
  out = out.replace(/src="\/images\/logo\/loading\.png"/g, `src="${REOVANA_LOGO}"`);
  out = out.replace(/data-light="\/images\/logo\/logo@2x\.png"/g, `data-light="${REOVANA_LOGO}"`);
  out = out.replace(/data-dark="\/images\/logo\/logo-2@2x\.png"/g, `data-dark="${REOVANA_LOGO_DARK}"`);
  out = out.replace(/alt="logo-footer"/g, 'alt="REOVANA"');
  out = out.replace(/class="logo_header"/g, 'class="logo_header reovana-logo"');

  out = stripPhoneNumbers(out);
  out = stripPopupSettings(out);
  out = dedupeTemplateHeaders(out);
  out = replaceHeaderLogin(out);
  out = groupHeaderActions(out);
  out = repairHeaderRight(out);
  out = applyFooterLogo(out);
  out = replaceSiteNavigation(out);

  if (filename === "index.html") {
    out = applyReovanaHomeCopy(out);
    out = applyHomePageContent(out);
  }

  return out;
}

function transformHtml(html, filename) {
  let out = html;

  for (const { from, to } of hrefReplacements) {
    const escaped = from.replace(/\./g, "\\.");
    out = out.replace(new RegExp(`href="${escaped}"`, "g"), `href="${to}"`);
    out = out.replace(new RegExp(`href='${escaped}'`, "g"), `href='${to}'`);
  }

  out = out.replace(/href="#modalLogin"/g, 'href="#modalLogin"');
  out = out.replace(/src="images\//g, 'src="/images/');
  out = out.replace(/src='images\//g, "src='/images/");
  out = out.replace(/data-src="images\//g, 'data-src="/images/');
  out = out.replace(/data-light="images\//g, 'data-light="/images/');
  out = out.replace(/data-dark="images\//g, 'data-dark="/images/');
  out = out.replace(/url\(images\//g, "url(/images/");
  out = out.replace(/src="icons\//g, 'src="/icons/');
  out = out.replace(/href="css\//g, 'href="/css/');

  return applyBranding(applyBlueTheme(out), filename);
}

function extractPage(html, filename) {
  const bodyMatch = html.match(/<body[^>]*class="([^"]*)"[^>]*>/i);
  let bodyClass = bodyMatch?.[1] ?? "theme-color-4";
  bodyClass = bodyClass
    .replace(/\btheme-color-[123]\b/g, "")
    .trim();
  if (!bodyClass.includes("theme-color-4")) {
    bodyClass = `${bodyClass} theme-color-4`.trim();
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "Proty";

  const wrapperStart = html.indexOf('<div id="wrapper">');
  const scriptStart = html.indexOf("<!-- Javascript -->");
  const fallbackScript = html.indexOf('<script src="js/');

  let end = scriptStart > -1 ? scriptStart : fallbackScript;
  if (end < 0) end = html.length;

  let chunk =
    wrapperStart > -1
      ? html.slice(wrapperStart, end)
      : html.slice(html.indexOf("<body"), end);

  chunk = transformHtml(chunk, filename);

  const pageTitle =
    filename === "index.html" ? "REOVANA — Foreclosed Homes" : title;

  return { bodyClass, title: pageTitle, html: chunk };
}

function routeToSlug(route) {
  if (route === "/") return "index";
  return route.replace(/^\//, "").replace(/\//g, "__");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];

for (const [file, route] of Object.entries(ROUTE_MAP)) {
  const filePath = path.join(SOURCE, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skip missing: ${file}`);
    continue;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const page = extractPage(raw, file);
  const slug = routeToSlug(route);

  fs.writeFileSync(
    path.join(OUT_DIR, `${slug}.json`),
    JSON.stringify({ route, file, ...page }),
  );

  manifest.push({
    route,
    file,
    slug,
    title: page.title,
    bodyClass: page.bodyClass,
  });

  console.log(`✓ ${file} -> ${route}`);
}

const manifestTs = `/* AUTO-GENERATED by scripts/convert-template.mjs — do not edit */
export type TemplatePageMeta = {
  route: string;
  file: string;
  slug: string;
  title: string;
  bodyClass: string;
};

export const TEMPLATE_PAGES: TemplatePageMeta[] = ${JSON.stringify(manifest, null, 2)};

export const ROUTE_TO_SLUG: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(manifest.map((m) => [m.route, m.slug])),
  null,
  2,
)};

export const SLUG_TO_ROUTE: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(manifest.map((m) => [m.slug, m.route])),
  null,
  2,
)};

export function getTemplateMetaByRoute(route: string): TemplatePageMeta | undefined {
  return TEMPLATE_PAGES.find((p) => p.route === route);
}

export function getTemplateMetaBySlug(slug: string): TemplatePageMeta | undefined {
  return TEMPLATE_PAGES.find((p) => p.slug === slug);
}
`;

fs.writeFileSync(MANIFEST_OUT, manifestTs);

const registryImports = manifest
  .map((m) => `import ${m.slug.replace(/-/g, "_")} from "./pages/${m.slug}.json";`)
  .join("\n");

const registryEntries = manifest
  .map((m) => `  "${m.slug}": ${m.slug.replace(/-/g, "_")},`)
  .join("\n");

const registryTs = `/* AUTO-GENERATED — do not edit */
${registryImports}

import type { TemplatePageData } from "../lib/load-template-page";

export const TEMPLATE_PAGE_REGISTRY: Record<string, TemplatePageData> = {
${registryEntries}
};
`;

fs.writeFileSync(
  path.join(ROOT, "src", "generated", "page-registry.ts"),
  registryTs,
);

console.log(`\nGenerated ${manifest.length} pages.`);
