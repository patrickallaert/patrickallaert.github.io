const assert = require("node:assert/strict");
const { buildCalendarEvents } = require("./calendar-data");
const { loadSiteData } = require("./site-data");

const data = loadSiteData();
const events = buildCalendarEvents(data);
const on = (date) => events.filter((event) => event.start.startsWith(date));
const closedEvents = buildCalendarEvents({
    ...data,
    freeIntro: { ...data.freeIntro, status: "closed" },
});

assert.equal(on("2026-09-09").filter((event) => event.category === "workshops").length, 2);
assert.equal(on("2026-09-09").filter((event) => event.id.startsWith("summer-guinguette")).length, 0);
assert.equal(on("2026-09-02").find((event) => event.id.startsWith("summer-guinguette")).category, "social-dancing");
assert.equal(events.filter((event) => event.url.startsWith("/try-forro/#")).length, 6);
assert.equal(events.filter((event) => event.url.startsWith("/try-forro/#") && event.categories.includes("initiations")).length, 6);
assert.equal(events.filter((event) => event.url.startsWith("/try-forro/#") && event.categories.includes("classes")).length, 2);
assert.equal(new Set(events.map((event) => event.id)).size, events.length);
assert.equal(on("2026-09-02").filter((event) => event.id === "free-intro-guinguette-2-september").length, 1);
assert.equal(on("2026-09-14").find((event) => event.id === "free-intro-ten-noey-14-september").category, "initiations");
assert.equal(on("2026-09-16").filter((event) => event.id === "free-intro-guinguette-16-september").length, 1);
assert.equal(on("2026-09-17").find((event) => event.id === "free-intro-brochet-17-september").category, "initiations");
assert.equal(on("2026-09-21").find((event) => event.id === "free-intro-ten-noey-21-september").category, "classes");
assert.equal(on("2026-09-24").find((event) => event.id === "free-intro-brochet-24-september").category, "classes");
assert.deepEqual(on("2026-09-21").find((event) => event.id === "free-intro-ten-noey-21-september").categories, ["classes", "initiations"]);
assert.deepEqual(on("2026-09-24").find((event) => event.id === "free-intro-brochet-24-september").categories, ["classes", "initiations"]);
assert.equal(on("2026-09-21").filter((event) => event.title.startsWith("Level 1")).length, 1);
assert.equal(on("2026-09-24").filter((event) => event.title.startsWith("Level 1")).length, 1);
assert.equal(closedEvents.filter((event) => event.url === "/try-forro/").length, 6);
assert.equal(closedEvents.filter((event) => event.url.startsWith("/try-forro/#")).length, 0);
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
