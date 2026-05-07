const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "src", "data", "classes.json");

const loadClassData = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const visibleTerms = (data, date = null) => {
    if (!date) return data.terms.filter((term) => term.visible !== false);

    const current = new Date(date);

    return data.terms.filter((term) => term.visible !== false && new Date(term.visibleFrom) <= current && current <= new Date(term.visibleUntil));
};

const sessionsForLevel = (data, course, date = null) => visibleTerms(data, date)
    .flatMap((term) => term.sessions
        .filter((session) => session.course === course)
        .map((session) => ({ term, session })));

const sessionsForVenue = (data, venue, date = null) => visibleTerms(data, date)
    .flatMap((term) => term.sessions
        .filter((session) => session.venue === venue)
        .map((session) => ({ term, session })));

module.exports = {
    DATA_PATH,
    loadClassData,
    sessionsForLevel,
    sessionsForVenue,
    visibleTerms,
};
