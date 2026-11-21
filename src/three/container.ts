import * as THREE from "three";
import type { Materials } from "./materials";
import { box, span } from "./parts";

/** A 40 ft container, outside. */
export const CL = 12.19;
export const CW = 2.44;
export const CH = 2.59;

/**
 * A 40 ft container with its roof and near side cut away (and its door end too, unless `doors`), the cut faces in the
 * accent colour. (x, y, z) is the middle of its base; the doors face -X and the near side is +Z.
 * Returns the corner where the cargo layout starts: door end, far side, on the floor.
 */
export function openContainer(g: THREE.Group, M: Materials, wall: THREE.Material, x: number, y: number, z: number, hold: { L: number; W: number; H: number }, doors = false) {
  const { L, W, H } = hold;
  const t = (CW - W) / 2;
  const x0 = x - CL / 2;
  const x1 = x + CL / 2;
  const zf = z - CW / 2;
  const zn = z + CW / 2;
  const fy = y + 0.16;
  const cutH = 0.035;
  const nearH = 0.5;
  g.add(span(x0, y, zf, x1, fy, zn, M.steel)); // base frame
  g.add(span(x0 + 0.1, fy - 0.01, zf + t, x1 - 0.1, fy, zn - t, M.floor));
  g.add(span(x0, fy, zf, x1, fy + H, zf + t, wall)); // far side
  g.add(span(x0 - 0.005, fy + H, zf - 0.005, x1 + 0.005, fy + H + cutH, zf + t + 0.005, M.cut));
  g.add(span(x1 - t, fy, zf, x1, fy + H, zn, wall)); // front end
  g.add(span(x1 - t - 0.005, fy + H, zf - 0.005, x1 + 0.005, fy + H + cutH, zn + 0.005, M.cut));
  g.add(span(x0, fy, zn - t, x1, fy + nearH, zn, wall)); // near side, cut low
  g.add(span(x0 - 0.005, fy + nearH, zn - t - 0.005, x1 + 0.005, fy + nearH + cutH, zn + 0.005, M.cut));
  const doorH = doors ? H : nearH;
  g.add(span(x0, fy, zf, x0 + t, fy + doorH, zn, wall)); // door end
  g.add(span(x0 - 0.005, fy + doorH, zf - 0.005, x0 + t + 0.005, fy + doorH + cutH, zn + 0.005, M.cut));
  for (const [cx, cz] of [[x0, zf], [x1, zf], [x0, zn], [x1, zn]]) g.add(box(0.18, 0.16, 0.18, M.steel, cx + (cx === x0 ? 0.09 : -0.09), y + 0.08, cz + (cz === zf ? 0.09 : -0.09)));
  return new THREE.Vector3(x0 + t + (CL - 2 * t - L) / 2, fy, zf + t);
}
