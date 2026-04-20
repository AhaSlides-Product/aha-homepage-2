# aha-homepage-2

Local development workspace for the AhaSlides homepage. The HTML is authored in
Webflow and pulled down on demand; only `style.css` and `main.js` are
hand-edited and committed.

## Setup

```bash
yarn install   # or: npm install
```

## Pull the latest HTML from Webflow

```bash
npm run pull
```

What it does (`pull.sh`):

1. Downloads `https://wordss-fresh-site.webflow.io/` into `index.html`.
2. Rewrites the GitHub Pages URLs to local paths:
   - `https://ahaslides-product.github.io/aha-homepage-2/style.css` → `style.css`
   - `https://ahaslides-product.github.io/aha-homepage-2/main.js` → `main.js`

`index.html` is git-ignored — re-run `npm run pull` whenever the Webflow site
changes. The committed source of truth is `style.css` and `main.js`.

## Develop

```bash
npm run dev      # vite dev server
npm run build    # production build into dist/
npm run preview  # preview the build
```

Typical loop:

1. `npm run pull` to refresh `index.html` after a Webflow change.
2. Edit `style.css` / `main.js`.
3. Commit only the CSS/JS changes (the HTML stays untracked).
