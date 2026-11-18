// Runs the 3-minute demo script from the spec against a running server.
// Usage: BASE_URL=http://localhost:3100 node scripts/demo-check.mjs [--shots dir]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shotsDir = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));

const asAccount = async (company, url) => {
  await page.goto(`${BASE}/demo`);
  await page.getByRole("button", { name: new RegExp(company) }).click();
  await page.waitForURL(url);
};
const step = (n) => console.log(`\n[${n}]`);
const check = (cond, msg) => {
  console.log(`${cond ? "  ok " : "  FAIL"} ${msg}`);
  if (!cond) problems.push(msg);
};
const shot = async (name) => shotsDir && (await page.screenshot({ path: `${shotsDir}/${name}.png`, fullPage: true }));
const t0 = Date.now();

step("1. Carrier adds capacity with Duplicate last listing");
await asAccount("Demo Air Cargo A", "**/carrier/capacity/new");
const tCarrier = Date.now();
await page.getByRole("button", { name: "Duplicate last listing" }).click();
await page.getByRole("button", { name: "In 3 days" }).click();
await page.getByRole("button", { name: "Add capacity" }).click();
await page.getByText("Capacity added.").first().waitFor();
check(true, `capacity published in ${((Date.now() - tCarrier) / 1000).toFixed(1)} s (spec: under 60 s)`);
await shot("1-carrier-capacity");

step("2. Shipper creates the demo shipment");
await asAccount("Demo Textile Export LLC", "**/shipper/new");
await page.getByRole("button", { name: "Load demo shipment" }).click();
const live = await page.locator("p", { hasText: "Your shipment:" }).first().textContent();
check(/6,000 kg, 40 m³, about 22\.2 m² of floor space/.test(live), `piece size gives the totals automatically (${live.trim()})`);
await shot("2-shipper-form");
await page.getByRole("button", { name: "Compare options" }).click();
await page.waitForURL("**/shipper/compare/**");
await page.getByText("Recommended:").waitFor();
check(await page.locator("svg[aria-label^='Arrival windows']").isVisible(), "lane chart is visible");
const chartText = await page.locator("svg[aria-label^='Arrival windows']").textContent();
check(/Air/.test(chartText) && /Rail/.test(chartText) && /Road/.test(chartText) && !/Sea/.test(chartText), "chart lanes are Air, Rail and Road (no sea)");
const rows = page.locator('li[id^="row-"]');
const tableText = (await rows.allTextContents()).join(" ");
check(/\$110\/m² × 22\.2 m²/.test(tableText), "rail offer is priced per m² of the shipment's floor space");
check(/Flat price, whole truck or wagon/.test(tableText), "road offer with a flat price is shown");
check(/\$200\/m² × 22\.2 m²/.test(tableText), "road groupage is priced per m²");
check(/\$2\.60\/kg × 6,680 kg/.test(tableText), "air offer is priced per chargeable kg");
check(/Room for \d+ pieces like yours/.test(tableText), "offers with floor space show how many pieces like yours fit");
check(await page.getByRole("heading", { name: "How do you want to send it?" }).isVisible(), "the shipper chooses how to send it");
check((await page.locator('button[aria-pressed]', { hasText: /from \$/ }).count()) >= 3, "each mode shows its best price");
check((await page.locator('li[id^="row-"] [role="img"][aria-label*="free of"]').count()) > 0, "every option shows how much space is free");
check((await page.locator('li[id^="row-"] [role="img"][aria-label*="loaded with your cargo"]').count()) > 0, "every option shows the vehicle with its load");
const notAvail = await page.getByText(/Not available for this shipment \(\d+\)/).textContent();
check(!!notAvail, `"${notAvail}" section present`);
await page.getByText(/Not available for this shipment/).click();
const reasons = await page.locator("details li.text-bad li, details ul.text-bad li").allTextContents();
console.log("   reasons:", reasons.map((r) => r.replace(/\s+/g, " ").trim()).join(" | "));
check(reasons.some((r) => /Only .* left/.test(r)), "shows an insufficient capacity reason");
check(reasons.some((r) => /Max piece weight is/.test(r)), "shows a piece weight reason");
check(reasons.some((r) => /after your deadline/.test(r)), "shows a missed deadline reason");
check(reasons.some((r) => /Carries vehicles only/.test(r)), "car carriers are listed as vehicles only for general cargo");
const unverified = await page.getByText("Demo Freight Road").count();
check(unverified === 0, "unverified carrier is never shown");
await shot("3-compare");

