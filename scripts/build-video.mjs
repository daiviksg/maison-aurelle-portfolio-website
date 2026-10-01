// Source loop (real clip in assets-src/video, else placeholder) → 5s silent 1920px
// H.264 MP4 + VP9 WebM + WebP poster. Pass `--start=SECONDS` to pick where the loop is cut.
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";
import { VIDEOS, SRC_VIDEO, SRC_PLACEHOLDER, OUT_VIDEO } from "./manifest.mjs";

const EXTS = [".mp4", ".mov", ".webm", ".m4v"];
const LEN = 5;
const startArg = process.argv.find((a) => a.startsWith("--start="));
const start = startArg ? startArg.split("=")[1] : "0";

const run = (args) => {
  const r = spawnSync(ffmpeg, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "));
};

function source(name) {
  for (const dir of [SRC_VIDEO, SRC_PLACEHOLDER])
    for (const ext of EXTS) {
      const p = path.join(dir, name + ext);
      if (existsSync(p)) return p;
    }
  throw new Error(`No source for video "${name}"`);
}

await fs.mkdir(OUT_VIDEO, { recursive: true });

for (const name of Object.keys(VIDEOS)) {
  const src = source(name);
  const base = path.join(OUT_VIDEO, name);
  const vf = "scale=1920:-2:flags=lanczos,fps=30,format=yuv420p";
  const cut = ["-ss", start, "-i", src, "-t", String(LEN), "-an", "-vf", vf];

  run([...cut, "-c:v", "libx264", "-profile:v", "high", "-crf", "23", "-preset", "slow", "-movflags", "+faststart", `${base}.mp4`]);
  run([...cut, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-deadline", "good", `${base}.webm`]);
  run(["-ss", start, "-i", src, "-frames:v", "1", "-vf", "scale=1920:-2", `${base}-poster.png`]);
  await sharp(`${base}-poster.png`).webp({ quality: 72 }).toFile(`${base}-poster.webp`);
  await fs.rm(`${base}-poster.png`);

  const sizes = await Promise.all([".mp4", ".webm"].map(async (e) => ((await fs.stat(base + e)).size / 1024).toFixed(0) + "KB"));
  console.log(`✓ ${name}  mp4 ${sizes[0]}  webm ${sizes[1]}  ${src.includes("placeholder") ? "(placeholder)" : ""}`);
}
