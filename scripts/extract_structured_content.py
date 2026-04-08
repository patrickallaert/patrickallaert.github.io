#!/usr/bin/env python3
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from typing import List, Tuple

ROOT = Path(__file__).resolve().parent.parent
HTML_DIR = ROOT / "site-source" / "html"
OUT_DIR = ROOT / "content-source"

SKIP_EXACT = {
    "Home",
    "About Us",
    "About",
    "Events",
    "Classes",
    "Levels",
    "Contact",
    "Newsletter",
    "More",
    "Forró Guinguettes",
    "Forró Práticas",
    "Forró Initiations",
    "Feedback Week",
    "April-June 2026",
    "top of page",
    "bottom of page",
    "GET IN TOUCH",
    "We'd love to hear from you",
    "Follow @conexao.brussels on Instagram",
    "Find Conexão on Facebook",
    "© 2020 by Sarah Collings. Proudly created withWix.com",
    "Logo font licensed by CC BY 4.0.",
    "Use tab to navigate through the menu items.",
    "Email info@conexao.be",
}

SKIP_CONTAINS = (
    "Proudly created with",
    "wix-thunderbolt",
    "polyfill",
    "fedops",
    "sourceMappingURL",
    "window.viewerModel",
    "performance.mark",
    "overrideGlobals",
)

MAPPING = [
    ("www.sarahforro.com.html", "home.md", "Home"),
    ("www.sarahforro.com__classes.html", "classes/overview.md", "Classes"),
    ("www.sarahforro.com__april-june-2026.html", "classes/april-june-2026.md", "Classes April-June 2026"),
    ("www.sarahforro.com__jan-march-2026.html", "classes/jan-march-2026.md", "Classes Jan-March 2026"),
    ("www.sarahforro.com__level-descriptions.html", "levels/overview.md", "Levels"),
    ("www.sarahforro.com__level1description.html", "levels/level-1.md", "Level 1"),
    ("www.sarahforro.com__level2description.html", "levels/level-2.md", "Level 2"),
    ("www.sarahforro.com__level3description.html", "levels/level-3.md", "Level 3"),
    ("www.sarahforro.com__level4description.html", "levels/level-4.md", "Level 4"),
    ("www.sarahforro.com__about-us.html", "about/about-us.md", "About Us"),
    ("www.sarahforro.com__events.html", "events/overview.md", "Events"),
    ("www.sarahforro.com__forr--guinguettes.html", "events/forro-guinguettes.md", "Forró Guinguettes"),
    ("www.sarahforro.com__forr--pr-ticas.html", "events/forro-praticas.md", "Forró Práticas"),
    ("www.sarahforro.com__forr--initiations.html", "events/forro-initiations.md", "Forró Initiations"),
    ("www.sarahforro.com__feedback-week-march-2025.html", "events/feedback-week.md", "Feedback Week"),
    ("www.sarahforro.com__contact.html", "contact/contact.md", "Contact"),
    ("www.sarahforro.com__arriving-dojo-du-brochet.html", "contact/arriving-at-the-dojo-du-brochet.md", "Arriving at the Dojo du Brochet"),
    ("www.sarahforro.com__newsletter.html", "contact/newsletter.md", "Newsletter"),
    ("www.sarahforro.com__terms-and-conditions.html", "legal/terms-and-conditions.md", "Terms and Conditions"),
    ("www.sarahforro.com__payment-information.html", "legal/payment-information.md", "Payment Information"),
    ("www.sarahforro.com__conditions-generales.html", "legal/conditions-generales.md", "Conditions générales"),
]


class BlockParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.skip_depth = 0
        self.current_tag = None
        self.current_text: List[str] = []
        self.blocks: List[Tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in {"script", "style"}:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        if tag in {"h1", "h2", "h3", "p", "li"}:
            self.current_tag = tag
            self.current_text = []

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.skip_depth:
            self.skip_depth -= 1
            return
        if self.skip_depth:
            return
        if self.current_tag == tag:
            text = " ".join("".join(self.current_text).split())
            if text:
                self.blocks.append((tag, text))
            self.current_tag = None
            self.current_text = []

    def handle_data(self, data: str) -> None:
        if self.skip_depth or not self.current_tag:
            return
        self.current_text.append(data)


def normalize_text(text: str) -> str:
    return " ".join(
        text.replace("\u200b", "")
        .replace("\ufeff", "")
        .replace("\xa0", " ")
        .split()
    )


def should_skip(text: str) -> bool:
    if not text:
        return True
    if text in SKIP_EXACT:
        return True
    if any(part in text for part in SKIP_CONTAINS):
        return True
    if text.startswith("Emailinfo@conexao.be"):
        return True
    if text.startswith("Level 1 Description |") or text.startswith("Level 2 Description |") or text.startswith("Level 3 Description |") or text.startswith("Level 4 Description |"):
        return True
    if text.endswith("top of page"):
        return True
    return False


def write_markdown(source_name: str, output_name: str, title: str) -> None:
    parser = BlockParser()
    parser.feed((HTML_DIR / source_name).read_text(encoding="utf-8", errors="ignore"))

    output_path = OUT_DIR / output_name
    output_path.parent.mkdir(parents=True, exist_ok=True)

    seen: set[tuple[str, str]] = set()
    lines = [f"# {title}", "", f"Source: `{source_name}`", ""]

    for tag, text in parser.blocks:
        text = normalize_text(text)
        if should_skip(text):
            continue
        key = (tag, text)
        if key in seen:
            continue
        seen.add(key)
        if tag == "h1":
            lines.extend([f"## {text}", ""])
        elif tag == "h2":
            lines.extend([f"## {text}", ""])
        elif tag == "h3":
            lines.extend([f"### {text}", ""])
        elif tag == "li":
            lines.append(f"- {text}")
        else:
            lines.extend([text, ""])

    output_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def write_manual_team_page() -> None:
    path = OUT_DIR / "about" / "team-profiles.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        """# Teaching Team

Source: user-provided content in chat.

## Sarah Collings

Sarah fell in love with forró while living in Milan and she hasn’t looked back since. Building on her experience in sports and language education, Sarah launched and started to teach forró classes in Brussels in 2014.

She now teaches regular classes in Brussels and Ghent, as well as travelling all over Europe and occasionally beyond to teach at workshops and festivals.

Sarah's classes emphasise the importance of presence, connection with our partner and musicality. She also prides herself on trying to achieve that oh-so-delicate balance between technique and creativity, precision and freedom, focus and fun.

## Simon

Simon discovered forró in 2018 in Toulouse and dived straight in, immersing himself in the dance, the music, and the community.

He loves the challenge of breaking down new moves and then practises diligently which creates his signature smooth dance style, whether he's turning universitário-style or exploring the intricacies of roots footwork. In the classroom, he is passionate, detailed-oriented, and untiring - keen to contribute to each student's learning as best he can.

## Andrés

The best way to get to know Andrés is to invite him to dance! One of the most generous dancers around, he's the first to open the dance floor and the last to leave it.

Andrés started dancing forró in 2017, and quickly proved himself a dedicated and curious leader. One of his strongest skills is connection, opening up lots of space for creativity and playfulness on the dance floor. In the classroom, he is laid-back but highly observant, analysing what's going on and providing support wherever necessary.

## Anna

Anna’s warm and welcoming nature makes her a natural at putting new students at ease. Her passion for sharing and spreading the joy of forró shines through in everything she does, whether she’s teaching a class or dancing at a party.

Outside the classroom, Anna takes her love for forró to the stage, where she keeps the rhythm alive as the zabumba player for "Forró na Chinela." Her commitment to the music and dance inspires everyone she encounters to dive deeper into the forró experience.

## Charlotte

Charlotte is all about the feeling. Her style of dancing values presence and connection, with a touch of playfulness. Highly committed, she studies hard as both a leader and follower. More recently, she has also put on an organiser hat to keep forró parties rolling in Brussels.

Charlotte's kindness and patience is appreciated in the classroom. She puts students at ease and brings an embodied softness to the space.

## Giulia

Giulia radiates positivity and warmth, making her one of the sunniest and most uplifting people in the forró community. Her playful and dynamic dance style is all about embracing joy and creating a fun connection with her partners.

As a teacher, Giulia is patient and encouraging, fostering an environment where students feel empowered to explore and grow. Beyond the dance floor, she brings her vibrant energy to the stage as the triangle player in the band "Forró na Chinela," adding sparkle and rhythm to their performances.

## Patrick

Everything Patrick does is clean and precise, providing maximum opportunity to connect with his partner. He's the embodiment of quality over quantity.

He started dancing forró in 2018, bringing his background in salsa, bachata and other dance styles with him. If you fancy a philosophical conversation on couple dancing? Patrick is your guy! And in the classroom, he is exceptionally patient, drawing on his diverse dance experiences to clearly communicate the details with a touch of humour.

## Vero

Vero is a creative and versatile dancer who constantly draws inspiration from a variety of dance styles, adding depth and uniqueness to her forró. Her approach to dancing emphasizes fluidity and self-expression, making every moment on the dance floor engaging and memorable.

In her teaching, Vero focuses on helping students enhance their technique and bring comfort and confidence to their dancing. Her thoughtful guidance and eye for detail ensure that students leave her classes feeling both accomplished and inspired to keep improving.
""",
        encoding="utf-8",
    )


def write_content_map() -> None:
    path = OUT_DIR / "content-map.md"
    path.write_text(
        """# Content Map

This file maps extracted source material to the current minimal site structure.

## Home

- Start light.
- Pull only essential orientation content later:
  - what Conexao is
  - current term
  - how the yearly rhythm works
  - key calls to action

## Classes

- `classes/overview.md`
- `classes/april-june-2026.md`
- `classes/jan-march-2026.md`

## Levels

- `levels/overview.md`
- `levels/level-1.md`
- `levels/level-2.md`
- `levels/level-3.md`
- `levels/level-4.md`

## About

- `about/about-us.md`
- `about/team-profiles.md`

## Events

- `events/overview.md`
- `events/forro-guinguettes.md`
- `events/forro-praticas.md`
- `events/forro-initiations.md`
- `events/feedback-week.md`

## Contact

- `contact/contact.md`
- `contact/arriving-at-the-dojo-du-brochet.md`
- `contact/newsletter.md`

## Legal

- `legal/terms-and-conditions.md`
- `legal/payment-information.md`
- `legal/conditions-generales.md`

## Suggested migration order

1. Classes
2. Levels
3. About
4. Contact
5. Legal
6. Events
7. Home
""",
        encoding="utf-8",
    )


def main() -> None:
    for source_name, output_name, title in MAPPING:
        write_markdown(source_name, output_name, title)
    write_manual_team_page()
    write_content_map()


if __name__ == "__main__":
    main()
