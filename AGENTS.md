# AGENTS.md — Orientation guide

Vanilla HTML/CSS/JS app (no framework). Vite bundler, Capacitor for Android.

## Architecture

- `bac-selector.html` — standalone page in `public/` (inlined CSS), links to `index.html?bac=id`
- `index.html` + `main.js` — main app (ES module), reads `?bac=` param, fetches matching per-bac JSON. AdMob via global `Capacitor.Plugins.AdMob` (try/catch, silently skips in browser dev)
- `styles.css` — at root, loaded as `/styles.css` from `index.html` only (bac-selector has inlined CSS)
- `public/data/orientations_*.json` — 7 per-bac data files (eco, info, let, math, sci, sp, tech), mirrored in `data/`
- `data/backup.ini` — raw extract output (unused by app). `data/raw-text.txt` and `data/cell-text.txt` are gitignored artifacts
- `scripts/extract-pdf.mjs` — parses hardcoded PDF at `d:\\Downloads\\guide_2025_tp.pdf`, outputs `data/orientations.json`. Only extracts for bac `علوم الإعلامية`. Has `last_guided_total_2024` field; per-bac split + rename to `2025` is done offline (not in repo)


## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run extract` | PDF extraction (hardcoded path in `extract-pdf.mjs`) |

## Data

`main.js` reads `?bac=` from URL, fetches `data/orientations_<bac>.json` via `fetch()`. No param → redirects to `bac-selector.html`. JSON uses field `last_guided_total_2025`.

## Conventions

- Arabic only, `dir="rtl"` on `<html>`
- `base: "./"` in Vite config (relative paths for Capacitor)
- `capacitor.config.ts`: app ID `com.raed.orientation`, `webDir: 'dist'`
- No tests, no lint, no CI/CD
- Google test banner ad unit ID `ca-app-pub-3940256099942544/6300978111`
