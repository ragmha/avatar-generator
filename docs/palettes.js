// Color palettes for each retro style
const PALETTES = {
  // 1-Bit: Pure black & white
  "1bit": {
    name: "1-Bit",
    label: "Monochrome",
    colors: [[0, 0, 0], [255, 255, 255]],
  },

  // 2-Bit: Original Game Boy (4 shades of green)
  "2bit": {
    name: "2-Bit",
    label: "Game Boy",
    colors: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15],
    ],
  },

  // 4-Bit: CGA-inspired 16-color palette
  "4bit": {
    name: "4-Bit",
    label: "CGA",
    colors: [
      [0, 0, 0],       [0, 0, 170],     [0, 170, 0],     [0, 170, 170],
      [170, 0, 0],     [170, 0, 170],   [170, 85, 0],    [170, 170, 170],
      [85, 85, 85],    [85, 85, 255],   [85, 255, 85],   [85, 255, 255],
      [255, 85, 85],   [255, 85, 255],  [255, 255, 85],  [255, 255, 255],
    ],
  },

  // 8-Bit: NES-style 64-color palette (4 levels per channel)
  "8bit": {
    name: "8-Bit",
    label: "NES",
    colors: (() => {
      const c = [];
      for (const r of [0, 85, 170, 255])
        for (const g of [0, 85, 170, 255])
          for (const b of [0, 85, 170, 255]) c.push([r, g, b]);
      return c;
    })(),
  },

  // 16-Bit: SNES-style 256-color palette (wider range)
  "16bit": {
    name: "16-Bit",
    label: "SNES",
    colors: (() => {
      const c = [];
      for (const r of [0, 51, 102, 153, 204, 255])
        for (const g of [0, 51, 102, 153, 204, 255])
          for (const b of [0, 51, 102, 153, 204, 255]) c.push([r, g, b]);
      return c;
    })(),
  },

  // Retro: Warm vintage CRT palette
  "retro": {
    name: "Retro",
    label: "Vintage CRT",
    colors: [
      [44,33,24],[67,52,38],[95,75,56],[120,97,72],[150,120,90],[180,148,108],
      [210,178,130],[235,210,160],[250,235,200],[255,248,230],
      [80,45,30],[110,60,35],[140,80,40],[170,100,50],[200,130,65],
      [60,50,40],[90,80,60],[130,115,85],[170,155,120],[210,195,160],
      [50,35,35],[80,50,45],[110,70,55],[145,90,65],[180,115,80],
      [40,40,50],[65,65,80],[90,90,110],[120,115,140],[155,150,175],
      [55,70,55],[80,100,75],[110,135,100],[145,170,130],[180,200,165],
      [70,55,70],[100,80,95],[135,110,125],[170,145,160],[200,180,190],
    ],
  },

  // Notion: Flat muted pastels for clean minimal illustration look
  "notion": {
    name: "Notion",
    label: "Minimal Flat",
    smooth: true, // renders with smooth upscale instead of pixelated
    colors: [
      [255,255,255],[250,250,248],[240,240,237],[227,226,224],[211,209,203],
      [159,164,169],[145,145,142],[120,119,116],[93,93,90],[55,53,47],
      [227,226,224],[235,236,233],[241,241,239],
      [253,236,200],[250,222,166],[245,200,120],
      [255,226,221],[245,195,185],[235,160,150],
      [253,222,238],[245,190,220],[235,155,200],
      [232,222,250],[210,195,240],[185,165,225],
      [211,229,239],[175,210,230],[140,190,220],
      [219,237,219],[185,220,185],[150,200,150],
      [255,243,221],[245,225,185],[230,200,150],
      [245,235,255],[230,220,245],[215,200,235],
    ],
  },
};

function nearestPaletteColor(r, g, b, palette) {
  let minDist = Infinity;
  let best = [0, 0, 0];
  for (const [pr, pg, pb] of palette) {
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < minDist) {
      minDist = dist;
      best = [pr, pg, pb];
    }
  }
  return best;
}

// For 1-bit: convert to grayscale first, then threshold
function toBit1(r, g, b) {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return gray > 128 ? [255, 255, 255] : [0, 0, 0];
}

// For 2-bit Game Boy: convert to luminance, map to 4 shades
function toBit2(r, g, b, palette) {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const idx = Math.min(3, Math.floor(gray / 64));
  return palette[idx];
}

function quantizePixel(r, g, b, style, palette) {
  if (style === "1bit") return toBit1(r, g, b);
  if (style === "2bit") return toBit2(r, g, b, palette);
  return nearestPaletteColor(r, g, b, palette);
}
