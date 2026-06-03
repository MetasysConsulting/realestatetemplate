/**
 * Converts Proty HTML template pages to Next.js-ready JSON chunks.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

function transformHtml(html) {
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

  return out;
}

function extractPage(html, filename) {
  const bodyMatch = html.match(/<body[^>]*class="([^"]*)"[^>]*>/i);
  const bodyClass = bodyMatch?.[1] ?? "theme-color-4";

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

  chunk = transformHtml(chunk);

  return { bodyClass, title, html: chunk };
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
