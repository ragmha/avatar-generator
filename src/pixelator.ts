import type { RGB, AvatarOptions, AvatarResult, BitStyle } from "./types";
import sharp from "sharp";

const LEVELS = [0, 85, 170, 255] as const;

export function generatePalette(): RGB[] {
  const colors: RGB[] = [];
  for (const r of LEVELS) {
    for (const g of LEVELS) {
      for (const b of LEVELS) {
        colors.push([r, g, b]);
      }
    }
  }
  return colors;
}

// All palettes keyed by style
const PALETTES: Record<BitStyle, RGB[]> = {
  "1bit": [[0, 0, 0], [255, 255, 255]],
  "2bit": [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
  "4bit": [
    [0,0,0],[0,0,170],[0,170,0],[0,170,170],
    [170,0,0],[170,0,170],[170,85,0],[170,170,170],
    [85,85,85],[85,85,255],[85,255,85],[85,255,255],
    [255,85,85],[255,85,255],[255,255,85],[255,255,255],
  ],
  "8bit": generatePalette(),
  "16bit": (() => {
    const c: RGB[] = [];
    for (const r of [0, 51, 102, 153, 204, 255])
      for (const g of [0, 51, 102, 153, 204, 255])
        for (const b of [0, 51, 102, 153, 204, 255])
          c.push([r, g, b] as RGB);
    return c;
  })(),
  // Warm vintage CRT palette
  "retro": [
    [44,33,24],[67,52,38],[95,75,56],[120,97,72],[150,120,90],[180,148,108],
    [210,178,130],[235,210,160],[250,235,200],[255,248,230],
    [80,45,30],[110,60,35],[140,80,40],[170,100,50],[200,130,65],
    [60,50,40],[90,80,60],[130,115,85],[170,155,120],[210,195,160],
    [50,35,35],[80,50,45],[110,70,55],[145,90,65],[180,115,80],
    [40,40,50],[65,65,80],[90,90,110],[120,115,140],[155,150,175],
    [55,70,55],[80,100,75],[110,135,100],[145,170,130],[180,200,165],
    [70,55,70],[100,80,95],[135,110,125],[170,145,160],[200,180,190],
  ],
  // Flat muted pastels for clean minimal look
  "notion": [
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
};

export function getPalette(style: BitStyle): RGB[] {
  return PALETTES[style];
}

export function nearestColor(r: number, g: number, b: number, palette?: RGB[]): RGB {
  const pal = palette ?? PALETTES["8bit"];
  let minDist = Infinity;
  let best: RGB = [0, 0, 0];
  for (const [pr, pg, pb] of pal) {
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < minDist) {
      minDist = dist;
      best = [pr, pg, pb];
    }
  }
  return best;
}

function quantizePixelForStyle(r: number, g: number, b: number, style: BitStyle): RGB {
  const palette = PALETTES[style];
  if (style === "1bit") {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    return gray > 128 ? [255, 255, 255] : [0, 0, 0];
  }
  if (style === "2bit") {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const idx = Math.min(3, Math.floor(gray / 64));
    return palette[idx];
  }
  return nearestColor(r, g, b, palette);
}

export function quantizePixels(
  buffer: Buffer,
  width: number,
  height: number,
  style: BitStyle = "8bit"
): Buffer {
  const out = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 3;
    const [r, g, b] = quantizePixelForStyle(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      style
    );
    out[offset] = r;
    out[offset + 1] = g;
    out[offset + 2] = b;
  }
  return out;
}

export async function generateAvatar(
  inputPath: string,
  outputPath: string,
  options: AvatarOptions = {}
): Promise<AvatarResult> {
  const { pixelSize = 32, outputSize = 512, style = "8bit" } = options;

  // Downscale to pixel grid
  const smallImage = await sharp(inputPath)
    .resize(pixelSize, pixelSize, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Quantize to selected palette
  const quantized = quantizePixels(
    smallImage.data,
    smallImage.info.width,
    smallImage.info.height,
    style
  );

  // Scale back up — notion uses smooth bilinear, others use nearest-neighbor
  const kernel = style === "notion" ? sharp.kernel.lanczos3 : sharp.kernel.nearest;
  const result = await sharp(quantized, {
    raw: {
      width: smallImage.info.width,
      height: smallImage.info.height,
      channels: 3,
    },
  })
    .resize(outputSize, outputSize, { kernel })
    .png()
    .toFile(outputPath);

  return {
    inputPath,
    outputPath,
    pixelSize,
    outputSize,
    style,
    fileSize: result.size,
  };
}
