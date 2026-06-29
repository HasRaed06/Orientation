# AGENTS.md — Orientation guide

Vanilla HTML/CSS/JS app (no framework). Vite bundler, Capacitor for Android.

## Structure

- `bac-selector.html` — standalone page in `public/` (inlined CSS), links to `index.html?bac=id`
- `index.html` + `main.js` — main app (ES module), reads `?bac=` param, fetches matching JSON
- `public/data/orientations_*.json` — 7 per-bac data files (eco, info, let, math, sci, sp, tech), mirrored in `data/`
- `src/` — React/TS components (SearchFeed, injectAd). Standalone; NOT imported by the main app
- `scripts/extract-pdf.mjs` — parses a hardcoded PDF, outputs `data/orientations.json`. Extracts only for bac `علوم الإعلامية` (`BAC_MEDIA` at line 10). Writes `last_guided_total_2024` field. The per-bac split + rename to `2025` is done offline (not in the repo)

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run extract` | PDF extraction (hardcoded path `extract-pdf.mjs:7`) |
| `npx tsc --noEmit` | Type-check `src/` |

## Data loading

`main.js` reads `?bac=` from URL, fetches `data/orientations_<bac>.json` via `fetch()`. No param → redirects to `bac-selector.html`. Per-bac JSON uses `last_guided_total_2025`.

## Conventions

- Arabic only, `dir="rtl"` on `<html>`
- `base: "./"` in Vite config (relative paths for Capacitor)
- `capacitor.config.ts`: app ID `com.raed.orientation`, `webDir: 'dist'`
- No tests, no lint, no CI/CD
- React TS components use kebab-case BEM CSS (e.g. `feed-card__title`)

## React / AdMob

- `SearchFeed` renders a feed with an ad spliced at index 3 (`injectAd.ts`)
- Ad uses `@capacitor-community/admob` with Google test banner ad unit ID
- On load failure `AdCard` returns `null`; cleanup calls `AdMob.removeBanner()`
