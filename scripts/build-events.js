const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./site-data");

const DOCS_PATH = path.join(__dirname, "..", "docs");
const EVENTS_PATH = path.join(DOCS_PATH, "events", "index.html");
const VENUE_ADDRESSES = {
    brochet: "Rue du Brochet 55, 1050 Ixelles",
    dublin: "Rue de Dublin 13, 1050 Ixelles",
    malibran: "Rue de la Digue 10, 1050 Ixelles",
};
const REGISTRATION_CHOICES = ["Not attending", "Leader", "Follower", "Either"];

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

const renderWorkshopDays = (event, data) => groupByDate(event.occurrences).map(({ date, occurrences }) => {
    const venue = occurrences[0].venue;
    const titleId = `workshops-${date}-title`;

    return [
        `<section class="event-day" aria-labelledby="${titleId}">`,
        `  <h3 id="${titleId}">${escapeHtml(formatDay(date))}</h3>`,
        `  <p><strong>Venue:</strong> <a href="/venues/#${venue}">${escapeHtml(data.venues[venue])}</a>${event.room ? `, ${escapeHtml(event.room)}` : ""}, ${escapeHtml(VENUE_ADDRESSES[venue])}</p>`,
        '  <div class="workshops">',
        ...occurrences.map((occurrence) => [
            `    <article id="${occurrence.id}">`,
            `      <h4>${escapeHtml(occurrence.title)}</h4>`,
            "      <dl>",
            `        <div><dt>Time</dt><dd>${renderTime(occurrence.time)}</dd></div>`,
            ...(occurrence.level ? [`        <div><dt>Level</dt><dd>${escapeHtml(occurrence.level)}</dd></div>`] : []),
            ...(occurrence.prerequisite ? [`        <div><dt>Prerequisite</dt><dd>${escapeHtml(occurrence.prerequisite)}</dd></div>`] : []),
            "      </dl>",
            ...(occurrence.description ? [`      <p>${escapeHtml(occurrence.description)}</p>`] : []),
            ...(occurrence.registrationField ? [
                '      <fieldset class="roles">',
                "        <legend>Participation and role</legend>",
                "        <div>",
                ...REGISTRATION_CHOICES.map((choice) => [
                    "          <label>",
                    `            <input type="radio" name="${escapeHtml(occurrence.registrationField)}" value="${escapeHtml(choice)}"${choice === "Not attending" ? " checked" : ""}>`,
                    `            <span>${escapeHtml(choice)}</span>`,
                    "          </label>",
                ].join("\n")),
                "        </div>",
                "      </fieldset>",
            ] : []),
            "    </article>",
        ].join("\n")),
        "  </div>",
        "</section>",
    ].join("\n");
}).join("\n\n");

const renderWorkshopProgramme = (event, data) => {
    const days = renderWorkshopDays(event, data);

    if (!event.registrationUrl) return days;

    return [
        `<form class="selection" action="${escapeHtml(event.registrationUrl)}" method="get" target="_blank" rel="noopener" data-prices="${escapeHtml(JSON.stringify(event.prices))}">`,
        '  <input type="hidden" name="usp" value="pp_url">',
        days.split("\n").map((line) => `  ${line}`).join("\n"),
        '  <footer class="summary">',
        '    <output aria-live="polite">Choose at least one workshop.</output>',
        '    <button type="submit">Continue to registration</button>',
        "  </footer>",
        "</form>",
    ].join("\n");
};

const renderPrices = (event) => {
    const prices = Object.entries(event.prices);

    return prices.map(([quantity, price], index) => [
        "<tr>",
        `  <th scope="row">${index === prices.length - 1 ? "All " : ""}${quantity} workshop${quantity === "1" ? "" : "s"}</th>`,
        `  <td>€${price}</td>`,
        "</tr>",
    ].join("\n")).join("\n");
};

