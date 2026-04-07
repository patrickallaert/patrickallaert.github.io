#!/usr/bin/env python3
from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_SOURCE = ROOT / "site-source"
HTML_DIR = SITE_SOURCE / "html"
WORKING_SET = SITE_SOURCE / "working-set"

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)

CORE_EN = {
    "www.sarahforro.com.html",
    "www.sarahforro.com__about-us.html",
    "www.sarahforro.com__classes.html",
    "www.sarahforro.com__contact.html",
    "www.sarahforro.com__events.html",
    "www.sarahforro.com__lead-and-follow.html",
    "www.sarahforro.com__level-descriptions.html",
    "www.sarahforro.com__level1description.html",
    "www.sarahforro.com__level2description.html",
    "www.sarahforro.com__level3description.html",
    "www.sarahforro.com__level4description.html",
    "www.sarahforro.com__payment-information.html",
    "www.sarahforro.com__newsletter.html",
    "www.sarahforro.com__open-doors.html",
    "www.sarahforro.com__arriving-dojo-du-brochet.html",
    "www.sarahforro.com__feedback-week-march-2025.html",
    "www.sarahforro.com__forr--guinguettes.html",
    "www.sarahforro.com__forr--initiations.html",
    "www.sarahforro.com__forr--pr-ticas.html",
    "www.sarahforro.com__xl-danse-2024.html",
}

LEGAL_REFERENCE = {
    "www.sarahforro.com__terms-and-conditions.html",
    "www.sarahforro.com__terms-conditions.html",
    "www.sarahforro.com__conditions-generales.html",
    "www.sarahforro.com__copy-of-terms-conditions.html",
    "www.sarahforro.com__copy-of-terms-conditions-1.html",
    "www.sarahforro.com__copy-of-conditions-g-n-rales.html",
}

BLOG_REFERENCE = {
    "www.sarahforro.com__blog.html",
    "www.sarahforro.com__blog__categories__faces-of-forr-.html",
    "www.sarahforro.com__blog__categories__letras-do-forr-.html",
    "www.sarahforro.com__blog__categories__lockdown-forr-.html",
    "www.sarahforro.com__blog__categories__musings-reflections.html",
    "www.sarahforro.com__post__forr--outside-the-box.html",
    "www.sarahforro.com__post__letras-do-forr--asa-branca-luiz-gonzaga.html",
    "www.sarahforro.com__post__letras-do-forr--sanfona-sentida.html",
    "www.sarahforro.com__post__letras-do-forr--vou-te-namorar-dois-dobrado.html",
    "www.sarahforro.com__post__letras-do-forr-.html",
    "www.sarahforro.com__post__the-forro-must-go-on.html",
    "www.sarahforro.com__post__when-the-penny-drops.html",
}

SEASONAL_REFERENCE = {
    "www.sarahforro.com__jan-march-2026.html",
    "www.sarahforro.com__april-june-2026.html",
    "www.sarahforro.com__sept-dec-2025.html",
}

FR_ARCHIVE = {
    "www.sarahforro.com__classes-sept-2021-fr.html",
    "www.sarahforro.com__cours-avril-2022.html",
    "www.sarahforro.com__cours-jan-2022.html",
    "www.sarahforro.com__cours-sept-2022.html",
}


def read_title(path: Path) -> str:
    content = path.read_text(encoding="utf-8", errors="ignore")
    match = TITLE_RE.search(content)
    return html.unescape(match.group(1).strip()) if match else ""


def category_for(name: str) -> tuple[str, str]:
    if name in CORE_EN:
        return "core-en", "Evergreen EN content to reuse directly in the rebuild."
    if name in LEGAL_REFERENCE:
        return "legal-reference", "Legal/payment reference to rewrite and consolidate."
    if name in BLOG_REFERENCE:
        return "blog-reference", "Legacy blog/reference material, likely not first-launch scope."
    if name in SEASONAL_REFERENCE:
        return "seasonal-reference", "Recent class-cycle reference for structure, copy, pricing, and dates."
    if name in FR_ARCHIVE:
        return "fr-archive", "French archive. Out of scope for the first EN-only rebuild."
    return "archive", "Old or duplicate seasonal/archive content to ignore during first-pass rebuild."


def ensure_clean_dirs() -> None:
    categories = {
        "core-en",
        "legal-reference",
        "blog-reference",
        "seasonal-reference",
        "fr-archive",
        "archive",
    }
    WORKING_SET.mkdir(exist_ok=True)
    for category in categories:
        target = WORKING_SET / category
        target.mkdir(parents=True, exist_ok=True)
        for child in target.iterdir():
            if child.is_symlink() or child.is_file():
                child.unlink()


def main() -> None:
    ensure_clean_dirs()
    rows = []

    for path in sorted(HTML_DIR.glob("*.html")):
        category, note = category_for(path.name)
        title = read_title(path)
        link = WORKING_SET / category / path.name
        if link.exists() or link.is_symlink():
            link.unlink()
        link.symlink_to(path.resolve())
        rows.append((category, path.name, title, note))

    grouped_order = [
        "core-en",
        "seasonal-reference",
        "legal-reference",
        "blog-reference",
        "fr-archive",
        "archive",
    ]

    audit = SITE_SOURCE / "content-audit.md"
    with audit.open("w", encoding="utf-8") as fh:
        fh.write("# Content Audit\n\n")
        fh.write("This file separates the public snapshot into the working set for the new EN-only Conexao site.\n\n")
        fh.write("## Recommendation\n\n")
        fh.write("- Keep the raw snapshot intact in `site-source/html`.\n")
        fh.write("- Build only from `core-en` plus `seasonal-reference` and `legal-reference`.\n")
        fh.write("- Ignore `fr-archive`, `archive`, and probably `blog-reference` for the first launch.\n")
        fh.write("- Replace recurring trimester pages with one reusable class-cycle model: September, January, April.\n")
        fh.write("- On the live site, show the current trimester and, when relevant, the next trimester once registration opens.\n\n")

        for category in grouped_order:
            fh.write(f"## {category}\n\n")
            for row_category, name, title, note in rows:
                if row_category != category:
                    continue
                fh.write(f"- `{name}`")
                if title:
                    fh.write(f" - {title}")
                fh.write(f" ({note})\n")
            fh.write("\n")


if __name__ == "__main__":
    main()
