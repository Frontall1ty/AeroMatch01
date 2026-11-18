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

const step = (n) => console.log(`\n[${n}]`);
const check = (cond, msg) => {
  console.log(`${cond ? "  ok " : "  FAIL"} ${msg}`);
  if (!cond) problems.push(msg);
};
const shot = async (name) => shotsDir && (await page.screenshot({ path: `${shotsDir}/${name}.png`, fullPage: true }));
const t0 = Date.now();

step("1. Carrier adds capacity with Duplicate last listing");
await page.goto(BASE);
await page.getByRole("button", { name: "Continue as carrier" }).click();
await page.waitForURL("**/carrier/capacity/new");
const tCarrier = Date.now();
await page.getByRole("button", { name: "Duplicate last listing" }).click();
await page.getByRole("button", { name: "In 3 days" }).click();
await page.getByRole("button", { name: "Add capacity" }).click();
await page.getByText("Capacity added.").first().waitFor();
check(true, `capacity published in ${((Date.now() - tCarrier) / 1000).toFixed(1)} s (spec: under 60 s)`);
await shot("1-carrier-capacity");

step("2. Shipper creates the demo shipment");
await page.getByRole("button", { name: "Shipper", exact: true }).click();
await page.waitForURL("**/shipper/new");
await page.getByRole("button", { name: "Load demo shipment" }).click();
await shot("2-shipper-form");
await page.getByRole("button", { name: "Compare options" }).click();
await page.waitForURL("**/shipper/compare/**");
await page.getByText("Recommended:").waitFor();
check(await page.locator("svg[aria-label^='Arrival windows']").isVisible(), "lane chart is visible");
const notAvail = await page.getByText(/Not available for this shipment \(\d+\)/).textContent();
check(!!notAvail, `"${notAvail}" section present`);
await page.getByText(/Not available for this shipment/).click();
const reasons = await page.locator("details li.text-bad li, details ul.text-bad li").allTextContents();
console.log("   reasons:", reasons.map((r) => r.replace(/\s+/g, " ").trim()).join(" | "));
check(reasons.some((r) => /Only .* left/.test(r)), "shows an insufficient capacity reason");
check(reasons.some((r) => /Max piece weight is/.test(r)), "shows a piece weight reason");
check(reasons.some((r) => /after your deadline/.test(r)), "shows a missed deadline reason");
const unverified = await page.getByText("Demo Freight Road").count();
check(unverified === 0, "unverified carrier is never shown");
await shot("3-compare");

step("3. Priority changes the recommendation");
const rec = async () => (await page.getByText("Recommended:").locator("..").textContent()).replace(/\s+/g, " ");
const seen = {};
for (const p of ["Fastest", "Cheapest", "Balanced"]) {
  await page.getByRole("button", { name: p, exact: true }).click();
  seen[p] = await rec();
  console.log(`   ${p}: ${seen[p].slice(0, 150)}`);
}
check(new Set(Object.values(seen)).size === 3, "three priorities give three different recommendations");
await page.getByRole("button", { name: "Fastest", exact: true }).click();

step("4. Request booking on the recommended air offer");
const firstRow = page.locator("tbody tr").first();
await firstRow.getByRole("button", { name: "Request booking" }).click();
const drawer = page.getByRole("dialog");
await drawer.waitFor();
check(await drawer.getByText("Commercial invoice").isVisible(), "document checklist is shown");
check(await drawer.getByText(/Indicative checklist/).isVisible(), "checklist disclaimer is shown");
await shot("4-drawer");
await drawer.getByRole("button", { name: "Request booking" }).click();
await page.waitForURL("**/shipper/bookings/**");
await page.getByText("Request sent.").waitFor();
const bookingUrl = page.url();
check(true, "booking requested");

step("5. Carrier approves and advances milestones to Delivered");
await page.getByRole("button", { name: "Carrier", exact: true }).click();
await page.waitForURL("**/carrier/capacity/new");
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
await page.getByRole("button", { name: "Shipper", exact: true }).click();
await page.waitForURL("**/shipper/new");
await page.goto(bookingUrl.split("?")[0]);
await page.getByText("Delivered").first().waitFor();
const done = await page.locator("ol li:has-text('(done)')").count();
check(done === 5, `timeline shows ${done} of 5 milestones done`);
await shot("6-shipper-timeline");

console.log(`\nTotal: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
if (problems.length) {
  console.log("\nPROBLEMS:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("\nAll checks passed.");
