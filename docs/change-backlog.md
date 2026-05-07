# Change Backlog

This backlog captures product, content, and technical ideas that should be considered after the current static rebuild. It is intentionally ordered so related work can be grouped instead of handled as isolated tweaks.

## Guiding Principles

- Keep HTML semantic and presentation-agnostic.
- Avoid redundant page prefixes in IDs and classes when the page is already scoped by `body#...`.
- Prefer one source of truth for class information when the same data must appear on Classes, Levels, and Venues.
- Keep the Classes page focused on programme clarity, not registration or level guidance that belongs elsewhere.
- Treat accessibility and mobile layout as acceptance criteria, not cleanup.

## Recommended Order

### 1. Naming And HTML Cleanup

Status: done for currently identified page-prefix repetitions. Keep applying the rule during future refactors.

Priority: high

Clean redundant IDs and classes before larger feature work, because selectors and future templates will be easier to reason about.

Examples:

- `body#home section#home-gallery` should become `body#home section#gallery`.
- Avoid descendants like `classes-*`, `levels-*`, or `home-*` when already scoped by page body ID.
- Keep IDs content-oriented: `#intro`, `#gallery`, `#team`, `#schedule`, `#prices`.
- Keep classes only when they represent reusable content types or necessary state.

Acceptance criteria:

- No obvious repeated page prefix in descendant IDs/classes.
- SCSS selectors remain readable and nested according to DOM hierarchy.
- No visual regression across active themes.

### 2. Class Data Model

Status: implemented for the Classes timetable. The data model and helper functions already support visible trimester sets, level lookups, and venue lookups; Levels and Venues can be wired to this data in a later step.

Priority: high

Decide whether class information remains authored in HTML or moves into a structured data file. This is the key decision before building filters, level-specific links, venue-specific listings, or embedded videos connected to levels.

The model must handle trimester-specific data. During most of the year, Classes may show one trimester. During transition periods, Classes may show two trimesters at once, each with its own schedule section. Levels and Venues then need to show a coherent mix of classes across the visible trimesters without duplicating editorial work.

Preferred direction:

- Create a structured source such as `src/data/classes.json`.
- Generate the Classes timetable from that data.
- Reuse the same data to show relevant courses on Levels and Venues.

Useful fields:

```json
{
  "terms": [
    {
      "id": "april-june-2026",
      "title": "April-June 2026",
      "starts": "2026-04-20",
      "ends": "2026-07-02",
      "visibleFrom": "2026-03-16",
      "visibleUntil": "2026-07-06",
      "sessions": [
        {
          "day": "monday",
          "time": "20:45-22:00",
          "type": "class",
          "level": "level-2",
          "title": "Level 2",
          "venue": "gc-ten-noey",
          "teachers": ["andres", "anna"],
          "noClass": ["2026-05-25"]
        }
      ]
    }
  ]
}
```

Acceptance criteria:

- One source of truth can produce one or several trimester schedules, level-specific summaries, and venue-specific summaries.
- Classes can render two visible trimesters as two separate schedule sections when needed.
- Levels and Venues can aggregate courses from the visible trimester set without losing trimester context.
- Editorial updates do not require modifying the same course in multiple HTML files.
- The generated HTML remains semantic and inspectable.

### 3. Level Filtering On Classes

Priority: high, after class data model or as a smaller static interim step

Allow visitors to clearly see the classes for a given level.

Possible UX:

- On Levels, each level links to `classes.html?level=level-2`.
- On Classes, a compact filter control lets users view all classes or one level.
- The legend should reflect the visible programme, including special formats such as Dancing in Dialogue and Footwork & Armwork.

Interim static option:

- Add `data-level="level-2"` attributes to class cards.
- Use a small progressive enhancement script to hide non-matching cards when a query parameter is present.

Better long-term option:

- Generate the schedule from structured data and derive filters from that same data.

Acceptance criteria:

- A beginner can quickly find Level 1 without scanning the full timetable.
- Links from Levels to Classes remain stable across trimesters.
- Filtering does not hide essential venue/date/no-class context.

