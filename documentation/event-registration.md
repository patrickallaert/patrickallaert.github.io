# Workshop registration reference

The Camila Alves event used workshop and role selectors, a price summary, and
a prefilled Google Form. The complete implementation is preserved in commit
`463e83c24872d9a12cb218e4ad806fecf432ecc1`.

Retrieve the relevant versions without restoring the whole site:

```sh
git show 463e83c24872d9a12cb218e4ad806fecf432ecc1:docs/events/2026-10-camila-alves/index.html
git show 463e83c24872d9a12cb218e4ad806fecf432ecc1:src/scripts/event-registration.js
git show 463e83c24872d9a12cb218e4ad806fecf432ecc1:src/styles/site.scss
git show 463e83c24872d9a12cb218e4ad806fecf432ecc1:scripts/check-event-registration.js
git show 463e83c24872d9a12cb218e4ad806fecf432ecc1:package.json
```

## How it worked

- Each workshop had radio choices for `Not attending`, `Leader`, `Follower`,
  and `Either`, matching one row of the Google Form's required role grid.
- Google Forms field identifiers were used as input names. For a new form,
  obtain and verify its prefilled link: do not reuse the old `entry.*` identifiers
  or assume its answer values are unchanged.
- The form's `data-prices` mapped workshop counts to package prices. JavaScript
  ignored `Not attending` choices, updated an accessible live summary, and
  disabled continuation until at least one workshop was selected.
- At widths of at least `42rem`, continuation loaded the embedded Google Form
  with the selection in its query parameters and scrolled to registration.
  Changing a selection afterwards required continuing again to update the form.
- On narrower screens, the native GET form opened the prefilled form in another
  tab. Without JavaScript, that same external form remained accessible.
- Selecting workshops did not submit a registration or reserve a place.

Keep the Google Form focused on email, first and last name, optional city,
optional photo/video preference, and the required attendance-and-role grid.
Keep the event description and newsletter subscriptions outside it. The
confirmation used was: "Thank you. We have received your registration request.
Your place is not confirmed yet; we will contact you by email."

## Reusing it

Adapt the archived markup, script, scoped SCSS, build entry, and browser test
together. Verify field mappings, prices, empty selection, mixed roles, changed
selection, mobile navigation, desktop embedding, and keyboard access against
the new Google Form before publishing.

## After an event

Keep its dated URL, programme, images, metadata, and calendar history. Add it
to the past-events list, remove registration controls, and clear `featuredEvent`
if it was featured. Run the build to update promotions and communication links.
Disable responses in Google Forms as well: old shared links remain usable
otherwise. Git preserves the interactive implementation; no dormant form or
registration assets need to remain published.
