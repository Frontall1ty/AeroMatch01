import * as THREE from "three";
import type { Materials } from "./materials";
import { box, mesh, rod, span, type Vehicle } from "./parts";

const GAUGE = 1.52; // the 1,520 mm gauge of the region
const WHEEL_R = 0.475;
const RAIL_TOP = 0.62;

/** A coil spring standing on end. */
function helix(radius: number, height: number, turns: number, tube: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= turns * 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, (i / (turns * 16)) * height, Math.sin(a) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, tube, 6);
}

/** One wheelset: two steel wheels with flanges on an axle, and the axle boxes outside. */
function wheelset(M: Materials, x: number) {
  const g = new THREE.Group();
  const y = RAIL_TOP + WHEEL_R;
  for (const s of [1, -1]) {
    const z = s * (GAUGE / 2 + 0.035);
    const tread = mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R * 0.97, 0.13, 40), M.wheelSteel);
    tread.rotation.x = Math.PI / 2;
    tread.position.set(x, y, z);
    g.add(tread);
    const flange = mesh(new THREE.CylinderGeometry(WHEEL_R + 0.03, WHEEL_R + 0.03, 0.025, 40), M.wheelSteel);
    flange.rotation.x = Math.PI / 2;
    flange.position.set(x, y, z - s * 0.065);
    g.add(flange);
    const shine = mesh(new THREE.CylinderGeometry(WHEEL_R + 0.002, WHEEL_R + 0.002, 0.06, 40, 1, true), M.railHead, false);
    shine.rotation.x = Math.PI / 2;
    shine.position.set(x, y, z + s * 0.02);
    g.add(shine);
    const hub = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 20), M.steel);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, y, s * (GAUGE / 2 + 0.2));
    g.add(hub);
    g.add(box(0.36, 0.24, 0.2, M.wagonFrame, x, y, s * (GAUGE / 2 + 0.24), 0.03)); // axle box
  }
  g.add(rod(0.075, GAUGE + 0.3, M.steel, "z", x, y, 0, 16));
  return g;
}

/** A two-axle bogie: side frames, bolster, springs and the two wheelsets. */
function bogie(M: Materials, x: number) {
  const g = new THREE.Group();
  const y = RAIL_TOP + WHEEL_R;
  const base = 0.925;
  g.add(wheelset(M, x - base), wheelset(M, x + base));
  for (const s of [1, -1]) {
    const z = s * (GAUGE / 2 + 0.24);
    // the side frame: a shallow arch from axle box to axle box
    const shape = new THREE.Shape();
    shape.moveTo(-base - 0.25, 0.1);
    shape.lineTo(-base - 0.15, 0.32);
    shape.lineTo(-0.45, 0.42);
    shape.lineTo(0.45, 0.42);
    shape.lineTo(base + 0.15, 0.32);
    shape.lineTo(base + 0.25, 0.1);
    shape.lineTo(base - 0.2, 0.08);
    shape.lineTo(0.42, -0.12);
    shape.lineTo(-0.42, -0.12);
    shape.lineTo(-base + 0.2, 0.08);
    shape.closePath();
    const win = new THREE.Path();
    win.moveTo(-0.3, 0.02);
    win.lineTo(0.3, 0.02);
    win.lineTo(0.3, 0.3);
    win.lineTo(-0.3, 0.3);
    win.closePath();
    shape.holes.push(win);
    const frame = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), M.wagonFrame);
    frame.position.set(x, y - 0.12, z - 0.08);
    g.add(frame);
    for (const dx of [-0.16, 0, 0.16]) {
      const spring = mesh(helix(0.06, 0.22, 5, 0.013), M.steel, false);
      spring.position.set(x + dx, y + 0.02, z);
      g.add(spring);
    }
  }
  g.add(box(0.36, 0.26, GAUGE + 0.5, M.wagonFrame, x, y + 0.24, 0, 0.03)); // bolster
  return g;
}

/** The automatic coupler at one end. */
function coupler(M: Materials, x: number, dir: 1 | -1, y: number) {
  const g = new THREE.Group();
  g.add(box(0.55, 0.16, 0.18, M.steel, x + dir * 0.28, y, 0, 0.02));
  g.add(box(0.26, 0.34, 0.34, M.steel, x + dir * 0.62, y, 0.04, 0.05));
  g.add(box(0.14, 0.22, 0.14, M.steel, x + dir * 0.74, y, -0.12, 0.04));
  return g;
}

/**
 * A covered goods wagon on a short piece of 1,520 mm track. The roof, the near side and the rear end wall are cut away
 * and the cut faces are filled in the accent colour. No railway markings or numbers.
 * The wagon's rear end is at X = 0, its front end at X = L; the near side is +Z.
 */
