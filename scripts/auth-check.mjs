// Accounts: sign-up, login, verification by hand, and who can see what.
// Usage: BASE_URL=http://localhost:3000 ADMIN_PASSCODE=... node scripts/auth-check.mjs   (server needs the same ADMIN_PASSCODE)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN = process.env.ADMIN_PASSCODE ?? "";
const stamp = Date.now();
const carrier = { name: "Test Carrier", company: `Test Carrier ${stamp} LLC`, email: `carrier${stamp}@example.com`, password: "a-long-test-password" };
const shipper = { name: "Test Shipper", company: `Test Shipper ${stamp} LLC`, email: `shipper${stamp}@example.com`, password: "another-long-password" };

const b = await chromium.launch();
const ctx = async () => (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
const problems = [];
const ok = (c, m) => { console.log(`${c ? "  ok  " : "  FAIL"} ${m}`); if (!c) problems.push(m); };

const COUNTRY = { TAS: "UZ", IST: "TR", ALA: "KZ" };
async function register(page, who, role, city) {
  await page.goto(`${BASE}/register`);
  await page.getByText(role === "CARRIER" ? "Carrier" : "Shipper", { exact: true }).first().click();
  await page.getByLabel("Your name").fill(who.name);
  await page.getByLabel("Company name").fill(who.company);
  await page.getByLabel("Country", { exact: true }).selectOption(COUNTRY[city]);
  await page.getByLabel("City", { exact: true }).selectOption(city);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Create account" }).click();
}

console.log("\n[Protected pages]");
const anon = await ctx();
await anon.goto(`${BASE}/shipper/new`);
ok(anon.url().endsWith("/login"), "a visitor who is not logged in is sent to the login page");

console.log("\n[Sign-up validation]");
await anon.goto(`${BASE}/register`);
await anon.getByLabel("Password").fill("short");
await anon.getByRole("button", { name: "Create account" }).click();
await anon.getByText("Use at least 10 characters.").waitFor();
ok(true, "a short password is refused with a clear message");

console.log("\n[Carrier signs up]");
const c = await ctx();
await register(c, carrier, "CARRIER", "TAS");
await c.waitForURL("**/account?welcome=1");
ok(await c.getByText("Not verified yet").first().isVisible(), "a new carrier starts as not verified");
ok(await c.getByText(/Still missing: .*phone number/i).isVisible(), "the account page lists what is missing");
await c.goto(`${BASE}/carrier/capacity/new`);
await c.selectOption("#destination", "IST");
await c.getByRole("button", { name: "In 3 days" }).click();
await c.getByRole("button", { name: "Add capacity" }).click();
await c.getByText("Capacity added.").first().waitFor();
ok(true, "an unverified carrier can add capacity");
await c.goto(`${BASE}/shipper/new`);
ok(c.url().includes("/carrier/capacity/new"), "a carrier cannot open shipper pages");
await c.getByRole("button", { name: "Log out" }).click();
await c.waitForURL((u) => new URL(u).pathname === "/");
ok(true, "logging out returns to the site");

console.log("\n[Login]");
await c.goto(`${BASE}/login`);
await c.getByLabel("Email").fill(carrier.email);
await c.getByLabel("Password").fill("wrong-password-123");
await c.getByRole("button", { name: "Log in" }).click();
await c.getByText("The email or password is not correct").waitFor();
ok(true, "a wrong password gives one generic message");
await c.getByLabel("Email").fill("nobody@example.com");
await c.getByRole("button", { name: "Log in" }).click();
await c.waitForTimeout(1200);
ok(await c.getByText("The email or password is not correct").isVisible(), "an unknown email gives the same message");

console.log("\n[Shipper cannot see an unverified carrier]");
const s = await ctx();
await register(s, shipper, "SHIPPER", "TAS");
await s.waitForURL("**/shipper/new");
await s.getByRole("button", { name: "Load demo shipment" }).click();
await s.getByRole("button", { name: "Compare options" }).click();
await s.waitForURL("**/shipper/compare/**");
await s.getByText("Recommended:").waitFor();
const compareUrl = s.url();
ok(!(await s.locator("body").textContent()).includes(carrier.company), "the unverified carrier's offer is not shown");

if (ADMIN) {
  console.log("\n[Admin verifies by hand]");
  const a = await ctx();
  await a.goto(`${BASE}/admin`);
  ok(a.url().endsWith("/admin/login"), "admin needs its own passcode");
  await a.getByLabel("Admin passcode").fill("wrong-passcode");
  await a.getByRole("button", { name: "Open admin" }).click();
  await a.getByText("That passcode is not correct.").waitFor();
  ok(true, "a wrong admin passcode is refused");
  await a.getByLabel("Admin passcode").fill(ADMIN);
  await a.getByRole("button", { name: "Open admin" }).click();
  await a.waitForURL("**/admin");
  const row = a.locator("tr", { hasText: carrier.company });
  ok(await row.getByText("Not yet").isVisible(), "the new carrier shows as not yet qualified");
  await row.getByRole("button", { name: "Verify" }).click();
  await row.getByText("Verified", { exact: true }).waitFor();
  ok(true, "the admin verifies the carrier");

  console.log("\n[Shipper sees the verified carrier]");
  await s.goto(compareUrl);
  await s.getByText("Recommended:").waitFor();
  ok((await s.locator("body").textContent()).includes(carrier.company), "after verification the carrier's offer appears");

  console.log("\n[Admin removes verification, and the offer disappears again]");
  await a.goto(`${BASE}/admin`);
  const row2 = a.locator("tr", { hasText: carrier.company });
  await row2.getByRole("button", { name: "Remove verification" }).click();
  await row2.getByRole("button", { name: "Verify" }).waitFor();
  await s.goto(compareUrl);
  await s.getByText("Recommended:").waitFor();
  ok(!(await s.locator("body").textContent()).includes(carrier.company), "after removing verification the offer is hidden again (and this test leaves no verified carrier behind)");
} else {
  console.log("\n(ADMIN_PASSCODE not set: skipped the admin steps)");
}

await b.close();
if (problems.length) { console.log("\nPROBLEMS:\n- " + problems.join("\n- ")); process.exit(1); }
console.log("\nAll checks passed.");
