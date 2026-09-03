import "temporal-polyfill/global";
import { Calendar } from "fullcalendar";
import dayGridPlugin from "fullcalendar/daygrid";
import listPlugin from "fullcalendar/list";
import classicThemePlugin from "fullcalendar/themes/classic";
import "fullcalendar/skeleton.css";
import "fullcalendar/themes/classic/theme.css";
import "fullcalendar/themes/classic/palette.css";

const calendarElement = document.querySelector("#calendar-viewer");
const events = JSON.parse(document.querySelector("#calendar-data").textContent);
const wideScreen = window.matchMedia("(min-width: 48rem)");

const visibleEvents = () => {
    const categories = new Set(
        [...document.querySelectorAll('.calendar-filters input[type="checkbox"]:checked')]
            .map((checkbox) => checkbox.value),
    );

    return events.filter((event) => categories.has(event.category));
};

const calendar = new Calendar(calendarElement, {
    plugins: [dayGridPlugin, listPlugin, classicThemePlugin],
    themeSystem: "classic",
    initialView: wideScreen.matches ? "dayGridMonth" : "listMonth",
    firstDay: 1,
    timeZone: "Europe/Brussels",
    height: "auto",
    dayMaxEvents: true,
    eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    },
    headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,listMonth",
    },
    buttonText: {
        today: "Today",
        month: "Month",
        list: "Agenda",
    },
    events: visibleEvents(),
    eventDidMount({ event, el }) {
        const venue = event.extendedProps.venue;
        const label = venue ? `${event.title}, ${venue}` : event.title;

        el.classList.add(event.extendedProps.category);
        el.setAttribute("aria-label", label);
        el.title = label;
    },
    eventContent({ event, timeText, view }) {
        if (view.type !== "listMonth") return true;

        const content = document.createElement("span");
        const time = document.createElement("span");
        const details = document.createElement("span");
        const title = document.createElement("strong");

        content.className = "calendar-event-details";
        time.className = "calendar-event-time";
        details.className = "calendar-event-copy";
        time.textContent = timeText;
        title.textContent = event.title;
        details.append(title);

        if (event.extendedProps.venue) {
            const venue = document.createElement("span");

            venue.textContent = event.extendedProps.venue;
            details.append(venue);
        }

        content.append(time, details);

        return { domNodes: [content] };
    },
});

calendar.render();

document.querySelector(".calendar-filters").addEventListener("change", () => {
    calendar.removeAllEvents();
    calendar.addEventSource(visibleEvents());
});

wideScreen.addEventListener("change", ({ matches }) => {
    calendar.changeView(matches ? "dayGridMonth" : "listMonth");
});
