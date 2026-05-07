const { chromium } = require("playwright");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8000";
const THEMES = (process.env.THEMES || "beta,epsilon,zeta,eta").split(",").map((theme) => theme.trim()).filter(Boolean);
const PAGES = (process.env.PAGES || "index.html,classes.html,levels.html,venues.html,events.html,about.html,register.html").split(",").map((page) => page.trim()).filter(Boolean);
const MIN_CONTRAST = Number(process.env.MIN_CONTRAST || 4.5);

const parseColor = (value) => {
    if (!value || value === "transparent") return null;

    let match = value.match(/rgba?\(([^)]+)\)/);

    if (match) {
        const parts = match[1].split(/,\s*/).map(Number);
        return [...parts.slice(0, 3), parts.length > 3 ? parts[3] : 1];
    }

    match = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?/);

    if (match) {
        return [match[1], match[2], match[3]].map((part) => Math.round(Number(part) * 255)).concat(match[4] ? Number(match[4]) : 1);
    }

    return null;
};

const composite = (top, bottom) => {
    const alpha = top[3] + bottom[3] * (1 - top[3]);

    return [0, 1, 2].map((index) => Math.round((top[index] * top[3] + bottom[index] * bottom[3] * (1 - top[3])) / alpha)).concat(alpha);
};

const srgb = (value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

const luminance = (color) => 0.2126 * srgb(color[0]) + 0.7152 * srgb(color[1]) + 0.0722 * srgb(color[2]);

const contrast = (foreground, background) => {
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);

    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
};

const checkServer = async (browser) => {
    const page = await browser.newPage();

    try {
        await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 5000 });
    } catch (error) {
        throw new Error(`Unable to reach ${BASE_URL}. Start the local site server before running this check.`);
    } finally {
        await page.close();
    }
};

const collectRows = async (page) => page.evaluate(() => {
    const textSelector = "a, button, h1, h2, h3, h4, h5, h6, p, li, span, strong, figcaption, dd, dt";

    const backgroundStack = (element) => {
        const stack = [];
        const colorFromImage = (value) => {
            const colors = value.match(/rgba?\([^)]+\)|color\(srgb\s+[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+)?\)/g);

            return colors ? colors.reverse().find((color) => !["rgba(0, 0, 0, 0)", "rgba(0,0,0,0)"].includes(color)) : null;
        };

        for (let node = element; node; node = node.parentElement) {
            const style = getComputedStyle(node);

            if (style.backgroundColor && !["rgba(0, 0, 0, 0)", "transparent"].includes(style.backgroundColor)) {
                stack.push(style.backgroundColor);
            } else if (style.backgroundImage && style.backgroundImage !== "none") {
                const color = colorFromImage(style.backgroundImage);

                if (color) stack.push(color);
            }
        }

        stack.push("rgb(255, 255, 255)");
        return stack;
    };

    return Array.from(document.querySelectorAll(textSelector))
        .filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);

            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && element.textContent.trim();
        })
        .map((element) => ({
            tag: element.tagName.toLowerCase(),
            text: element.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
            color: getComputedStyle(element).color,
            backgroundStack: backgroundStack(element),
        }))
        .filter((row) => row.backgroundStack);
});

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const failures = [];

    try {
        await checkServer(browser);

        for (const theme of THEMES) {
            for (const pagePath of PAGES) {
                await page.goto(`${BASE_URL.replace(/\/$/, "")}/${pagePath}`, { waitUntil: "domcontentloaded" });
                await page.evaluate((themeName) => sessionStorage.setItem("conexao-theme", themeName), theme);
                await page.reload({ waitUntil: "networkidle" });

                const rows = await collectRows(page);

                for (const row of rows) {
                    const foreground = parseColor(row.color);

                    if (!foreground) continue;

                    let background = [255, 255, 255, 1];

                    for (const color of row.backgroundStack.reverse()) {
                        const parsed = parseColor(color);

                        if (parsed) background = composite(parsed, background);
                    }

                    const value = contrast(foreground, background);

                    if (value < MIN_CONTRAST) {
                        failures.push({
                            theme,
                            page: pagePath,
                            contrast: value,
                            tag: row.tag,
                            text: row.text,
                            color: row.color,
                            background: `rgb(${background.slice(0, 3).join(", ")})`,
                        });
                    }
                }
            }
        }
    } finally {
        await browser.close();
    }

    if (failures.length) {
        console.error(`Contrast check failed: ${failures.length} text nodes below ${MIN_CONTRAST}:1`);

        for (const failure of failures.slice(0, 40)) {
            console.error(`${failure.theme}/${failure.page}: ${failure.contrast.toFixed(2)} ${failure.tag} "${failure.text}" color=${failure.color} bg=${failure.background}`);
        }

        if (failures.length > 40) {
            console.error(`...and ${failures.length - 40} more.`);
        }

        process.exit(1);
    }

    console.log(`Contrast check passed for ${THEMES.join(", ")} on ${PAGES.length} pages at ${BASE_URL}.`);
})().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
