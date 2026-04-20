#!/usr/bin/env bash
set -euo pipefail

URL="https://wordss-fresh-site.webflow.io/"
OUT="index.html"

cd "$(dirname "$0")"

echo "Pulling $URL ..."
curl -fsSL "$URL" -o "$OUT.tmp"

sed -i.bak \
  -e 's|https://ahaslides-product\.github\.io/aha-homepage-2/style\.css|style.css|g' \
  -e 's|https://ahaslides-product\.github\.io/aha-homepage-2/main\.js|main.js|g' \
  "$OUT.tmp"
rm -f "$OUT.tmp.bak"

mv "$OUT.tmp" "$OUT"
echo "Wrote $OUT (style.css / main.js rewritten to local paths)"
