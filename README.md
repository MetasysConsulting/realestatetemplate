# Proty Real Estate — Next.js (Full Template Port)

Complete port of the **Proty** ThemeForest HTML template into Next.js, preserving original markup, styles, fonts, icons, images, and JavaScript behavior.

## Stack

- Next.js 16 (App Router, static generation)
- pnpm
- Original template CSS (`public/css/styles.css`, Bootstrap, Swiper, etc.)
- Template JS (`public/js/main.js`, jQuery, GSAP, Swiper, …)
- Fonts: **Lexend**, **Manrope**, **Poppins**, **Mulish** (same as template SCSS)
- Default accent: **blue theme** (`theme-color-4`, `#7695ff`)

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build
pnpm start
pnpm convert-template   # Re-import HTML from ../proty-package/proty
```

## All pages (53 routes)

| Route | Original HTML |
|-------|----------------|
| `/` | index.html |
| `/home/02` … `/home/10` | home02.html … home10.html |
| `/listing/grid-full-width` | property-grid-full-width.html |
| `/listing/grid-top-search` | property-gird-top-search.html |
| `/listing/grid-left-sidebar` | property-gird-left-sidebar.html |
| `/listing/grid-right-sidebar` | property-gird-right-sidebar.html |
| `/listing/list-full-width` | property-list-full-width.html |
| `/listing/list-top-search` | property-list-top-search.html |
| `/listing/list-left-sidebar` | property-list-left-sidebar.html |
| `/listing/list-right-sidebar` | property-list-right-sidebar.html |
| `/listing/half-map-grid` | property-half-map-grid.html |
| `/listing/half-map-list` | property-half-map-list.html |
| `/listing/half-top-map` | property-half-top-map.html |
| `/listing/filter-popup` | property-filter-popup.html |
| `/listing/filter-popup-left` | property-filter-popup-left.html |
| `/listing/filter-popup-right` | property-filter-popup-right.html |
| `/property/detail/v1` … `v5` | property-detail-v1.html … v5 |
| `/agents`, `/agents/details` | agents.html, agents-details.html |
| `/agency/grid`, `/list`, `/details` | agency-*.html |
| `/blog/grid`, `/list`, `/details` | blog-*.html |
| `/project/list`, `/details` | project-*.html |
| `/contact`, `/faq`, `/career`, `/compare` | contact, faq, career, compare |
| `/home-loan-process` | home-loan-process.html |
| `/dashboard`, `/add-property` | dashboard, add-property |
| `/my-property`, `/my-profile`, `/my-favorites`, `/my-package`, `/my-save-search` | my-*.html |
| `/review` | review.html |
| `/template-404` | 404.html (also used for Next `not-found`) |

Redirects: `/blog` → `/blog/grid`, `/properties` → `/listing/grid-full-width`.

## How it works

1. `scripts/convert-template.mjs` reads HTML from `../proty-package/proty/`
2. Extracts `#wrapper` content + modals, rewrites links to Next routes and `/images/…` paths
3. Outputs `src/generated/pages/*.json` + `template-manifest.ts` + `page-registry.ts`
4. `src/app/[[...slug]]/page.tsx` statically renders each page via `TemplatePage`

## Repository

https://github.com/MetasysConsulting/realestatetemplate

## License

Use of the Proty design/assets is subject to your ThemeForest license.
