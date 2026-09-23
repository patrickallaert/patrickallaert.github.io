const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { buildCalendarEvents } = require("./calendar-data");
const { loadSiteData } = require("./site-data");

const data = loadSiteData();
const events = buildCalendarEvents(data);
const on = (date) => events.filter((event) => event.start.startsWith(date));
const find = (date, title) => on(date).find((event) => event.title === title);
const pratica = (date, time) => on(date).find((event) => event.title === "Forró Prática" && event.start.endsWith(`T${time}:00`));

assert.equal(events.length, 198);
assert.equal(on("2026-09-09").filter((event) => event.category === "workshops").length, 2);
assert.equal(on("2026-10-03").filter((event) => event.category === "workshops").length, 3);
assert.equal(events.filter((event) => event.category === "workshops").length, 7);
assert.equal(on("2026-09-09").filter((event) => event.category === "workshops").every((event) => event.url === "/events/2026-09-mardio-milena/#programme"), true);
assert.equal(on("2026-10-03").filter((event) => event.category === "workshops").every((event) => event.url === "/events/2026-10-camila-alves/#programme"), true);
assert.equal(find("2026-10-03", "Frame in Forró").end, "2026-10-03T18:15:00");
assert.equal(find("2026-09-09", "Summer Forró Guinguette"), undefined);
assert.equal(find("2026-09-02", "Summer Forró Guinguette").category, "social-dancing");
assert.equal(events.every((event) => !Object.hasOwn(event, "id")), true);
assert.equal(events.filter((event) => event.url === "/try-forro/").length, 7);
assert.equal(events.filter((event) => event.url === "/try-forro/" && event.categories.includes("initiations")).length, 7);
assert.equal(events.filter((event) => event.url === "/try-forro/" && event.categories.includes("classes")).length, 2);
for (const date of ["2026-07-08", "2026-07-22", "2026-08-05", "2026-08-19", "2026-09-02", "2026-09-16"]) {
    assert.equal(on(date).filter((event) => event.start.endsWith("T19:30:00") && event.categories.includes("initiations")).length, 1);
}
assert.equal(find("2026-09-02", "Free forró intro class").venue, "La Guinguette Henri");
assert.equal(find("2026-09-12", "Free forró intro class").venue, "Pianofabriek");
assert.equal(find("2026-09-14", "Free forró intro class").category, "initiations");
assert.equal(find("2026-09-17", "Free forró intro class").category, "initiations");
assert.equal(find("2026-09-21", "Level 1 · Free trial class").venue, "GC Ten Noey");
assert.deepEqual(find("2026-09-21", "Level 1 · Free trial class").categories, ["classes", "initiations"]);
assert.deepEqual(find("2026-09-24", "Level 1 · Free trial class").categories, ["classes", "initiations"]);
assert.equal(events.filter((event) => event.title === "Forró Prática" && event.start.endsWith("T19:00:00")).length, 32);
assert.equal(events.filter((event) => event.title === "Forró Prática" && event.start.endsWith("T20:15:00")).length, 40);
assert.equal(pratica("2026-09-20", "19:00").category, "social-dancing");
assert.equal(pratica("2026-10-04", "19:00"), undefined);
assert.equal(pratica("2026-09-23", "20:15").start, "2026-09-23T20:15:00");
assert.equal(pratica("2026-10-28", "20:15"), undefined);
assert.ok(pratica("2027-06-27", "19:00"));
assert.ok(pratica("2027-06-30", "20:15"));
assert.equal(on("2027-07-04").filter((event) => event.category === "social-dancing").length, 0);

for (const event of ["2026-09-mardio-milena", "2026-10-camila-alves"]) {
    assert.match(fs.readFileSync(path.join(__dirname, "..", "docs", "events", event, "index.html"), "utf8"), /<section id="programme"/);
}

console.log(`Calendar check passed with ${events.length} occurrences.`);
