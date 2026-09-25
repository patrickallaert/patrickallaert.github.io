# Site Data

`site.json` is the single source of structured programme data. Keep it
editorial: only store information that changes between trimesters or values
that cannot be derived safely.

## Data Model

- `trimesters` contains every programme to publish, in display order.
- `noClassDates` lists dates on which every class scheduled that day is cancelled.
- `schedule` contains the recurring class slots for a trimester.
- `events` contains only the information needed by the calendar, shared programme pages, or featured-event promotion. Event-page content is edited directly in `docs/`.
- `freeIntros` contains only the information needed to add free introductions and Level 1 trials to the calendar. An `event` reuses a recurring event; a `course` reuses a scheduled class and identifies it as a free trial.
- `featuredEvent` identifies the entry in `events` promoted across the site. Set it to `null` to remove the global banner and the promotional blocks from Home and Events. Promotional links always lead to the event page, never directly to its registration form.
- `venues`, `teachers`, and `courses` provide shared labels and course-specific display options.

## Derived By The Generator

- Venue links are derived from venue IDs: `brochet` becomes `/venues/#brochet`.
- Teacher links are derived from teacher IDs: `simon` becomes `/about/#simon`.
- Standard course links are derived from course IDs: `level-2` becomes `/levels/#level-2`.
- Guest-event links are derived from their event IDs: `2026-10-camila-alves` becomes `/events/2026-10-camila-alves/`. Calendar occurrences link to that page's `#programme` section.
- `level-N` and `roots-N` titles and CSS classes are inferred from their IDs.
- Day names and the weekday for each no-class date are derived automatically.
- Session duration classes are generated from the schedule.
- Weekly calendar occurrences are derived from `recurrence`, whose `starts` value is the first occurrence. `interval` changes the number of weeks between occurrences, `skipFirstOfMonth` omits the first occurrence of every month, and `excludedDates` removes individual exceptions. One-off or irregular occurrences use `dates`. Each occurrence has one primary visual `category` and one or more filtering `categories`; free Level 1 trials belong to both classes and initiations without being duplicated.

## Generated HTML Blocks

- `scripts/build-classes.js` replaces the `class-schedules` block in `docs/classes/index.html`.
- `scripts/build-levels.js` replaces the `course-sessions:<course-id>` blocks in `docs/levels/index.html`.
- `scripts/build-venues.js` replaces the `venue-sessions:<venue-id>` blocks in `docs/venues/index.html`.
- `scripts/build-calendar.js` writes all individual class and event occurrences into the calendar block in `docs/events/index.html`.
- `scripts/build-featured-event.js` replaces the `featured-event-banner`, `featured-event-home`, and `featured-event-summary` blocks in `docs/`.
- `scripts/build-links.js` creates the communication link list and its downloadable SVG and PNG QR codes. Upcoming guest events are derived from `site.json`; stable destinations are kept in the script so they do not enlarge programme data.

For the MVP, `docs/` is both the GitHub Pages publication directory and the
directly edited HTML source. Do not create a separate `site/` directory. Edit
HTML outside generated markers by hand; edit generated content through
`site.json` and rerun `npm run build`.

The registration status and external form link in `docs/register/index.html`
are edited directly when registrations open or close.

Temporary notices are edited directly in `docs/` and use the generic `notice`
class. They are not part of the programme data or propagated automatically.

The unlisted `/links/` page is generated for the communication team. Keep it
out of navigation and `sitemap.xml`; its QR codes always use production URLs.

Guest-event pages, prices, registration forms, prática summaries, and archive
cards are edited directly in `docs/events/`. Keep only their calendar or
featured-event metadata in `site.json`. Every guest-event page with workshops
must expose its programme as `<section id="programme">`.

The `/try-forro/` page and its permanent links from Home, Classes, Levels,
Events, and Register are edited directly in `docs/`. Registration details,
languages, addresses, and availability periods do not belong in `site.json`.