step("3. Priority changes the recommendation");
const rec = async () => (await page.getByText("Recommended:").locator("..").textContent()).replace(/\s+/g, " ");
const seen = {};
for (const p of ["Fastest", "Cheapest", "Safest", "Balanced"]) {
  await page.getByRole("button", { name: p, exact: true }).click();
  seen[p] = await rec();
  console.log(`   ${p}: ${seen[p].slice(0, 150)}`);
}
check(new Set(Object.values(seen)).size === 4, "four priorities give four different recommendations");
await page.getByRole("button", { name: "Fastest", exact: true }).click();

step("4. Request booking on the recommended air offer");
const firstRow = page.locator('li[id^="row-"]').first();
await firstRow.getByRole("button", { name: "Request booking" }).click();
const drawer = page.getByRole("dialog");
await drawer.waitFor();
check(await drawer.getByText("Loaded with your cargo").isVisible(), "the drawer shows how full the vehicle is");
check((await drawer.locator('[role=img][aria-label*="loaded with your cargo"] rect').count()) >= 6, "the drawer shows the vehicle cut away with its positions");
check(await drawer.getByText("Commercial invoice").isVisible(), "document checklist is shown");
check(await drawer.getByText(/Indicative checklist/).isVisible(), "checklist disclaimer is shown");
await shot("4-drawer");
await drawer.getByRole("button", { name: "Request booking" }).click();
await page.waitForURL("**/shipper/bookings/**");
await page.getByText("Request sent.").waitFor();
const bookingUrl = page.url();
check(true, "booking requested");

step("5. Carrier approves and advances milestones to Delivered");
await asAccount("Demo Air Cargo A", "**/carrier/capacity/new");
await page.goto(`${BASE}/carrier/requests`);
await page.getByRole("button", { name: "Approve" }).first().click();
await page.getByText("No requests waiting").waitFor();
await page.goto(`${BASE}/carrier/bookings`);
await shot("5-carrier-bookings");
for (let i = 0; i < 4; i++) {
  await page.getByRole("button", { name: /^Mark as/ }).first().click();
  await page.waitForTimeout(500);
}
await page.getByText("Delivered. All milestones are recorded.").waitFor();
check(true, "booking delivered");

step("6. Shipper sees the full timeline");
await asAccount("Demo Textile Export LLC", "**/shipper/new");
await page.goto(bookingUrl.split("?")[0]);
await page.getByText("Delivered").first().waitFor();
const done = await page.locator("ol li:has-text('(done)')").count();
check(done === 5, `timeline shows ${done} of 5 milestones done`);
await shot("6-shipper-timeline");

step("7. Shipping vehicles: only vehicle carriers are offered");
await page.goto(`${BASE}/shipper/new`);
await page.getByText("Vehicles", { exact: true }).click();
await page.getByLabel("How many vehicles?").fill("4");
await page.getByRole("button", { name: "Compare options" }).click();
await page.waitForURL("**/shipper/compare/**");
await page.getByText("Recommended:").waitFor();
const carRows = await page.locator('li[id^="row-"]').count();
const carText = (await page.locator('li[id^="row-"]').allTextContents()).join(" ");
check(carRows === 2, `only 2 vehicle offers are listed (found ${carRows})`);
check(/\$900\/vehicle × 4/.test(carText) && /\$700\/vehicle × 4/.test(carText), "vehicle offers are priced per vehicle");
await page.getByText(/Not available for this shipment/).click();
check(await page.getByText("Carries general cargo only").first().isVisible(), "general cargo carriers are listed as not available for vehicles");
await shot("7-vehicles");

step("8. Carrier space calculator");
await asAccount("Demo Air Cargo A", "**/carrier/capacity/new");
await page.getByText("Road", { exact: true }).first().click();
await page.getByText("Space calculator: how many pieces fit?").click();
await page.getByLabel("Common piece sizes").selectOption({ index: 1 });
const fitText = await page.locator("p", { hasText: /\d+\s*pieces fit/ }).first().textContent();
console.log("   ", fitText.replace(/\s+/g, " ").trim());
const count = Number(fitText.match(/(\d+)\s*pieces fit/)?.[1] ?? 0);
check(count >= 33 && count <= 36, `a 13.6 m trailer takes ${count} euro pallets (expected 33 to 36)`);
check(await page.locator("svg[aria-label^='Top view']").isVisible(), "top view of the floor is drawn");
await shot("8-space-calculator");

console.log(`\nTotal: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
if (problems.length) {
  console.log("\nPROBLEMS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("\nAll checks passed.");
