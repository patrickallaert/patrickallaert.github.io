const fs = require("fs");
const path = require("path");
const { loadSiteData, noClassDatesForDay, scheduleForVenue } = require("./site-data");

const VENUES_PATH = path.join(__dirname, "..", "docs", "venues", "index.html");
const VENUES = [
    "salle-dublin",
    "gc-ten-noey",
    "dojo-du-brochet",
    "maison-malibran",
];

const DAY_INDEX = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

const COURSE_ORDER = [
    "dancing-in-dialogue",
    "footwork-armwork",
    "level-1",
    "level-2",
    "level-3",
    "level-4",
    "roots-1",
    "roots-2",
    "pratica",
    "free-practice",
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

const listNames = (items) => {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} &amp; ${items[1]}`;

    return `${items.slice(0, -1).join(", ")} &amp; ${items.at(-1)}`;
};

const link = (href, label) => href ? `<a href="${href}">${escapeHtml(label)}</a>` : escapeHtml(label);

const inferredCourse = (id) => {
    const match = id.match(/^(level|roots)-(\d)$/);
    const [, type, number] = match;

    return {
        title: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${number}`,
    };
};

const course = (data, id) => data.courses[id] || inferredCourse(id);

const courseTitle = (data, id) => course(data, id).title || id;

const courseHref = (id, item) => {
    if (item.link === false) return null;
    if (id === "pratica") return "/events/#praticas";

    return `/levels/#${id}`;
};

const courseClassName = (data, id) => {
    const item = course(data, id);
    const classes = ["class"];

    if (id.match(/^(level|roots)-\d$/)) return [...classes, id.replace("-", " ")].join(" ");
    if (item.category) return [...classes, item.category, id].join(" ");

    return [...classes, id].join(" ");
};

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

const compareSessions = (left, right) => {
    const dayDiff = DAY_INDEX[left.session.day] - DAY_INDEX[right.session.day];
    if (dayDiff !== 0) return dayDiff;

    const timeDiff = left.session.time.localeCompare(right.session.time);
    if (timeDiff !== 0) return timeDiff;

    const leftIndex = COURSE_ORDER.indexOf(left.session.course);
    const rightIndex = COURSE_ORDER.indexOf(right.session.course);

    return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
};

const groupByDay = (sessions) => sessions.reduce((groups, item) => {
    const group = groups.find(({ day }) => day === item.session.day);

    if (group) {
        group.sessions.push(item);
    } else {
        groups.push({ day: item.session.day, sessions: [item] });
    }

    return groups;
}, []);

const sessionDetails = ({ term, session }, data, indent) => {
    const item = course(data, session.course);
    const innerIndent = `${indent}  `;
    const detailIndent = `${innerIndent}  `;
    const dateRange = renderDateRange(term, session);
    const people = renderPeople(session, data);
    const noClass = renderNoClass(term, session);
    const date = dateRange ? `${dateRange} ` : "";
    const portraits = renderPortraits(session, data, detailIndent);

    return [
        `${indent}<li>`,
        `${innerIndent}<article class="${escapeHtml(courseClassName(data, session.course))}">`,
        portraits,
        `${detailIndent}<h5>${link(courseHref(session.course, item), courseTitle(data, session.course))}</h5>`,
        `${detailIndent}<p class="term">${link(`/classes/#${term.id}`, term.title)}</p>`,
        `${detailIndent}<p class="time">${date}${renderTimeRange(session.time)}</p>`,
        noClass ? `${detailIndent}<p class="exceptions"><strong>No class:</strong> ${noClass}</p>` : "",
        people ? `${detailIndent}<p class="people">${people}</p>` : "",
        session.note ? `${detailIndent}<p class="note">${escapeHtml(session.note)}</p>` : "",
        `${innerIndent}</article>`,
        `${indent}</li>`,
    ].filter(Boolean).join("\n");
};

const renderDayGroup = ({ day, sessions }, data, indent) => {
    const innerIndent = `${indent}  `;
    const listIndent = `${innerIndent}  `;

    return [
        `${indent}<section>`,
        `${innerIndent}<h4>${escapeHtml(dayName(day))}</h4>`,
        `${innerIndent}<ul>`,
        sessions.map((session) => sessionDetails(session, data, listIndent)).join("\n"),
        `${innerIndent}</ul>`,
        `${indent}</section>`,
    ].join("\n");
};

const renderVenueSessions = (venue, data) => {
    const sessions = scheduleForVenue(data, venue)
        .filter(({ session }) => session.course !== "free-practice")
        .sort(compareSessions);
    const indent = "      ";
    const innerIndent = `${indent}  `;
    const groupIndent = `${innerIndent}  `;

    return [
        `${indent}<!-- venue-sessions:${venue}:start -->`,
        `${indent}<section aria-labelledby="${venue}-scheduled-classes">`,
        `${innerIndent}<h3 id="${venue}-scheduled-classes">Scheduled Classes</h3>`,
        sessions.length === 0 ? `${innerIndent}<p>No scheduled classes in the visible programme.</p>` : "",
        sessions.length > 0 ? [
            `${innerIndent}<div class="scheduled-days">`,
            groupByDay(sessions).map((group) => renderDayGroup(group, data, groupIndent)).join("\n"),
            `${innerIndent}</div>`,
        ].join("\n") : "",
        `${indent}</section>`,
        `${indent}<!-- venue-sessions:${venue}:end -->`,
    ].filter(Boolean).join("\n");
};

const replaceVenueSessions = (html, venue, data) => html.replace(
    new RegExp(`[ \\t]*<!-- venue-sessions:${venue}:start -->[\\s\\S]*?[ \\t]*<!-- venue-sessions:${venue}:end -->`),
    renderVenueSessions(venue, data),
);

const data = loadSiteData();

fs.writeFileSync(VENUES_PATH, VENUES.reduce(
    (output, venue) => replaceVenueSessions(output, venue, data),
    fs.readFileSync(VENUES_PATH, "utf8"),
));
