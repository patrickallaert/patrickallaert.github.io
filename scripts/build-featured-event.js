const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./site-data");

const DOCS_PATH = path.join(__dirname, "..", "docs");

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const replaceBlock = (html, name, content) => {
    const indentation = html.match(/\n([ \t]+)<a href="#main">/)[1];

    return html.replace(
        new RegExp(`([ \\t]*)<!-- ${name}:start -->[\\s\\S]*?[ \\t]*<!-- ${name}:end -->`, "g"),
        (_, indent) => [
            `${indent}<!-- ${name}:start -->`,
            content.split("\n").map((line) => `${indent}${indentation.repeat(line.match(/^ */)[0].length / 2)}${line.trimStart()}`).join("\n"),
            `${indent}<!-- ${name}:end -->`,
        ].filter(Boolean).join("\n"),
    );
};

const data = loadSiteData();
const event = data.featuredEvent;
const banner = event ? [
    "<aside class=\"featured-event-banner\" aria-label=\"Featured event\">",
    "  <p>",
    `    <strong>${escapeHtml(event.title)}</strong>`,
    `    <span>${escapeHtml(event.label)} · ${escapeHtml(event.dates)}</span>`,
    `    <a href=\"${escapeHtml(event.url)}\">View the workshops</a>`,
    "  </p>",
    "</aside>",
].join("\n") : "";
const feature = event ? [
    "<section id=\"featured-event\" class=\"featured-event\" aria-labelledby=\"featured-event-title\">",
    "  <div>",
    "    <p class=\"eyebrow\">Featured event</p>",
    `    <h2 id=\"featured-event-title\">${escapeHtml(event.title)}</h2>`,
    `    <p class=\"event-date\">${escapeHtml(event.label)} · ${escapeHtml(event.dates)}</p>`,
    `    <p>${escapeHtml(event.summary)}</p>`,
    "    <ul aria-label=\"Mardio and Milena event links\">",
    `      <li><a href=\"${escapeHtml(event.registrationUrl)}\" rel=\"noopener noreferrer\" target=\"_blank\">Register for the workshops</a></li>`,
    `      <li><a href=\"${escapeHtml(event.url)}\">View the full programme</a></li>`,
    "    </ul>",
    "  </div>",
    "  <figure>",
    `    <img src=\"${escapeHtml(event.image)}\" alt=\"${escapeHtml(event.imageAlt)}\" width=\"1080\" height=\"1920\" loading=\"lazy\" decoding=\"async\">`,
    "  </figure>",
    "</section>",
].join("\n") : "";

for (const page of fs.globSync(path.join(DOCS_PATH, "**", "index.html"))) {
    let html = fs.readFileSync(page, "utf8");
    html = replaceBlock(html, "featured-event-banner", banner);

    if (page === path.join(DOCS_PATH, "index.html")) {
        html = replaceBlock(html, "featured-event-home", feature);
    }

    if (page === path.join(DOCS_PATH, "events", "index.html")) {
        html = replaceBlock(html, "featured-event-summary", feature.replaceAll("featured-event-title", "featured-event-summary-title"));
    }

    fs.writeFileSync(page, html);
}
