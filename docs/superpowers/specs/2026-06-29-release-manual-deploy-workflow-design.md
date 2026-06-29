# Release & Manual-Deploy Workflow — Design

Date: 2026-06-29

## Mục tiêu

Thay đổi quy trình deploy GitHub Pages: bỏ auto-deploy khi merge vào `master`,
chuyển sang deploy theo **tag** và do **dev trigger thủ công**.

Quy trình mong muốn:

```
feature branch ──merge──> master            (KHÔNG deploy)
                              │
                    (đến ngày release)
                              ▼
                tạo branch  release-yyyymmdd  ← điểm ổn định / base cho hotfix
                              │
                    tạo tag  v.release-yyyymmdd
                              │
                    push branch + tag lên origin
                              │
   Dev: Actions → "Deploy to Pages" → Run workflow → chọn ref = tag
                              ▼
        GitHub Actions publish style.css + main.js → GitHub Pages
```

## Bối cảnh hiện tại

- Repo **không có** GitHub Actions workflow nào. GitHub Pages đang chạy ở chế độ
  **"Deploy from a branch"**, phục vụ trực tiếp file từ root của `master`.
- Trang HTML thật được host trên Webflow (`wordss-fresh-site.webflow.io`). Repo
  chỉ host 2 file asset là `style.css` và `main.js`; `index.html` bị gitignore.
- Trang Webflow live tham chiếu cross-origin tới đúng 2 URL:
  - `https://ahaslides-product.github.io/aha-homepage-2/style.css`
  - `https://ahaslides-product.github.io/aha-homepage-2/main.js`
- Không có file nào khác (ảnh, mp4, …) được tham chiếu qua `github.io`. Vì vậy
  "deploy" = publish phiên bản mới của `style.css` và `main.js` lên Pages.
- Hiện tại: merge vào `master` → Pages tự cập nhật ngay lập tức.

## Quyết định thiết kế

| Vấn đề | Quyết định |
|--------|-----------|
| Cơ chế deploy | Chuyển từ "Deploy from a branch" sang **GitHub Actions** (bắt buộc để deploy theo tag + trigger tay) |
| Cách trigger | `workflow_dispatch` — vào tab Actions → Run workflow → chọn ref là tag `v.release-yyyymmdd` |
| Phạm vi publish | Chỉ `style.css` + `main.js` đặt ở root của site |
| Build vite? | KHÔNG. Webflow hardcode 2 path `style.css`/`main.js` nên không dùng asset-hash của vite |
| Helper script | KHÔNG tạo. Dev tự chạy lệnh git theo hướng dẫn trong README |

## Thành phần

### 1. `.github/workflows/deploy-pages.yml`

Workflow deploy GitHub Pages, chạy thủ công.

Yêu cầu:

- **Trigger:** chỉ `workflow_dispatch` (không có `push`). Dev chọn ref (tag) ở
  dropdown của GitHub UI khi Run workflow.
- **Tên hiển thị:** `Deploy to Pages` (để dễ nhận ở tab Actions).
- **permissions:**
  - `contents: read`
  - `pages: write`
  - `id-token: write`
- **concurrency:** group `pages`, không huỷ run đang chạy (tránh deploy chồng nhau).
- **Job `build`:**
  - `actions/checkout`
  - Gom đúng `style.css` và `main.js` vào một thư mục tạm `_site/`.
  - `actions/upload-pages-artifact` với `path: _site`.
- **Job `deploy`:**
  - `needs: build`
  - `environment: github-pages` (kèm `url` từ output của deploy step).
  - `actions/deploy-pages`.

Phác thảo:

```yaml
name: Deploy to Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Assemble site
        run: |
          mkdir -p _site
          cp style.css main.js _site/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 2. Cập nhật `README.md`

Thêm mục mô tả quy trình release với lệnh git mẫu (dùng ngày thật, ví dụ `20260629`):

```bash
# 1. Đảm bảo master đã có các feature cần release
git checkout master
git pull

# 2. Tạo branch release theo ngày
git checkout -b release-20260629
git push -u origin release-20260629

# 3. Tạo tag và push
git tag v.release-20260629
git push origin v.release-20260629

# 4. Deploy: vào GitHub → tab Actions → "Deploy to Pages" → Run workflow
#    → ở dropdown "Use workflow from" chọn tag v.release-20260629 → Run.
```

Ghi rõ: merge vào `master` **không còn tự deploy**; deploy chỉ xảy ra khi dev
chạy workflow thủ công.

### 3. Thao tác tay một lần (ngoài repo)

Trong GitHub: **Settings → Pages → Source → GitHub Actions**.
Đây là bước UI, không thực hiện được bằng code; sẽ hướng dẫn người dùng bấm.

## Lưu ý vận hành

- `workflow_dispatch` chạy từ một **tag** chỉ hoạt động nếu file workflow đã tồn
  tại trong cây của tag đó. Vì workflow nằm trên `master` và tag được cắt từ
  `master` *sau khi* đã merge workflow này, nên mọi tag tương lai đều chứa
  workflow. Tag cũ tạo trước khi merge sẽ không deploy được (không vấn đề gì).
- Sau khi đổi Source sang GitHub Actions, auto-deploy theo branch tự động ngừng —
  không cần workflow phụ để tắt.
- Branch `release-yyyymmdd` đóng vai trò điểm ổn định / base cho hotfix; deploy
  thực tế dựa trên **tag**.

## Verify

1. Merge workflow vào `master`, đổi Pages Source sang GitHub Actions.
2. Tạo tag thử `v.release-20260629` và push.
3. Actions → "Deploy to Pages" → Run workflow → chọn tag → chạy.
4. Kiểm tra job xanh, rồi `curl https://ahaslides-product.github.io/aha-homepage-2/style.css`
   xác nhận nội dung cập nhật.

## Phạm vi loại trừ (YAGNI)

- Không tạo `scripts/release.sh`.
- Không build vite cho bản deploy.
- Không deploy tự động theo tag, không dùng Environment approval.
- Không publish các asset khác ngoài `style.css` và `main.js`.
