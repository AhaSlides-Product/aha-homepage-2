# Release & Manual-Deploy Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay auto-deploy-on-merge bằng GitHub Actions workflow deploy thủ công theo tag, publish `style.css` + `main.js` lên GitHub Pages.

**Architecture:** Thêm một workflow `workflow_dispatch` deploy Pages (gom 2 file asset vào `_site/` rồi upload + deploy artifact). Cập nhật README mô tả quy trình release bằng git thủ công. Một thao tác UI một lần đổi Pages Source sang "GitHub Actions" (người dùng tự bấm).

**Tech Stack:** GitHub Actions (`actions/checkout@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`), GitHub Pages.

## Global Constraints

- Chỉ publish đúng 2 file: `style.css` và `main.js`, đặt ở root của site.
- KHÔNG build vite cho bản deploy (Webflow hardcode path `style.css`/`main.js`).
- Workflow trigger DUY NHẤT bằng `workflow_dispatch` (không có `push`).
- Tên branch release: `release-yyyymmdd`; tag: `v.release-yyyymmdd`.
- URL hợp đồng phải giữ nguyên: `https://ahaslides-product.github.io/aha-homepage-2/style.css` và `.../main.js`.
- Đang làm trên branch `chore/release-manual-deploy-workflow`.

---

### Task 1: Tạo workflow deploy Pages thủ công

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: file `style.css` và `main.js` ở root repo (đã tồn tại).
- Produces: một workflow tên hiển thị `Deploy to Pages`, chạy bằng `workflow_dispatch`, deploy vào environment `github-pages`.

- [ ] **Step 1: Viết file workflow**

Tạo `.github/workflows/deploy-pages.yml` với nội dung chính xác:

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

- [ ] **Step 2: Kiểm tra YAML hợp lệ (parse được)**

Run:
```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy-pages.yml')); print('YAML OK')"
```
Expected: in ra `YAML OK`, không có traceback.

- [ ] **Step 3: Kiểm tra logic gom file đúng (mô phỏng bước Assemble)**

Run:
```bash
rm -rf /tmp/_site_check && mkdir -p /tmp/_site_check && cp style.css main.js /tmp/_site_check/ && ls /tmp/_site_check
```
Expected: liệt kê đúng `main.js` và `style.css` (xác nhận cả 2 file tồn tại ở root để bước `cp` trong workflow không lỗi). Dọn dẹp: `rm -rf /tmp/_site_check`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "ci: add manual workflow_dispatch deploy to GitHub Pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Tài liệu hoá quy trình release trong README

**Files:**
- Modify: `README.md` (thêm mục mới ở cuối, sau mục "Develop")

**Interfaces:**
- Consumes: workflow `Deploy to Pages` từ Task 1.
- Produces: hướng dẫn người dùng đọc được; không có interface code.

- [ ] **Step 1: Thêm mục "Release & deploy" vào README**

Chèn khối sau vào cuối `README.md`:

```markdown
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
```

- [ ] **Step 2: Kiểm tra README còn đọc được và có mục mới**

Run:
```bash
grep -n "Release & deploy" README.md && grep -n "Run workflow" README.md
```
Expected: mỗi grep trả về ít nhất 1 dòng khớp.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document tag-based manual release & deploy process

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Bàn giao & kích hoạt (thao tác tay một lần + verify end-to-end)

**Files:**
- Không sửa file. Đây là bước phối hợp với người dùng + verify thực tế trên GitHub.

**Interfaces:**
- Consumes: workflow `Deploy to Pages` (Task 1) đã có trên `master`.
- Produces: GitHub Pages chạy ở chế độ GitHub Actions; một lần deploy thành công đã verify.

- [ ] **Step 1: Đưa branch lên & merge vào master**

Push branch và mở PR (hoặc merge) để `deploy-pages.yml` có mặt trên `master`:
```bash
git push -u origin chore/release-manual-deploy-workflow
```
Sau đó merge PR vào `master` theo quy trình thường của team.

> Quan trọng: workflow phải nằm trên `master` TRƯỚC khi cắt tag, vì tag được cắt
> từ `master` sau merge mới chứa file workflow (điều kiện để `workflow_dispatch`
> chạy từ tag đó).

- [ ] **Step 2: (Người dùng) Đổi Pages Source sang GitHub Actions**

Hướng dẫn người dùng: GitHub → **Settings → Pages → Source → GitHub Actions**.
Đây là bước UI, không làm được bằng CLI. Đồng thời việc này tự động tắt
auto-deploy theo branch.

- [ ] **Step 3: Tạo tag thử và push**

```bash
git checkout master && git pull
git checkout -b release-20260629
git push -u origin release-20260629
git tag v.release-20260629
git push origin v.release-20260629
```

- [ ] **Step 4: Chạy workflow từ tag và verify deploy**

1. Actions → **Deploy to Pages** → Run workflow → chọn tag `v.release-20260629` → Run.
2. Đợi 2 job xanh.
3. Verify nội dung đã publish:

```bash
curl -fsSL "https://ahaslides-product.github.io/aha-homepage-2/style.css" | head -5
curl -fsSL "https://ahaslides-product.github.io/aha-homepage-2/main.js" | head -5
```
Expected: trả về nội dung file (HTTP 200, có nội dung), khớp với phiên bản trong tag.

- [ ] **Step 5: Xác nhận merge-to-master không còn deploy**

Sau khi Source đã là GitHub Actions: thực hiện một merge nhỏ bất kỳ vào `master`
và kiểm tra tab Actions — KHÔNG có run deploy nào tự khởi động. (Chỉ
`workflow_dispatch` mới deploy.)

---

## Self-Review

**Spec coverage:**
- Cơ chế GitHub Actions → Task 1. ✓
- Trigger `workflow_dispatch` chọn tag → Task 1 (workflow) + Task 3 Step 4. ✓
- Publish chỉ `style.css` + `main.js` → Task 1 Step 1 (`cp style.css main.js`). ✓
- README hướng dẫn quy trình git thủ công → Task 2. ✓
- Thao tác tay đổi Pages Source → Task 3 Step 2. ✓
- Lưu ý workflow phải có trên master trước khi cắt tag → Task 3 Step 1. ✓
- Auto-deploy ngừng sau khi đổi Source → Task 3 Step 2 + verify Step 5. ✓
- Verify bằng curl → Task 3 Step 4. ✓
- YAGNI loại trừ (không script, không vite, không auto-tag-deploy) → tôn trọng, không có task nào tạo các thứ này. ✓

**Placeholder scan:** Không có TBD/TODO; mọi bước có lệnh/nội dung cụ thể. Ngày `20260629` là placeholder có chủ đích, đã ghi rõ "đổi thành ngày thật". ✓

**Type/tên nhất quán:** tên workflow `Deploy to Pages`, environment `github-pages`, branch `release-yyyymmdd`, tag `v.release-yyyymmdd`, concurrency group `pages` — dùng nhất quán xuyên suốt. ✓
