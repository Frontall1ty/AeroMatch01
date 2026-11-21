import type { Mode } from "@/lib/constants";

/** Which vehicles have a 3D model so far. The others keep the drawing. Kept apart from the viewer so this list does not pull three.js into the page. */
export const MODELS_3D: Mode[] = ["AIR", "SEA", "RAIL", "ROAD"];

/** Whether this browser can draw WebGL at all. */
export function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
