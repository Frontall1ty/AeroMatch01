// Ownership and overbooking: another carrier cannot handle a request, and capacity cannot be oversold.
// Usage: BASE_URL=http://localhost:3000 node scripts/capacity-check.mjs   (run on freshly seeded data)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
const problems = [];
const ok = (c, m) => { console.log(`${c ? "  ok  " : "  FAIL"} ${m}`); if (!c) problems.push(m); };
const as = async (company, url) => {
  await p.goto(`${BASE}/demo`);
  await p.getByRole("button", { name: new RegExp(company) }).click();
  await p.waitForURL(url);
};

// A shipper books the 22,000 kg freighter listing (Demo Air Cargo A) four times with 6,000 kg each.
await as("Demo Textile Export LLC", "**/shipper/new");
for (let i = 0; i < 4; i++) {
  await p.goto(`${BASE}/shipper/new`);
  await p.getByRole("button", { name: "Load demo shipment" }).click();
  await p.getByRole("button", { name: "Compare options" }).click();
  await p.waitForURL("**/shipper/compare/**");
  const row = p.locator("tbody tr", { hasText: "$14,028" }).first();
  await row.getByRole("button", { name: "Request booking" }).click();
  await p.getByRole("dialog").getByRole("button", { name: "Request booking" }).click();
  await p.waitForURL("**/shipper/bookings/**");
}

// Another carrier sees none of them and is told that they wait for others.
await as("Demo Trucking Co", "**/carrier/capacity/new");
await p.goto(`${BASE}/carrier/requests`);
ok(await p.getByText("No requests waiting").isVisible(), "another carrier sees none of Air A's requests");
ok(await p.getByText(/waiting for other carriers/).isVisible(), "the page says requests wait for other carriers");

// The owner approves until the space runs out.
await as("Demo Air Cargo A", "**/carrier/capacity/new");
await p.goto(`${BASE}/carrier/requests`);
let approved = 0, blocked = "";
for (let i = 0; i < 4; i++) {
  await p.getByRole("button", { name: "Approve" }).first().click();
  await p.waitForTimeout(900);
  const alert = p.getByRole("alert").filter({ hasText: /Not enough capacity/ });
  if (await alert.count()) { blocked = await alert.first().textContent(); break; }
  approved++;
  await p.goto(`${BASE}/carrier/requests`);
}
ok(approved === 3, `three approvals fit (18,000 of 22,000 kg), found ${approved}`);
ok(/Not enough capacity/.test(blocked), "the fourth approval is refused with a clear message");

await b.close();
if (problems.length) { console.log("\nPROBLEMS:\n- " + problems.join("\n- ")); process.exit(1); }
console.log("\nAll checks passed.");
