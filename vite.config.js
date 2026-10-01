import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

// <x-img name="hero" alt="…" sizes="100vw" priority class="…" pclass="…" data-foo></x-img>
// → <picture> with AVIF + WebP srcsets, explicit width/height, and the right loading hints.
// The widths and intrinsic size come from public/media/img/manifest.json (npm run assets:img).
function responsiveImages() {
  let manifestFile;
  let base = "/";
  const attrRe = /([\w:-]+)(?:="([^"]*)")?/g;

  return {
    name: "responsive-images",
    configResolved(config) {
      manifestFile = path.join(config.publicDir, "media/img/manifest.json");
      base = config.base;
    },
    transformIndexHtml(html) {
      const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
      return html.replace(/<x-img\s([^>]*)><\/x-img>/g, (_, raw) => {
        const attrs = {};
        for (const [, k, v] of raw.matchAll(attrRe)) attrs[k] = v ?? "";
        const { name, alt, sizes = "100vw", priority, pclass, ...rest } = attrs;
        const m = manifest[name];
        if (!m) throw new Error(`x-img: "${name}" missing from manifest — run npm run assets:img`);
        if (alt === undefined) throw new Error(`x-img: "${name}" needs an alt (use alt="" if decorative)`);

        const set = (fmt) => m.widths.map((w) => `${base}media/img/${name}-${w}.${fmt} ${w}w`).join(", ");
        const load = priority !== undefined
          ? `loading="eager" fetchpriority="high" decoding="async"`
          : `loading="lazy" decoding="async"`;
        const extra = Object.entries(rest).map(([k, v]) => (v === "" ? k : `${k}="${v}"`)).join(" ");
        const hidden = alt === "" ? ` aria-hidden="true"` : "";

        return `<picture${pclass ? ` class="${pclass}"` : ""}${hidden}>` +
          `<source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">` +
          `<source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">` +
          `<img src="${base}media/img/${name}-1600.webp" width="${m.width}" height="${m.height}" alt="${alt}" ${load} ${extra}>` +
          `</picture>`;
      });
    },
  };
}

// BASE_PATH lets the same build serve from a sub-path, e.g. GitHub Pages at /maison-aurelle/.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [responsiveImages()],
  server: { port: 5188, strictPort: true },
  build: { target: "es2022" },
});
