const { eventPageUrl, sessionOccurrences, weeklyDates } = require("./site-data");

const eventUrl = (course) => course === "pratica" ? "/events/#praticas" : `/levels/#${course}`;

const courseTitle = (data, course) => data.courses[course]?.title || `Level ${course.slice(-1)}`;

const FREE_INTRO_URL = "/try-forro/";

const freeIntroTitle = (session) => session.course
    ? "Level 1 · Free trial class"
    : "Free forró intro class";

const freeIntroVenue = (data, session) => session.venue ? data.venues[session.venue] : session.location;

const timedEvent = ({ title, date, time, url, category, categories = [category], venue, className }) => {
    const [start, end] = time.split("-");

    return {
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

const classEvents = (data) => data.trimesters.flatMap((term) => term.schedule.flatMap((session) => {
    if (session.event) return [];

    return sessionOccurrences(term, session).map((date) => {
        const freeIntro = data.freeIntros.find((candidate) =>
            candidate.date === date
            && candidate.course === session.course);

        return timedEvent({
            title: freeIntro ? freeIntroTitle(freeIntro) : courseTitle(data, session.course),
            date,
            time: session.time,
            url: freeIntro ? FREE_INTRO_URL : eventUrl(session.course),
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

const publicEvents = (data) => Object.entries(data.events).filter(([, event]) => !event.occurrences).flatMap(([id, event]) => {
    const dates = event.recurrence ? weeklyDates({
        ...event.recurrence,
        excludedDates: excludedDates(data, id, event),
    }) : event.dates;

    return dates.map((date) => {
        const freeIntro = data.freeIntros.find((session) =>
            session.date === date && session.event === id);

        return timedEvent({
            title: freeIntro ? freeIntroTitle(freeIntro) : event.title || courseTitle(data, event.course),
            date,
            time: freeIntro?.time || event.time,
            url: freeIntro ? FREE_INTRO_URL : event.url || eventUrl(event.course),
            category: event.category,
            venue: freeIntro ? freeIntroVenue(data, freeIntro) : event.venue ? data.venues[event.venue] : event.location,
        });
    });
});

const freeIntroEvents = (data) => data.freeIntros
    .filter((session) => !session.event && !session.course)
    .map((session) => timedEvent({
        title: freeIntroTitle(session),
        date: session.date,
        time: session.time,
        url: FREE_INTRO_URL,
        category: "initiations",
        venue: freeIntroVenue(data, session),
    }));

const workshopEvents = (data) => Object.entries(data.events).filter(([, event]) => event.occurrences).flatMap(([id, event]) => {
    return event.occurrences.map((occurrence) => timedEvent({
        title: occurrence.title,
        date: occurrence.date || event.date,
        time: occurrence.time,
        url: `${eventPageUrl(id)}#programme`,
        category: event.category,
        venue: data.venues[occurrence.venue || event.venue],
    }));
});

const buildCalendarEvents = (data) => [
    ...classEvents(data),
    ...publicEvents(data),
    ...freeIntroEvents(data),
    ...workshopEvents(data),
].sort((left, right) => left.start.localeCompare(right.start) || left.title.localeCompare(right.title));

module.exports = { buildCalendarEvents };
