const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { loadSiteData } = require("./site-data");

const BASE_URL = "https://conexao.be";
const PAGE_PATH = path.join(__dirname, "..", "docs", "links", "index.html");
const QR_PATH = path.join(__dirname, "..", "docs", "assets", "qr");

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const links = (data) => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());
    const futureEvents = Object.entries(data.events)
        .filter(([, event]) => event.occurrences?.some((occurrence) => (occurrence.date || event.date) >= today))
        .map(([id, event]) => ({
            slug: `event-${id}`,
            title: event.title,
            path: `/events/${id}/`,
        }));

    return [
        {
            id: "main-pages",
            title: "Main pages",
            items: [
                ["home", "Home", "/"],
                ["classes", "Classes", "/classes/"],
                ["levels", "Levels", "/levels/"],
                ["venues", "Venues", "/venues/"],
                ["events", "Events", "/events/"],
                ["about", "About", "/about/"],
                ["register", "Register", "/register/"],
            ].map(([slug, title, path]) => ({ slug, title, path })),
        },
        {
            id: "direct-links",
            title: "Direct links",
            items: [
                ["try-forro", "Try forró for free", "/try-forro/"],
                ["calendar", "Classes and events calendar", "/events/#calendar"],
                ["praticas", "Forró práticas", "/events/#praticas"],
                ["prices", "Prices", "/register/#prices"],
            ].map(([slug, title, path]) => ({ slug, title, path })),
        },
        ...(futureEvents.length ? [{ id: "upcoming-events", title: "Upcoming events", items: futureEvents }] : []),
        {
            id: "course-levels",
            title: "Course levels",
            items: [
                ["level-1", "Level 1", "/levels/#level-1"],
                ["level-2", "Level 2", "/levels/#level-2"],
                ["level-3", "Level 3", "/levels/#level-3"],
                ["level-4", "Level 4", "/levels/#level-4"],
                ["lead-follow", "Everyone Leads, Everyone Follows", "/levels/#lead-follow"],
                ["roots", "Roots", "/levels/#roots"],
            ].map(([slug, title, path]) => ({ slug, title, path })),
        },
        {
            id: "community",
            title: "Community and organisation",
            items: [
                ["safer-dance-spaces", "Safer Dance Spaces", "/safer-dance-spaces/"],
                ["care-team", "Care Team", "/safer-dance-spaces/#care-team"],
                ["community-values", "Community Values & Agreements", "/community-values/"],
                ["team-practices", "Team Practices & Aspirations", "/team-practices/"],
            ].map(([slug, title, path]) => ({ slug, title, path })),
        },
        {
            id: "venues",
            title: "Venues",
            qrCodes: false,
            items: Object.entries(data.venues).map(([id, title]) => ({
                slug: `venue-${id}`,
                title,
                path: `/venues/#${id}`,
            })),
        },
        {
            id: "team-profiles",
            title: "Team profiles",
            qrCodes: false,
            items: Object.entries(data.teachers).map(([id, title]) => ({
                slug: `team-${id}`,
                title,
                path: `/about/#${id}`,
            })),
        },
    ];
};

const renderRow = (item, qrCodes) => {
    const url = `${BASE_URL}${item.path}`;
    const asset = `/assets/qr/${item.slug}`;

    return [
        "        <tr>",
        `            <td class="url"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></td>`,
        `            <th scope="row">${escapeHtml(item.title)}</th>`,
        ...(qrCodes ? [
            '            <td class="qr">',
            `                <a href="${escapeHtml(url)}" aria-label="Open ${escapeHtml(item.title)}">`,
            `                    <img src="${asset}.svg" alt="QR code for ${escapeHtml(item.title)}" width="144" height="144" loading="lazy">`,
            "                </a>",
            "            </td>",
            "            <td>",
            `                <ul class="formats" aria-label="QR code downloads for ${escapeHtml(item.title)}">`,
            `                    <li><a href="${asset}.svg" download="conexao-${item.slug}-qr.svg" aria-label="Download SVG QR code for ${escapeHtml(item.title)}">SVG</a></li>`,
            `                    <li><a href="${asset}.png" download="conexao-${item.slug}-qr.png" aria-label="Download PNG QR code for ${escapeHtml(item.title)}">PNG</a></li>`,
            "                </ul>",
            "            </td>",
        ] : []),
        "        </tr>",
    ].join("\n");
};

const renderGroup = (group) => {
    const qrCodes = group.qrCodes !== false;

    return [
        `<section id="${group.id}" aria-labelledby="${group.id}-title">`,
        `    <h2 id="${group.id}-title">${escapeHtml(group.title)}</h2>`,
        `    <table aria-labelledby="${group.id}-title">`,
        "        <thead>",
        "            <tr>",
        "                <th scope=\"col\">URL</th>",
        "                <th scope=\"col\">Page</th>",
        ...(qrCodes ? [
            "                <th scope=\"col\">QR code</th>",
            "                <th scope=\"col\">Files</th>",
        ] : []),
        "            </tr>",
        "        </thead>",
        "        <tbody>",
        group.items.map((item) => renderRow(item, qrCodes)).join("\n"),
        "        </tbody>",
        "    </table>",
        "</section>",
    ].join("\n");
};

const renderNavigation = (groups) => [
    '<nav aria-label="Link categories">',
    "    <ul>",
    ...groups.map((group) => `        <li><a href="#${group.id}">${escapeHtml(group.title)}</a></li>`),
    "    </ul>",
    "</nav>",
].join("\n");

const build = async () => {
    const groups = links(loadSiteData());
    const items = groups.filter((group) => group.qrCodes !== false).flatMap((group) => group.items);
    let html = fs.readFileSync(PAGE_PATH, "utf8");
    const content = [renderNavigation(groups), ...groups.map(renderGroup)].join("\n\n");

    html = html.replace(
        /([ \t]*)<!-- links:start -->[\s\S]*?[ \t]*<!-- links:end -->/,
        (_, indentation) => [
            `${indentation}<!-- links:start -->`,
            content.split("\n").map((line) => line ? `${indentation}${line}` : "").join("\n"),
            `${indentation}<!-- links:end -->`,
        ].join("\n"),
    );

    fs.writeFileSync(PAGE_PATH, html);
    fs.rmSync(QR_PATH, { recursive: true, force: true });
    fs.mkdirSync(QR_PATH, { recursive: true });

    for (const item of items) {
        const url = `${BASE_URL}${item.path}`;
        const options = {
            errorCorrectionLevel: "L",
            margin: 4,
            color: { dark: "#004f71ff", light: "#ffffffff" },
        };

        await QRCode.toFile(path.join(QR_PATH, `${item.slug}.svg`), url, { ...options, type: "svg", width: 1024 });
        await QRCode.toFile(path.join(QR_PATH, `${item.slug}.png`), url, { ...options, type: "png", width: 1024 });
    }
};

build();
