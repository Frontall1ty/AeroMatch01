import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Mode } from "@/lib/constants";
import { HOLDS, type Layout } from "@/lib/holds";
import { buildCargo, disposeCargo, type CargoItem } from "./cargo";
import { makeMaterials } from "./materials";
import type { Vehicle } from "./parts";
import { buildPlane } from "./plane";
import { buildWagon } from "./rail";
import { buildShip } from "./ship";
import { buildTruck } from "./truck";

export type View = "angled" | "top";

export type ViewerOptions = {
  mode: Mode;
  layout: Layout;
  view: View;
  /** No auto-turn and no drop-in, as with reduced motion. */
  still: boolean;
  onHover: (index: number | null) => void;
  onLost: () => void;
};

export type Viewer = {
  setLayout: (layout: Layout) => void;
  setView: (view: View) => void;
  setStill: (still: boolean) => void;
  turn: (direction: 1 | -1) => void;
  dispose: () => void;
};

function buildVehicle(mode: Mode, M: ReturnType<typeof makeMaterials>, layout: Layout): Vehicle & { dispose?: () => void } {
  const b = HOLDS[mode].box;
  const hold = { L: b.lengthCm / 100, W: b.widthCm / 100, H: b.heightCm / 100 };
  switch (mode) {
    case "AIR":
      return buildPlane(M, hold);
    case "RAIL":
      return buildWagon(M, hold);
    case "SEA":
      return buildShip(M, hold, layout.units);
    default:
      return buildTruck(M, hold);
  }
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const bounce = (t: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

/**
 * A 3D view of one vehicle with its roof cut away and the cargo inside. It renders only when something changes or
 * moves, stops when it is off screen, turns slowly by itself unless `still`, and can be turned with the mouse or the
 * Turn buttons. Throws if WebGL is not available, so the caller can keep the drawing instead.
 */
export function createViewer(host: HTMLElement, opts: ViewerOptions): Viewer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "pan-y";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.85;

  const M = makeMaterials();

  const sun = new THREE.DirectionalLight(0xffffff, 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xe8eefc, 0x1a1a1e, 0.35));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.shadow);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), M.glow);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.002;
  scene.add(glow);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  controls.minPolarAngle = 0.02;
  controls.maxPolarAngle = 1.38;
  controls.autoRotateSpeed = 0.55;

  const water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), M.water);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  let vehicle: Vehicle & { dispose?: () => void } = buildVehicle(opts.mode, M, opts.layout);
  let units = opts.layout.units;
  scene.add(vehicle.group);
  function rebuild(layout: Layout) {
    vehicle.group.removeFromParent();
    vehicle.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    vehicle.dispose?.();
    vehicle = buildVehicle(opts.mode, M, layout);
    units = layout.units;
    scene.add(vehicle.group);
    frame();
  }
  let cargo: CargoItem[] = [];
  let still = opts.still;
  let touched = false;
  let radius = 10;

  /* ---------- framing ---------- */
  function frame() {
    const whole = new THREE.Box3().setFromObject(vehicle.group);
    radius = whole.getBoundingSphere(new THREE.Sphere()).radius;
    const bb = vehicle.frame ?? whole;
    const sphere = bb.getBoundingSphere(new THREE.Sphere());
    ground.visible = glow.visible = !vehicle.water;
    water.visible = Boolean(vehicle.water);
    scene.environmentIntensity = vehicle.water ? 0.75 : 0.6;
    controls.target.copy(vehicle.focus);
    const size = bb.getSize(new THREE.Vector3());
    glow.scale.set(size.x * 1.6, size.z * 6 + size.x * 0.5, 1);
    glow.position.set(sphere.center.x, 0.002, sphere.center.z);
    const s = sun.shadow.camera as THREE.OrthographicCamera;
    const half = sphere.radius * 1.15;
    s.left = -half;
    s.right = half;
    s.top = half;
    s.bottom = -half;
    s.near = 0.5;
    s.far = sphere.radius * 8;
    s.updateProjectionMatrix();
    sun.position.set(sphere.center.x - sphere.radius * 0.6, sphere.center.y + sphere.radius * 2.2, sphere.center.z + sphere.radius * 1.2);
    sun.target.position.copy(sphere.center);
    controls.minDistance = sphere.radius * 0.6;
    controls.maxDistance = radius * 3;
  }

  /**
   * Camera position for a view, from the azimuth (0 = straight at the near side) and the elevation, as close as it can
   * be with the whole vehicle in the frame (found by trying distances, so a long trailer fills the width).
   */
  function place(view: View, azimuth: number) {
    const elev = view === "top" ? THREE.MathUtils.degToRad(88) : THREE.MathUtils.degToRad(28);
    const t = controls.target;
    const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(azimuth), Math.sin(elev), Math.cos(elev) * Math.cos(azimuth));
    const bb = vehicle.frame ?? new THREE.Box3().setFromObject(vehicle.group);
    const corners: THREE.Vector3[] = [];
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) corners.push(new THREE.Vector3(x, y, z));
    const probe = camera.clone();
    const fits = (d: number) => {
      probe.position.copy(t).addScaledVector(dir, d);
      probe.lookAt(t);
      probe.updateMatrixWorld();
      probe.updateProjectionMatrix();
      return corners.every((c) => {
        const p = c.clone().project(probe);
        return Math.abs(p.x) < 0.9 && Math.abs(p.y) < 0.86 && p.z < 1;
      });
    };
    let lo = radius * 0.3;
    let hi = radius * 8;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    return t.clone().addScaledVector(dir, hi);
  }

  let view: View = opts.view;
  let tween: { from: THREE.Vector3; to: THREE.Vector3; start: number; dur: number } | null = null;
  function goTo(to: THREE.Vector3, animate: boolean) {
    if (!animate || still) {
      camera.position.copy(to);
      tween = null;
    } else {
      tween = { from: camera.position.clone(), to, start: performance.now(), dur: 750 };
    }
    kick();
  }

  /* ---------- cargo, with the boxes dropping in ---------- */
  let drops: { item: CargoItem; start: number }[] = [];
  function setCargo(layout: Layout, animateFrom: number) {
    const shown = new Set(cargo.map((c) => c.index));
    disposeCargo(cargo);
    cargo = buildCargo(M, layout, vehicle.holdOrigin);
    const now = performance.now();
    drops = [];
    let k = 0;
    for (const item of cargo) {
      vehicle.group.parent?.add(item.object);
      item.object.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      if (!still && (item.index >= animateFrom || !shown.has(item.index)) && animateFrom >= 0) {
        item.object.position.y = item.restY + 4;
        item.object.visible = false;
        drops.push({ item, start: now + Math.min(k * 45, 1400) });
        k++;
      }
    }
    hovered = null;
    kick();
  }

  /* ---------- hover ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: CargoItem | null = null;
  function setHover(item: CargoItem | null) {
    if (hovered === item) return;
    if (hovered) {
      hovered.hit.forEach((m) => m.material === M.boxHover && (m.material = M.box));
      hovered.object.position.y = hovered.restY;
    }
    hovered = item;
    if (item) {
      item.hit.forEach((m) => m.material === M.box && (m.material = M.boxHover));
      item.object.position.y = item.restY + 0.06;
    }
    opts.onHover(item ? item.index : null);
    kick();
  }
  function onMove(e: PointerEvent) {
    if (e.buttons) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(cargo.flatMap((c) => c.hit), false);
    const mesh = hits[0]?.object;
    setHover(mesh ? cargo.find((c) => c.hit.includes(mesh as THREE.Mesh)) ?? null : null);
  }
  const onLeave = () => setHover(null);
  const onStart = () => {
    touched = true;
    controls.autoRotate = false;
    tween = null;
    kick();
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  controls.addEventListener("start", onStart);
  controls.addEventListener("change", () => kick());

  /* ---------- render on demand ---------- */
  let raf = 0;
  let visible = true;
  let alive = true;
  function kick() {
    if (!raf && visible && alive) raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    raf = 0;
    let busy = false;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.dur);
      camera.position.lerpVectors(tween.from, tween.to, ease(t));
      if (t >= 1) tween = null;
      else busy = true;
    }
    if (drops.length) {
      drops = drops.filter(({ item, start }) => {
        const t = (now - start) / 650;
        if (t < 0) return true;
        item.object.visible = true;
        if (t >= 1) {
          item.object.position.y = item.restY;
          return false;
        }
        item.object.position.y = item.restY + 4 * (1 - bounce(t));
        return true;
      });
      busy = busy || drops.length > 0;
    }
    controls.autoRotate = !still && !touched && !tween;
    const moved = controls.update();
    busy = busy || moved || controls.autoRotate;
    renderer.render(scene, camera);
    if (busy) kick();
  }

  /* ---------- size and visibility ---------- */
  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    kick();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(host);
  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();
  frame();
  const startAz = view === "top" ? 0 : -0.62;
  camera.position.copy(place(view, startAz));
  controls.update();
  setCargo(opts.layout, 0);

  return {
    setLayout(layout) {
      if (opts.mode === "SEA" && layout.units !== units) rebuild(layout);
      setCargo(layout, cargo.length);
    },
    setView(v) {
      view = v;
      touched = v === "top";
      goTo(place(v, v === "top" ? 0 : -0.62), true);
    },
    setStill(s) {
      still = s;
      if (s) {
        // stop at once, without the glide that damping would add
        controls.autoRotate = false;
        controls.enableDamping = false;
        controls.update();
        controls.enableDamping = true;
        drops.forEach(({ item }) => {
          item.object.visible = true;
          item.object.position.y = item.restY;
        });
        drops = [];
      }
      kick();
    },
    turn(direction) {
      touched = true;
      const t = controls.target;
      const off = camera.position.clone().sub(t);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * (Math.PI / 4));
      goTo(t.clone().add(off), true);
    },
    dispose() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      controls.dispose();
      disposeCargo(cargo);
      vehicle.dispose?.();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
      M.dispose();
      env.dispose();
      pmrem.dispose();
      room.dispose?.();
      renderer.dispose();
      canvas.remove();
    },
  };
}
