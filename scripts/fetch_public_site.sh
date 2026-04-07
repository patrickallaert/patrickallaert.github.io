#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/site-source"
BASE_URL="https://www.sarahforro.com"

mkdir -p \
  "$OUT_DIR/sitemaps" \
  "$OUT_DIR/html" \
  "$OUT_DIR/assets" \
  "$OUT_DIR/tmp"

fetch() {
  local url="$1"
  local dest="$2"
  curl --connect-timeout 10 --max-time 45 -fsSL "$url" -o "$dest"
}

fetch "$BASE_URL/robots.txt" "$OUT_DIR/robots.txt"
fetch "$BASE_URL/sitemap.xml" "$OUT_DIR/sitemaps/sitemap.xml"
fetch "$BASE_URL/pages-sitemap.xml" "$OUT_DIR/sitemaps/pages-sitemap.xml"
fetch "$BASE_URL/blog-posts-sitemap.xml" "$OUT_DIR/sitemaps/blog-posts-sitemap.xml"
curl -fsSL "$BASE_URL/blog-categories-sitemap.xml" -o "$OUT_DIR/sitemaps/blog-categories-sitemap.xml" || true

python3 - <<'PY' "$OUT_DIR"
import os
import re
import sys
import xml.etree.ElementTree as ET

out_dir = sys.argv[1]
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
seen = set()
urls = []

for name in ("pages-sitemap.xml", "blog-posts-sitemap.xml", "blog-categories-sitemap.xml"):
    path = os.path.join(out_dir, "sitemaps", name)
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        continue
    tree = ET.parse(path)
    for loc in tree.findall(".//sm:loc", ns):
        url = (loc.text or "").strip()
        if url and url not in seen:
            seen.add(url)
            urls.append(url)

urls.sort()

with open(os.path.join(out_dir, "tmp", "urls.txt"), "w", encoding="utf-8") as fh:
    for url in urls:
        fh.write(url + "\n")

def slugify(url: str) -> str:
    cleaned = re.sub(r"^https?://", "", url).strip("/")
    if not cleaned:
        return "home"
    cleaned = cleaned.replace("/", "__")
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", cleaned)
    return cleaned

with open(os.path.join(out_dir, "tmp", "url_map.tsv"), "w", encoding="utf-8") as fh:
    for url in urls:
        fh.write(f"{url}\t{slugify(url)}.html\n")
PY

while IFS=$'\t' read -r url filename; do
  curl --connect-timeout 10 --max-time 45 -fsSL "$url" -o "$OUT_DIR/html/$filename"
done < "$OUT_DIR/tmp/url_map.tsv"

python3 - <<'PY' "$OUT_DIR"
import html
import os
import re
import sys

out_dir = sys.argv[1]
html_dir = os.path.join(out_dir, "html")

title_re = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
asset_re = re.compile(
    r'https://(?:static\.wixstatic\.com/media|static\.wixstatic\.com/shapes|static\.parastorage\.com/services/[^"\' )]+\.(?:css|js)|static\.parastorage\.com/unpkg/[^"\' )]+\.(?:js|css))[^"\' )]*',
    re.IGNORECASE,
)

assets = set()
rows = []

for filename in sorted(os.listdir(html_dir)):
    path = os.path.join(html_dir, filename)
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        content = fh.read()
    match = title_re.search(content)
    title = html.unescape(match.group(1).strip()) if match else ""
    rows.append((filename, title))
    for asset in asset_re.findall(content):
        assets.add(asset)

with open(os.path.join(out_dir, "tmp", "assets.txt"), "w", encoding="utf-8") as fh:
    for asset in sorted(assets):
        fh.write(asset + "\n")

with open(os.path.join(out_dir, "inventory.md"), "w", encoding="utf-8") as fh:
    fh.write("# Sarah Forro Public Content Inventory\n\n")
    fh.write("## Saved Pages\n\n")
    for filename, title in rows:
        fh.write(f"- `{filename}`")
        if title:
            fh.write(f" - {title}")
        fh.write("\n")
    fh.write("\n")
    fh.write(f"## Referenced Assets\n\n- {len(assets)} unique asset URLs extracted from saved HTML.\n")
PY

wget \
  --directory-prefix="$OUT_DIR/assets" \
  --input-file="$OUT_DIR/tmp/assets.txt" \
  --force-directories \
  --no-verbose \
  --continue \
  --tries=2 \
  --timeout=20 || true

printf 'Collected %s pages and %s asset URLs.\n' \
  "$(wc -l < "$OUT_DIR/tmp/urls.txt")" \
  "$(wc -l < "$OUT_DIR/tmp/assets.txt")"
