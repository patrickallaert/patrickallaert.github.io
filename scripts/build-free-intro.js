const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./site-data");

const DOCS_PATH = path.join(__dirname, "..", "docs");

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const replaceBlock = (html, name, content) => html.replace(
    new RegExp(`([ \\t]*)<!-- ${name}:start -->[\\s\\S]*?[ \\t]*<!-- ${name}:end -->`),
    (_, indentation) => [
        `${indentation}<!-- ${name}:start -->`,
        ...content.split("\n").filter(Boolean).map((line) => `${indentation}${line}`),
        `${indentation}<!-- ${name}:end -->`,
    ].join("\n"),
);

const formatDate = (date) => new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
}).format(new Date(`${date}T00:00:00Z`)).replace(",", "");

const renderTime = (time) => {
    const [start, end] = time.split("-");

    return end
        ? `<time datetime="${start}">${start}</time>–<time datetime="${end}">${end}</time>`
        : `<time datetime="${start}">${start}</time>`;
};

const renderFreeIntroPage = (data) => {
    const offer = data.freeIntro;

    if (offer.status === "closed") {
        return [
            '<h2 id="free-sessions-title">Next free intro classes</h2>',
            `<p>The trimester has started. New free intro and trial classes are planned ahead of the next trimester in ${escapeHtml(offer.nextPeriod)}.</p>`,
            '<p>Check this page again closer to the date, or follow Conexão on <a href="https://www.instagram.com/conexao.brussels/" rel="noopener noreferrer" target="_blank">Instagram</a> or <a href="https://www.facebook.com/conexao.dance.school" rel="noopener noreferrer" target="_blank">Facebook</a> for announcements.</p>',
        ].join("\n");
    }

    return [
        '<h2 id="free-sessions-title">Free sessions in September 2026</h2>',
        '<p>Intro classes take place before the trimester, followed by two Level 1 classes that you can attend as a free trial. No partner or previous dance experience is needed.</p>',
        '<div class="free-intro-sessions">',
        ...offer.sessions.map((session) => [
            `  <article id="${escapeHtml(session.id)}">`,
            `    <p class="session-type">${session.type === "trial" ? "Free Level 1 trial" : "Free intro class"}</p>`,
            `    <h3>${escapeHtml(formatDate(session.date))}</h3>`,
            '    <dl class="session-facts">',
            `      <div><dt>Time</dt><dd>${renderTime(session.time)}</dd></div>`,
            `      <div><dt>Venue</dt><dd>${session.venue ? `<a href="/venues/#${escapeHtml(session.venue)}">${escapeHtml(data.venues[session.venue])}</a>` : escapeHtml(session.location)}${session.address ? `, ${escapeHtml(session.address)}` : ""}</dd></div>`,
            ...(session.event ? [`      <div><dt>Event</dt><dd><a href="${escapeHtml(session.event.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(session.event.title)}</a></dd></div>`] : []),
            `      <div><dt>Language</dt><dd>${escapeHtml(session.language)}</dd></div>`,
            '      <div><dt>Price</dt><dd>Free</dd></div>',
            '    </dl>',
            '  </article>',
        ].join("\n")),
        '</div>',
        '<div class="free-intro-registration">',
        '  <h3>Register in advance</h3>',
        '  <p>Advance registration helps us welcome everyone and balance leaders and followers where needed. To attend two sessions, submit the form once for each session.</p>',
        `  <p class="free-intro-action"><a href="${escapeHtml(offer.registrationUrl)}" rel="noopener noreferrer" target="_blank">Register for a free session</a></p>`,
        '</div>',
    ].join("\n");
};

const freeIntroPromotion = (data, location) => {
    if (data.freeIntro.status === "closed") {
        return location === "register"
            ? '<p class="free-intro-return">Looking for a first taste of forró? <a href="/try-forro/">See when our next free intro classes are planned.</a></p>'
            : "";
    }

    if (location === "register") {
        return [
            '<aside class="free-intro-promotion" aria-label="Free intro and trial classes">',
            '  <p><strong>New to forró?</strong> Choose from free intro and trial classes in September.</p>',
            '  <a href="/try-forro/">View the free sessions</a>',
            '</aside>',
        ].join("\n");
    }

    if (location === "events") {
        return '<p class="intro-action"><a href="/try-forro/">Try forró for free</a></p>';
    }

    return '<li><a href="/try-forro/">Try forró for free</a></li>';
};

const buildFreeIntro = (data) => {
    const pagePath = path.join(DOCS_PATH, "try-forro", "index.html");
    const promotions = {
        "index.html": "home",
        "classes/index.html": "classes",
        "levels/index.html": "levels",
        "events/index.html": "events",
        "register/index.html": "register",
    };

    fs.writeFileSync(pagePath, replaceBlock(
        fs.readFileSync(pagePath, "utf8"),
        "free-intro-page",
        renderFreeIntroPage(data),
    ));

    for (const [page, location] of Object.entries(promotions)) {
        const pagePath = path.join(DOCS_PATH, page);

        fs.writeFileSync(pagePath, replaceBlock(
            fs.readFileSync(pagePath, "utf8"),
            `free-intro-${location}`,
            freeIntroPromotion(data, location),
        ));
    }
};

if (require.main === module) buildFreeIntro(loadSiteData());

module.exports = { buildFreeIntro, freeIntroPromotion, renderFreeIntroPage };
