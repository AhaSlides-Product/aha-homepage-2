#!/usr/bin/env bash
set -euo pipefail

URL="https://wordss-fresh-site.webflow.io/"
OUT="index.html"

cd "$(dirname "$0")"

echo "Pulling $URL ..."
curl -fsSL "$URL" -o "$OUT.tmp"

sed \
  -e 's|https://ahaslides-product\.github\.io/aha-homepage-2/style\.css|style.css|g' \
  -e 's|https://ahaslides-product\.github\.io/aha-homepage-2/main\.js|main.js|g' \
  -e 's|<head>|<head><meta name="robots" content="noindex,nofollow">|' \
  "$OUT.tmp" > "$OUT.tmp.new"
rm -f "$OUT.tmp"

mv "$OUT.tmp.new" "$OUT"
echo "Wrote $OUT (style.css / main.js rewritten, robots noindex injected)"
