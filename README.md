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

GitHub Pages **không còn tự deploy khi merge vào `master`**. Deploy chỉ xảy ra
khi dev chạy workflow thủ công, dựa trên một tag release.

Chỉ `style.css` và `main.js` được publish (đúng 2 file Webflow tham chiếu tại
`https://ahaslides-product.github.io/aha-homepage-2/`).

### Quy trình release

```bash
# 1. Đảm bảo master đã có các feature cần release
git checkout master
git pull

# 2. Tạo branch release theo ngày (đổi 20260629 thành ngày thật)
git checkout -b release-20260629
git push -u origin release-20260629

# 3. Tạo tag và push
git tag v.release-20260629
git push origin v.release-20260629
```

### 4. Deploy thủ công

1. Mở GitHub → tab **Actions** → workflow **Deploy to Pages**.
2. Bấm **Run workflow**.
3. Ở dropdown *"Use workflow from"* chọn tag `v.release-20260629`.
4. Bấm **Run workflow** và đợi cả 2 job (`build`, `deploy`) xanh.

> Lần thiết lập đầu tiên: vào **Settings → Pages → Source** và chọn
> **GitHub Actions** (thay cho "Deploy from a branch").
