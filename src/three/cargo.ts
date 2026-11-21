import * as THREE from "three";
import type { Layout } from "@/lib/holds";
import type { Materials } from "./materials";
import { axle, box } from "./parts";
import { rng } from "./textures";

const CAR_PAINT = [0xc9ced6, 0x2b2f36, 0xf1f3f6, 0x1f3a5f, 0x6b7280, 0x7a1f1f];

/** A plain car shape: body, glasshouse and four wheels. No make. */
function car(M: Materials, l: number, w: number, h: number, i: number) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: CAR_PAINT[i % CAR_PAINT.length], roughness: 0.3, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.06 });
  const r = 0.32;
  const bodyH = h * 0.42;
  g.add(box(l * 0.98, bodyH, w * 0.98, paint, 0, r + bodyH / 2 - 0.05, 0, 0.14));
  g.add(box(l * 0.52, h * 0.36, w * 0.86, M.glass, -l * 0.04, r + bodyH + h * 0.14, 0, 0.16));
  g.add(box(l * 0.44, 0.05, w * 0.8, paint, -l * 0.04, r + bodyH + h * 0.33, 0, 0.02));
  for (const s of [1, -1]) {
    g.add(box(0.04, 0.08, 0.22, M.lampWhite, l * 0.49, r + bodyH * 0.6, s * w * 0.32, 0.02));
    g.add(box(0.04, 0.08, 0.22, M.lampRed, -l * 0.49, r + bodyH * 0.6, s * w * 0.32, 0.02));
  }
  for (const x of [l * 0.32, -l * 0.32]) g.add(axle(M, x, r, 0.2, w * 0.86));
  (g.userData as { owned?: THREE.Material[] }).owned = [paint];
  return g;
}

export type CargoItem = { object: THREE.Object3D; index: number; restY: number; hit: THREE.Mesh[] };

/**
 * The cargo of a layout as 3D objects, placed in the hold: crates of corrugated board, pallets, or cars.
 * `origin` is the world position of the hold's corner where the layout starts.
 */
export function buildCargo(M: Materials, layout: Layout, origin: THREE.Vector3): CargoItem[] {
  const items: CargoItem[] = [];
  const r = rng(29);
  for (const b of layout.boxes) {
    const g = new THREE.Group();
    const hit: THREE.Mesh[] = [];
    if (layout.state === "vehicles") {
      g.add(car(M, b.l - 0.15, b.w - 0.12, b.h, b.index));
    } else if (layout.state === "estimate") {
      // a Euro pallet with its load
      const pb = 0.14;
      for (const z of [-b.w / 2 + 0.05, 0, b.w / 2 - 0.05]) g.add(box(b.l - 0.04, pb * 0.7, 0.1, M.pallet, 0, pb * 0.35, z));
      g.add(box(b.l - 0.04, 0.03, b.w - 0.04, M.pallet, 0, pb - 0.015, 0));
      const load = box(b.l - 0.06, b.h - pb - 0.02, b.w - 0.06, M.box, 0, pb + (b.h - pb) / 2, 0, 0.02);
      g.add(load);
      hit.push(load);
    } else {
      const gap = 0.012 + r() * 0.01;
      const crate = box(b.l - gap * 2, b.h - gap, b.w - gap * 2, M.box, 0, (b.h - gap) / 2, 0, 0.018);
      crate.rotation.y = (r() - 0.5) * 0.012;
      g.add(crate);
      hit.push(crate);
    }
    if (hit.length === 0) g.traverse((o) => (o as THREE.Mesh).isMesh && hit.push(o as THREE.Mesh));
    const restY = origin.y + b.z;
    g.position.set(origin.x + b.x + b.l / 2, restY, origin.z + b.y + b.w / 2);
    g.userData.index = b.index;
    items.push({ object: g, index: b.index, restY, hit });
  }
  return items;
}

export function disposeCargo(items: CargoItem[]) {
  for (const it of items) {
    it.object.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    const owned = (it.object.children[0]?.userData as { owned?: THREE.Material[] } | undefined)?.owned;
    owned?.forEach((m) => m.dispose());
    it.object.removeFromParent();
  }
}
