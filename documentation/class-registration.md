# Class registration modes

Edit `docs/register/index.html` directly. Both modes use the same page, sections,
and styles; no JavaScript switch, hidden form, or build setting is needed.
Keep the menu link, canonical URL, social metadata, and `#prices` anchor in both
modes. The descriptions in the page head are intentionally mode-independent.

## Shared introduction

Keep the heading and the existing `.free-intro-promotion` aside in `#intro`.
It links to `/try-forro/` in both modes. Update its wording to match that page:
announce forthcoming dates while they are unknown, or invite visitors to view
the available sessions once published. Trial availability and trimester
registration are separate: opening one does not automatically open the other.

Replace the status paragraph and the list using the blocks below. In open mode,
also add the registration action after the list. Never retain that action in
closed mode, including in hidden HTML.

## Open mode

Update the trimester title and replace `FORM_URL` with the confirmed Google
Form URL before publishing. The paragraph belongs immediately after the h1;
the list and action follow the shared free-session aside.

```html
<p>Registration is currently open for the September-December 2026 trimester. You do not need a partner to register; Conexão balances leaders and followers across the groups.</p>
```

```html
<ol aria-label="Registration steps">
    <li><strong>Fill in the form</strong><span>Share your course choice and dance role</span></li>
    <li><strong>Make payment</strong><span>Use the bank details provided after submitting</span></li>
    <li><strong>Wait for confirmation</strong><span>Your place is confirmed once payment arrives</span></li>
</ol>
<p class="registration-action"><a href="FORM_URL" rel="noopener noreferrer" target="_blank">Open the registration form</a></p>
```

Use the heading `Confirmation` for the payment confirmation section and
`Before You Register` for the final section. Its terms paragraph is:

```html
<p>By registering, you confirm that you have read and agreed to the <a href="/legal/">terms and conditions</a>.</p>
```

## Closed mode

Use the same paragraph and list positions as in open mode, without a
registration action. The shared free-session aside remains the primary action.

```html
<p><strong>Registration is currently closed.</strong> We look forward to welcoming you for a future trimester.</p>
```

```html
<ol aria-label="Plan your next classes">
    <li><strong>Discover forró</strong><span>Check the <a href="/try-forro/">upcoming free sessions</a> for your first steps.</span></li>
    <li><strong>Find your level</strong><span>Explore the <a href="/levels/">course levels</a> to see where you fit.</span></li>
    <li><strong>Stay informed</strong><span><a href="https://share-eu1.hsforms.com/1gp2kLtL2QOCK_PpFZkqouweumu4" rel="noopener noreferrer" target="_blank">Subscribe to our newsletter</a> for future class and event announcements.</span></li>
</ol>
```

Keep existing prices and payment notes, labelled with their trimester:

```html
<p>These prices apply to the September-December 2026 trimester, for which registration is closed. Prices for the next trimester will be confirmed when registration opens.</p>
```

Use `Already Registered?` above the confirmation information so existing
students can still find it. Use `Plan Your Next Classes` for the final section
and this terms paragraph:

```html
<p>Before registering for a future trimester, read the <a href="/legal/">terms and conditions</a>.</p>
```

## Switching checklist

- Update the status, list, action, and two section headings as described above.
- On opening, confirm the trimester, form URL, rates, payment and confirmation
  instructions. Replace the closed price paragraph with a trimester-labelled
  introduction to the current packages. Do not assume rates remain unchanged.
- On closing, remove the form link entirely and disable responses in Google
  Forms: removing the website link does not block old shared links.
- Keep `/try-forro/` prominent and consistent with its current dates or waiting
  message. Do not invent dates or a reopening deadline.
- Retain `#prices`, current programme links, and the community and legal links.
  Temporary schedule notices are not part of either reusable mode.
- Check contextual links on Classes, Home, and Levels. Prefer stable wording
  such as checking registration availability over promising an open form.
- Run `npm run verify`, check internal links and anchors, and inspect desktop
  and mobile layouts. Confirm no obsolete form URL or `FORM_URL` placeholder
  remains in the published HTML, then deploy.
