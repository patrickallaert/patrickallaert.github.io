const fs = require("fs");
const path = require("path");
const { loadSiteData, noClassDatesForDay, scheduleForLevel } = require("./site-data");

const LEVELS_PATH = path.join(__dirname, "..", "docs", "levels", "index.html");
const COURSE_SECTIONS = [
    ["level-1", 3, "      "],
    ["level-2", 3, "      "],
    ["level-3", 3, "      "],
    ["level-4", 3, "      "],
    ["roots-1", 3, "      "],
    ["roots-2", 3, "      "],
];

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatDate = (date) => new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
}).format(new Date(`${date}T00:00:00Z`));

const formatTime = (time) => time.replace(":", "h");

const dayName = (day) => day.charAt(0).toUpperCase() + day.slice(1);

const DAY_INDEX = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

const listNames = (items) => {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} &amp; ${items[1]}`;

    return `${items.slice(0, -1).join(", ")} &amp; ${items.at(-1)}`;
};

const link = (href, label) => `<a href="${href}">${escapeHtml(label)}</a>`;

const people = (ids, data) => listNames(ids.map((id) => link(`/about/#${id}`, data.teachers[id])));

const sessionPeople = (session) => [...new Set([...(session.teachers || []), ...(session.assistants || [])])];

const renderPeople = (session, data) => {
    if (!session.teachers?.length) return "";

    const teachers = people(session.teachers, data);

    if (session.assistants?.length) {
        return `${teachers}, assisted by ${people(session.assistants, data)}`;
    }

    return teachers;
};

const dateToIso = (date) => date.toISOString().slice(0, 10);

const utcDate = (date) => new Date(`${date}T00:00:00Z`);

const firstDayInRange = (start, day) => {
    const date = utcDate(start);
    const offset = (DAY_INDEX[day] - date.getUTCDay() + 7) % 7;

    date.setUTCDate(date.getUTCDate() + offset);

    return dateToIso(date);
};

const nextWeek = (date) => {
    const next = utcDate(date);

    next.setUTCDate(next.getUTCDate() + 7);

    return dateToIso(next);
};

const sessionOccurrences = (term, session) => {
    const starts = session.starts || firstDayInRange(term.starts, session.day);
    const ends = session.ends || term.ends;
    const noClass = new Set(noClassDatesForDay(term, session.day));
    const dates = [];

    for (let date = starts; date <= ends; date = nextWeek(date)) {
        if (!noClass.has(date)) dates.push(date);
    }

    return dates;
};

const sessionDateRange = (term, session) => {
    const dates = sessionOccurrences(term, session);

    return {
        starts: dates[0],
        ends: dates.at(-1),
    };
};

const renderDateRange = (term, session) => {
    const { starts, ends } = sessionDateRange(term, session);

    if (!starts || !ends) return "";

    return `<span><time datetime="${starts}">${formatDate(starts)}</time> - <time datetime="${ends}">${formatDate(ends)}</time></span>`;
};

const renderTimeRange = (time) => {
    const [start, end] = time.split("-");

    return `<time datetime="${start}">${formatTime(start)}</time> - <time datetime="${end}">${formatTime(end)}</time>`;
};

const isWithinSessionDates = (date, term, session) => {
    const { starts, ends } = sessionDateRange(term, session);

    return !(!starts || !ends || date < starts || date > ends);
};

const renderNoClass = (term, session) => {
    const dates = noClassDatesForDay(term, session.day).filter((date) => isWithinSessionDates(date, term, session));

    if (!dates.length) return "";

    return dates.map((date) => `<time datetime="${date}">${formatDate(date)}</time>`).join(" &amp; ");
};

const renderPortraits = (session, data, indent) => {
    const ids = sessionPeople(session);

    if (!ids.length) return "";

    return [
        `${indent}<figure class="portraits" aria-label="Teaching team">`,
        ...ids.map((id) => `${indent}  <img src="/assets/team/${id}.jpg" alt="${escapeHtml(data.teachers[id])}" width="320" height="320" loading="lazy">`),
        `${indent}</figure>`,
    ].join("\n");
};

const sessionDetails = ({ term, session }, data, indent) => {
    const innerIndent = `${indent}  `;
    const detailIndent = `${innerIndent}  `;
    const dateRange = renderDateRange(term, session);
    const people = renderPeople(session, data);
    const noClass = renderNoClass(term, session);
    const date = dateRange ? `${dateRange} ` : "";
    const portraits = renderPortraits(session, data, detailIndent);

    return [
        `${indent}<li>`,
        `${innerIndent}<article>`,
        portraits,
        `${detailIndent}<h4>${escapeHtml(dayName(session.day))}</h4>`,
        `${detailIndent}<p class="term">${link(`/classes/#${term.id}`, term.title)}</p>`,
        `${detailIndent}<p class="time">${date}${renderTimeRange(session.time)}</p>`,
        noClass ? [
            `${detailIndent}<p class="exceptions"><strong>No class:</strong> ${noClass}</p>`,
        ].join("\n") : "",
        `${detailIndent}<p class="venue">${link(`/venues/#${session.venue}`, data.venues[session.venue])}</p>`,
        people ? `${detailIndent}<p class="people">${people}</p>` : "",
        `${innerIndent}</article>`,
        `${indent}</li>`,
    ].filter(Boolean).join("\n");
};

const renderCourseSessions = (course, headingLevel, indent, data) => {
    const sessions = scheduleForLevel(data, course);
    const heading = `h${headingLevel}`;
    const innerIndent = `${indent}  `;
    const listIndent = `${innerIndent}  `;
    return [
        `${indent}<!-- course-sessions:${course}:start -->`,
        `${indent}<section aria-labelledby="${course}-scheduled-classes">`,
        `${innerIndent}<${heading} id="${course}-scheduled-classes">Scheduled Classes</${heading}>`,
        sessions.length === 0 ? `${innerIndent}<p>No scheduled classes in the visible programme.</p>` : "",
        sessions.length > 0 ? [
            `${innerIndent}<ul>`,
            sessions.map((session) => sessionDetails(session, data, `${listIndent}`)).join("\n"),
            `${innerIndent}</ul>`,
        ].join("\n") : "",
        `${indent}</section>`,
        `${indent}<!-- course-sessions:${course}:end -->`,
    ].filter(Boolean).join("\n");
};

const data = loadSiteData();

fs.writeFileSync(LEVELS_PATH, COURSE_SECTIONS.reduce(
    (output, [course, headingLevel, indent]) => output.replace(
        new RegExp(`[ \\t]*<!-- course-sessions:${course}:start -->[\\s\\S]*?[ \\t]*<!-- course-sessions:${course}:end -->`),
        renderCourseSessions(course, headingLevel, indent, data),
    ),
    fs.readFileSync(LEVELS_PATH, "utf8"),
));
