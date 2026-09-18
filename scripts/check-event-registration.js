const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://conexao.local";
const EVENT_URL = `${BASE_URL}/events/2026-10-camila-alves/`;
const GOOGLE_FORM = "https://docs.google.com/forms/d/e/1FAIpQLSdnp5n87nrkl1V4dwmBLCjxjaKyrZP92bg4opx8urea5RB3KQ/viewform";

const selections = {
    "entry.974674964": "Leader",
    "entry.500263104": "Follower",
};

const selectWorkshops = async (page) => {
    for (const [name, value] of Object.entries(selections)) {
        await page.locator(`input[name="${name}"][value="${value}"]`).check();
    }
};

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    await context.route("https://docs.google.com/**", (route) => route.fulfill({
        body: "<!doctype html><title>Registration form</title><button>Submit</button>",
        contentType: "text/html",
    }));

    const desktop = await context.newPage();

    await desktop.setViewportSize({ width: 1280, height: 900 });
    await desktop.goto(EVENT_URL);

    const desktopButton = desktop.locator('#programme .summary button[type="submit"]');
    const desktopIframe = desktop.locator("#registration iframe");

    assert.equal(await desktopButton.isDisabled(), true);
    assert.equal(await desktopIframe.isHidden(), true);
    assert.equal(await desktop.locator("#registration").isHidden(), true);

    await selectWorkshops(desktop);
    assert.equal(await desktop.locator("#programme .summary output").innerText(), "2 workshops selected\n€32 to pay on the day");
    assert.equal(await desktopButton.isEnabled(), true);
    await desktopButton.click();
    assert.equal(await desktopIframe.isVisible(), true);
    assert.equal(await desktop.locator("#registration").isVisible(), true);

    const embeddedUrl = new URL(await desktopIframe.getAttribute("src"));

    assert.equal(`${embeddedUrl.origin}${embeddedUrl.pathname}`, GOOGLE_FORM);
    assert.equal(embeddedUrl.searchParams.get("entry.974674964"), "Leader");
    assert.equal(embeddedUrl.searchParams.get("entry.500263104"), "Follower");
    assert.equal(embeddedUrl.searchParams.get("entry.1247541740"), "Not attending");
    assert.equal(embeddedUrl.searchParams.get("embedded"), "true");

    const mobile = await context.newPage();

    await mobile.setViewportSize({ width: 390, height: 844 });
    await mobile.goto(EVENT_URL);
    await selectWorkshops(mobile);

    const [popup] = await Promise.all([
        mobile.waitForEvent("popup"),
        mobile.locator('#programme .summary button[type="submit"]').click(),
    ]);
    await popup.waitForLoadState();

    const externalUrl = new URL(popup.url());

    assert.equal(`${externalUrl.origin}${externalUrl.pathname}`, GOOGLE_FORM);
    assert.equal(externalUrl.searchParams.get("entry.974674964"), "Leader");
    assert.equal(externalUrl.searchParams.get("entry.500263104"), "Follower");
    assert.equal(externalUrl.searchParams.get("entry.1247541740"), "Not attending");
    assert.equal(await mobile.locator("#registration iframe").isHidden(), true);

    await browser.close();
    console.log("Event registration selection passed on desktop and mobile.");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
