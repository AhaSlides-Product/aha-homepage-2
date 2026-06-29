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

## Release & deploy

Merging to `master` no longer deploys. Deploy is manual, from a release tag,
and publishes only `style.css` and `main.js`.

Cut a release (replace `20260629` with the real date):

```bash
git checkout master && git pull
git checkout -b release-20260629 && git push -u origin release-20260629
git tag v.release-20260629 && git push origin v.release-20260629
```

Then deploy: **Actions → Deploy to Pages → Run workflow**, select the tag
`v.release-20260629`, and run.

> One-time setup: **Settings → Pages → Source → GitHub Actions**.
