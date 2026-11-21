import * as THREE from "three";
import type { Materials } from "./materials";
import { box, mesh, rod, span, wheel, type Vehicle } from "./parts";

const R = 3.0; // fuselage radius
const C = 5.2; // height of the fuselage axis

/** A lathe whose axis runs along +X, from x0 to x0 + length; `profile` gives the radius along it (t from 0 to 1). */
function lathe(profile: (t: number) => number, length: number, mat: THREE.Material, steps = 40, phiStart = 0, phiLength = Math.PI * 2) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new THREE.Vector2(Math.max(0.0001, profile(t)), t * length));
  }
  const m = mesh(new THREE.LatheGeometry(pts, 64, phiStart, phiLength), mat);
  m.rotation.z = -Math.PI / 2; // local y (the lathe axis) becomes world +X
  return m;
}

/** A flat, swept surface (wing, stabiliser) from its outline in (along, outward), with thickness and a little dihedral. */
function surface(outline: [number, number][], thickness: number, mat: THREE.Material, side: 1 | -1, dihedral: number) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: thickness * 0.35, bevelSize: thickness * 0.4, bevelSegments: 3 });
  geo.rotateX(Math.PI / 2); // outline y → world z (outward), extrusion → world -y
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    pos.setY(i, pos.getY(i) + Math.abs(z) * dihedral);
    pos.setZ(i, z * side);
  }
  geo.computeVertexNormals();
  if (side < 0) {
    // mirroring flips the winding; turn the faces back
    const idx = geo.index;
    if (idx) for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a); }
    else for (let i = 0; i < pos.count; i += 3) for (const k of ["x", "y", "z"] as const) {
      const get = k === "x" ? pos.getX.bind(pos) : k === "y" ? pos.getY.bind(pos) : pos.getZ.bind(pos);
      const set = k === "x" ? pos.setX.bind(pos) : k === "y" ? pos.setY.bind(pos) : pos.setZ.bind(pos);
      const a = get(i + 1);
      set(i + 1, get(i + 2));
      set(i + 2, a);
    }
    geo.computeVertexNormals();
  }
  return mesh(geo, mat);
}

/** A turbofan: nacelle, fan face with spinner, and the exhaust cone. Its front is at x, centre at (y, z). */
function engine(M: Materials, x: number, y: number, z: number) {
  const g = new THREE.Group();
  const len = 5.4;
  const nac = lathe((t) => {
    const u = 1 - t; // u = 0 at the front
    if (u < 0.08) return 1.22 + u * 1.6;
    return 1.35 - Math.pow(Math.max(0, u - 0.3), 1.6) * 0.75;
  }, len, M.paintGrey, 40);
  nac.position.set(x - len, y, z);
  g.add(nac);
  const fan = mesh(new THREE.CircleGeometry(1.2, 48), M.steel);
  fan.rotation.y = Math.PI / 2;
  fan.position.set(x - 0.35, y, z);
  g.add(fan);
  for (let i = 0; i < 22; i++) {
    const blade = box(0.02, 1.05, 0.14, M.alu, x - 0.33, y, z);
    blade.rotation.x = (i / 22) * Math.PI * 2;
    blade.geometry.translate(0, 0.55, 0);
    g.add(blade);
  }
  const spinner = lathe((t) => 0.42 * Math.sqrt(Math.max(0, 1 - t * t)), 0.6, M.chrome, 16);
  spinner.position.set(x - 0.38, y, z);
  g.add(spinner);
  const cone = lathe((t) => 0.55 * (1 - t), 1.4, M.steel, 12);
  cone.rotation.z = Math.PI / 2;
  cone.position.set(x - len, y, z);
  g.add(cone);
  return g;
}

function gearLeg(M: Materials, x: number, z: number, top: number, wheelR: number, axles: number[], spread: number) {
  const g = new THREE.Group();
  const hubY = wheelR;
  g.add(rod(0.13, top - hubY, M.chrome, "y", x, (top + hubY) / 2, z, 16));
  g.add(rod(0.2, 0.9, M.steel, "y", x, top - 0.45, z, 16));
  for (const ax of axles) {
    g.add(rod(0.08, spread * 2 + 0.2, M.steel, "z", x + ax, hubY, z, 12));
    for (const s of [1, -1] as const) {
      const w = wheel(M, wheelR, 0.42, s);
      w.position.set(x + ax, hubY, z + s * spread);
      g.add(w);
    }
  }
  if (axles.length > 1) g.add(span(x + axles[0], hubY - 0.06, z - 0.1, x + axles[axles.length - 1], hubY + 0.06, z + 0.1, M.steel));
  return g;
}

