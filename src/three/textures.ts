import * as THREE from "three";

/**
 * Textures drawn on a canvas at start, so the 3D views load no image files. Every one is generated from a fixed seed,
 * so the picture is the same on every visit.
 */

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, color = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Brown corrugated board with a strip of tape and a blank white label. No marks of any company. */
export function cardboard() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = "#B88A55";
    g.fillRect(0, 0, w, h);
    // fibres and blotches
    for (let i = 0; i < 2600; i++) {
      const light = r() > 0.5;
      g.fillStyle = light ? `rgba(255,236,200,${0.05 + r() * 0.07})` : `rgba(90,55,20,${0.04 + r() * 0.07})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 9, 1 + r() * 1.5);
    }
    for (let i = 0; i < 18; i++) {
      const grad = g.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 40 + r() * 80);
      grad.addColorStop(0, `rgba(80,50,20,${0.05 + r() * 0.05})`);
      grad.addColorStop(1, "rgba(80,50,20,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
    // the flutes, faintly
    for (let x = 0; x < w; x += 6) {
      g.fillStyle = "rgba(60,35,10,0.035)";
      g.fillRect(x, 0, 2, h);
    }
    // tape across the middle
    const ty = h * 0.42;
    const th = h * 0.16;
    const tape = g.createLinearGradient(0, ty, 0, ty + th);
    tape.addColorStop(0, "rgba(214,176,116,0.95)");
    tape.addColorStop(0.5, "rgba(232,200,146,0.95)");
    tape.addColorStop(1, "rgba(205,166,106,0.95)");
    g.fillStyle = tape;
    g.fillRect(0, ty, w, th);
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.fillRect(0, ty + th * 0.18, w, th * 0.12);
    // a blank shipping label with a barcode
    const lx = w * 0.08;
    const ly = h * 0.68;
    g.fillStyle = "#F4F1EA";
    g.fillRect(lx, ly, w * 0.3, h * 0.2);
    g.fillStyle = "#2A2A2A";
    for (let i = 0; i < 26; i++) g.fillRect(lx + 8 + i * 5.2, ly + 10, r() > 0.5 ? 2 : 3.2, h * 0.08);
    g.fillStyle = "#9A9A9A";
    g.fillRect(lx + 8, ly + h * 0.12, w * 0.2, 4);
    g.fillRect(lx + 8, ly + h * 0.15, w * 0.14, 4);
  });
}

/** Plank floor, planks running along the length. */
export function planks() {
  return canvasTexture(1024, 256, (g, w, h) => {
    const r = rng(11);
    const rows = 8;
    const ph = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 300;
      while (x < w) {
        const len = 260 + r() * 340;
        const tone = 96 + Math.floor(r() * 38);
        g.fillStyle = `rgb(${tone + 34},${tone + 6},${tone - 28})`;
        g.fillRect(x, i * ph, len, ph);
        for (let k = 0; k < 9; k++) {
          g.strokeStyle = `rgba(60,35,15,${0.08 + r() * 0.1})`;
          g.lineWidth = 1;
          g.beginPath();
          const y = i * ph + r() * ph;
          g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 6, x + len * 0.6, y + (r() - 0.5) * 6, x + len, y);
          g.stroke();
        }
        g.fillStyle = "rgba(30,18,8,0.55)";
        g.fillRect(x + len - 2, i * ph, 2, ph);
        x += len;
      }
      g.fillStyle = "rgba(30,18,8,0.6)";
      g.fillRect(0, i * ph, w, 2);
    }
  });
}

/** Heavy tarpaulin for a curtain-sided trailer: pale grey with soft vertical folds. */
export function tarp() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(3);
    g.fillStyle = "#D7DBE0";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const v = Math.sin(x / 9) * 0.5 + Math.sin(x / 23 + 1) * 0.5;
      g.fillStyle = v > 0 ? `rgba(255,255,255,${v * 0.1})` : `rgba(40,50,60,${-v * 0.1})`;
      g.fillRect(x, 0, 1, h);
    }
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = `rgba(60,70,80,${r() * 0.05})`;
      g.fillRect(r() * w, r() * h, 2, 2);
    }
  });
}

/** Ribbed steel or aluminium panel, for walls that are not fabric. */
export function ribs(base = "#C9CED5", period = 16) {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += period) {
      const grad = g.createLinearGradient(x, 0, x + period, 0);
      grad.addColorStop(0, "rgba(0,0,0,0.10)");
      grad.addColorStop(0.35, "rgba(255,255,255,0.14)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.03)");
      grad.addColorStop(1, "rgba(0,0,0,0.12)");
      g.fillStyle = grad;
      g.fillRect(x, 0, period, h);
    }
  });
}

/** A soft round light on the floor under the vehicle, like a studio. */
export function floorGlow() {
  return canvasTexture(512, 512, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "rgba(255,255,255,0.11)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.045)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

/** Track ballast: grey crushed stone. */
export function gravel() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(17);
    g.fillStyle = "#6B6B68";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) {
      const s = 2 + r() * 7;
      const v = 70 + Math.floor(r() * 110);
      g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Small ripples, used as a bump map so the water breaks up the reflections. */
export function ripples() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(23);
    g.fillStyle = "#808080";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = 20 + r() * 60;
      g.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${0.15 + r() * 0.2})` : `rgba(0,0,0,${0.15 + r() * 0.2})`;
      g.lineWidth = 1 + r() * 2.5;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + len / 2, y + (r() - 0.5) * 8, x + len, y);
      g.stroke();
    }
  }, false);
}
