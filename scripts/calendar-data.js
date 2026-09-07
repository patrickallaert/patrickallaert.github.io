const { sessionOccurrences, weeklyDates } = require("./site-data");

const eventUrl = (course) => course === "pratica" ? "/events/#praticas" : `/levels/#${course}`;

const courseTitle = (data, course) => data.courses[course]?.title || `Level ${course.slice(-1)}`;

const freeIntroUrl = (data, session) => data.freeIntro.status === "open"
    ? `/try-forro/#${session.id}`
    : "/try-forro/";

const freeIntroTitle = (session) => session.type === "trial"
    ? "Level 1 · Free trial class"
    : "Free forró intro class";

const freeIntroVenue = (data, session) => session.venue ? data.venues[session.venue] : session.location;

const timedEvent = ({ id, title, date, time, url, category, categories = [category], venue, className }) => {
    const [start, end] = time.split("-");

    return {
        id,
        title,
        start: `${date}T${start}:00`,
        ...(end ? { end: `${date}T${end}:00` } : {}),
        url,
        category,
        categories,
        venue,
        classNames: [category, ...(className ? [className] : [])],
    };
};

const classEvents = (data) => data.trimesters.flatMap((term) => term.schedule.flatMap((session, index) => {
    if (session.event) return [];

    return sessionOccurrences(term, session).map((date) => {
        const freeIntro = data.freeIntro.sessions.find((candidate) =>
            candidate.date === date
            && candidate.venue === session.venue
            && candidate.source?.trimester === term.id
            && candidate.source?.course === session.course);

        return timedEvent({
            id: freeIntro ? `free-intro-${freeIntro.id}` : `${term.id}-${index}-${date}`,
            title: freeIntro ? freeIntroTitle(freeIntro) : courseTitle(data, session.course),
            date,
            time: session.time,
            url: freeIntro ? freeIntroUrl(data, freeIntro) : eventUrl(session.course),
            category: "classes",
            categories: freeIntro ? ["classes", "initiations"] : ["classes"],
            venue: data.venues[session.venue],
            className: session.course,
        });
    });
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

    return dates.map((date) => {
        const freeIntro = data.freeIntro.sessions.find((session) =>
            session.date === date && session.source?.event === id);

        return timedEvent({
            id: freeIntro ? `free-intro-${freeIntro.id}` : `${id}-${date}`,
            title: freeIntro ? freeIntroTitle(freeIntro) : event.title,
            date,
            time: freeIntro?.time || event.time,
            url: freeIntro ? freeIntroUrl(data, freeIntro) : event.url,
            category: event.category,
            venue: freeIntro ? freeIntroVenue(data, freeIntro) : event.venue ? data.venues[event.venue] : event.location,
        });
    });
});

const freeIntroEvents = (data) => data.freeIntro.sessions
    .filter((session) => !session.source)
    .map((session) => timedEvent({
        id: `free-intro-${session.id}`,
        title: freeIntroTitle(session),
        date: session.date,
        time: session.time,
        url: freeIntroUrl(data, session),
        category: "initiations",
        venue: freeIntroVenue(data, session),
    }));

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
    ...freeIntroEvents(data),
    ...featuredEvents(data),
].sort((left, right) => left.start.localeCompare(right.start) || left.title.localeCompare(right.title));

module.exports = { buildCalendarEvents };
