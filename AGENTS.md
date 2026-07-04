# AGENTS.md — Orientation guide

Vanilla HTML/CSS/JS app (no framework). Vite bundler, Capacitor for Android.

## App

- `public/bac-selector.html` — standalone page (inlined CSS), links to `index.html?bac=id`
- `index.html` + `main.js` (ES module) — reads `?bac=`, fetches per-bac JSON, renders cards with filter/sort/search. Falls back to `bac-selector.html` if no `?bac=` or fetch fails.
- `styles.css` only loaded from `index.html` (via `/styles.css`; Vite resolves from `public/`)
- `index.html` year labels are inconsistent: `<title>` says 2025, body/footer say 2026
- Arabic only, `dir="rtl"` on `<html>`, `android:supportsRtl="true"` in manifest
- `touch-action: manipulation` and `viewport-fit=cover` for mobile

## AdMob

- `Capacitor.Plugins.AdMob` accessed as a **global** (not imported from npm). Inlined try/catch in `main.js` silently skips in browser dev.
- Google test banner: `ca-app-pub-3940256099942544/6300978111` — `isTesting: true`, `position: "BOTTOM_CENTER"`, `adSize: "ADAPTIVE_BANNER"`

## Data

- `data/orientations_*.json` and `public/data/orientations_*.json` are exact copies — 7 files (eco, info, let, math, sci, sp, tech). Each is an array of objects with `code`, `institution`, `degree`, `specialization`, `category`, `last_guided_total_2025`, `last_guided_display`, `score_formula`, `page`, `bac_type` (unused)
- `main.js` fetches `./data/orientations_<bac>.json` — served from `public/data/` in both dev and prod (Vite mounts `public/` at root)
- Data source: `scripts/extract-pdf.mjs` parses hardcoded `d:\\Downloads\\guide_2025_tp.pdf`, outputs `data/orientations.json`. Only extracts for bac `علوم الإعلامية`. Per-bac split + field rename to `2025` is done offline
- `scripts/debug-pdf.mjs` and `scripts/debug-pages.mjs` — ad-hoc debugging helpers
- `data/backup.ini` is tracked but unused (prior format). `data/raw-text.txt` and `data/cell-text.txt` are gitignored artifacts

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
- `capacitor.config.ts`: app ID `com.raed.orientation`, `webDir: 'dist'`
- `android/` is Capacitor-managed. Only manual change: `AndroidManifest.xml:19` (`windowSoftInputMode="adjustPan"` keeps AdMob banner at bottom when keyboard opens)
- TypeScript is a devDep only (for `capacitor.config.ts` parsing)
- `pdf-parse` is a dependency of the extract script only, unused in the app
- No tests, no lint, no CI/CD
- Only `scripts/` is codegen/debugging; everything else powers the app
