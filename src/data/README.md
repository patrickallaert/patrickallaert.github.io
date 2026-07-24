# Site Data

`site.json` is the single source of structured programme data. Keep it
editorial: only store information that changes between trimesters or values
that cannot be derived safely.

## Data Model

- `trimesters` contains every programme to publish, in display order.
- `noClassDates` lists dates on which every class scheduled that day is cancelled.
- `schedule` contains the recurring class slots for a trimester.
- `registration` points to the only trimester accepting registrations and its form URL. Set it to `null` to close registration.
- `venues`, `teachers`, and `courses` provide shared labels and course-specific display options.

## Derived By The Generator

- Venue links are derived from venue IDs: `brochet` becomes `/venues/#brochet`.
- Teacher links are derived from teacher IDs: `simon` becomes `/about/#simon`.
- Standard course links are derived from course IDs: `level-2` becomes `/levels/#level-2`.
- `level-N` and `roots-N` titles and CSS classes are inferred from their IDs.
- Day names and the weekday for each no-class date are derived automatically.
- Registration labels are generated from the referenced trimester title.
- Session duration classes and legend items are generated from the schedule.

## Generated HTML Blocks

- `scripts/build-classes.js` replaces the `class-schedules` block in `docs/classes/index.html`.
- `scripts/build-levels.js` replaces the `course-sessions:<course-id>` blocks in `docs/levels/index.html`.
- `scripts/build-venues.js` replaces the `venue-sessions:<venue-id>` blocks in `docs/venues/index.html`.
- `scripts/build-registration.js` replaces the `registration-status` and `registration-link` blocks in `docs/register/index.html`.

For the MVP, `docs/` is both the GitHub Pages publication directory and the
directly edited HTML source. Do not create a separate `site/` directory. Edit
HTML outside generated markers by hand; edit generated content through
`site.json` and rerun `npm run build`.
