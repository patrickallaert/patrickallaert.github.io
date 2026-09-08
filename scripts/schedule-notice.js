const escapeHtml = (value) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const renderScheduleNotice = (notice, trimester) => [
    '<aside class="schedule-notice" aria-label="Schedule update">',
    `    <p><strong>${escapeHtml(notice.title)}</strong></p>`,
    `    <p>${escapeHtml(notice.text)}</p>`,
    ...(trimester ? [`    <p><a href="/classes/#${escapeHtml(trimester)}">View the updated class schedule</a></p>`] : []),
    '</aside>',
].join("\n");

module.exports = { renderScheduleNotice };
