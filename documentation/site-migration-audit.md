# Site Migration Audit

Updated: 2026-04-10

This note compares the current `docs/` pages against the structured source material in `content-source/`.

## Current State

### Strongest pages

- `docs/classes.html`
  The clearest and most advanced page so far. The weekly schedule is usable on desktop and mobile, and the page already links out to levels, teachers, assistants, venues, and registration.

- `docs/levels.html`
  The overview and level sections now follow `content-source/levels/overview.md` and `content-source/levels/level-1.md` to `level-4.md` much more faithfully than before.

- `docs/venues.html`
  Useful, standalone page. The addresses, room notes, and map links are already in place.

### Partially migrated pages

- `docs/about.html`
  Real content is present, but the page is still shorter than the source material in `content-source/about/about-us.md` and `content-source/about/team-profiles.md`.

- `docs/contact.html`
  Still a scaffold that points to `content-source/`.

- `docs/events.html`
  Still a scaffold that points to `content-source/`.

- `docs/index.html`
  Still a scaffold that points to `content-source/`.

- `docs/legal.html`
  Still a scaffold that points to `content-source/`.

## Link Integrity

The internal links used from `docs/classes.html` currently resolve correctly:

- teacher and assistant links to `docs/about.html`
- venue links to `docs/venues.html`
- level links to `docs/levels.html`

No missing internal anchors were found in these cross-page links.

## Page-by-Page Notes

### Home

Source:

- `content-source/home.md`

Current status:

- only a placeholder intro and links to source files

Content still missing from the page:

- class teaser
- registration teaser
- initiation teaser
- prática teaser
- short introduction to Sarah and the school

### Classes

Source:

- `content-source/classes/overview.md`
- `content-source/classes/jan-march-2026.md`
- `content-source/classes/april-june-2026.md`
- poster references in `feedback/`

Current status:

- current and next trimester are modelled
- registration logic matches the intended demo scenario
- the schedule is much clearer than the old poster-only approach

Open points:

- the registration URL is still a placeholder
- `Roots` and `Musicality` do not yet have dedicated explanation pages or anchors
- if desired later, a small monthly calendar view could complement the schedule without replacing it

### Levels

Source:

- `content-source/levels/overview.md`
- `content-source/levels/level-1.md`
- `content-source/levels/level-2.md`
- `content-source/levels/level-3.md`
- `content-source/levels/level-4.md`

Current status:

- overview structure is in place
- Level 1 to 4 text is now close to the current source files

Open points:

- the references mentioned in the source files are not yet reinstated:
  - vocabulary playlists
  - PDFs
- if these references return later, the HTML structure is ready to receive them

### Events

Source:

- `content-source/events/overview.md`
- `content-source/events/forro-guinguettes.md`
- `content-source/events/forro-praticas.md`
- `content-source/events/forro-initiations.md`
- `content-source/events/feedback-week.md`

Current status:

- only scaffold links to source files

Content likely worth surfacing first:

- prática rhythm and venue
- initiations
- guinguettes

Content likely secondary or seasonal:

- Feedback Week

### About

Source:

- `content-source/about/about-us.md`
- `content-source/about/team-profiles.md`

Current status:

- Sarah has a real profile page section
- the main teaching team is represented
- Emma and Marco currently have provisional entries only

Gaps against the source:

- several team profiles are shortened
- Sarah's longer pedagogical and research background is only partially represented
- the school-building context is currently compressed

### Venues

Source:

- `content-source/contact/arriving-at-the-dojo-du-brochet.md`
- venue details currently inferred from the existing site and user corrections

Current status:

- useful and coherent
- likely good enough for now

Open points:

- additional arrival notes could be added later for venues other than Dojo du Brochet

### Contact

Source:

- `content-source/contact/contact.md`
- `content-source/contact/newsletter.md`
- `content-source/contact/arriving-at-the-dojo-du-brochet.md`

Current status:

- still a scaffold
- `Venues` now correctly carries the room-specific arrival details

Likely future shape:

- email / newsletter / social links
- short pointer to `Venues`

### Legal

Source:

- `content-source/legal/terms-and-conditions.md`
- `content-source/legal/payment-information.md`
- `content-source/legal/conditions-generales.md`

Current status:

- still a scaffold

Important note:

- `payment-information.md` currently contains no extracted body content
- the EN terms page contains substantial material and is the most useful base for the future `Legal` page
- the FR page is reference material only for now, since the site itself is EN-only

## Suggested Migration Order

1. `docs/index.html`
   Home is still too empty compared with the maturity of `Classes`, `Levels`, `About`, and `Venues`.

2. `docs/about.html`
   Expand the existing page with the missing source details, without rewriting.

3. `docs/contact.html`
   Bring back the real contact and newsletter information, while keeping venue logistics on the separate `Venues` page.

4. `docs/events.html`
   Start with evergreen event formats, not one-off archives.

5. `docs/legal.html`
   Rebuild around the English terms and conditions page.

## General Guidance

- Keep using `content-source/` as the editorial source of truth.
- Avoid linking to `content-source/*.md` from the final public pages once migration is done.
- Prefer partial migration with faithful wording over polished paraphrase.
- Keep placeholder content visibly provisional when the real text is not yet available.
