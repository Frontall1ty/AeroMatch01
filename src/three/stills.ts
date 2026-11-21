import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HOLDS } from "@/lib/holds";
import type { LoadKind } from "@/lib/load";
import { makeMaterials } from "./materials";
import { buildPlane } from "./plane";
import { buildContainerFlat, buildWagon } from "./rail";
import { buildShip } from "./ship";
import { buildTruck } from "./truck";

/**
 * Side views of the 3D vehicles for the load view (compare rows, the booking drawer, the home page), rendered once by
 * scripts/render-stills.mjs and saved as images, because a page of offers cannot hold a live 3D view per row.
 * Each still comes with the rectangle of the cargo space's back wall, in pixels, where the positions are drawn.
 */
export function renderStill(kind: LoadKind, width: number) {
  const M = makeMaterials();
  const hold = (m: keyof typeof HOLDS) => ({ L: HOLDS[m].box.lengthCm / 100, W: HOLDS[m].box.widthCm / 100, H: HOLDS[m].box.heightCm / 100 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa3402f, roughness: 0.55, metalness: 0.35, map: M.wagonPaint.map });
  let group: THREE.Group;
  let a: THREE.Vector3;
  let b: THREE.Vector3;
  if (kind === "ship") {
    const s = buildShip(M, hold("SEA"), 0, { open: false, tiers: 5 });
    group = s.group;
    a = s.stacks.min.clone();
    b = s.stacks.max.clone();
  } else {
    const h = kind === "plane" ? hold("AIR") : kind === "truck" ? hold("ROAD") : kind === "wagon" ? hold("RAIL") : hold("SEA");
    const v = kind === "plane" ? buildPlane(M, h) : kind === "truck" ? buildTruck(M, h) : kind === "wagon" ? buildWagon(M, h, 1.2) : buildContainerFlat(M, h, red, 1.2);
    group = v.group;
    a = v.holdOrigin.clone();
    b = v.holdOrigin.clone().add(new THREE.Vector3(h.L, h.H, 0));
  }

  const scene = new THREE.Scene();
  scene.add(group);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;

  const bb = new THREE.Box3().setFromObject(group);
  // the plane's wings and the ship's length would leave the cargo space small: frame the body only
  if (kind === "plane") {
    bb.min.set(-16.5, 0, -4);
    bb.max.set(HOLDS.AIR.box.lengthCm / 100 + 8.6, 15.5, 4);
  }
  const centre = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3());
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(centre.x - size.x * 0.3, centre.y + size.x * 0.8, centre.z + size.x * 0.6);
  sun.target.position.copy(centre);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  const half = size.length() * 0.6;
  Object.assign(sc, { left: -half, right: half, top: half, bottom: -half, near: 0.5, far: size.length() * 4 });
  sc.updateProjectionMatrix();
  scene.add(sun, sun.target, new THREE.HemisphereLight(0xe8eefc, 0x1a1a1e, 0.35));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // from the near side, a little above, looking straight across: lines along the vehicle stay level
  const elev = THREE.MathUtils.degToRad(kind === "ship" ? 4 : 9);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  cam.position.copy(centre).add(new THREE.Vector3(0, Math.sin(elev), Math.cos(elev)).multiplyScalar(size.length() * 2));
  cam.lookAt(centre);
  cam.updateMatrixWorld();
  const corners: THREE.Vector3[] = [];
  for (const x of [bb.min.x, bb.max.x]) for (const y of [Math.max(0, bb.min.y), bb.max.y]) for (const z of [bb.min.z, bb.max.z]) corners.push(new THREE.Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse));
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const pad = 0.02 * (Math.max(...xs) - Math.min(...xs));
  cam.left = Math.min(...xs) - pad;
  cam.right = Math.max(...xs) + pad;
  cam.top = Math.max(...ys) + pad;
  cam.bottom = Math.min(...ys) - pad * 1.5;
  cam.updateProjectionMatrix();
  const height = Math.round((width * (cam.top - cam.bottom)) / (cam.right - cam.left));
  renderer.setSize(width, height, false);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL("image/png");

  const px = (p: THREE.Vector3) => {
    const v = p.clone().project(cam);
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
  };
  const p0 = px(a);
  const p1 = px(b);
  const area = { x: Math.round(Math.min(p0.x, p1.x)), y: Math.round(Math.min(p0.y, p1.y)), w: Math.round(Math.abs(p1.x - p0.x)), h: Math.round(Math.abs(p1.y - p0.y)) };
  renderer.dispose();
  M.dispose();
  return { url, w: width, h: height, area };
}