const renderGuinguetteDetails = (guinguette, initiation, events) => {
    const { starts, ends } = guinguette.recurrence;
    const exception = guinguette.excludedDates[0];
    const replacementEvent = events[guinguette.excludedDateEvents[exception]];

    return [
        '<div class="event-details">',
        '  <dl class="event-facts">',
        "    <div>",
        "      <dt>Dates</dt>",
        `      <dd>Every Wednesday from <time datetime="${starts}">${escapeHtml(formatDate(starts))}</time> to <time datetime="${ends}">${escapeHtml(formatDate(ends, true))}</time>, except <time datetime="${exception}">${escapeHtml(formatDate(exception))}</time>, when <a href="${replacementEvent.url}">${escapeHtml(replacementEvent.title)}</a> took place</dd>`,
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

const renderPastEvents = (events) => [
    "<ul>",
    ...Object.values(events).filter((event) => event.status === "past")
        .sort((left, right) => right.occurrences[0].date.localeCompare(left.occurrences[0].date))
        .map((event) => [
            "  <li>",
            "    <article>",
            "      <figure>",
            `        <img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.imageAlt)}" width="1080" height="1920" loading="lazy" decoding="async">`,
            "      </figure>",
            "      <div>",
            `        <h3><a href="${escapeHtml(event.url)}">${escapeHtml(event.title)}</a></h3>`,
            `        <p>${escapeHtml(event.label)} · ${escapeHtml(event.dates)}</p>`,
            `        <p>${escapeHtml(event.summary)}</p>`,
            "      </div>",
            "    </article>",
            "  </li>",
        ].join("\n")),
    "</ul>",
].join("\n");

const renderRegistration = (event) => {
    if (!event.registrationUrl) {
        return "<p><strong>Registrations will open soon.</strong> The registration form will be available directly on this page.</p>";
    }

    const separator = event.registrationUrl.includes("?") ? "&" : "?";

    return [
        '<p class="prompt">Choose at least one workshop above, then continue to prepare the registration form.</p>',
        `<iframe data-src="${escapeHtml(`${event.registrationUrl}${separator}embedded=true`)}" title="Registration form for ${escapeHtml(event.title)}" width="700" height="2048" loading="lazy" hidden>Registration form for ${escapeHtml(event.title)}</iframe>`,
    ].join("\n");
};

const renderPraticaSchedules = (events, data) => {
    const praticas = [events["sunday-pratica"], events["wednesday-pratica"]];

    return [
        '<dl>',
        ...praticas.map((event) => [
            "  <div>",
            `    <dt>${escapeHtml(event.recurrence.day[0].toUpperCase() + event.recurrence.day.slice(1))}s</dt>`,
            "    <dd>",
            `      <span><strong>Time</strong><span>${renderPraticaTime(event.time)}${event.scheduleNote ? `, ${escapeHtml(event.scheduleNote)}` : ""}</span></span>`,
            `      <span><strong>2026–2027 season</strong><span><time datetime="${event.recurrence.starts}">${escapeHtml(formatDate(event.recurrence.starts, true))}</time> to <time datetime="${event.recurrence.ends}">${escapeHtml(formatDate(event.recurrence.ends, true))}</time></span></span>`,
            "    </dd>",
            "  </div>",
        ].join("\n")),
        "</dl>",
        "",
        `<p><strong>Venue:</strong> <a href="/venues/#${praticas[0].venue}">${escapeHtml(data.venues[praticas[0].venue])}</a></p>`,
    ].join("\n");
};

const data = loadSiteData();
let eventsHtml = fs.readFileSync(EVENTS_PATH, "utf8");
eventsHtml = replaceBlock(eventsHtml, "summer-guinguette-details", renderGuinguetteDetails(data.events["summer-guinguette"], data.events["summer-initiation"], data.events));
eventsHtml = replaceBlock(eventsHtml, "pratica-schedules", renderPraticaSchedules(data.events, data));
eventsHtml = replaceBlock(eventsHtml, "past-events", renderPastEvents(data.events));
fs.writeFileSync(EVENTS_PATH, eventsHtml);

for (const event of Object.values(data.events).filter((event) => event.occurrences)) {
    const eventPath = path.join(DOCS_PATH, event.url, "index.html");
    let eventHtml = fs.readFileSync(eventPath, "utf8");
    eventHtml = replaceBlock(eventHtml, "workshop-programme", renderWorkshopProgramme(event, data));
    if (event.prices) eventHtml = replaceBlock(eventHtml, "event-prices", renderPrices(event));
    eventHtml = replaceBlock(eventHtml, "event-registration", renderRegistration(event));
    fs.writeFileSync(eventPath, eventHtml);
}
