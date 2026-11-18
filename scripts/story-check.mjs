// The scroll story: the three transitions happen at the right places, and reduced motion shows still scenes.
// Usage: BASE_URL=http://localhost:3000 node scripts/story-check.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const b = await chromium.launch();
const problems = [];
const ok = (c, m) => { console.log(`${c ? "  ok  " : "  FAIL"} ${m}`); if (!c) problems.push(m); };

const page = await (await b.newContext({ viewport: { width: 1360, height: 800 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(BASE);
await page.waitForTimeout(500);

const geometry = await page.evaluate(() => {
  const story = document.querySelector("#ways");
  const stage = document.querySelector(".story-stage");
  return { top: story.getBoundingClientRect().top + window.scrollY, span: story.offsetHeight - stage.offsetHeight, stick: parseFloat(getComputedStyle(stage).top) };
});
async function at(p) {
  await page.evaluate(([g, f]) => window.scrollTo(0, g.top - g.stick + g.span * f), [geometry, p]);
  await page.waitForTimeout(150);
  return page.evaluate(() => {
    const num = (sel, prop) => parseFloat(getComputedStyle(document.querySelector(sel))[prop]);
    // a soft edge is a mask: solid up to the first percentage, gone by the second
    const edge = (sel) => {
      const cs = getComputedStyle(document.querySelector(sel));
      const m = ((cs.maskImage && cs.maskImage !== "none" ? cs.maskImage : cs.webkitMaskImage) || "").match(/(-?[\d.]+)%/g) || [];
      return m.length >= 2 ? { solid: parseFloat(m[0]), gone: parseFloat(m[1]) } : null;
    };
    return {
      p: parseFloat(getComputedStyle(document.querySelector("#ways")).getPropertyValue("--p")),
      sea: num(".story-sea", "opacity"),
      airText: num(".story-text-air", "opacity"),
      seaText: num(".story-text-sea", "opacity"),
      roadText: num(".story-text-road", "opacity"),
      railText: num(".story-text-rail", "opacity"),
      road: edge(".story-road"),
      rail: edge(".story-rail"),
    };
  });
}

console.log("\n[Scrolling drives the story]");
const start = await at(0);
ok(start.p < 0.01, `the story starts at 0 (${start.p})`);
ok(start.sea === 0 && start.airText > 0.99 && start.road && start.road.gone <= 0 && start.rail && start.rail.gone <= 0, "at the start: the sky only (sea, road and rail are hidden) and the air text shows");

const sky = await at(0.1);
ok(sky.airText > 0.99 && sky.seaText === 0, "in the sky the air text is shown, not the sea text");

const t1 = await at(0.26);
ok(t1.sea > 0.2 && t1.sea < 0.95, `transition 1: the sea is fading in over the sky (opacity ${t1.sea.toFixed(2)})`);

const sea = await at(0.4);
ok(sea.sea > 0.99 && sea.seaText > 0.99 && sea.airText < 0.02, "in the sea: the sea is fully in and the sea text shows, the air text is gone");

const t2 = await at(0.52);
ok(t2.road && t2.road.gone > 0 && t2.road.gone < 135 && t2.road.solid < 100, `transition 2: the road is being revealed from the left (soft edge at ${t2.road && t2.road.gone}%)`);

const road = await at(0.64);
ok(road.road && road.road.solid >= 100 && road.roadText > 0.99, "on the road: fully revealed and the road text shows");

const t3 = await at(0.78);
ok(t3.rail && t3.rail.gone > 0 && t3.rail.solid < 100, `transition 3: the rail yard is rising from the bottom (soft edge at ${t3.rail && t3.rail.gone}%)`);

const rail = await at(1);
ok(rail.rail && rail.rail.solid >= 100 && rail.railText > 0.99, "on the rail: fully revealed and the rail text shows");
ok(errors.length === 0, `no errors in the page${errors.length ? ": " + errors.join("; ") : ""}`);

const vehicles = await page.evaluate(() => document.querySelectorAll(".story-vehicle svg, svg.story-vehicle").length);
ok(vehicles === 4, `four vehicles are drawn (plane, ship, truck, train): ${vehicles}`);

console.log("\n[Reduced motion shows still scenes]");
const calm = await (await b.newContext({ viewport: { width: 1360, height: 800 }, reducedMotion: "reduce" })).newPage();
await calm.goto(BASE);
await calm.waitForTimeout(400);
const still = await calm.evaluate(() => ({
  positions: [...document.querySelectorAll(".story-scene")].map((e) => getComputedStyle(e).position),
  sticky: getComputedStyle(document.querySelector(".story-stage")).position,
  texts: [...document.querySelectorAll(".story-text")].map((e) => getComputedStyle(e).opacity),
  masks: [...document.querySelectorAll(".story-scene")].map((e) => getComputedStyle(e).maskImage || "none"),
}));
ok(still.sticky === "static" && still.positions.every((x) => x === "relative") && still.masks.every((m) => m === "none"), "the scenes are stacked, not pinned, with no masks");
ok(still.texts.length === 4 && still.texts.every((x) => x === "1"), "all four texts are visible");

console.log("\n[A phone]");
const phone = await (await b.newContext({ viewport: { width: 375, height: 812 } })).newPage();
await phone.goto(BASE);
await phone.waitForTimeout(400);
ok((await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "no sideways scrolling");

await b.close();
if (problems.length) { console.log("\nPROBLEMS:\n- " + problems.join("\n- ")); process.exit(1); }
console.log("\nAll checks passed.");
