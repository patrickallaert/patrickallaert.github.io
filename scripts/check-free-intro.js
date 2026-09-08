const assert = require("node:assert/strict");
const { freeIntroPromotion, renderFreeIntroPage } = require("./build-free-intro");
const { loadSiteData } = require("./site-data");

const data = loadSiteData();
const openPage = renderFreeIntroPage(data);
const closedData = {
    ...data,
    freeIntro: { ...data.freeIntro, status: "closed" },
};
const closedPage = renderFreeIntroPage(closedData);

assert.equal((openPage.match(/<article id=/g) || []).length, 7);
assert.match(openPage, new RegExp(data.freeIntro.registrationUrl));
assert.match(openPage, /Panorama Brasilis/);
assert.match(openPage, /pianofabriek\.be\/en\/activiteiten\/bora-pianofabriek-cineclube-panorama-brasilis/);
assert.match(freeIntroPromotion(data, "home"), /Try forró for free/);
assert.equal(freeIntroPromotion(closedData, "home"), "");
assert.doesNotMatch(closedPage, new RegExp(data.freeIntro.registrationUrl));
assert.match(closedPage, new RegExp(data.freeIntro.nextPeriod));
assert.match(freeIntroPromotion(closedData, "register"), /next free intro classes/);

console.log("Free intro open and closed states passed.");
