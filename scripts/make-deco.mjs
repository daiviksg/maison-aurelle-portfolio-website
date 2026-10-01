// Original decorative assets (not placeholders — these ship): soft cloud banks with alpha
// for the valley reveal, and olive sprigs for the botanical corners.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { OUT_DECO } from "./manifest.mjs";

const rand = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

await fs.mkdir(OUT_DECO, { recursive: true });

// ── Clouds ────────────────────────────────────────────────────────────────────
async function cloud(name, seed, W = 2400, H = 1500) {
  const r = rand(seed);
  const puffs = [], shade = [];
  // Cumulus clusters: wide flat bases, rounded heads that shrink as they rise.
  const clusters = 6;
  for (let c = 0; c < clusters; c++) {
    const cx = W * ((c + 0.5) / clusters) + (r() - 0.5) * W * 0.08;
    const base = H * (0.78 + (r() - 0.5) * 0.12);
    const size = W * (0.07 + r() * 0.06);
    for (let i = 0; i < 16; i++) {
      const lift = r();
      const x = cx + (r() - 0.5) * size * (2.6 - lift * 1.6);
      const y = base - lift * size * 1.7;
      const rad = size * (0.55 - lift * 0.3) * (0.7 + r() * 0.5);
      puffs.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(0)}"/>`);
      if (lift < 0.45) shade.push(`<circle cx="${x.toFixed(0)}" cy="${(y + rad * 0.45).toFixed(0)}" r="${(rad * 0.9).toFixed(0)}"/>`);
    }
    puffs.push(`<ellipse cx="${cx.toFixed(0)}" cy="${base.toFixed(0)}" rx="${(size * 1.6).toFixed(0)}" ry="${(size * 0.35).toFixed(0)}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${W * 0.006}"/></filter>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${W * 0.012}"/></filter>
      <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.12" stop-color="#fff"/><stop offset="0.88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    </defs>
    <g mask="url(#m)">
      <g filter="url(#b)" fill="#FFFFFF">${puffs.join("")}</g>
      <g filter="url(#s)" fill="#AFC3D0" opacity="0.5">${shade.join("")}</g>
    </g>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 80, alphaQuality: 80 }).toFile(path.join(OUT_DECO, `${name}.webp`));
  console.log("deco", name);
}
await cloud("cloud-a", 11);
await cloud("cloud-b", 29);

// ── Olive sprigs ──────────────────────────────────────────────────────────────
function sprig(seed, { leaves = 26, blossoms = 5 } = {}) {
  const r = rand(seed);
  const W = 600, H = 800;
  // Stem: cubic from top-left corner bending down/right.
  const p0 = [20, 20], p1 = [220, 120], p2 = [300, 420], p3 = [520, 760];
  const at = (t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u ** 3 * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t ** 3 * p3[k]);
  };
  const tan = (t) => { const a = at(t), b = at(Math.min(1, t + 0.01)); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const greens = ["#5E6E45", "#72835A", "#8C9A6C", "#4C5A38"];
  let leafPaths = "";
  for (let i = 0; i < leaves; i++) {
    const t = 0.04 + (i / leaves) * 0.92;
    const [x, y] = at(t);
    const side = i % 2 ? 1 : -1;
    const ang = (tan(t) * 180) / Math.PI + side * (35 + r() * 25);
    const len = 70 + r() * 60 - t * 25, wid = 12 + r() * 6;
    leafPaths += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})" d="M0 0 C${len * 0.3} ${-wid} ${len * 0.75} ${-wid} ${len} 0 C${len * 0.75} ${wid} ${len * 0.3} ${wid} 0 0Z" fill="${greens[Math.floor(r() * greens.length)]}"/>`;
  }
  let flowers = "";
  for (let i = 0; i < blossoms; i++) {
    const t = 0.2 + r() * 0.75;
    const [x, y] = at(t);
    const ox = (r() - 0.5) * 90, oy = (r() - 0.5) * 90;
    const pr = 9 + r() * 5;
    const petals = Array.from({ length: 5 }, (_, k) => {
      const a = (k / 5) * Math.PI * 2 + r();
      return `<ellipse cx="${(x + ox + Math.cos(a) * pr).toFixed(1)}" cy="${(y + oy + Math.sin(a) * pr).toFixed(1)}" rx="${pr * 0.85}" ry="${pr * 0.6}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(x + ox + Math.cos(a) * pr).toFixed(1)} ${(y + oy + Math.sin(a) * pr).toFixed(1)})" fill="#F8BBCB"/>`;
    }).join("");
    flowers += `${petals}<circle cx="${(x + ox).toFixed(1)}" cy="${(y + oy).toFixed(1)}" r="${(pr * 0.35).toFixed(1)}" fill="#340C24" opacity="0.55"/>`;
  }
  const stem = `<path d="M${p0} C${p1} ${p2} ${p3}" fill="none" stroke="#4C5A38" stroke-width="4" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${stem}${leafPaths}${flowers}</svg>`;
}
await fs.writeFile(path.join(OUT_DECO, "sprig-a.svg"), sprig(5));
await fs.writeFile(path.join(OUT_DECO, "sprig-b.svg"), sprig(17, { leaves: 30, blossoms: 7 }));
console.log("deco sprigs");
