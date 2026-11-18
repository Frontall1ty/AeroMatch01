// The modes follow the city: an inland city never sees sea, a coastal one does.
// Usage: BASE_URL=http://localhost:3000 node scripts/lanes-check.mjs   (creates two test accounts)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const stamp = Date.now();
const b = await chromium.launch();
const problems = [];
const ok = (c, m) => { console.log(`${c ? "  ok  " : "  FAIL"} ${m}`); if (!c) problems.push(m); };

const COUNTRY = { TAS: "UZ", IST: "TR" };
async function shipperIn(city, label) {
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  await p.goto(`${BASE}/register`);
  await p.getByText("Shipper", { exact: true }).first().click();
  await p.getByLabel("Your name").fill("Lane Tester");
  await p.getByLabel("Company name").fill(`${label} ${stamp} LLC`);
  await p.getByLabel("Country", { exact: true }).selectOption(COUNTRY[city]);
  await p.getByLabel("City", { exact: true }).selectOption(city);
  await p.getByLabel("Email").fill(`${label.toLowerCase()}${stamp}@example.com`);
  await p.getByLabel("Password").fill("a-long-test-password");
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL("**/shipper/new");
  return p;
}
async function compare(p) {
  await p.getByRole("button", { name: "Load demo shipment" }).click();
  await p.getByRole("button", { name: "Compare options" }).click();
  await p.waitForURL("**/shipper/compare/**");
  await p.getByRole("heading", { name: "How do you want to send it?" }).waitFor();
  const tiles = await p.locator("section[aria-labelledby=how] button[aria-pressed]").allTextContents();
  return tiles.map((t) => t.replace(/\s+/g, " "));
}

console.log("\n[Choosing a country and a city at sign-up]");
const reg = await (await b.newContext()).newPage();
await reg.goto(`${BASE}/register`);
ok(await reg.getByLabel("City", { exact: true }).isDisabled(), "the city list waits for a country");
await reg.getByLabel("Country", { exact: true }).selectOption("UZ");
const uzCities = await reg.getByLabel("City", { exact: true }).locator("option").allTextContents();
ok(uzCities.some((x) => x.startsWith("Tashkent")) && uzCities.some((x) => x.startsWith("Samarkand")), "Uzbekistan offers Tashkent and Samarkand");
ok(!uzCities.some((x) => x.startsWith("Istanbul")), "the city list only shows that country's cities");
await reg.getByLabel("Country", { exact: true }).selectOption("GE");
ok((await reg.getByLabel("City", { exact: true }).inputValue()) === "TBS", "a country with one city fills the city in");
const countryCount = await reg.getByLabel("Country", { exact: true }).locator("option").count();
ok(countryCount > 15, `the country list is worldwide (${countryCount - 1} countries)`);

console.log("\n[A shipper in Tashkent, an inland city]");
const t = await shipperIn("TAS", "Inland");
ok((await t.inputValue("#origin")) === "TAS", "the form starts in the shipper's own city");
const tTiles = await compare(t);
console.log("   modes:", tTiles.map((x) => x.split(" ")[0]).join(", "));
ok(tTiles.some((x) => x.startsWith("Air")) && tTiles.some((x) => x.startsWith("Rail")) && tTiles.some((x) => x.startsWith("Road")), "air, rail and road are offered");
ok(!tTiles.some((x) => x.startsWith("Sea")), "sea is never offered from an inland city");

console.log("\n[The destination picker]");
await t.goto(`${BASE}/shipper/new`);
const rowsAll = await t.locator('input[name="destination"]').count();
ok(rowsAll >= 25, `lists every reachable city (${rowsAll})`);
await t.getByPlaceholder("Search a city or country").fill("kazakh");
await t.waitForTimeout(300);
const kz = await t.locator('input[name="destination"]').evaluateAll((els) => els.map((e) => e.value).sort());
ok(JSON.stringify(kz) === JSON.stringify(["ALA", "NQZ"]), `searching a country finds its cities (${kz.join(", ")})`);
await t.getByPlaceholder("Search a city or country").fill("zzzz");
ok(await t.getByText(/No city matches/).isVisible(), "an empty search says what to do");
await t.getByPlaceholder("Search a city or country").fill("");
const dxbRow = t.locator("label", { hasText: "DXB" });
ok(/Air/.test(await dxbRow.textContent()) && /Road/.test(await dxbRow.textContent()) && !/Rail/.test(await dxbRow.textContent()), "each city shows the modes that run there (Dubai: air and road)");
const jfkRow = t.locator("label", { hasText: "JFK" });
ok(!/Road|Rail/.test(await jfkRow.textContent()), "a city on another landmass has no road or rail");
await t.getByRole("button", { name: /PVG Shanghai|Shanghai/ }).first().click().catch(() => {});

console.log("\n[A shipper in Istanbul, a coastal city]");
const i = await shipperIn("IST", "Coastal");
ok((await i.inputValue("#origin")) === "IST", "the form starts in Istanbul");
await i.locator('label:has-text("DXB")').click();
const iTiles = await compare(i);
console.log("   modes:", iTiles.map((x) => x.split(" ")[0]).join(", "));
ok(iTiles.some((x) => x.startsWith("Sea")), "sea is offered between two coastal cities");
ok(iTiles.some((x) => x.startsWith("Air")), "air is offered too");

console.log("\n[Choosing a mode filters the list]");
await i.locator("section[aria-labelledby=how] button", { hasText: "Sea" }).click();
await i.waitForTimeout(400);
const rows = await i.locator('li[id^="row-"]').allTextContents();
ok(rows.length > 0 && rows.every((r) => /Container|LCL|Ro-Ro|Demo Sea Logistics/.test(r)), `only sea options are listed (${rows.length})`);
ok((await i.locator('li[id^="row-"] [role="img"][aria-label*="loaded with your cargo"]').first().getAttribute("aria-label"))?.match(/ship|vessel/i) !== null, "a ship is drawn for sea options");
await i.getByRole("button", { name: "Show all modes" }).click();
await i.waitForTimeout(300);
ok((await i.locator('li[id^="row-"]').count()) > rows.length, "Show all modes brings the other modes back");

console.log("\n[Cheapest, Fastest and Safest labels]");
const body = await i.locator('li[id^="row-"]').allTextContents();
const joined = body.join(" ");
ok(/Cheapest/.test(joined) && /Fastest/.test(joined), "options carry Cheapest and Fastest labels");
ok(/Safest/.test(joined), "an option carries the Safest label");
await i.getByRole("button", { name: "Safest", exact: true }).click();
await i.waitForTimeout(300);
const rec = (await i.getByText("Recommended:").first().locator("..").textContent()).replace(/\s+/g, " ");
ok(/demo estimate/.test(rec), "the Safest recommendation says safety is a demo estimate");

await b.close();
if (problems.length) { console.log("\nPROBLEMS:\n- " + problems.join("\n- ")); process.exit(1); }
console.log("\nAll checks passed.");
