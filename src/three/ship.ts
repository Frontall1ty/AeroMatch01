import * as THREE from "three";
import { SHIP_SLOTS } from "@/lib/holds";
import type { Materials } from "./materials";
import { box, mesh, span, type Vehicle } from "./parts";
import { ribs, rng } from "./textures";

const CL = 12.19; // 40 ft container, outside
const CW = 2.44;
const CH = 2.59;
const BAY = 12.8;
const ROW = 2.62;
const DECK = 3.5; // top of the hatch covers

/** Container colours of a generic fleet: no line's colours, no names. */
const FLEET = [0x2f5d8a, 0x8e3b2b, 0x2b7a78, 0x7d848c, 0xb49a6a, 0x3f6b45, 0x5a4f7a, 0xc9ccd1];

/**
 * A small container ship on the water. Your containers are orange and sit on top of the stacks; the first one has its
 * roof and near side cut away, with the cargo inside. No line's colours or names, no hull markings.
 * The ship's bow points to +X; the near side is +Z. The open container's doors face -X.
 */
export function buildShip(M: Materials, hold: { L: number; W: number; H: number }, mine: number): Vehicle & { dispose: () => void } {
  const { L, W, H } = hold;
  const g = new THREE.Group();
  const r = rng(41);
  const tex = ribs("#BDBDBD", 10);
  tex.repeat.set(6, 1);
  const owned: THREE.Material[] = [];
  const steel = (color: number) => {
    const m = new THREE.MeshStandardMaterial({ color, map: tex, roughness: 0.55, metalness: 0.35 });
    owned.push(m);
    return m;
  };
  const fleet = FLEET.map(steel);
  const orange = steel(0xff6a2e);

  const bays = SHIP_SLOTS.bays;
  const rows = SHIP_SLOTS.rows;
  const deckL = bays * BAY;
  const beam = rows * ROW + 1.8;
  const stern = -17;
  const bowEnd = deckL + 24;

  /* ---------- hull ---------- */
  const outline = new THREE.Shape();
  outline.moveTo(stern, -beam / 2 + 0.6);
  outline.quadraticCurveTo(stern, -beam / 2, stern + 1.5, -beam / 2);
  outline.lineTo(deckL + 4, -beam / 2);
  outline.bezierCurveTo(deckL + 14, -beam / 2, bowEnd - 4, -1.5, bowEnd, 0);
  outline.bezierCurveTo(bowEnd - 4, 1.5, deckL + 14, beam / 2, deckL + 4, beam / 2);
  outline.lineTo(stern + 1.5, beam / 2);
  outline.quadraticCurveTo(stern, beam / 2, stern, beam / 2 - 0.6);
  outline.closePath();
  const layer = (y0: number, y1: number, mat: THREE.Material, grow = 0) => {
    const geo = new THREE.ExtrudeGeometry(outline, { depth: y1 - y0, bevelEnabled: grow > 0, bevelSize: grow, bevelThickness: 0.01, bevelSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    const m = mesh(geo, mat);
    m.position.y = y0;
    return m;
  };
  g.add(layer(-4, 0.6, M.antifoul));
  g.add(layer(0.6, 0.75, M.paintWhite, 0.02));
  g.add(layer(0.75, 3.0, M.hull));
  g.add(layer(3.0, 3.06, M.deck));
  // forecastle, raised at the bow, with a white bulwark
  const fc = new THREE.Shape();
  fc.moveTo(deckL + 2, -beam / 2);
  fc.lineTo(deckL + 4, -beam / 2);
  fc.bezierCurveTo(deckL + 14, -beam / 2, bowEnd - 4, -1.5, bowEnd, 0);
  fc.bezierCurveTo(bowEnd - 4, 1.5, deckL + 14, beam / 2, deckL + 4, beam / 2);
  fc.lineTo(deckL + 2, beam / 2);
  fc.closePath();
  const fcGeo = new THREE.ExtrudeGeometry(fc, { depth: 2.4, bevelEnabled: false });
  fcGeo.rotateX(-Math.PI / 2);
  const fcMesh = mesh(fcGeo, M.hull);
  fcMesh.position.y = 3.0;
  g.add(fcMesh);
  g.add(span(deckL + 2, 3.0, -beam / 2 + 0.2, deckL + 2.3, 6.2, beam / 2 - 0.2, M.paintWhite)); // breakwater
  // hatch covers under each bay
  for (let b = 0; b < bays; b++) g.add(span(b * BAY + 0.15, 3.06, -rows * ROW / 2 - 0.2, b * BAY + BAY - 0.15, DECK, rows * ROW / 2 + 0.2, M.aluPanel));

  /* ---------- accommodation and bridge at the stern ---------- */
  const ax0 = stern + 2;
  const ax1 = stern + 11;
  const decks = 5;
  for (let d = 0; d < decks; d++) {
    const y0 = 3.06 + d * 2.8;
    const shrink = d * 0.25;
    g.add(span(ax0 + shrink, y0, -beam / 2 + 1 + shrink, ax1, y0 + 2.8, beam / 2 - 1 - shrink, M.paintWhite));
    g.add(span(ax1 - 0.01, y0 + 1.2, -beam / 2 + 1.5 + shrink, ax1 + 0.02, y0 + 2.1, beam / 2 - 1.5 - shrink, M.glass));
    for (const s of [1, -1]) g.add(span(ax0 + 1 + shrink, y0 + 1.2, s * (beam / 2 - 1 - shrink) - s * 0.01, ax1 - 1, y0 + 2.1, s * (beam / 2 - 1 - shrink) + s * 0.02, M.glass));
  }
  const bridgeY = 3.06 + decks * 2.8;
  g.add(span(ax0 + 2, bridgeY, -beam / 2 - 0.6, ax1 + 0.4, bridgeY + 2.6, beam / 2 + 0.6, M.paintWhite)); // bridge with wings
  g.add(span(ax1 + 0.39, bridgeY + 0.9, -beam / 2 - 0.4, ax1 + 0.42, bridgeY + 2.2, beam / 2 + 0.4, M.glass));
  g.add(span(ax0 + 2.2, bridgeY + 2.6, -beam / 2 - 0.5, ax1 + 0.3, bridgeY + 2.75, beam / 2 + 0.5, M.paintGraphite));
  g.add(box(3.2, 5, 2.8, M.paintGraphite, ax0 + 1.4, bridgeY + 4.2, 0, 0.3)); // funnel
  g.add(span(ax0 - 0.2, bridgeY + 5.0, -1.45, ax0 + 3.0, bridgeY + 5.5, 1.45, M.paintWhite));
  g.add(span(ax0 + 4, bridgeY + 2.75, -0.08, ax0 + 4.2, bridgeY + 8, 0.08, M.paintWhite)); // mast
  g.add(span(ax0 + 3.3, bridgeY + 6.8, -1.4, ax0 + 4.9, bridgeY + 6.9, 1.4, M.paintWhite));

  /* ---------- containers ---------- */
  // Slots in the order your containers fill them: the middle bays first, near rows first, on top of the stacks.
  const slots: { b: number; row: number }[] = [];
  const bayOrder = Array.from({ length: bays }, (_, i) => i).sort((a, b) => Math.abs(a - 4.2) - Math.abs(b - 4.2));
  for (const b of bayOrder) for (let row = rows - 1; row >= 0; row--) slots.push({ b, row });
  const count = Math.max(1, Math.min(mine, slots.length));
  const yours = new Set(slots.slice(0, count).map((s) => `${s.b}-${s.row}`));
  const zOf = (row: number) => -rows * ROW / 2 + ROW / 2 + row * ROW;
  const xOf = (b: number) => b * BAY + BAY / 2;
  let openAt: THREE.Vector3 | null = null;
  for (let b = 0; b < bays; b++) {
    for (let row = 0; row < rows; row++) {
      const key = `${b}-${row}`;
      const mineHere = yours.has(key);
      const below = mineHere ? 1 : 1 + Math.floor(r() * 3);
      for (let tier = 0; tier < below; tier++) {
        const c = box(CL, CH - 0.04, CW, fleet[Math.floor(r() * fleet.length)], xOf(b), DECK + tier * CH + CH / 2, zOf(row), 0.03);
        g.add(c);
      }
      if (!mineHere) continue;
      const y = DECK + below * CH;
      if (!openAt) {
        openAt = new THREE.Vector3(xOf(b), y, zOf(row));
        continue;
      }
      g.add(box(CL, CH - 0.04, CW, orange, xOf(b), y + CH / 2, zOf(row), 0.03));
    }
  }

  /* ---------- the open container ---------- */
  const o = openAt!;
  const t = (CW - W) / 2;
  const x0 = o.x - CL / 2;
  const x1 = o.x + CL / 2;
  const zf = o.z - CW / 2;
  const zn = o.z + CW / 2;
  const fy = o.y + 0.16;
  const cutH = 0.035;
  const nearH = 0.5;
  g.add(span(x0, o.y, zf, x1, fy, zn, M.steel)); // base frame
  g.add(span(x0 + 0.1, fy - 0.01, zf + t, x1 - 0.1, fy, zn - t, M.floor));
  g.add(span(x0, fy, zf, x1, fy + H, zf + t, orange)); // far side
  g.add(span(x0 - 0.005, fy + H, zf - 0.005, x1 + 0.005, fy + H + cutH, zf + t + 0.005, M.cut));
  g.add(span(x1 - t, fy, zf, x1, fy + H, zn, orange)); // front end
  g.add(span(x1 - t - 0.005, fy + H, zf - 0.005, x1 + 0.005, fy + H + cutH, zn + 0.005, M.cut));
  g.add(span(x0, fy, zn - t, x1, fy + nearH, zn, orange)); // near side, cut low
  g.add(span(x0 - 0.005, fy + nearH, zn - t - 0.005, x1 + 0.005, fy + nearH + cutH, zn + 0.005, M.cut));
  g.add(span(x0, fy, zf, x0 + t, fy + nearH, zn, orange)); // door end, cut low
  g.add(span(x0 - 0.005, fy + nearH, zf - 0.005, x0 + t + 0.005, fy + nearH + cutH, zn + 0.005, M.cut));
  for (const [x, z] of [[x0, zf], [x1, zf], [x0, zn], [x1, zn]]) g.add(box(0.18, 0.16, 0.18, M.steel, x + (x === x0 ? 0.09 : -0.09), o.y + 0.08, z + (z === zf ? 0.09 : -0.09)));

  g.traverse((m) => {
    if ((m as THREE.Mesh).isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  return {
    group: g,
    holdOrigin: new THREE.Vector3(x0 + t + (CL - 2 * t - L) / 2, fy, zf + t),
    focus: new THREE.Vector3(o.x, o.y + 1.2, o.z),
    frame: new THREE.Box3(new THREE.Vector3(o.x - 15, 1, -beam / 2), new THREE.Vector3(o.x + 15, o.y + 3, beam / 2)),
    water: true,
    dispose() {
      owned.forEach((m) => m.dispose());
      tex.dispose();
    },
  };
}
