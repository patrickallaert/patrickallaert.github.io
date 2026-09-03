const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./site-data");

const DOCS_PATH = path.join(__dirname, "..", "docs");
const EVENTS_PATH = path.join(DOCS_PATH, "events", "index.html");
const WORKSHOPS_PATH = path.join(DOCS_PATH, "events", "mardio-milena", "index.html");
const VENUE_ADDRESSES = {
    brochet: "Rue du Brochet 55, 1050 Ixelles",
    dublin: "Rue de Dublin 13, 1050 Ixelles",
};

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const replaceBlock = (html, name, content) => {
    const indentation = html.match(/\n([ \t]+)<a href="#main">/)[1];

    return html.replace(
        new RegExp(`([ \\t]*)<!-- ${name}:start -->[\\s\\S]*?[ \\t]*<!-- ${name}:end -->`),
        (_, indent) => [
            `${indent}<!-- ${name}:start -->`,
            content.split("\n").map((line) => line
                ? `${indent}${indentation.repeat(line.match(/^ */)[0].length / 2)}${line.trimStart()}`
                : "").join("\n"),
            `${indent}<!-- ${name}:end -->`,
        ].join("\n"),
    );
};

const formatDate = (date, year = false) => new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    ...(year ? { year: "numeric" } : {}),
}).format(new Date(`${date}T00:00:00Z`));

const formatDay = (date) => new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
}).format(new Date(`${date}T00:00:00Z`)).replace(",", "");

const renderTime = (time) => {
    const [start, end] = time.split("-");
    const startTime = `<time datetime="${start}">${start}</time>`;

    return end ? `${startTime}–<time datetime="${end}">${end}</time>` : startTime;
};

const renderPraticaTime = (time) => {
    const label = (value) => value.endsWith(":00")
        ? `${Number(value.slice(0, 2))}h`
        : value.replace(":", "h");
    const [start, end] = time.split("-");

    return `<time datetime="${start}">${label(start)}</time> - <time datetime="${end}">${label(end)}</time>`;
};

const groupByDate = (occurrences) => occurrences.reduce((groups, occurrence) => {
    const group = groups.find(({ date }) => date === occurrence.date);

    if (group) group.occurrences.push(occurrence);
    else groups.push({ date: occurrence.date, occurrences: [occurrence] });

    return groups;
}, []);

const renderWorkshopProgramme = (event, data) => groupByDate(event.occurrences).map(({ date, occurrences }) => {
    const venue = occurrences[0].venue;
    const titleId = `workshops-${date}-title`;

    return [
        `<section class="event-day" aria-labelledby="${titleId}">`,
        `  <h3 id="${titleId}">${escapeHtml(formatDay(date))}</h3>`,
        `  <p><strong>Venue:</strong> <a href="/venues/#${venue}">${escapeHtml(data.venues[venue])}</a>, ${escapeHtml(VENUE_ADDRESSES[venue])}</p>`,
        '  <div class="workshops">',
        ...occurrences.map((occurrence) => [
            `    <article id="${occurrence.id}">`,
            `      <h4>${escapeHtml(occurrence.title)}</h4>`,
            '      <dl class="workshop-facts">',
            `        <div><dt>Time</dt><dd>${renderTime(occurrence.time)}</dd></div>`,
            `        <div><dt>Level</dt><dd>${escapeHtml(occurrence.level)}</dd></div>`,
            `        <div><dt>Prerequisite</dt><dd>${escapeHtml(occurrence.prerequisite)}</dd></div>`,
            "      </dl>",
            `      <p>${escapeHtml(occurrence.description)}</p>`,
            "    </article>",
        ].join("\n")),
        "  </div>",
        "</section>",
    ].join("\n");
}).join("\n\n");

const renderGuinguetteDetails = (guinguette, initiation, featuredEvent) => {
    const { starts, ends } = guinguette.recurrence;
    const exception = guinguette.excludedDates[0];

    return [
        '<div class="event-details">',
        '  <dl class="event-facts">',
        "    <div>",
        "      <dt>Dates</dt>",
        `      <dd>Every Wednesday from <time datetime="${starts}">${escapeHtml(formatDate(starts))}</time> to <time datetime="${ends}">${escapeHtml(formatDate(ends, true))}</time>, except <time datetime="${exception}">${escapeHtml(formatDate(exception))}</time>, when the <a href="${featuredEvent.url}">Mardio &amp; Milena workshops</a> take place</dd>`,
        "    </div>",
        "    <div>",
        "      <dt>Free dancing</dt>",
        `      <dd>${renderTime(guinguette.time)}</dd>`,
        "    </div>",
        "    <div>",
        "      <dt>Free initiation</dt>",
        `      <dd>${renderTime(initiation.time)} every other Wednesday</dd>`,
        "    </div>",
        "    <div>",
        "      <dt>Location</dt>",
        `      <dd>${escapeHtml(guinguette.location)}</dd>`,
        "    </div>",
        "  </dl>",
        "",
        '  <div class="event-initiations">',
        "    <h3>Initiation dates</h3>",
        "    <ul>",
        ...initiation.dates.map((date) => `      <li><time datetime="${date}">${escapeHtml(formatDate(date))}</time></li>`),
        "    </ul>",
        "  </div>",
        "</div>",
        "",
        '<ul class="event-links" aria-label="Summer Forró Guinguettes links">',
        `  <li><a href="${guinguette.links.instagram}" rel="noopener noreferrer" target="_blank">View the Instagram post</a></li>`,
        `  <li><a href="${guinguette.links.facebook}" rel="noopener noreferrer" target="_blank">View the Facebook event</a></li>`,
        "</ul>",
    ].join("\n");
};

const renderPraticaSchedules = (events, data) => {
    const praticas = [events["sunday-pratica"], events["wednesday-pratica"]];

    return [
        "<div>",
        ...praticas.map((event) => [
            "  <article>",
            `    <h3>${escapeHtml(event.recurrence.day[0].toUpperCase() + event.recurrence.day.slice(1))}s</h3>`,
            `    <p><strong>Time:</strong> ${renderPraticaTime(event.time)}${event.scheduleNote ? `, ${escapeHtml(event.scheduleNote)}` : ""}</p>`,
            `    <p><strong>2026–2027 season:</strong> <time datetime="${event.recurrence.starts}">${escapeHtml(formatDate(event.recurrence.starts, true))}</time> to <time datetime="${event.recurrence.ends}">${escapeHtml(formatDate(event.recurrence.ends, true))}</time></p>`,
            "  </article>",
        ].join("\n")),
        "</div>",
        "",
        `<p><strong>Venue:</strong> <a href="/venues/#${praticas[0].venue}">${escapeHtml(data.venues[praticas[0].venue])}</a></p>`,
    ].join("\n");
};

const data = loadSiteData();
let eventsHtml = fs.readFileSync(EVENTS_PATH, "utf8");
eventsHtml = replaceBlock(eventsHtml, "summer-guinguette-details", renderGuinguetteDetails(data.events["summer-guinguette"], data.events["summer-initiation"], data.featuredEvent));
eventsHtml = replaceBlock(eventsHtml, "pratica-schedules", renderPraticaSchedules(data.events, data));
fs.writeFileSync(EVENTS_PATH, eventsHtml);

fs.writeFileSync(WORKSHOPS_PATH, replaceBlock(
    fs.readFileSync(WORKSHOPS_PATH, "utf8"),
    "workshop-programme",
    renderWorkshopProgramme(data.featuredEvent, data),
));
