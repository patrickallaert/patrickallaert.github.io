# Class Data

`classes.json` is the source of truth for the class timetable. Keep it editorial: only store information that actually changes from term to term or cannot be derived safely.

## Derived By The Generator

- Venue links are derived from venue IDs: `dojo-du-brochet` becomes `/venues/#dojo-du-brochet`.
- Teacher links are derived from teacher IDs: `simon` becomes `/about/#simon`.
- Standard course links are derived from course IDs: `level-2` becomes `/levels/#level-2`.
- `level-N` and `roots-N` titles and CSS classes are inferred from their IDs.
- Day names are derived from day keys: `monday` becomes `Monday`.
- Registration links always point to `/register/`.
- Registration labels are generated from the term title.
- Session duration classes are generated from the time range.
- Legend items are generated from the courses present in a term.
- Scheduled class summaries on Levels are generated from the visible terms.

## Store Explicitly

- Human-readable venue and teacher names.
- Term dates, visibility dates, and term summaries.
- No-class dates.
- Session day, venue, time, course, teachers, assistants, and term-specific date ranges.
- Course exceptions such as short courses, practice sessions, labels, or non-standard linking behavior.

## Generated HTML Blocks

`scripts/build-classes.js` replaces the timetable between `class-schedules` markers in `docs/classes/index.html`.

`scripts/build-levels.js` replaces `course-sessions:<course-id>` markers in `docs/levels/index.html`. Keep those markers in place when editing the page by hand.
