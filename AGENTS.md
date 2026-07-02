# AGENTS.md — Orientation guide

Vanilla HTML/CSS/JS app (no framework). Vite bundler, Capacitor for Android.

## App

- `public/bac-selector.html` — standalone page (inlined CSS), links to `index.html?bac=id`
- `index.html` + `main.js` (ES module) — reads `?bac=`, fetches per-bac JSON, renders cards with filter/sort/search. AdMob via `Capacitor.Plugins.AdMob` (try/catch, silently skips in browser dev)
- `styles.css` loaded from `index.html` only (via absolute `/styles.css` path; Vite resolves it)
- Arabic only, `dir="rtl"` on `<html>`

## Data

- `data/orientations_*.json` and `public/data/orientations_*.json` are exact copies — 7 files (eco, info, let, math, sci, sp, tech). Each is an array with fields `code`, `institution`, `degree`, `specialization`, `category`, `last_guided_total_2025`, `score_formula`, `page`, `bac_type` (unused by app)
- `main.js` fetches `./data/orientations_<bac>.json` — served from `public/data/` in both dev and prod (Vite mounts `public/` at root)
- Data source: `scripts/extract-pdf.mjs` parses hardcoded path `d:\\Downloads\\guide_2025_tp.pdf`, outputs `data/orientations.json` with field `last_guided_total_2024`. Only extracts for bac `علوم الإعلامية`. Per-bac split + field rename to `2025` is done offline (not in repo)
- `scripts/debug-pdf.mjs` and `scripts/debug-pages.mjs` — ad-hoc debugging helpers for the PDF extractor
- `data/backup.ini` — prior extract format (unused by app). `data/raw-text.txt` and `data/cell-text.txt` are gitignored artifacts

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run extract` | PDF extraction (hardcoded path) |

## Conventions

- `"type": "module"` in package.json — all `.js` and `.mjs` files run as ESM
- `base: "./"` in Vite config (relative paths for Capacitor)
- `capacitor.config.ts`: app ID `com.raed.orientation`, `webDir: 'dist'` — the only TypeScript file in the repo
- `android/` is Capacitor-managed (regenerated via `npx cap sync`); do not hand-edit
- Google test banner: `ca-app-pub-3940256099942544/6300978111`
- No tests, no lint, no CI/CD
- Only `scripts/` is codegen and debugging; everything else powers the app