/**
 * A twin-engine freighter with its main deck cut open along the top, parked. Nose, cockpit and tail stay whole.
 * No livery, no registration, no airline. The deck's rear end is at X = 0 and its front at X = L; the near side is +Z.
 */
export function buildPlane(M: Materials, hold: { L: number; W: number; H: number }): Vehicle {
  const { L, W } = hold;
  const g = new THREE.Group();
  const floorY = C - 0.6;
  const x0 = -1.4;
  const x1 = L + 1.4;
  const hn = -0.1; // near side cut, half a metre above the deck
  const hf = 1.9; // far side cut, below the crown
  const t0 = Math.asin(-hn / R);
  const t1 = Math.PI + Math.asin(hf / R);

  /* ---------- the open barrel over the main deck ---------- */
  const len = x1 - x0;
  const outer = mesh(new THREE.CylinderGeometry(R, R, len, 96, 1, true, t0, t1 - t0), M.paintWhite);
  outer.rotation.z = -Math.PI / 2;
  outer.position.set((x0 + x1) / 2, C, 0);
  g.add(outer);
  const inner = mesh(new THREE.CylinderGeometry(R - 0.12, R - 0.12, len, 96, 1, true, t0, t1 - t0), M.interior);
  inner.rotation.z = -Math.PI / 2;
  inner.position.copy(outer.position);
  g.add(inner);
  // frames inside, every 1.5 m, following the opening
  for (let x = x0 + 0.6; x < x1; x += 1.5) {
    const geo = new THREE.TorusGeometry(R - 0.16, 0.05, 6, 64, t1 - t0);
    geo.rotateZ(t0 + Math.PI);
    const frame = mesh(geo, M.alu, false);
    frame.rotation.y = Math.PI / 2;
    frame.position.set(x, C, 0);
    g.add(frame);
  }
  // the cut faces along both edges
  for (const th of [t0, t1]) {
    const r = R - 0.06;
    const cap = box(len, 0.035, 0.14, M.cut, (x0 + x1) / 2, C - r * Math.sin(th), r * Math.cos(th));
    cap.rotation.x = th;
    g.add(cap);
  }
  // the deck with roller tracks
  const half = Math.sqrt(R * R - 0.6 * 0.6) - 0.15;
  g.add(span(x0, floorY - 0.14, -half, x1, floorY, half, M.aluPanel));
  for (const z of [-1.8, -0.9, 0, 0.9, 1.8]) g.add(span(0, floorY, z - 0.04, L, floorY + 0.025, z + 0.04, M.chrome));
  // bulkheads at both ends, shaped like the cut section
  const section = new THREE.Shape();
  for (let i = 0; i <= 48; i++) {
    const th = t0 + ((t1 - t0) * i) / 48;
    const p = new THREE.Vector2((R - 0.12) * Math.cos(th), -(R - 0.12) * Math.sin(th));
    if (i === 0) section.moveTo(p.x, p.y);
    else section.lineTo(p.x, p.y);
  }
  section.closePath();
  for (const [x, cut] of [[x0 + 0.05, true], [x1 - 0.05, false]] as const) {
    const wall = mesh(new THREE.ShapeGeometry(section), M.interior);
    wall.rotation.y = -Math.PI / 2;
    wall.position.set(x, C, 0);
    g.add(wall);
    if (cut) {
      const a = new THREE.Vector3(x, C + hn, (R - 0.12) * Math.cos(t0));
      const b = new THREE.Vector3(x, C + hf, (R - 0.12) * Math.cos(t1));
      const d = b.clone().sub(a);
      const edge = box(0.08, 0.035, d.length(), M.cut, x, (a.y + b.y) / 2, (a.z + b.z) / 2);
      edge.rotation.x = Math.atan2(-d.y, d.z);
      g.add(edge);
    }
  }

  /* ---------- nose with the cockpit, closed ---------- */
  const noseLen = 7;
  const nose = lathe((t) => R * Math.pow(Math.max(0, 1 - Math.pow(t, 2.3)), 0.5), noseLen, M.paintWhite, 48);
  nose.position.set(x1, C, 0);
  g.add(nose);
  // the cockpit windscreen: a dark band round the top of the nose
  const noseR = (t: number) => R * Math.pow(Math.max(0, 1 - Math.pow(t, 2.3)), 0.5);
  const cut = Math.asin(0.32);
  const band: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = 0.36 + (i / 10) * 0.1;
    band.push(new THREE.Vector2(noseR(t) + 0.015, t * noseLen));
  }
  const shield = mesh(new THREE.LatheGeometry(band, 64, Math.PI + cut, Math.PI - 2 * cut), M.glass, false);
  shield.rotation.z = -Math.PI / 2;
  shield.position.set(x1, C, 0);
  g.add(shield);
  for (const phi of [Math.PI * 1.5, Math.PI * 1.5 - 0.42, Math.PI * 1.5 + 0.42, Math.PI * 1.5 - 0.9, Math.PI * 1.5 + 0.9]) {
    const post: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = 0.36 + (i / 10) * 0.1;
      post.push(new THREE.Vector2(noseR(t) + 0.025, t * noseLen));
    }
    const pm = mesh(new THREE.LatheGeometry(post, 2, phi - 0.025, 0.05), M.paintWhite, false);
    pm.rotation.z = -Math.PI / 2;
    pm.position.set(x1, C, 0);
    g.add(pm);
  }

  /* ---------- tail cone, swept up ---------- */
  const tailLen = 15;
  const tail = lathe((t) => R * (1 - Math.pow(t, 1.5) * 0.88), tailLen, M.paintWhite, 40);
  tail.rotation.z = Math.PI / 2 - 0.075;
  tail.position.set(x0, C, 0);
  g.add(tail);
  const tailTipX = x0 - tailLen * Math.cos(0.075);
  const tailTipY = C + tailLen * Math.sin(0.075);

  // fin
  const fin = new THREE.Shape([new THREE.Vector2(-3.5, 0), new THREE.Vector2(5.5, 0), new THREE.Vector2(5.2, 0.6), new THREE.Vector2(-1.2, 9.6), new THREE.Vector2(-4.3, 9.6), new THREE.Vector2(-5.8, 0.6)]);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.15, bevelSegments: 3 });
  const finMesh = mesh(finGeo, M.paintWhite);
  finMesh.position.set(tailTipX + 5.5, tailTipY + 0.6, -0.18);
  g.add(finMesh);
  // stabilisers
  for (const s of [1, -1] as const) {
    g.add(
      (() => {
        const st = surface([[0, 0], [4.8, 0], [1.6, 10], [-0.4, 10]], 0.28, M.paintGrey, s, 0.1);
        st.position.set(tailTipX + 3.0, tailTipY + 0.1, 0);
        return st;
      })(),
    );
  }

  /* ---------- wings and engines ---------- */
  const wingTop = C - 1.75;
  for (const s of [1, -1] as const) {
    const wing = surface([[11, 0], [21.5, 0], [22, 2.6], [7, 24], [4.4, 24], [9.5, 6]], 0.42, M.paintGrey, s, 0.085);
    wing.position.set(0, wingTop, 0);
    g.add(wing);
    const ez = s * 8.2;
    const lead = 21.5 - (8.2 - 2.6) * Math.tan(0.56);
    const ey = wingTop + 8.2 * 0.085 - 1.85;
    g.add(engine(M, lead + 3.0, ey, ez));
    g.add(span(lead - 2.0, ey + 0.9, ez - 0.18, lead + 1.6, wingTop + 8.2 * 0.085 - 0.2, ez + 0.18, M.paintGrey, 0.1));
  }
  // wing-to-body fairing
  g.add(box(13, 1.2, 5.4, M.paintWhite, 15.5, C - 2.35, 0, 0.55));

  /* ---------- landing gear ---------- */
  g.add(gearLeg(M, x1 + 4.6, 0, C - 2.4, 0.5, [0], 0.32));
  for (const s of [1, -1]) g.add(gearLeg(M, 13.8, s * 4.4, wingTop - 0.2, 0.62, [-0.75, 0.75], 0.45));

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return {
    group: g,
    holdOrigin: new THREE.Vector3(0, floorY, -W / 2),
    focus: new THREE.Vector3(L * 0.5, floorY + 0.6, 0),
    frame: new THREE.Box3(new THREE.Vector3(-8, 1, -7), new THREE.Vector3(L + 7.5, C + 4, 7)),
  };
}
