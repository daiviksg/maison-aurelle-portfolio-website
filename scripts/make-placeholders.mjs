// Generates original, full-resolution placeholder "plates" for every image slot, plus
// silent placeholder texture loops. Nothing here is photography — it's drawn from scratch —
// so the site can be built, measured and shipped before real imagery arrives.
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";
import { IMAGES, OG, VIDEOS, SRC_PLACEHOLDER } from "./manifest.mjs";

const rand = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</linearGradient>`;

const radial = (id, cx, cy, r, stops) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("")}</radialGradient>`;

// Rolling ridge line across the frame
const ridge = (W, H, base, amp, seed, fill, opacity = 1) => {
  const r = rand(seed);
  const n = 14;
  let d = `M0 ${H} L0 ${base}`;
  for (let i = 0; i <= n; i++) {
    const x = (W / n) * i;
    const y = base - amp * (0.35 + r() * 0.65) * Math.sin((i / n) * Math.PI * (1 + r()));
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return `<path d="${d} L${W} ${H} Z" fill="${fill}" opacity="${opacity}"/>`;
};

function heroScene(W, H, mode) {
  const day = mode === "day";
  const hz = H * 0.72;
  const hx = W * 0.5, hw = W * 0.4, hh = H * 0.075;
  const lit = day ? "#E9E2D2" : "#F6C07A";
  const house = (flip) => {
    const s = flip ? `transform="translate(0 ${2 * hz}) scale(1 -1)" opacity="${day ? 0.25 : 0.35}"` : "";
    const wins = Array.from({ length: 11 }, (_, i) => {
      const on = day || [1, 2, 4, 5, 7, 9].includes(i);
      return `<rect x="${hx - hw / 2 + hw * 0.03 + i * hw * 0.088}" y="${hz - hh * 1.5}" width="${hw * 0.07}" height="${hh * 0.95}" fill="${on ? lit : "#3A2A34"}" opacity="${day ? 0.55 : 0.95}"/>`;
    }).join("");
    const body = day ? "#EDE6D8" : "#221620";
    const slab = day ? "#CFC4B1" : "#140C12";
    return `<g ${s}>
      <rect x="${hx - hw / 2}" y="${hz - hh * 1.9}" width="${hw}" height="${hh * 1.9}" fill="${body}"/>
      <rect x="${hx - hw * 0.6}" y="${hz - hh * 2.05}" width="${hw * 1.2}" height="${hh * 0.16}" fill="${slab}"/>
      ${wins}
      <rect x="${hx - hw * 0.6}" y="${hz - hh * 0.12}" width="${hw * 1.2}" height="${hh * 0.12}" fill="${slab}"/>
    </g>`;
  };
  const sky = day
    ? grad("sky", [[0, "#2F5F9E"], [0.55, "#6F9FCF"], [1, "#CFE1EC"]])
    : grad("sky", [[0, "#10142B"], [0.5, "#2B2346"], [0.85, "#5C3F58"], [1, "#8A5A62"]]);
  const lake = day
    ? grad("lake", [[0, "#8FB4C8"], [0.3, "#4F7F99"], [1, "#27465C"]])
    : grad("lake", [[0, "#4A3550"], [0.3, "#241C33"], [1, "#0C0B18"]]);
  const glow = day
    ? radial("sun", 0.8, 0.15, 0.4, [[0, "#FFFFFF", 0.35], [1, "#FFFFFF", 0]])
    : radial("sun", 0.2, 0.18, 0.08, [[0, "#F3F3EC", 0.9], [1, "#F3F3EC", 0]]);
  return `<defs>${sky}${lake}${glow}</defs>
    <rect width="${W}" height="${hz}" fill="url(#sky)"/>
    <rect width="${W}" height="${H}" fill="url(#sun)"/>
    ${ridge(W, hz, hz - H * 0.05, H * 0.14, 3, day ? "#7F97AE" : "#2A2238", 0.8)}
    ${ridge(W, hz, hz - H * 0.01, H * 0.07, 9, day ? "#4E6B55" : "#1A1424")}
    <rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#lake)"/>
    ${Array.from({ length: 40 }, (_, i) => {
      const r = rand(100 + i);
      const y = hz + (H - hz) * r() ** 1.6;
      return `<rect x="${W * r()}" y="${y}" width="${W * (0.05 + r() * 0.2)}" height="${2 + r() * 6}" fill="${day ? "#FFFFFF" : "#F2C39A"}" opacity="${0.06 + r() * 0.1}"/>`;
    }).join("")}
    ${house(true)}${house(false)}`;
}

const scenes = {
  hero(W, H) { return heroScene(W, H, "day"); },
  heroNight(W, H) { return heroScene(W, H, "night"); },

  lake(W, H) {
    const hz = H * 0.66;
    return `<defs>${grad("s", [[0, "#9DB3C2"], [1, "#E6ECEC"]])}${grad("w", [[0, "#C9D6DB"], [1, "#5E7B8E"]])}
      ${grad("fog", [[0, "#F3F3EC", 0], [0.6, "#F3F3EC", 0.55], [1, "#F3F3EC", 0]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#s)"/>
      ${ridge(W, hz, hz - H * 0.3, H * 0.35, 11, "#8FA8B8")}
      <rect y="${hz - H * 0.25}" width="${W}" height="${H * 0.2}" fill="url(#fog)"/>
      ${ridge(W, hz, hz - H * 0.12, H * 0.22, 21, "#6C8A9E")}
      ${ridge(W, hz, hz - H * 0.02, H * 0.1, 5, "#3F5A6C")}
      <rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#w)"/>
      <rect y="${hz - H * 0.06}" width="${W}" height="${H * 0.14}" fill="url(#fog)"/>`;
  },

  shore(W, H) {
    const hz = H * 0.46, cx = W * 0.5;
    const planks = Array.from({ length: 22 }, (_, i) => {
      const t = i / 21, y = hz + (H - hz) * t ** 1.8, half = W * (0.02 + 0.3 * t ** 1.8);
      return `<rect x="${cx - half}" y="${y}" width="${half * 2}" height="${2 + t * 16}" fill="#2E2A2A" opacity="0.55"/>`;
    }).join("");
    const reeds = Array.from({ length: 70 }, (_, i) => {
      const r = rand(400 + i), x = r() < 0.5 ? W * r() * 0.28 : W * (0.72 + r() * 0.28), h = H * (0.08 + r() * 0.2);
      return `<path d="M${x} ${H} q${W * 0.01 * (r() - 0.5)} ${-h / 2} ${W * 0.02 * (r() - 0.5)} ${-h}" stroke="#3D4A38" stroke-width="${3 + r() * 6}" fill="none" opacity="0.8"/>`;
    }).join("");
    return `<defs>${grad("s", [[0, "#D8E1E3"], [1, "#F1EFE7"]])}${grad("w", [[0, "#C7D3D6"], [1, "#6F8791"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#s)"/>
      ${ridge(W, hz, hz - H * 0.03, H * 0.05, 31, "#A9B9BF")}
      <rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#w)"/>
      <path d="M${cx - W * 0.02} ${hz} L${cx + W * 0.02} ${hz} L${cx + W * 0.34} ${H} L${cx - W * 0.34} ${H} Z" fill="#5A4B42"/>
      ${planks}${reeds}`;
  },

  aerial(W, H) {
    const r = rand(77);
    const shore = `M0 0 L${W * 0.58} 0 C${W * 0.48} ${H * 0.3} ${W * 0.7} ${H * 0.55} ${W * 0.55} ${H} L0 ${H} Z`;
    const trees = Array.from({ length: 900 }, () => {
      const x = r() * W * 0.68, y = r() * H, rr = W * (0.006 + r() * 0.012);
      const c = ["#27402C", "#34523A", "#47684A", "#5E7E55", "#2F4A36"][Math.floor(r() * 5)];
      return `<circle cx="${x}" cy="${y}" r="${rr}" fill="${c}"/>`;
    }).join("");
    return `<defs>${grad("w", [[0, "#3C6275"], [1, "#6F97A7"]], 1, 0)}<clipPath id="land"><path d="${shore}"/></clipPath></defs>
      <rect width="${W}" height="${H}" fill="url(#w)"/>
      <path d="${shore}" fill="#D7CBB2" transform="translate(${W * 0.012} 0)"/>
      <g clip-path="url(#land)"><rect width="${W}" height="${H}" fill="#2A4430"/>${trees}</g>`;
  },

  pool(W, H) {
    return `<defs>${grad("wall", [[0, "#E4DED3"], [1, "#C9C1B4"]])}${grad("water", [[0, "#8FC3CF"], [1, "#2E6E84"]])}
      ${grad("light", [[0, "#FFFFFF", 0.55], [1, "#FFFFFF", 0]], 1, 1)}</defs>
      <rect width="${W}" height="${H}" fill="url(#wall)"/>
      <rect x="${W * 0.18}" y="${H * 0.08}" width="${W * 0.64}" height="${H * 0.42}" fill="#EDEAE2"/>
      <rect x="${W * 0.22}" y="${H * 0.11}" width="${W * 0.56}" height="${H * 0.36}" fill="#AFC6CC"/>
      ${ridge(W * 0.56, H * 0.36, H * 0.3, H * 0.1, 8, "#7D9AA3").replace("<path", `<path transform="translate(${W * 0.22} ${H * 0.11})"`)}
      <path d="M${W * 0.3} ${H * 0.55} L${W * 0.7} ${H * 0.55} L${W} ${H} L0 ${H} Z" fill="url(#water)"/>
      <path d="M${W * 0.3} ${H * 0.55} L${W * 0.7} ${H * 0.55} L${W} ${H} L0 ${H} Z" fill="url(#light)"/>`;
  },

  spa(W, H) {
    const slats = Array.from({ length: 26 }, (_, i) =>
      `<rect x="${(W / 26) * i}" y="0" width="${W / 26 - W * 0.006}" height="${H}" fill="${i % 3 ? "#9C6D48" : "#8A5E3D"}"/>`).join("");
    return `<rect width="${W}" height="${H}" fill="#6B452C"/>${slats}
      <rect x="0" y="${H * 0.62}" width="${W}" height="${H * 0.06}" fill="#B98A5E"/>
      <rect x="0" y="${H * 0.68}" width="${W}" height="${H * 0.32}" fill="#4A2F1F"/>
      <rect width="${W}" height="${H}" fill="#FFD9A8" opacity="0.12"/>
      <circle cx="${W * 0.8}" cy="${H * 0.2}" r="${W * 0.35}" fill="#FFE7C4" opacity="0.18"/>`;
  },

  library(W, H) {
    const r = rand(55);
    let books = "";
    for (let row = 0; row < 7; row++) {
      const y = H * 0.06 + row * H * 0.13;
      let x = W * 0.06;
      while (x < W * 0.92) {
        const bw = W * (0.012 + r() * 0.022), bh = H * (0.08 + r() * 0.035);
        const c = ["#6E3B3B", "#2F3E52", "#8C7A5B", "#E6DCC8", "#4A5A45", "#B08A60"][Math.floor(r() * 6)];
        books += `<rect x="${x}" y="${y + H * 0.12 - bh}" width="${bw}" height="${bh}" fill="${c}"/>`;
        x += bw + W * 0.002;
      }
      books += `<rect x="${W * 0.04}" y="${y + H * 0.12}" width="${W * 0.92}" height="${H * 0.01}" fill="#3A2B22"/>`;
    }
    return `<rect width="${W}" height="${H}" fill="#5A4636"/><rect x="${W * 0.04}" y="${H * 0.04}" width="${W * 0.92}" height="${H * 0.93}" fill="#2B211B"/>${books}
      <rect width="${W}" height="${H}" fill="#FFC98A" opacity="0.08"/>`;
  },

  garden(W, H) {
    const r = rand(13);
    const clumps = Array.from({ length: 260 }, () => {
      const x = r() * W, y = H * (0.35 + r() * 0.65), rr = W * (0.02 + r() * 0.05);
      const c = ["#4E6B45", "#6F8A57", "#90A56E", "#3C5438", "#B5B98A"][Math.floor(r() * 5)];
      return `<ellipse cx="${x}" cy="${y}" rx="${rr}" ry="${rr * 0.7}" fill="${c}" opacity="0.9"/>`;
    }).join("");
    return `<defs>${grad("s", [[0, "#DCE6E4"], [1, "#F4EFE2"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#s)"/>
      ${ridge(W, H, H * 0.4, H * 0.12, 17, "#7F9A80")}
      ${clumps}
      <path d="M${W * 0.46} ${H * 0.45} L${W * 0.54} ${H * 0.45} L${W * 0.8} ${H} L${W * 0.2} ${H} Z" fill="#D9CDB4" opacity="0.9"/>`;
  },

  facade(W, H) {
    const n = 7, aw = W * 0.09, gap = W * 0.03, total = n * aw + (n - 1) * gap, x0 = (W - total) / 2;
    const arches = Array.from({ length: n }, (_, i) => {
      const x = x0 + i * (aw + gap), top = H * 0.32, bottom = H * 0.86;
      return `<path d="M${x} ${bottom} L${x} ${top + aw / 2} A${aw / 2} ${aw / 2} 0 0 1 ${x + aw} ${top + aw / 2} L${x + aw} ${bottom} Z" fill="#3B3029"/>
        <path d="M${x + aw * 0.1} ${bottom} L${x + aw * 0.1} ${top + aw / 2} A${aw * 0.4} ${aw * 0.4} 0 0 1 ${x + aw * 0.9} ${top + aw / 2} L${x + aw * 0.9} ${bottom} Z" fill="#6D5A4B" opacity="0.5"/>`;
    }).join("");
    return `<defs>${grad("st", [[0, "#E8DCC7"], [1, "#C8B79C"]])}${grad("sky", [[0, "#9FBBCB"], [1, "#DCE7EA"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect x="${W * 0.06}" y="${H * 0.2}" width="${W * 0.88}" height="${H * 0.72}" fill="url(#st)"/>
      <rect x="${W * 0.04}" y="${H * 0.17}" width="${W * 0.92}" height="${H * 0.04}" fill="#B9A688"/>
      ${arches}
      <rect x="0" y="${H * 0.9}" width="${W}" height="${H * 0.1}" fill="#A99577"/>
      <rect width="${W / 2}" height="${H}" fill="#000" opacity="0.04"/>`;
  },

  living(W, H) {
    return `<defs>${grad("sky", [[0, "#AFC7D4"], [1, "#E5EBE6"]])}${grad("fl", [[0, "#B99A76"], [1, "#7E6248"]])}</defs>
      <rect width="${W}" height="${H}" fill="#E9E2D6"/>
      <rect x="${W * 0.1}" y="${H * 0.1}" width="${W * 0.8}" height="${H * 0.58}" fill="url(#sky)"/>
      ${ridge(W * 0.8, H * 0.58, H * 0.4, H * 0.12, 6, "#7F97A5").replace("<path", `<path transform="translate(${W * 0.1} ${H * 0.1})"`)}
      <rect x="${W * 0.1}" y="${H * 0.52}" width="${W * 0.8}" height="${H * 0.16}" fill="#6F8FA0"/>
      ${[0.3, 0.5, 0.7].map((f) => `<rect x="${W * f - W * 0.003}" y="${H * 0.1}" width="${W * 0.006}" height="${H * 0.58}" fill="#2B2B2B"/>`).join("")}
      <rect x="0" y="${H * 0.68}" width="${W}" height="${H * 0.32}" fill="url(#fl)"/>
      <rect x="${W * 0.22}" y="${H * 0.63}" width="${W * 0.42}" height="${H * 0.14}" rx="${H * 0.02}" fill="#D8CFC0"/>
      <rect x="${W * 0.22}" y="${H * 0.58}" width="${W * 0.42}" height="${H * 0.07}" rx="${H * 0.02}" fill="#CBC1B0"/>
      <ellipse cx="${W * 0.74}" cy="${H * 0.8}" rx="${W * 0.08}" ry="${H * 0.03}" fill="#3C3129"/>`;
  },

  material(W, H) {
    const r = rand(91);
    const veins = Array.from({ length: 60 }, () => {
      const y = H * r(), a = H * 0.01 * (r() - 0.5);
      return `<path d="M0 ${y} C${W * 0.3} ${y + a * 30} ${W * 0.6} ${y - a * 30} ${W} ${y + a * 10}" stroke="${r() < 0.5 ? "#C4AE8C" : "#F4ECDD"}" stroke-width="${2 + r() * 14}" fill="none" opacity="${0.25 + r() * 0.4}"/>`;
    }).join("");
    return `<rect width="${W}" height="${H}" fill="#DCCBAE"/>${veins}
      <rect x="0" y="${H * 0.64}" width="${W}" height="${H * 0.012}" fill="#B08A4A"/>
      <rect x="0" y="${H * 0.652}" width="${W}" height="${H * 0.348}" fill="#7A5A3C"/>
      ${Array.from({ length: 30 }, (_, i) => `<rect x="0" y="${H * (0.66 + i * 0.011)}" width="${W}" height="${H * 0.003}" fill="#5C4129" opacity="0.4"/>`).join("")}`;
  },

  bedroom(W, H) {
    return `<defs>${grad("sky", [[0, "#C9D8DF"], [1, "#F0E9DD"]])}</defs>
      <rect width="${W}" height="${H}" fill="#EDE7DC"/>
      <rect x="${W * 0.46}" y="${H * 0.12}" width="${W * 0.46}" height="${H * 0.56}" fill="url(#sky)"/>
      ${ridge(W * 0.46, H * 0.56, H * 0.42, H * 0.1, 44, "#8EA3A0").replace("<path", `<path transform="translate(${W * 0.46} ${H * 0.12})"`)}
      <rect x="0" y="${H * 0.72}" width="${W}" height="${H * 0.28}" fill="#BFA887"/>
      <rect x="${W * 0.05}" y="${H * 0.4}" width="${W * 0.36}" height="${H * 0.24}" fill="#D5C8B4"/>
      <rect x="${W * 0.02}" y="${H * 0.58}" width="${W * 0.5}" height="${H * 0.2}" fill="#F4F0E8"/>
      <rect x="${W * 0.02}" y="${H * 0.66}" width="${W * 0.5}" height="${H * 0.12}" fill="#CDB9A0"/>`;
  },

  terrace(W, H) {
    return `<defs>${grad("sky", [[0, "#8FB4CC"], [1, "#DCE7EA"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      ${ridge(W, H * 0.62, H * 0.5, H * 0.1, 71, "#7C95A3")}
      <rect y="${H * 0.55}" width="${W}" height="${H * 0.1}" fill="#6D8C9C"/>
      <rect x="0" y="${H * 0.6}" width="${W}" height="${H * 0.4}" fill="#D9CDB8"/>
      <rect x="0" y="${H * 0.58}" width="${W}" height="${H * 0.03}" fill="#C4B69C"/>
      <rect x="${W * 0.12}" y="${H * 0.66}" width="${W * 0.3}" height="${H * 0.12}" rx="${H * 0.02}" fill="#EFEBE3"/>
      <rect x="${W * 0.55}" y="${H * 0.68}" width="${W * 0.14}" height="${H * 0.1}" rx="${H * 0.05}" fill="#8A6F55"/>
      <rect x="${W * 0.75}" y="${H * 0.64}" width="${W * 0.16}" height="${H * 0.14}" rx="${H * 0.02}" fill="#EFEBE3"/>
      <path d="M0 0 L${W * 0.3} 0 L${W * 0.16} ${H * 0.2} Z" fill="#4E6B45" opacity="0.8"/>`;
  },

  dining(W, H) {
    return `<defs>${grad("wall", [[0, "#E7DFD2"], [1, "#D2C6B3"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#wall)"/>
      <rect x="${W * 0.6}" y="${H * 0.08}" width="${W * 0.32}" height="${H * 0.5}" fill="#A9C1CD"/>
      ${ridge(W * 0.32, H * 0.5, H * 0.38, H * 0.08, 12, "#7F97A5").replace("<path", `<path transform="translate(${W * 0.6} ${H * 0.08})"`)}
      <rect x="0" y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="#9C7B5A"/>
      <rect x="${W * 0.14}" y="${H * 0.56}" width="${W * 0.62}" height="${H * 0.04}" fill="#6B4E36"/>
      <rect x="${W * 0.18}" y="${H * 0.6}" width="${W * 0.015}" height="${H * 0.2}" fill="#5A4130"/>
      <rect x="${W * 0.72}" y="${H * 0.6}" width="${W * 0.015}" height="${H * 0.2}" fill="#5A4130"/>
      ${[0.25, 0.4, 0.55].map((f) => `<ellipse cx="${W * f}" cy="${H * 0.55}" rx="${W * 0.035}" ry="${H * 0.012}" fill="#F3F3EC"/>`).join("")}
      <circle cx="${W * 0.47}" cy="${H * 0.5}" r="${H * 0.05}" fill="#C98A3A"/>`;
  },

  quote(W, H) {
    return `<defs>${grad("sky", [[0, "#7FA6C4"], [1, "#C9DCE6"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <path d="M0 ${H} L0 ${H * 0.42} L${W * 0.34} ${H * 0.3} L${W * 0.34} ${H} Z" fill="#E4D8C4"/>
      <path d="M${W * 0.34} ${H} L${W * 0.34} ${H * 0.3} L${W * 0.62} ${H * 0.46} L${W * 0.62} ${H} Z" fill="#CDBEA5"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${W * (0.05 + i * 0.045)}" y="${H * (0.55 + (i % 2) * 0.02)}" width="${W * 0.03}" height="${H * 0.16}" fill="#6E6154" opacity="0.8"/>`).join("")}
      <rect x="0" y="${H * 0.82}" width="${W}" height="${H * 0.18}" fill="#6C8E9E"/>
      <rect x="0" y="${H * 0.82}" width="${W}" height="${H * 0.01}" fill="#F3F3EC" opacity="0.6"/>`;
  },

  valley(W, H) {
    const r = rand(303);
    const villages = Array.from({ length: 120 }, () => `<rect x="${W * r()}" y="${H * (0.62 + r() * 0.3)}" width="${W * 0.006}" height="${H * 0.008}" fill="#EFE7DA" opacity="0.8"/>`).join("");
    return `<defs>${grad("sky", [[0, "#6E9EC8"], [1, "#CFE0EA"]])}</defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      ${ridge(W, H, H * 0.4, H * 0.22, 5, "#7187A0")}
      ${ridge(W, H, H * 0.52, H * 0.14, 15, "#5E7A62")}
      ${ridge(W, H, H * 0.64, H * 0.1, 25, "#6F8A5A")}
      <path d="M0 ${H * 0.95} C${W * 0.3} ${H * 0.8} ${W * 0.6} ${H * 0.98} ${W} ${H * 0.84} L${W} ${H} L0 ${H} Z" fill="#6C8E9E"/>
      ${villages}`;
  },
};

async function grain(w, h) {
  const size = 256, buf = Buffer.alloc(size * size);
  const r = rand(2024);
  for (let i = 0; i < buf.length; i++) buf[i] = 128 + (r() - 0.5) * 70;
  return sharp(buf, { raw: { width: size, height: size, channels: 1 } }).png().toBuffer();
}

async function plate(name, { w, h, scene }, out) {
  const label = `<text x="${w * 0.02}" y="${h - w * 0.02}" font-family="Arial, sans-serif" font-size="${Math.round(w * 0.011)}" letter-spacing="${w * 0.001}" font-weight="700" fill="#FFFFFF" fill-opacity="0.55">PLACEHOLDER · ${name.toUpperCase()}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${scenes[scene](w, h)}${label}</svg>`;
  await sharp(Buffer.from(svg), { limitInputPixels: false })
    .composite([{ input: await grain(w, h), tile: true, blend: "soft-light" }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(out);
  console.log("plate", path.basename(out));
}

function loop(name, tint, out) {
  // Slow drifting gradient + soft noise: reads as "texture moving", never as content.
  const [a, b, c] = tint;
  const args = [
    "-y", "-loglevel", "error",
    "-f", "lavfi", "-i", `gradients=s=1920x1080:c0=${a}:c1=${b}:c2=${c}:nb_colors=3:speed=0.012:duration=6:rate=30`,
    "-vf", "noise=alls=10:allf=t,gblur=sigma=2,format=yuv420p",
    "-t", "6", "-an", "-c:v", "libx264", "-crf", "18", out,
  ];
  const res = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (res.status !== 0) throw new Error(`ffmpeg failed for ${name}`);
  console.log("loop ", path.basename(out));
}

await fs.mkdir(SRC_PLACEHOLDER, { recursive: true });
const force = process.argv.includes("--force");
const { existsSync } = await import("node:fs");
const want = (p) => force || !existsSync(p);
for (const [name, spec] of Object.entries(IMAGES)) { const p = path.join(SRC_PLACEHOLDER, `${name}.jpg`); if (want(p)) await plate(name, spec, p); }
await plate(OG.name, OG, path.join(SRC_PLACEHOLDER, `${OG.name}.jpg`));
for (const [name, { tint }] of Object.entries(VIDEOS)) { const p = path.join(SRC_PLACEHOLDER, `${name}.mp4`); if (want(p)) loop(name, tint, p); }
