# Proty — Hawaii Real Estate (Next.js)

Next.js port of the **Proty** real estate HTML template (ThemeForest), configured with the template’s **blue theme** (`theme-color-4`: primary `#7695ff`).

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [pnpm](https://pnpm.io/) package manager
- Original template CSS (Bootstrap grid + Proty `styles.css`)
- [Swiper](https://swiperjs.com/) for listing carousels

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command       | Description          |
|---------------|----------------------|
| `pnpm dev`    | Development server   |
| `pnpm build`  | Production build     |
| `pnpm start`  | Run production build |
| `pnpm lint`   | ESLint               |

## Routes

| Path                 | Page                    |
|----------------------|-------------------------|
| `/`                  | Home + hero search      |
| `/properties`        | Property grid/list      |
| `/properties/[id]`   | Property detail         |
| `/agents`            | Agents                  |
| `/blog`              | Blog index              |
| `/faq`               | FAQ                     |
| `/contact`           | Contact form            |

## Theme

Blue branding is applied via CSS variables in `src/app/globals.css` (matching the HTML template’s `theme-color-4`).

## Push to a remote repository

This project is already a git repo. Create a GitHub repo, then:

```bash
git remote add origin git@github.com:YOUR_USER/proty-web.git
git add .
git commit -m "Initial Next.js port of Proty template with blue theme"
git push -u origin main
```

## Source template

Static assets and styles come from `proty-package/proty/` in the parent folder (original ThemeForest zip). License and extended use follow your ThemeForest purchase terms.

## Project structure

```
src/
  app/           # Routes (App Router)
  components/    # Header, footer, property cards, home sections
  lib/           # Navigation + sample property data
public/
  css/           # Template stylesheets
  icons/         # Icomoon icon font
  images/        # Template images
```
