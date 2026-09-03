const fs = require("fs");
const path = require("path");
const { buildCalendarEvents } = require("./calendar-data");
const { loadSiteData } = require("./site-data");

const CALENDAR_PATH = path.join(__dirname, "..", "docs", "events", "index.html");
const events = JSON.stringify(buildCalendarEvents(loadSiteData())).replaceAll("<", "\\u003c");
fs.writeFileSync(CALENDAR_PATH, fs.readFileSync(CALENDAR_PATH, "utf8").replace(
    /([ \t]*)<!-- calendar-data:start -->[\s\S]*?[ \t]*<!-- calendar-data:end -->/,
    (_, indentation) => [
        `${indentation}<!-- calendar-data:start -->`,
        `${indentation}<script type="application/json" id="calendar-data">${events}</script>`,
        `${indentation}<!-- calendar-data:end -->`,
    ].join("\n"),
));
