import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Materials } from "./materials";

/** Small builders shared by the vehicles. Sizes in metres; X along the vehicle, Y up, Z across. */

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadows = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/** A box by its size, placed by its centre. */
export function box(sx: number, sy: number, sz: number, mat: THREE.Material, x = 0, y = 0, z = 0, radius = 0) {
  const geo = radius > 0 ? new RoundedBoxGeometry(sx, sy, sz, 3, Math.min(radius, sx / 2, sy / 2, sz / 2)) : new THREE.BoxGeometry(sx, sy, sz);
  const m = mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

/** A box by two corners. */
export function span(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material, radius = 0) {
  return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, radius);
}

/** A cylinder lying along an axis. */
export function rod(radius: number, length: number, mat: THREE.Material, axis: "x" | "y" | "z", x = 0, y = 0, z = 0, segments = 24) {
  const m = mesh(new THREE.CylinderGeometry(radius, radius, length, segments), mat);
  if (axis === "x") m.rotation.z = Math.PI / 2;
  if (axis === "z") m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

/** A tyre with rounded shoulders and a metal rim, its axle along Z. */
export function wheel(M: Materials, radius: number, width: number, outward: 1 | -1 = 1) {
  const g = new THREE.Group();
  const ri = radius * 0.6;
  const c = Math.min(width * 0.28, radius * 0.18);
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(ri, -width / 2));
  pts.push(new THREE.Vector2(radius - c, -width / 2));
  for (let i = 1; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - c + Math.cos(a) * c, -width / 2 + c + Math.sin(a) * c));
  }
  pts.push(new THREE.Vector2(radius, width / 2 - c));
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - c + Math.cos(a) * c, width / 2 - c + Math.sin(a) * c));
  }
  pts.push(new THREE.Vector2(ri, width / 2));
  const tyre = mesh(new THREE.LatheGeometry(pts, 48), M.rubber);
  tyre.rotation.x = Math.PI / 2;
  g.add(tyre);
  // tread grooves
  for (const dz of [-0.18, 0.18]) {
    const groove = mesh(new THREE.TorusGeometry(radius - 0.004, 0.008, 6, 64), M.plastic, false);
    groove.position.z = dz * width;
    g.add(groove);
  }
  const rim = mesh(new THREE.CylinderGeometry(ri, ri, width * 0.86, 40), M.rim);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const dish = mesh(new THREE.CylinderGeometry(ri * 0.82, ri * 0.92, 0.02, 40), M.steel);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = outward * width * 0.44;
  g.add(dish);
  const hub = mesh(new THREE.CylinderGeometry(ri * 0.34, ri * 0.4, 0.06, 24), M.chrome);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = outward * width * 0.47;
  g.add(hub);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const nut = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8), M.chrome, false);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(Math.cos(a) * ri * 0.5, Math.sin(a) * ri * 0.5, outward * width * 0.47);
    g.add(nut);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const hole = mesh(new THREE.CylinderGeometry(ri * 0.11, ri * 0.11, 0.03, 16), M.plastic, false);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * ri * 0.66, Math.sin(a) * ri * 0.66, outward * width * 0.45);
    g.add(hole);
  }
  return g;
}

/** A pair of wheels on an axle, one each side of the vehicle. */
export function axle(M: Materials, x: number, radius: number, width: number, track: number, dual = false) {
  const g = new THREE.Group();
  for (const side of [1, -1] as const) {
    const w = wheel(M, radius, width, side);
    w.position.set(x, radius, side * (track / 2));
    g.add(w);
    if (dual) {
      const inner = wheel(M, radius, width, side);
      inner.position.set(x, radius, side * (track / 2 - width - 0.03));
      g.add(inner);
    }
  }
  g.add(rod(0.07, track - width, M.steel, "z", x, radius, 0, 12));
  return g;
}

export type Vehicle = {
  group: THREE.Group;
  /** World position of the hold's corner where the cargo layout starts: rear end, far side, on the floor. */
  holdOrigin: THREE.Vector3;
  /** The middle of the cargo space, where the camera looks. */
  focus: THREE.Vector3;
  /** What the camera frames, when not the whole vehicle (a long wing or a big ship would leave the cargo tiny). */
  frame?: THREE.Box3;
  /** On water instead of on the ground. */
  water?: boolean;
};
