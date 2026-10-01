// Single source of truth for every image and video slot on the site.
// Real files dropped into assets-src/img|video (same basename, any of .jpg/.jpeg/.png/.webp/.avif,
// .mp4/.mov/.webm) take precedence over the generated placeholders in assets-src/placeholder.

export const WIDTHS = [640, 1024, 1600, 2400, 3840];

export const IMAGES = {
  hero:              { w: 5120, h: 2880, scene: "hero",     budget: 400 },
  "hero-night":      { w: 5120, h: 2880, scene: "heroNight", budget: 400 },
  "detail-material": { w: 3840, h: 2560, scene: "material" },
  "slide-terrace":   { w: 3840, h: 2560, scene: "terrace" },
  "slide-dining":    { w: 3840, h: 2560, scene: "dining" },
  quote:             { w: 3840, h: 2160, scene: "quote" },
  "loc-lake":        { w: 3840, h: 1646, scene: "lake" },
  "loc-shore":       { w: 3072, h: 3840, scene: "shore" },
  "loc-aerial":      { w: 3840, h: 2560, scene: "aerial" },
  valley:            { w: 3840, h: 2160, scene: "valley" },
  "amen-pool":       { w: 3072, h: 3840, scene: "pool" },
  "amen-spa":        { w: 3072, h: 3840, scene: "spa" },
  "amen-library":    { w: 3072, h: 3840, scene: "library" },
  "amen-garden":     { w: 3072, h: 3840, scene: "garden" },
  "bedroom-view":    { w: 3840, h: 2560, scene: "bedroom" },
  "arch-facade":     { w: 3840, h: 2160, scene: "facade" },
  "interior-living": { w: 3840, h: 2160, scene: "living" },
};

export const OG = { name: "og", w: 1200, h: 630, scene: "hero" };

export const VIDEOS = {
  water:        { tint: ["0x17233B", "0x6F8CA0", "0xB5CEDB"] },
  "light-wall": { tint: ["0xD9CBB6", "0xF3F3EC", "0xB9A58C"] },
};

export const SRC_IMG = "assets-src/img";
export const SRC_VIDEO = "assets-src/video";
export const SRC_PLACEHOLDER = "assets-src/placeholder";
export const OUT_IMG = "public/media/img";
export const OUT_VIDEO = "public/media/video";
export const OUT_DECO = "public/media/deco";
