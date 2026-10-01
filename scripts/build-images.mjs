// Source (real photo in assets-src/img, else placeholder) → AVIF + WebP at 640/1024/1600/2400/3840.
// Hero-class images are stepped down in quality until the 1600px AVIF is under budget.
// Writes public/media/img/manifest.json, which the Vite <x-img> transform reads.
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { IMAGES, OG, WIDTHS, SRC_IMG, SRC_PLACEHOLDER, OUT_IMG } from "./manifest.mjs";

const EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"];
const only = process.argv.slice(2);

function source(name) {
  for (const dir of [SRC_IMG, SRC_PLACEHOLDER])
    for (const ext of EXTS) {
      const p = path.join(dir, name + ext);
      if (existsSync(p)) return { file: p, real: dir === SRC_IMG };
    }
  throw new Error(`No source for "${name}" — run npm run placeholders or add assets-src/img/${name}.jpg`);
}

async function encode(img, width, fmt, quality) {
  const pipeline = img.clone().resize({ width, withoutEnlargement: false });
  return fmt === "avif"
    ? pipeline.avif({ quality, effort: 5, chromaSubsampling: "4:2:0" }).toBuffer()
    : pipeline.webp({ quality, effort: 5, smartSubsample: true }).toBuffer();
}

await fs.mkdir(OUT_IMG, { recursive: true });
const manifestPath = path.join(OUT_IMG, "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(await fs.readFile(manifestPath, "utf8")) : {};

for (const [name, spec] of Object.entries(IMAGES)) {
  if (only.length && !only.includes(name)) continue;
  const { file, real } = source(name);
  const img = sharp(file, { limitInputPixels: false }).rotate();
  const meta = await img.metadata();
  const w = meta.autoOrient?.width ?? meta.width, h = meta.autoOrient?.height ?? meta.height;
  if (real && w < 3840) console.warn(`  ! ${name}: source is ${w}px wide — 2400/3840 will be upscaled`);

  let q = { avif: 55, webp: 78 };
  if (spec.budget) {
    // Step quality down until the 1600px AVIF fits the hero budget (KB).
    for (;;) {
      const kb = (await encode(img, 1600, "avif", q.avif)).length / 1024;
      if (kb <= spec.budget || q.avif <= 30) { console.log(`  ${name}@1600 avif q${q.avif} = ${kb.toFixed(0)} KB`); break; }
      q = { avif: q.avif - 5, webp: q.webp - 6 };
    }
  }

  for (const width of WIDTHS)
    for (const fmt of ["avif", "webp"])
      await fs.writeFile(path.join(OUT_IMG, `${name}-${width}.${fmt}`), await encode(img, width, fmt, q[fmt]));

  manifest[name] = { width: w, height: h, widths: WIDTHS, placeholder: !real };
  console.log(`✓ ${name} ${w}×${h}${real ? "" : " (placeholder)"}`);
}

if (!only.length || only.includes(OG.name)) {
  const { file } = source(OG.name);
  await sharp(file).resize(OG.w, OG.h, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT_IMG, "og.jpg"));
}

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log("manifest →", manifestPath);
