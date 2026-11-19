// Accessibility scan (WCAG 2.1 A and AA) with axe-core on the main screens.
// Usage: BASE_URL=http://localhost:3000 [ADMIN_PASSCODE=...] node scripts/a11y-check.mjs   (reseed first; the server needs the same ADMIN_PASSCODE to scan the admin)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
const page = await ctx.newPage();
const failures = [];

async function scan(name, prepare) {
  if (prepare) await prepare();
  await page.waitForTimeout(700);
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () =>
    // eslint-disable-next-line no-undef
    await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }),
  );
  const bad = result.violations;
  console.log(`${bad.length === 0 ? "  ok  " : "  FAIL"} ${name} (${bad.length} issues)`);
  for (const v of bad) {
    console.log(`       [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} place${v.nodes.length === 1 ? "" : "s"})`);
    for (const n of v.nodes.slice(0, 2)) console.log(`         ${n.target.join(" ")}`);
    failures.push(`${name}: ${v.id}`);
  }
}

console.log("\n[Public pages]");
await page.goto(BASE);
await scan("home (site)");
await page.goto(`${BASE}/register`);
await scan("sign up");
await page.goto(`${BASE}/login`);
await scan("log in");
await page.goto(`${BASE}/demo`);
await scan("demo accounts");
await page.goto(`${BASE}/gate`);
await scan("passcode gate");
await page.goto(`${BASE}/gate?error=wrong`);
await scan("passcode gate with an error");

console.log("\n[Shipper]");
await page.goto(`${BASE}/demo`);
await page.getByRole("button", { name: /Demo Textile Export LLC/ }).click();
await page.waitForURL("**/shipper/new");
await scan("new shipment");
await page.getByRole("button", { name: "Load demo shipment" }).click();
await page.getByRole("button", { name: "Compare options" }).click();
await page.waitForURL("**/shipper/compare/**");
await page.getByText("Recommended:").waitFor();
await scan("compare options");
await page.locator('li[id^="row-"]').first().getByRole("button", { name: "Request booking" }).click();
await page.getByRole("dialog").waitFor();
await scan("booking drawer");

console.log("\n[Carrier]");
await page.goto(`${BASE}/demo`);
await page.getByRole("button", { name: /Demo Air Cargo A/ }).click();
await page.waitForURL("**/carrier/capacity/new");
await scan("add capacity");
await page.goto(`${BASE}/account`);
await scan("account");

if (process.env.ADMIN_PASSCODE) {
  console.log("\n[Admin console]");
  await page.goto(`${BASE}/admin/login`);
  await scan("admin login");
  await page.getByLabel("Admin passcode").fill(process.env.ADMIN_PASSCODE);
  await page.getByRole("button", { name: "Open admin" }).click();
  await page.waitForURL("**/admin");
  for (const [name, path] of [["overview", ""], ["carriers", "/carriers"], ["shippers", "/shippers"], ["listings", "/listings?source=demo"], ["bookings", "/bookings"], ["activity", "/activity"], ["system", "/system"]]) {
    await page.goto(`${BASE}/admin${path}`);
    await scan(`admin ${name}`);
  }
} else {
  console.log("\n(ADMIN_PASSCODE not set: skipped the admin screens)");
}

await b.close();
if (failures.length) {
  console.log(`\n${failures.length} issue type${failures.length === 1 ? "" : "s"} to fix.`);
  process.exit(1);
}
console.log("\nNo accessibility violations found by axe-core.");
