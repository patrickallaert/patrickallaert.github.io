const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://conexao.local";
const STORAGE_KEY = "conexao-cookie-preferences";

(async () => {
    const browser = await chromium.launch();

    const createContext = async () => {
        const context = await browser.newContext();
        const requests = { analytics: 0, youtube: 0 };
        await context.route(/^https:\/\/(conexao\.be|conexao\.libereco\.be)\//, async (route) => {
            const url = new URL(route.request().url());
            await route.fulfill({ response: await context.request.get(`${BASE_URL}${url.pathname}${url.search}`) });
        });
        await context.route("https://www.googletagmanager.com/**", async (route) => {
            requests.analytics++;
            await route.fulfill({ contentType: "application/javascript", body: "" });
        });
        await context.route(/https:\/\/(?:[^/]+\.)?(?:youtube(?:-nocookie)?\.com|googlevideo\.com|ytimg\.com)\//, async (route) => {
            requests.youtube++;
            await route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Test player</title>" });
        });
        return { context, requests };
    };

    try {
        for (const origin of ["https://conexao.be", "https://conexao.libereco.be", BASE_URL]) {
            for (const analytics of [false, true]) {
                for (const youtube of [false, true]) {
                    const { context, requests } = await createContext();
                    const page = await context.newPage();
                    await page.goto(`${origin}/`);
                    await page.locator("#cookie-preferences[open]").waitFor();
                    assert.deepEqual(requests, { analytics: 0, youtube: 0 });
                    assert.equal(await page.locator('input[name="analytics"]').isChecked(), false);
                    assert.equal(await page.locator('input[name="youtube"]').isChecked(), false);
                    await page.getByText("Choose preferences", { exact: true }).click();
                    await page.locator('input[name="analytics"]').setChecked(analytics);
                    await page.locator('input[name="youtube"]').setChecked(youtube);
                    await page.getByRole("button", { name: "Save my choices", exact: true }).click();
                    await page.locator("#cookie-preferences[open]").waitFor({ state: "hidden" });
                    await page.locator("#video").scrollIntoViewIfNeeded();
                    await page.waitForLoadState("networkidle");
                    const expected = { analytics: analytics && origin === "https://conexao.be" ? 1 : 0, youtube: youtube ? 1 : 0 };
                    assert.deepEqual(requests, expected);
                    assert.equal(await page.locator("#video-player iframe").count(), youtube ? 1 : 0);
                    assert.equal(await page.locator("#youtube-notice").isVisible(), !youtube);
                    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
                    assert.equal(saved.analytics, analytics);
                    assert.equal(saved.youtube, youtube);
                    assert.ok(Math.abs(saved.expires - Date.now() - 180 * 86400000) < 10000);

                    await page.reload();
                    assert.equal(await page.locator("#cookie-preferences[open]").count(), 0);
                    await page.locator("#video").scrollIntoViewIfNeeded();
                    await page.waitForLoadState("networkidle");
                    assert.deepEqual(requests, { analytics: expected.analytics * 2, youtube: expected.youtube * 2 });
                    await page.getByRole("button", { name: "Cookie preferences", exact: true }).click();
                    assert.equal(await page.locator('input[name="analytics"]').isChecked(), analytics);
                    assert.equal(await page.locator('input[name="youtube"]').isChecked(), youtube);
                    await page.keyboard.press("Escape");
                    assert.deepEqual(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY), saved);
                    await context.close();
                }
            }
        }

        const { context, requests } = await createContext();
        const page = await context.newPage();
        await page.goto("https://conexao.be/");
        await page.getByRole("button", { name: "Yes, allow both", exact: true }).click();
        await page.locator("#video").scrollIntoViewIfNeeded();
        await page.waitForLoadState("networkidle");
        assert.deepEqual(requests, { analytics: 1, youtube: 1 });
        await context.addCookies([
            { name: "_ga", value: "test", domain: ".conexao.be", path: "/" },
            { name: "_ga_4EZ01891D3", value: "test", url: "https://conexao.be/" },
        ]);
        await page.getByRole("button", { name: "Cookie preferences", exact: true }).click();
        await page.getByRole("button", { name: "No thanks", exact: true }).click();
        await page.waitForLoadState("networkidle");
        assert.deepEqual(requests, { analytics: 1, youtube: 1 });
        assert.equal(await page.locator("#video-player iframe").count(), 0);
        assert.equal((await context.cookies()).filter((cookie) => cookie.name.startsWith("_ga")).length, 0);
        assert.deepEqual(await page.evaluate((key) => {
            const { analytics, youtube } = JSON.parse(localStorage.getItem(key));
            return { analytics, youtube };
        }, STORAGE_KEY), { analytics: false, youtube: false });

        await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ analytics: true, youtube: true, expires: 0 })), STORAGE_KEY);
        await page.reload();
        await page.locator("#cookie-preferences[open]").waitFor();
        assert.deepEqual(requests, { analytics: 1, youtube: 1 });
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#video-player iframe").count(), 0);

        await page.goto("https://conexao.be/legal/#cookies");
        assert.equal(await page.locator("#cookie-preferences[open]").count(), 0);
        assert.equal(await page.locator("#cookies").isVisible(), true);
        await page.goto("https://conexao.be/links/");
        assert.equal(await page.locator('script[src*="consent.js"]').count(), 0);
        assert.deepEqual(requests, { analytics: 1, youtube: 1 });
        await context.close();
        console.log("Consent checks passed: all four choices on production, acceptance, and local; external requests intercepted.");
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
