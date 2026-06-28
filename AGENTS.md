# AGENTS.md — Orientation Guide

## Project structure

Vanilla HTML/CSS/JS app (no framework). Vite bundler. Capacitor for Android.

- `bac-selector.html` — Bac type chooser page (standalone, inlined CSS), links to `index.html?bac=id`
- `index.html` — Main app page, reads `?bac=` from URL to load the matching JSON
- `main.js` — App logic (`type="module"` script in `index.html`)
- `public/data/orientations_*.json` — Per-bac type data files (7 types: eco, info, let, math, sci, sp, tech), also mirrored in `data/`
- `scripts/extract-pdf.mjs` — Parses `d:\Downloads\guide_2025_tp.pdf` → `data/orientations.json`
- `styles.css` — RTL Arabic design system

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run extract` | Run PDF extraction — hardcoded PDF path at `extract-pdf.mjs:7`, outputs `data/orientations.json`. Only extracts for bac type `علوم الإعلامية` (defined at `extract-pdf.mjs:10`). |

## Data loading

`main.js` no longer imports `orientations.json` statically. On load, it reads `?bac=` from URL, fetches the corresponding `data/orientations_*.json` via `fetch()` and renders the main screen. If no `?bac=` param is present, it redirects to `bac-selector.html`.

The per-bac JSON files use `last_guided_total_2025` (not `2024`).

## Conventions

- Arabic content only, RTL layout (`dir="rtl"` on `<html>`)
- No tests, no lint, no CI/CD, no typechecking
- `base: "./"` in Vite config (relative asset paths for Capacitor/Cordova)
- No `public/` directory currently exists (vite config expects one)
- `capacitor.config.ts` → `webDir: 'dist'`, app ID `com.raed.orientation`
