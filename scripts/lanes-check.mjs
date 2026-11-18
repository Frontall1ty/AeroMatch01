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

async function shipperIn(city, label) {
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  await p.goto(`${BASE}/register`);
  await p.getByText("Shipper", { exact: true }).first().click();
  await p.getByLabel("Your name").fill("Lane Tester");
  await p.getByLabel("Company name").fill(`${label} ${stamp} LLC`);
  await p.getByLabel("Your city").selectOption(city);
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

console.log("\n[A shipper in Tashkent, an inland city]");
const t = await shipperIn("TAS", "Inland");
ok((await t.inputValue("#origin")) === "TAS", "the form starts in the shipper's own city");
const tTiles = await compare(t);
console.log("   modes:", tTiles.map((x) => x.split(" ")[0]).join(", "));
ok(tTiles.some((x) => x.startsWith("Air")) && tTiles.some((x) => x.startsWith("Rail")) && tTiles.some((x) => x.startsWith("Road")), "air, rail and road are offered");
ok(!tTiles.some((x) => x.startsWith("Sea")), "sea is never offered from an inland city");

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
ok((await i.locator('li[id^="row-"] svg[role="img"]').first().getAttribute("aria-label"))?.match(/ship|vessel/i) !== null, "a ship is drawn for sea options");
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
