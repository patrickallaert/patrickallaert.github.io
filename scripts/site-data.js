const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "src", "data", "site.json");
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAYS = [...DAYS.slice(1), DAYS[0]];

const dateToIso = (date) => date.toISOString().slice(0, 10);

const utcDate = (date) => new Date(`${date}T00:00:00Z`);

const firstDayInRange = (start, day) => {
    const date = utcDate(start);
    const offset = (DAYS.indexOf(day) - date.getUTCDay() + 7) % 7;

    date.setUTCDate(date.getUTCDate() + offset);

    return dateToIso(date);
};

const nextWeek = (date, interval) => {
    const next = utcDate(date);

    next.setUTCDate(next.getUTCDate() + 7 * interval);

    return dateToIso(next);
};

const weeklyDates = ({ day, starts, ends, interval = 1, skipFirstOfMonth = false, excludedDates = [] }) => {
    const excluded = new Set(excludedDates);
    const dates = [];

    for (let date = day ? firstDayInRange(starts, day) : starts; date <= ends; date = nextWeek(date, interval)) {
        if (!excluded.has(date) && !(skipFirstOfMonth && utcDate(date).getUTCDate() <= 7)) dates.push(date);
    }

    return dates;
};

const assert = (condition, message) => {
    if (!condition) throw new Error(`Invalid ${DATA_PATH}: ${message}`);
};

const validateSiteData = (data) => {
    assert(data && typeof data === "object", "expected a JSON object");
    assert(data.venues && typeof data.venues === "object", "venues must be an object");
    assert(data.teachers && typeof data.teachers === "object", "teachers must be an object");
    assert(data.courses && typeof data.courses === "object", "courses must be an object");
    assert(data.events && typeof data.events === "object", "events must be an object");
    assert(Array.isArray(data.trimesters), "trimesters must be an array");
    assert(Array.isArray(data.freeIntros), "freeIntros must be an array");

    const trimesterIds = new Set();

    for (const trimester of data.trimesters) {
        assert(trimester.id, "every trimester needs an id");
        assert(!trimesterIds.has(trimester.id), `duplicate trimester id ${trimester.id}`);
        assert(trimester.title && trimester.starts && trimester.ends, `trimester ${trimester.id} needs title, starts and ends`);
        assert(Array.isArray(trimester.noClassDates), `trimester ${trimester.id} needs a noClassDates array`);
        assert(Array.isArray(trimester.schedule), `trimester ${trimester.id} needs a schedule array`);
        trimesterIds.add(trimester.id);

        trimester.schedule = trimester.schedule.map((item) => {
            if (!item.event) return item;

            const event = data.events[item.event];

            return {
                event: item.event,
                day: DAYS[utcDate(event.recurrence.starts).getUTCDay()],
                venue: event.venue,
                time: event.time,
                course: event.course,
                note: event.note,
                ...item,
            };
        });

        for (const item of trimester.schedule) {
            assert(DAYS.includes(item.day), `unknown day ${item.day} in trimester ${trimester.id}`);
            assert(data.venues[item.venue], `unknown venue ${item.venue} in trimester ${trimester.id}`);
            assert(data.courses[item.course] || /^level-\d$/.test(item.course), `unknown course ${item.course} in trimester ${trimester.id}`);

            for (const person of [...(item.teachers || []), ...(item.assistants || [])]) {
                assert(data.teachers[person], `unknown teacher ${person} in trimester ${trimester.id}`);
            }
        }
    }

    return data;
};

const loadSiteData = () => validateSiteData(JSON.parse(fs.readFileSync(DATA_PATH, "utf8")));

const noClassDatesForDay = (trimester, day) => trimester.noClassDates.filter((date) => {
    return DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()] === day;
});

module.exports = {
    DATA_PATH,
    DAYS,
    WEEKDAYS,
    eventPageUrl: (event) => `/events/${event}/`,
    loadSiteData,
    noClassDatesForDay,
    scheduleForLevel: (data, course) => data.trimesters
        .flatMap((trimester) => trimester.schedule
            .filter((item) => item.course === course)
            .map((session) => ({term: trimester, session}))),
    scheduleForVenue: (data, venue) => data.trimesters
        .flatMap((trimester) => trimester.schedule
            .filter((item) => item.venue === venue)
            .map((session) => ({term: trimester, session}))),
    sessionOccurrences: (trimester, session) => weeklyDates({
        day: session.day,
        starts: session.starts || trimester.starts,
        ends: session.ends || trimester.ends,
        excludedDates: noClassDatesForDay(trimester, session.day),
    }),
    weeklyDates,
};
