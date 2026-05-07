const fs = require("fs");
const path = require("path");
const { loadClassData, visibleTerms } = require("./class-data");

const CLASSES_PATH = path.join(__dirname, "..", "site", "classes", "index.html");
const START_MARKER = "    <!-- class-schedules:start -->";
const END_MARKER = "    <!-- class-schedules:end -->";
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

const minutesBetween = ([start, end]) => {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
};

const link = (href, label) => href ? `<a href="${href}">${escapeHtml(label)}</a>` : escapeHtml(label);

const courseHref = (id, course) => {
    if (course.link === false) return null;
    if (id === "pratica") return "/events/#praticas";

    return `/levels/#${id}`;
};

const inferredCourse = (id) => {
    const match = id.match(/^(level|roots)-(\d)$/);

    const [, type, number] = match;

    return {
        classes: [type, number],
        includeIdClass: false,
        title: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${number}`,
    };
};

const getCourse = (data, id) => {
    return data.courses[id] || inferredCourse(id);
};

const courseClasses = (id, course) => {
    if (!course.classes) return [id];
    if (course.includeIdClass === false) return course.classes;

    return [...course.classes, id];
};

const courseClassName = (id, course, duration) => ["class", ...courseClasses(id, course), `duration-${duration}`].join(" ");

const courseTitle = (id, course) => course.title || id;

const listNames = (items) => {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return `${items[0]} &amp; ${items[1]}`;

    return `${items.slice(0, -1).join(", ")} &amp; ${items.at(-1)}`;
};

const renderPeople = (ids, people) => listNames(ids.map((id) => {
    return link(`/about/#${id}`, people[id]);
}));

const renderTeachers = (session, people) => {
    if (!session.teachers?.length) return "";

    const teachers = renderPeople(session.teachers, people);

    if (session.assistants?.length) {
        return `<p class="teachers">${teachers}, assisted by ${renderPeople(session.assistants, people)}</p>`;
    }

    return `<p class="teachers">${teachers}</p>`;
};

const renderDateRange = (session) => {
    if (!session.starts || !session.ends) return "";

    return `<p><time datetime="${session.starts}">${formatDate(session.starts)}</time> - <time datetime="${session.ends}">${formatDate(session.ends)}</time></p>`;
};

const renderSession = (session, data) => {
    const course = getCourse(data, session.course);
    const time = session.time.split("-");
    return [
        `              <article class="${(courseClassName(session.course, course, minutesBetween(time)))}">`,
        `                <p><time datetime="${time[0]}">${formatTime(time[0])}</time> - <time datetime="${time[1]}">${formatTime(time[1])}</time></p>`,
        `                <h6>${link(courseHref(session.course, course), courseTitle(session.course, course))}</h6>`,
        renderDateRange(session) && `                ${renderDateRange(session)}`,
        renderTeachers(session, data.teachers) && `                ${renderTeachers(session, data.teachers)}`,
        session.note && `                <p>${escapeHtml(session.note)}</p>`,
        "              </article>",
    ].filter(Boolean).join("\n");
};

const renderNoClass = (dates) => {
    if (!dates?.length) return "";

    const formatted = dates.map((date) => `<time datetime="${date}">${formatDate(date)}</time>`);

    return `          <p><strong>No class:</strong> ${listNames(formatted)}</p>`;
};

const renderVenue = (venueId, sessions, data) => {
    const venue = data.venues[venueId];

    return [
        "          <section>",
        `            <h5>${link(`/venues/#${venueId}`, venue)}</h5>`,
        "            <div>",
        sessions.map((session) => renderSession(session, data)).join("\n"),
        "            </div>",
        "          </section>",
    ].join("\n");
};

const renderDay = ([day, noClass], term, data) => {
    const sessions = term.sessions.filter((session) => session.day === day);
    const venues = [...new Set(sessions.map((session) => session.venue))];

    return [
        "        <article>",
        `          <h4>${escapeHtml(dayName(day))}</h4>`,
        renderNoClass(noClass),
        venues.map((venue) => renderVenue(venue, sessions.filter((session) => session.venue === venue), data)).join("\n"),
        "        </article>",
    ].filter(Boolean).join("\n");
};

const legendItems = (term, data) => {
    const courses = [...new Set(term.sessions.map((session) => session.course))];

    return courses
        .sort((left, right) => {
            const leftIndex = COURSE_ORDER.indexOf(left);
            const rightIndex = COURSE_ORDER.indexOf(right);

            return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
        })
        .map((id) => ({ id, course: getCourse(data, id) }))
        .filter(({ course }) => {
            return course.legend !== false;
        });
};

const renderLegend = (term, data) => [
    '      <ul class="schedule-legend" aria-label="Course colour legend">',
    ...legendItems(term, data).map(({ id, course }) => `        <li class="${course.legendClass || id}">${escapeHtml(course.legendLabel || courseTitle(id, course))}</li>`),
    "      </ul>",
].join("\n");

const renderTerm = (term, data) => [
    `    <section id="${term.id}">`,
    `      <h2>${escapeHtml(term.title)}</h2>`,
    term.registration !== false && `      <p><a href="/register/">Register for ${escapeHtml(term.title)}</a></p>`,
    `      <p class="trimester-summary"><span><time datetime="${term.starts}">${formatDate(term.starts)}</time> - <time datetime="${term.ends}">${formatDate(term.ends)}</time></span> <span>${escapeHtml(term.summary)}</span></p>`,
    "",
    '      <div class="schedule-days">',
    Object.entries(term.days).map((day) => renderDay(day, term, data)).join("\n"),
    "      </div>",
    "",
    renderLegend(term, data),
    "    </section>",
].filter(Boolean).join("\n");

const renderSchedules = (data) => [
    START_MARKER,
    visibleTerms(data, process.env.CLASSES_ON_DATE || null).map((term) => renderTerm(term, data)).join("\n\n"),
    END_MARKER,
].join("\n");

const replaceSchedules = (html, schedules) => {
    return html.replace(new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`), schedules);
};

fs.writeFileSync(CLASSES_PATH, replaceSchedules(fs.readFileSync(CLASSES_PATH, "utf8"), renderSchedules(loadClassData())));