### 4. Prices Content And Naming

Priority: medium-high

The price section should be clearer, more structured, and easier to compare. It should also avoid the term "Fair Trade" if it does not accurately describe the pricing model.

Potential replacement terms:

- Reduced rate
- Solidarity rate
- Supported rate
- Community rate
- Flexible rate

Recommended direction:

- Separate standard price, reduced/solidarity price, and what is included.
- Avoid moral or economic labels that could be misunderstood.
- Make registration/payment constraints explicit but not visually heavy.

Acceptance criteria:

- Visitors can understand price differences without reading long paragraphs.
- The terminology feels respectful and precise.
- The same pricing pattern can be reused on Register if needed.

### 5. Forro Pratica Distinction

Priority: medium

The Wednesday Forro Pratica should be visually distinct from classes while still clearly connected to the preceding Wednesday class.

Possible treatment:

- Different card rhythm: less like a level class, more like a practice/social block.
- Distinct label such as `Practice`.
- Connected spacing when it follows the 19:00-20:15 class at the same venue.
- Keep it in the legend as a separate type.

Acceptance criteria:

- It is immediately clear this is not a normal level class.
- It still reads as part of the same Wednesday evening programme.

### 6. Level Video Integration

Priority: medium, after Levels content structure is stable

Several YouTube videos show movements by level. These could make the Levels page more useful, especially for students choosing or reviewing a level.

Recommended direction:

- Add videos to Levels, grouped by level.
- Avoid embedding too many videos by default if performance or page length becomes a problem.
- Consider poster/thumbnail cards that open embedded videos on demand.

Acceptance criteria:

- Videos are clearly tied to a level.
- Page remains usable on mobile.
- Embeds do not slow down the page unnecessarily.

### 7. New Layout Exploration

Priority: medium, after content model stabilizes

Large layout changes should happen after class data, pricing, and key content decisions. Otherwise the layout risks being optimized around content that will change.

Recommended direction:

- Prototype one new layout against real content.
- Validate Home, Classes, Levels, Venues, About, Events, and Register.
- Keep each theme as a distinct look and feel over the same semantic HTML.

Acceptance criteria:

- Same HTML can support meaningfully different themes.
- Mobile layouts are checked with real content.
- Header/main spacing and hero behavior are consistent.

### 8. Calendar Embed Or Calendar Export

Priority: medium-low

An embedded Google Calendar or Gmail Calendar-style view is not recommended as the primary class programme, because recurring trimester classes need richer context than a generic calendar embed usually provides.

Better uses:

- Optional calendar export links.
- One-off events.
- A secondary "add to calendar" action per course or term.

Acceptance criteria:

- The primary schedule remains native HTML.
- Calendar integration helps users remember events without replacing the site schedule.

### 9. WhatsApp Contact

Priority: medium-low

A WhatsApp entry point can reduce friction, but ownership and moderation need to be decided first.

Open questions:

- Should it point to a group, a community, or an individual account?
- Who is responsible for replies?
- Should the link be public on the site or only shown after registration?

Recommended direction:

- Prefer a stable Conexao-owned WhatsApp community/group if available.
- Avoid linking to a personal phone number unless that is an explicit operational choice.
- Add it as a contact option only where it helps: Register, Contact, or footer.

Acceptance criteria:

- The contact path is sustainable for the team.
- Visitors understand what kind of response to expect.

### 10. Website Chat

Priority: low

Live chat is probably not a V1 priority unless Conexao can reliably answer messages. A chat widget creates an expectation of fast response and may affect privacy/compliance.

Recommended direction:

- Start with clearer contact options and registration guidance.
- Reconsider live chat only if there is a real operational workflow behind it.

Acceptance criteria:

- No chat widget unless response ownership, privacy, and maintenance are clear.

## Cross-Cutting Technical Notes

- If structured data is introduced, add a build step instead of duplicating data across HTML.
- Preserve static output so the site remains easy to host.
- Keep progressive enhancement optional: the site should remain understandable if JavaScript fails.
- Any filter or generated timetable must be tested on mobile and with contrast checks.
