const { sessionOccurrences, weeklyDates } = require("./site-data");

const eventUrl = (course) => course === "pratica" ? "/events/#praticas" : `/levels/#${course}`;

const courseTitle = (data, course) => data.courses[course]?.title || `Level ${course.slice(-1)}`;

const timedEvent = ({ id, title, date, time, url, category, venue, className }) => {
    const [start, end] = time.split("-");

    return {
        id,
        title,
        start: `${date}T${start}:00`,
        ...(end ? { end: `${date}T${end}:00` } : {}),
        url,
        category,
        venue,
        classNames: [category, ...(className ? [className] : [])],
    };
};

const classEvents = (data) => data.trimesters.flatMap((term) => term.schedule.flatMap((session, index) => {
    if (session.event) return [];

    return sessionOccurrences(term, session).map((date) => timedEvent({
        id: `${term.id}-${index}-${date}`,
        title: courseTitle(data, session.course),
        date,
        time: session.time,
        url: eventUrl(session.course),
        category: "classes",
        venue: data.venues[session.venue],
        className: session.course,
    }));
}));

const excludedDates = (data, id, event) => [
    ...(event.excludedDates || []),
    ...data.trimesters
        .filter((term) => term.schedule.some((session) => session.event === id))
        .flatMap((term) => term.noClassDates),
];

const publicEvents = (data) => Object.entries(data.events).flatMap(([id, event]) => {
    const dates = event.recurrence ? weeklyDates({
        ...event.recurrence,
        excludedDates: excludedDates(data, id, event),
    }) : event.dates;

    return dates.map((date) => timedEvent({
        id: `${id}-${date}`,
        title: event.title,
        date,
        time: event.time,
        url: event.url,
        category: event.category,
        venue: event.venue ? data.venues[event.venue] : event.location,
    }));
});

const featuredEvents = (data) => data.featuredEvent.occurrences.map((occurrence) => timedEvent({
    id: `mardio-milena-${occurrence.id}`,
    title: occurrence.title,
    date: occurrence.date,
    time: occurrence.time,
    url: `${data.featuredEvent.url}#${occurrence.id}`,
    category: data.featuredEvent.category,
    venue: data.venues[occurrence.venue],
}));

const buildCalendarEvents = (data) => [
    ...classEvents(data),
    ...publicEvents(data),
    ...featuredEvents(data),
].sort((left, right) => left.start.localeCompare(right.start) || left.title.localeCompare(right.title));

module.exports = { buildCalendarEvents };
