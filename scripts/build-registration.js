const fs = require("fs");
const path = require("path");
const { loadSiteData } = require("./site-data");

const REGISTRATION_PATH = path.join(__dirname, "..", "docs", "register", "index.html");
const STATUS_START_MARKER = "      <!-- registration-status:start -->";
const STATUS_END_MARKER = "      <!-- registration-status:end -->";
const LINK_START_MARKER = "      <!-- registration-link:start -->";
const LINK_END_MARKER = "      <!-- registration-link:end -->";

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const registrationTrimester = (data) => data.trimesters.find(({ id }) => id === data.registration?.trimester);

const renderStatus = (data) => {
    const trimester = registrationTrimester(data);
    const paragraph = trimester
        ? `      <p>Registration is currently open for the ${escapeHtml(trimester.title)} trimester. You do not need a partner to register; Conexão balances leaders and followers across the groups.</p>`
        : "      <p>Registration is currently closed.</p>";

    return [STATUS_START_MARKER, paragraph, STATUS_END_MARKER].join("\n");
};

const renderLink = (data) => {
    const paragraph = data.registration
        ? `      <p><a href="${escapeHtml(data.registration.url)}" rel="noopener noreferrer" target="_blank">Open the registration form</a></p>`
        : "";

    return [LINK_START_MARKER, paragraph, LINK_END_MARKER].filter(Boolean).join("\n");
};

const replaceBlock = (html, start, end, content) => html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), content);

const data = loadSiteData();
const html = fs.readFileSync(REGISTRATION_PATH, "utf8");
const withStatus = replaceBlock(html, STATUS_START_MARKER, STATUS_END_MARKER, renderStatus(data));

fs.writeFileSync(REGISTRATION_PATH, replaceBlock(withStatus, LINK_START_MARKER, LINK_END_MARKER, renderLink(data)));
