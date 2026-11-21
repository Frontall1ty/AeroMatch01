import * as THREE from "three";
import { cardboard, floorGlow, gravel, planks, ribs, ripples, tarp } from "./textures";

/**
 * The materials of the 3D views, made once per viewer and disposed with it.
 * Physically based, lit by a studio environment: paint with a clear coat, glass, rubber, brushed and polished metal.
 */
export function makeMaterials() {
  const tex = { cardboard: cardboard(), planks: planks(), tarp: tarp(), alu: ribs("#C7CCD3", 14), oxide: ribs("#7A3D2F", 20), glow: floorGlow(), gravel: gravel(), ripples: ripples() };
  const m = {
    paintWhite: new THREE.MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 }),
    paintGrey: new THREE.MeshPhysicalMaterial({ color: 0xd4d9e0, roughness: 0.32, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    paintGraphite: new THREE.MeshPhysicalMaterial({ color: 0x2b2f36, roughness: 0.35, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.1 }),
    paintSignal: new THREE.MeshPhysicalMaterial({ color: 0xff5b1f, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b1018, roughness: 0.03, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe3e7ec, roughness: 0.12, metalness: 1 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xc4c9d0, roughness: 0.38, metalness: 0.85 }),
    aluPanel: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.alu, roughness: 0.42, metalness: 0.6 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.55, metalness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.88, metalness: 0 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xc3c8cf, roughness: 0.22, metalness: 0.9 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.62, metalness: 0.05 }),
    lampWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: 1.6, roughness: 0.1 }),
    lampRed: new THREE.MeshStandardMaterial({ color: 0x8a0f0f, emissive: 0xff2a1a, emissiveIntensity: 1.2, roughness: 0.2 }),
    lampAmber: new THREE.MeshStandardMaterial({ color: 0x8a4a00, emissive: 0xffa31a, emissiveIntensity: 1, roughness: 0.2 }),
    plate: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }),
    /** Where the roof was cut off: the cut faces are filled in the accent colour, like a section drawing. */
    cut: new THREE.MeshStandardMaterial({ color: 0xff5b1f, emissive: 0xff5b1f, emissiveIntensity: 0.25, roughness: 0.5 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.planks, roughness: 0.78, metalness: 0 }),
    tarp: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.tarp, roughness: 0.82, metalness: 0, side: THREE.DoubleSide }),
    interior: new THREE.MeshStandardMaterial({ color: 0xe6e9ee, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide }),
    box: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.cardboard, roughness: 0.86, metalness: 0 }),
    boxHover: new THREE.MeshStandardMaterial({ color: 0xffe2c8, map: tex.cardboard, roughness: 0.7, metalness: 0, emissive: 0xff5b1f, emissiveIntensity: 0.28 }),
    pallet: new THREE.MeshStandardMaterial({ color: 0xd2b48a, map: tex.planks, roughness: 0.85 }),
    shadow: new THREE.ShadowMaterial({ opacity: 0.5 }),
    wagonPaint: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.oxide, roughness: 0.62, metalness: 0.35 }),
    wagonFrame: new THREE.MeshStandardMaterial({ color: 0x6e3528, roughness: 0.6, metalness: 0.35 }),
    wheelSteel: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.4, metalness: 0.85 }),
    railHead: new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.25, metalness: 1 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x5a4a3e, roughness: 0.7, metalness: 0.6 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x9a9893, roughness: 0.9 }),
    ballast: new THREE.MeshStandardMaterial({ color: 0x8f8d88, map: tex.gravel, roughness: 0.95 }),
    hull: new THREE.MeshPhysicalMaterial({ color: 0x1d2b3a, roughness: 0.4, metalness: 0.3, clearcoat: 0.6 }),
    antifoul: new THREE.MeshStandardMaterial({ color: 0x8e2a1e, roughness: 0.6, metalness: 0.2 }),
    deck: new THREE.MeshStandardMaterial({ color: 0x5f6b5a, roughness: 0.85 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x0c2536, roughness: 0.14, metalness: 0, bumpMap: tex.ripples, bumpScale: 0.6, clearcoat: 0.3 }),
    glow: new THREE.MeshBasicMaterial({ map: tex.glow, transparent: true, depthWrite: false }),
  };
  tex.gravel.repeat.set(8, 1);
  tex.ripples.repeat.set(40, 40);
  return {
    ...m,
    dispose() {
      Object.values(m).forEach((x) => x.dispose());
      Object.values(tex).forEach((t) => t.dispose());
    },
  };
}

export type Materials = ReturnType<typeof makeMaterials>;
