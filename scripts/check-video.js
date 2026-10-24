const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://conexao.local";

(async () => {
    const browser = await chromium.launch();

    try {
        const context = await browser.newContext();
        const youtubeRequests = [];
        let analyticsRequests = 0;

        await context.route("https://conexao.be/**", async (route) => {
            const url = new URL(route.request().url());
            await route.fulfill({ response: await context.request.get(`${BASE_URL}${url.pathname}${url.search}`) });
        });
        await context.route(/https:\/\/(?:[^/]+\.)?(?:youtube(?:-nocookie)?\.com|googlevideo\.com|ytimg\.com)\//, async (route) => {
            youtubeRequests.push(route.request().url());
            await route.fulfill({ contentType: "text/html", body: "<!doctype html><title>YouTube test player</title>" });
        });
        await context.route("https://www.googletagmanager.com/**", async (route) => {
            analyticsRequests++;
            await route.fulfill({ contentType: "application/javascript", body: "" });
        });

        const page = await context.newPage();
        await page.goto("https://conexao.be/");
        await page.getByRole("button", { name: "No thanks", exact: true }).click();
        await page.waitForLoadState("networkidle");
        assert.equal(youtubeRequests.length, 0, "The preview and template must not contact YouTube");
        assert.equal(await page.locator("#video-player iframe").count(), 0);

        const load = page.getByRole("button", { name: "Choose preferences for YouTube videos", exact: true });
        await load.focus();
        await page.keyboard.press("Enter");
        await page.locator("#cookie-preferences[open]").waitFor();
        assert.equal(await page.locator('input[name="youtube"]').isChecked(), false);
        assert.equal(await page.locator('input[name="youtube"]').evaluate((input) => input === document.activeElement), true);
        assert.equal(youtubeRequests.length, 0, "The play button must open preferences, not grant consent");
        await page.locator('input[name="youtube"]').check();
        await page.getByRole("button", { name: "Save my choices", exact: true }).click();
        await page.locator("#video-player iframe").scrollIntoViewIfNeeded();
        await page.waitForLoadState("networkidle");
        assert.equal(youtubeRequests.length, 1);
        const iframe = page.locator("#video-player iframe");
        const url = new URL(await iframe.getAttribute("src"));
        assert.equal(url.hostname, "www.youtube-nocookie.com");
        assert.equal(url.searchParams.has("autoplay"), false);
        assert.equal((await iframe.getAttribute("allow")).includes("autoplay"), false);
        assert.equal(await iframe.getAttribute("referrerpolicy"), "strict-origin-when-cross-origin");
        assert.equal(await iframe.getAttribute("loading"), "lazy");
        assert.equal(analyticsRequests, 0, "Playing YouTube must not grant analytics consent");

        await page.reload();
        await page.locator("#video-player iframe").scrollIntoViewIfNeeded();
        await page.waitForLoadState("networkidle");
        assert.equal(await page.locator("#cookie-preferences[open]").count(), 0);
        assert.equal(youtubeRequests.length, 2, "The saved YouTube choice must restore the player");

        await page.getByRole("button", { name: "Cookie preferences", exact: true }).click();
        await page.locator('input[name="youtube"]').uncheck();
        await page.getByRole("button", { name: "Save my choices", exact: true }).click();
        assert.equal(await page.locator("#video-player iframe").count(), 0);
        assert.equal(await page.locator("#video-player img").isVisible(), true);

        await page.reload();
        await page.waitForLoadState("networkidle");
        assert.equal(await page.locator("#video-player iframe").count(), 0);
        assert.equal(youtubeRequests.length, 2, "A saved refusal must block the player on later visits");
        await context.close();

        const noScript = await browser.newContext({ javaScriptEnabled: false });
        const fallback = await noScript.newPage();
        await fallback.goto(BASE_URL);
        assert.equal(await fallback.getByRole("link", { name: "Watch on YouTube", exact: true }).isVisible(), true);
        assert.equal(await fallback.locator("#video-player img").isVisible(), true);
        assert.equal(await fallback.locator("#video-player iframe").count(), 0);
        assert.equal(await fallback.getByRole("button", { name: "Choose preferences for YouTube videos", exact: true, includeHidden: true }).isVisible(), false);
        await noScript.close();
        console.log("YouTube consent checks passed; external player requests were intercepted.");
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
