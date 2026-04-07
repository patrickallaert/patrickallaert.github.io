# Conexao Site Brief

This file captures product and content decisions for the rebuild so future sessions can continue without re-discovery.

## Confirmed

- The new site is a rebuild of `sarahforro.com` for Conexao.
- Target domains later: `conexao.be` or `conexao.dance`.
- First version is EN only.
- Old orphaned/archive pages should not drive the new information architecture.
- Accessibility should be materially better than the current site, without aiming for maximum formal strictness.
- Mobile usability is required.
- Class cycles follow a fixed rhythm:
  - September to December
  - January to March
  - April to June
  - July and August are a break
- The future site should be able to show both the current trimester and, when relevant, the next trimester.
- The current class-programme poster image is not an acceptable primary way to present class information.
- Primary goals are:
  - join a class
  - understand levels
  - see schedule
  - register
  - find location is also important
- V1 pages should include:
  - Home
  - Classes
  - Levels
  - Events
  - About
  - Contact
  - Legal
- Content will initially be maintained directly by the user.
- Current registration flow should be kept for V1.
- A Conexao logo already exists.
- Visual direction should stay somewhat close to the current site, but modernized.
- Instagram communication should be considered as a visual reference for consistency.
- Accessibility target for V1:
  - materially better than the current site
  - good contrast
  - keyboard usability
  - clear structure
  - responsive mobile layout
  - no important text embedded in images
  - readable forms
- Preferred implementation is a simple static site.
- Class content should be authored directly in HTML for V1.
- Class presentation should use a weekly grid only, not a calendar application/embed as the primary model.
- HTML quality matters:
  - semantic structure is important
  - avoid presentation-driven class names
  - classes and IDs should describe content, not appearance
  - keep class usage minimal when possible
- CSS authoring preferences:
  - use Sass/SCSS
  - nest selectors when that improves readability and remains reasonable
  - keep selectors structural/content-oriented
  - use `stylelint-config-recess-order` ordering
- Existing legal/payment content should largely be kept for V1.
- The user is comfortable with code-level editing and has strong PHP/CMS expertise.

## Open Questions

### 1. Primary goals

- Closed.

### 2. Launch scope

- Core V1 pages are confirmed.
- Which additional subpages are required for V1 under `Classes`, `Events`, or `Contact` is still open.

### 3. Classes data

- The user will update content initially.
- Store class content directly in HTML/templates for V1.
- Future CMS is possible, but not for now.

### 4. Registration flow

- Keep the current flow for V1.
- The exact current mechanism still needs to be documented in the new site.

### 5. Calendar model

- Use a weekly schedule grid as the primary model for regular classes.
- Do not use an embedded calendar as the main representation of recurring weekly classes.
- One-off events/calendar exports can still be considered later if useful.

### 6. Brand and visuals

- Logo exists.
- Keep some of the current visual identity, but modernize it.
- Instagram output should be reviewed as a reference for tone and visual consistency.
- Instagram references are now available locally in `instagram-source/`.
- Colors, fonts, and final art direction are still open, but should be derived from the current identity plus Instagram references.

### 7. Languages

- EN only. Future multilingual support is not a current requirement.

### 8. Accessibility

- Baseline accessibility expectations are confirmed.
- No additional explicit requirements yet.

### 9. Hosting and stack

- Static site confirmed.
- Hosting choice is still open.
- CSS/HTML authoring preference is explicit:
  - semantic HTML first
  - avoid design-oriented utility class naming
  - prefer structural selectors where reasonable

### 10. Legal/content

- Keep the current legal/payment content for V1.
