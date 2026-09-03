const assert = require("node:assert/strict");
const { buildCalendarEvents } = require("./calendar-data");
const { loadSiteData } = require("./site-data");

const events = buildCalendarEvents(loadSiteData());
const on = (date) => events.filter((event) => event.start.startsWith(date));

assert.equal(on("2026-09-09").filter((event) => event.category === "workshops").length, 2);
assert.equal(on("2026-09-09").filter((event) => event.id.startsWith("summer-guinguette")).length, 0);
assert.equal(on("2026-09-02").find((event) => event.id.startsWith("summer-guinguette")).category, "social-dancing");
assert.equal(on("2026-09-20").find((event) => event.id.startsWith("sunday-pratica")).category, "social-dancing");
assert.equal(on("2026-09-20").filter((event) => event.id.startsWith("sunday-pratica")).length, 1);
assert.equal(on("2026-10-04").filter((event) => event.id.startsWith("sunday-pratica")).length, 0);
assert.equal(on("2026-09-23").filter((event) => event.id.startsWith("wednesday-pratica")).length, 1);
assert.equal(on("2026-09-23").find((event) => event.id.startsWith("wednesday-pratica")).start, "2026-09-23T20:15:00");
assert.equal(on("2026-10-28").filter((event) => event.id.startsWith("wednesday-pratica")).length, 0);
assert.equal(on("2027-06-27").filter((event) => event.id.startsWith("sunday-pratica")).length, 1);
assert.equal(on("2027-06-30").filter((event) => event.id.startsWith("wednesday-pratica")).length, 1);
assert.equal(on("2027-07-04").filter((event) => event.category === "social-dancing").length, 0);

console.log(`Calendar check passed with ${events.length} occurrences.`);
