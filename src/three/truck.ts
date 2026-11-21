import * as THREE from "three";
import type { Materials } from "./materials";
import { axle, box, rod, span, type Vehicle } from "./parts";

/**
 * A generic cab-over tractor with a curtain-sided semi-trailer. The roof and the near curtain are cut away and the cut
 * faces are filled in the accent colour. No make, no badge, no lettering.
 * The trailer's rear is at X = 0 and its front at X = L; the near side (towards the camera) is +Z.
 */
export function buildTruck(M: Materials, hold: { L: number; W: number; H: number }): Vehicle {
  const { L, W, H } = hold;
  const g = new THREE.Group();
  const floorY = 1.22;
  const t = 0.05; // wall thickness
  const outW = W + 2 * t;
  const cutH = 0.035;

  /* ---------- trailer ---------- */
  const floor = box(L + 0.12, 0.12, outW, M.floor, L / 2, floorY - 0.06, 0);
  (floor.material as THREE.MeshStandardMaterial).map!.repeat.set(L / 3.2, 1);
  g.add(floor);
  // side rails along the floor edge
  for (const s of [1, -1]) g.add(span(-0.06, floorY - 0.24, s * (outW / 2), L + 0.06, floorY + 0.02, s * (outW / 2 + 0.05), M.alu));
  // chassis beams and cross members
  for (const s of [1, -1]) g.add(span(0.4, floorY - 0.46, s * 0.44, L - 0.3, floorY - 0.12, s * 0.56, M.steel));
  for (let x = 1; x < L - 0.5; x += 1.1) g.add(span(x, floorY - 0.2, -outW / 2 + 0.08, x + 0.08, floorY - 0.12, outW / 2 - 0.08, M.steel));
  // front bulkhead (aluminium), with its cut face on top
  g.add(span(L, floorY, -outW / 2, L + 0.06, floorY + H, outW / 2, M.aluPanel));
  g.add(span(L - 0.005, floorY + H, -outW / 2 - 0.005, L + 0.065, floorY + H + cutH, outW / 2 + 0.005, M.cut));
  // far curtain, full height, with stakes and the top rail cut
  g.add(span(0, floorY, -outW / 2, L, floorY + H, -W / 2, M.tarp));
  for (const x of [L * 0.25, L * 0.5, L * 0.75]) g.add(span(x - 0.05, floorY, -outW / 2 - 0.02, x + 0.05, floorY + H, -W / 2 + 0.01, M.alu));
  g.add(span(-0.06, floorY + H - 0.1, -outW / 2 - 0.03, L + 0.06, floorY + H, -W / 2, M.alu));
  g.add(span(-0.06, floorY + H, -outW / 2 - 0.035, L + 0.065, floorY + H + cutH, -W / 2 + 0.005, M.cut));
  // buckles along the bottom of the far curtain
  for (let x = 0.5; x < L; x += 0.75) g.add(span(x - 0.025, floorY + 0.05, -outW / 2 - 0.012, x + 0.025, floorY + 0.5, -outW / 2 - 0.004, M.plastic));
  // near curtain, cut low so the inside shows
  const nearH = 0.5;
  g.add(span(0, floorY, W / 2, L, floorY + nearH, outW / 2, M.tarp));
  g.add(span(0, floorY + nearH, W / 2 - 0.005, L, floorY + nearH + cutH, outW / 2 + 0.005, M.cut));
  for (const x of [L * 0.25, L * 0.5, L * 0.75]) {
    g.add(span(x - 0.05, floorY, W / 2 - 0.01, x + 0.05, floorY + nearH, outW / 2 + 0.02, M.alu));
  }
  // rear frame: the far post full height, the near post cut with the curtain; the header and doors are cut away
  g.add(span(-0.08, floorY, -outW / 2, 0.02, floorY + H, -outW / 2 + 0.1, M.alu));
  g.add(span(-0.085, floorY + H, -outW / 2 - 0.005, 0.025, floorY + H + cutH, -outW / 2 + 0.105, M.cut));
  g.add(span(-0.08, floorY, outW / 2 - 0.1, 0.02, floorY + nearH, outW / 2, M.alu));
  g.add(span(-0.085, floorY + nearH, outW / 2 - 0.105, 0.025, floorY + nearH + cutH, outW / 2 + 0.005, M.cut));
  g.add(span(-0.08, floorY - 0.04, -outW / 2, 0.02, floorY + 0.05, outW / 2, M.alu));
  // rear under-run bar, lamps, blank plate
  g.add(span(-0.2, 0.42, -W / 2 + 0.1, -0.06, 0.58, W / 2 - 0.1, M.steel));
  for (const s of [1, -1]) {
    g.add(span(-0.14, 0.58, s * 0.6, -0.08, floorY - 0.24, s * 0.6 + 0.08 * s, M.steel));
    g.add(box(0.06, 0.12, 0.42, M.lampRed, -0.21, 0.66, s * (W / 2 - 0.32), 0.02));
    g.add(box(0.06, 0.06, 0.12, M.lampAmber, -0.21, 0.66, s * (W / 2 - 0.05), 0.015));
  }
  g.add(box(0.02, 0.11, 0.52, M.plate, -0.215, 0.5, 0));
  // mudflaps and mudguards over the trailer axles
  const axlesX = [1.25, 2.56, 3.87];
  for (const s of [1, -1]) {
    g.add(span(0.42, floorY - 0.32, s * (W / 2 - 0.42), 4.7, floorY - 0.28, s * (outW / 2 + 0.02), M.plastic));
    g.add(span(0.48, 0.2, s * (W / 2 - 0.4), 0.52, floorY - 0.32, s * (outW / 2), M.plastic));
  }
  for (const x of axlesX) g.add(axle(M, x, 0.53, 0.38, W - 0.02));
  // side under-run guards between the axles and the landing legs
  for (const s of [1, -1]) {
    for (const y of [0.5, 0.78]) g.add(span(5.0, y, s * (W / 2 - 0.04), L - 3.2, y + 0.07, s * (W / 2 + 0.0), M.alu));
    for (const x of [5.2, (5 + L - 3.2) / 2, L - 3.4]) g.add(span(x, 0.5, s * (W / 2 - 0.06), x + 0.06, floorY - 0.24, s * (W / 2 - 0.02), M.steel));
  }
  // landing legs
  for (const s of [1, -1]) {
    g.add(span(L - 2.75, 0.08, s * 0.5, L - 2.6, floorY - 0.24, s * 0.65, M.steel));
    g.add(span(L - 2.85, 0, s * 0.45, L - 2.5, 0.08, s * 0.7, M.steel));
  }

  /* ---------- tractor ---------- */
  const T = L + 0.06; // trailer front face
  const cabBack = T + 0.85;
  const cabFront = cabBack + 2.3;
  const cabBottom = 1.08;
  const cabTop = 3.86;
  const cabW = 2.49;
  const frontAxle = cabFront - 0.75;
  const rearAxle = frontAxle - 3.7;
  // chassis
  for (const s of [1, -1]) g.add(span(rearAxle - 1.0, 0.72, s * 0.42, cabFront - 0.2, 1.0, s * 0.53, M.steel));
  g.add(rod(0.42, 0.08, M.steel, "y", rearAxle + 0.15, 1.08, 0, 32));
  // cab body
  const cx = (cabBack + cabFront) / 2;
  g.add(box(cabFront - cabBack, cabTop - cabBottom, cabW, M.paintWhite, cx, (cabBottom + cabTop) / 2, 0, 0.14));
  // roof fairing, a little narrower
  g.add(box(1.9, 0.22, cabW - 0.16, M.paintWhite, cx - 0.1, cabTop + 0.08, 0, 0.1));
  // windscreen, slightly raked, and the sun visor
  const ws = box(0.04, 1.02, cabW - 0.28, M.glass, cabFront + 0.004, 3.0, 0, 0.03);
  ws.rotation.z = 0.06;
  g.add(ws);
  g.add(box(0.2, 0.07, cabW - 0.2, M.plastic, cabFront + 0.02, 3.6, 0, 0.02));
  // side windows and door seams
  for (const s of [1, -1]) {
    g.add(box(0.95, 0.78, 0.02, M.glass, cabFront - 0.72, 2.98, s * (cabW / 2 + 0.002), 0.02));
    g.add(span(cabFront - 1.33, 1.25, s * (cabW / 2 - 0.004), cabFront - 1.31, 3.45, s * (cabW / 2 + 0.003), M.plastic));
    g.add(span(cabFront - 1.2, 2.1, s * (cabW / 2), cabFront - 1.0, 2.14, s * (cabW / 2 + 0.03), M.plastic)); // handle
    // steps
    g.add(span(cabFront - 1.15, 0.62, s * (cabW / 2 - 0.25), cabFront - 0.45, 0.68, s * (cabW / 2 + 0.01), M.alu));
    g.add(span(cabFront - 1.15, 0.92, s * (cabW / 2 - 0.25), cabFront - 0.45, 0.98, s * (cabW / 2 + 0.01), M.alu));
    // mirror arm and head
    g.add(span(cabFront - 0.25, 3.0, s * (cabW / 2), cabFront - 0.2, 3.04, s * (cabW / 2 + 0.32), M.plastic));
    g.add(box(0.1, 0.5, 0.24, M.plastic, cabFront - 0.24, 2.85, s * (cabW / 2 + 0.38), 0.04));
    g.add(box(0.02, 0.44, 0.2, M.glass, cabFront - 0.18, 2.85, s * (cabW / 2 + 0.38), 0.01));
  }
  // grille with slats, generic
  g.add(box(0.05, 0.78, 1.42, M.plastic, cabFront + 0.01, 1.95, 0, 0.03));
  for (let i = 0; i < 6; i++) g.add(box(0.03, 0.035, 1.34, M.chrome, cabFront + 0.04, 1.65 + i * 0.12, 0));
  // headlamps and running lights
  for (const s of [1, -1]) {
    g.add(box(0.06, 0.2, 0.46, M.glass, cabFront + 0.02, 1.42, s * 0.88, 0.04));
    g.add(box(0.03, 0.14, 0.38, M.lampWhite, cabFront + 0.045, 1.42, s * 0.88, 0.03));
    g.add(box(0.03, 0.03, 0.4, M.lampWhite, cabFront + 0.045, 1.6, s * 0.88));
    g.add(box(0.05, 0.08, 0.12, M.lampAmber, cabFront - 0.05, 1.45, s * (cabW / 2 + 0.005), 0.02));
  }
  // bumper and under-run
  g.add(box(0.28, 0.36, cabW + 0.02, M.paintGraphite, cabFront - 0.04, 1.06, 0, 0.06));
  g.add(span(cabFront - 0.2, 0.52, -cabW / 2 + 0.15, cabFront + 0.06, 0.66, cabW / 2 - 0.15, M.steel));
  // wheel arches
  for (const s of [1, -1]) g.add(span(frontAxle - 0.62, 1.0, s * (cabW / 2 - 0.42), frontAxle + 0.62, 1.1, s * (cabW / 2 + 0.01), M.plastic));
  // fuel tank and battery box
  g.add(rod(0.3, 1.25, M.alu, "x", cabBack + 0.25, 0.78, 0.92, 32));
  for (const x of [cabBack - 0.35, cabBack + 0.85]) g.add(rod(0.31, 0.04, M.steel, "x", x, 0.78, 0.92, 32));
  g.add(box(0.7, 0.45, 0.4, M.plastic, cabBack + 0.25, 0.82, -0.95, 0.03));
  // rear mudguards
  for (const s of [1, -1]) g.add(span(rearAxle - 0.65, 1.05, s * 0.62, rearAxle + 0.65, 1.1, s * (cabW / 2), M.plastic));
  // lower cab panels in graphite, side air deflectors, roof spoiler
  g.add(box(cabFront - cabBack - 0.02, 0.5, cabW + 0.01, M.paintGraphite, cx, cabBottom + 0.2, 0, 0.1));
  for (const s of [1, -1]) g.add(box(0.5, 1.9, 0.05, M.paintWhite, cabBack - 0.2, 2.75, s * (cabW / 2 - 0.03), 0.02));
  const spoiler = box(1.5, 0.6, cabW - 0.12, M.paintWhite, cabBack + 0.55, cabTop + 0.42, 0, 0.18);
  spoiler.rotation.z = 0.16;
  g.add(spoiler);
  // catwalk behind the cab, and the air and power lines to the trailer, coiled
  g.add(span(T + 0.05, 1.12, -0.55, cabBack - 0.02, 1.16, 0.55, M.alu));
  const coil = (color: number, z: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const a = u * Math.PI * 2 * 7;
      pts.push(new THREE.Vector3(T + 0.05 + u * (cabBack - T - 0.1), 2.05 - Math.sin(u * Math.PI) * 0.35 + Math.sin(a) * 0.06, z + Math.cos(a) * 0.06));
    }
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.013, 6), mat);
    tube.castShadow = true;
    return tube;
  };
  g.add(coil(0xc62828, -0.25), coil(0xe0a800, 0.0), coil(0x1d1f23, 0.25));
  // exhaust stack behind the cab
  g.add(rod(0.07, 1.4, M.chrome, "y", cabBack - 0.15, 3.0, -0.95, 20));
  // wheels: single at the front, twin at the rear
  g.add(axle(M, frontAxle, 0.52, 0.34, cabW - 0.06));
  g.add(axle(M, rearAxle, 0.52, 0.3, cabW - 0.06, true));

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    holdOrigin: new THREE.Vector3(0, floorY, -W / 2),
    focus: new THREE.Vector3(L * 0.55, floorY + H * 0.35, 0),
  };
}
