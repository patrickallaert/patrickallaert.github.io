const fs = require("fs");
const path = require("path");
const { eventPageUrl, loadSiteData } = require("./site-data");

const DOCS_PATH = path.join(__dirname, "..", "docs");

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const replaceBlock = (html, name, content) => html.replace(
    new RegExp(`([ \\t]*)<!-- ${name}:start -->[\\s\\S]*?[ \\t]*<!-- ${name}:end -->`, "g"),
    (_, indentation) => [
        `${indentation}<!-- ${name}:start -->`,
        content ? content.split("\n").map((line) => `${indentation}${line}`).join("\n") : "",
        `${indentation}<!-- ${name}:end -->`,
    ].filter(Boolean).join("\n"),
);

const data = loadSiteData();
const event = data.featuredEvent ? data.events[data.featuredEvent] : null;
const url = event?.url || eventPageUrl(data.featuredEvent);
const dates = Array.isArray(event?.dates)
    ? event.dates.map((date) => new Intl.DateTimeFormat("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    }).format(new Date(`${date}T00:00:00Z`))).join(" · ")
    : event?.dates;
const details = `${dates} · ${event?.label}`;
const linkLabel = event?.linkLabel || "View event details";
const banner = event ? [
    "<aside class=\"featured-event-banner\" aria-label=\"Featured event\">",
    "  <p>",
    `    <strong>${escapeHtml(event.title)}</strong>`,
    `    <span>${escapeHtml(details)}</span>`,
    `    <a href=\"${escapeHtml(url)}\">${escapeHtml(linkLabel)}</a>`,
    "  </p>",
    "</aside>",
].join("\n") : "";
const renderFeature = (eager = false) => event?.image ? [
    "<section id=\"featured-event\" class=\"featured-event\" aria-labelledby=\"featured-event-title\">",
    "  <div>",
    "    <p class=\"eyebrow\">Featured event</p>",
    `    <h2 id=\"featured-event-title\">${escapeHtml(event.title)}</h2>`,
    `    <p class=\"event-date\">${escapeHtml(details)}</p>`,
    `    <p>${escapeHtml(event.summary)}</p>`,
    `    <ul aria-label=\"${escapeHtml(event.title)} links\">`,
    `      <li><a href=\"${escapeHtml(url)}\">View event details</a></li>`,
    "    </ul>",
    "  </div>",
    "  <figure>",
    `    <img src=\"${escapeHtml(event.image)}\" alt=\"${escapeHtml(event.imageAlt)}\" width=\"1080\" height=\"1920\" ${eager ? "loading=\"eager\"" : "loading=\"lazy\""} decoding=\"async\">`,
    "  </figure>",
    "</section>",
].join("\n") : "";

for (const page of fs.globSync(path.join(DOCS_PATH, "**", "index.html"))) {
    let html = fs.readFileSync(page, "utf8");
    html = replaceBlock(html, "featured-event-banner", banner);

    if (page === path.join(DOCS_PATH, "index.html")) {
        html = replaceBlock(html, "featured-event-home", renderFeature());
    }

    if (page === path.join(DOCS_PATH, "events", "index.html")) {
        html = replaceBlock(html, "featured-event-summary", renderFeature(true).replaceAll("featured-event-title", "featured-event-summary-title"));
    }

    fs.writeFileSync(page, html);
}