export function buildWagon(M: Materials, hold: { L: number; W: number; H: number }): Vehicle {
  const { L, W, H } = hold;
  const g = new THREE.Group();
  const floorY = RAIL_TOP + 1.3;
  const t = 0.06;
  const outW = W + 2 * t;
  const cutH = 0.035;
  const nearH = 0.55;

  /* ---------- track ---------- */
  const extra = 6;
  const ballast = new THREE.Shape();
  ballast.moveTo(-2.1, 0);
  ballast.lineTo(2.1, 0);
  ballast.lineTo(1.55, 0.3);
  ballast.lineTo(-1.55, 0.3);
  ballast.closePath();
  const bed = mesh(new THREE.ExtrudeGeometry(ballast, { depth: L + extra * 2, bevelEnabled: false }), M.ballast);
  bed.rotation.y = Math.PI / 2;
  bed.position.set(-extra, 0, 0);
  bed.scale.set(1, 1, 1);
  g.add(bed);
  for (let x = -extra + 0.3; x < L + extra; x += 0.55) g.add(box(0.26, 0.17, 2.7, M.concrete, x, 0.3 + 0.085, 0, 0.02));
  for (const s of [1, -1]) {
    const z = s * (GAUGE / 2);
    g.add(span(-extra, 0.47, z - 0.075, L + extra, 0.49, z + 0.075, M.rail));
    g.add(span(-extra, 0.49, z - 0.012, L + extra, 0.58, z + 0.012, M.rail));
    g.add(span(-extra, 0.58, z - 0.037, L + extra, RAIL_TOP, z + 0.037, M.railHead));
  }

  /* ---------- running gear and underframe ---------- */
  g.add(bogie(M, 2.0), bogie(M, L - 2.0));
  g.add(span(-0.1, floorY - 0.55, -0.22, L + 0.1, floorY - 0.12, 0.22, M.wagonFrame)); // centre sill
  for (const s of [1, -1]) g.add(span(-0.1, floorY - 0.32, s * (outW / 2 - 0.12), L + 0.1, floorY - 0.04, s * (outW / 2), M.wagonFrame));
  for (const x of [-0.1, L - 0.06]) g.add(span(x, floorY - 0.45, -outW / 2, x + 0.16, floorY - 0.04, outW / 2, M.wagonFrame)); // end beams
  const cy = RAIL_TOP + 1.06;
  g.add(coupler(M, -0.1, -1, cy), coupler(M, L + 0.1, 1, cy));
  // brake cylinder and reservoir under the floor
  g.add(rod(0.2, 1.4, M.steel, "x", L * 0.5 - 1.2, floorY - 0.42, 0.6, 20));
  g.add(rod(0.26, 0.6, M.steel, "x", L * 0.5 + 0.8, floorY - 0.42, -0.55, 20));

  /* ---------- body ---------- */
  const floor = box(L, 0.1, W, M.floor, L / 2, floorY - 0.05, 0);
  (floor.material as THREE.MeshStandardMaterial).map!.repeat.set(L / 3.2, 1);
  g.add(floor);
  // far side wall, full height, with vertical stiffeners, a sliding door and an inner lining
  g.add(span(0, floorY, -outW / 2, L, floorY + H, -W / 2, M.wagonPaint));
  for (let x = 0.35; x < L; x += 0.9) {
    if (Math.abs(x - L / 2) < 1.2) continue;
    g.add(span(x - 0.04, floorY, -outW / 2 - 0.05, x + 0.04, floorY + H, -outW / 2, M.wagonFrame));
  }
  g.add(span(L / 2 - 1.0, floorY + 0.02, -outW / 2 - 0.09, L / 2 + 1.0, floorY + H - 0.08, -outW / 2 - 0.04, M.wagonPaint));
  g.add(span(L / 2 - 1.3, floorY + H - 0.1, -outW / 2 - 0.12, L / 2 + 1.3, floorY + H - 0.04, -outW / 2, M.steel));
  g.add(span(L / 2 - 1.3, floorY - 0.06, -outW / 2 - 0.12, L / 2 + 1.3, floorY, -outW / 2, M.steel));
  g.add(span(0.02, floorY, -W / 2, L - 0.02, floorY + 1.7, -W / 2 + 0.03, M.floor));
  g.add(span(-0.005, floorY + H, -outW / 2 - 0.13, L + 0.005, floorY + H + cutH, -W / 2 + 0.005, M.cut));
  // front end wall, full height
  g.add(span(L - 0.0, floorY, -outW / 2, L + 0.06, floorY + H, outW / 2, M.wagonPaint));
  for (const z of [-0.7, 0, 0.7]) g.add(span(L + 0.06, floorY, z - 0.05, L + 0.11, floorY + H, z + 0.05, M.wagonFrame));
  g.add(span(L - 0.005, floorY + H, -outW / 2 - 0.005, L + 0.115, floorY + H + cutH, outW / 2 + 0.005, M.cut));
  // near side and rear end, cut low so the inside shows
  g.add(span(0, floorY, W / 2, L, floorY + nearH, outW / 2, M.wagonPaint));
  g.add(span(-0.005, floorY + nearH, W / 2 - 0.005, L + 0.005, floorY + nearH + cutH, outW / 2 + 0.005, M.cut));
  for (let x = 0.35; x < L; x += 0.9) g.add(span(x - 0.04, floorY, outW / 2, x + 0.04, floorY + nearH, outW / 2 + 0.05, M.wagonFrame));
  g.add(span(-0.06, floorY, -outW / 2, 0, floorY + nearH, outW / 2, M.wagonPaint));
  g.add(span(-0.065, floorY + nearH, -outW / 2 - 0.005, 0.005, floorY + nearH + cutH, outW / 2 + 0.005, M.cut));
  // corner steps and a hand rail on the front end
  for (const s of [1, -1]) {
    g.add(span(L - 0.3, floorY - 0.75, s * (outW / 2), L + 0.02, floorY - 0.7, s * (outW / 2 + 0.25), M.steel));
    g.add(rod(0.018, 1.2, M.steel, "y", L + 0.2, floorY + 0.4, s * (outW / 2 - 0.1), 8));
  }

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    holdOrigin: new THREE.Vector3(0, floorY, -W / 2),
    focus: new THREE.Vector3(L * 0.5, floorY + H * 0.2, 0),
  };
}
