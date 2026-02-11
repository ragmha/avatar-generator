import type { RGB, AvatarOptions, AvatarResult } from "./types";
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

const PALETTE = generatePalette();

export function nearestColor(r: number, g: number, b: number): RGB {
  let minDist = Infinity;
  let best: RGB = [0, 0, 0];
  for (const [pr, pg, pb] of PALETTE) {
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (dist < minDist) {
      minDist = dist;
      best = [pr, pg, pb];
    }
  }
  return best;
}

export function quantizePixels(
  buffer: Buffer,
  width: number,
  height: number
): Buffer {
  const out = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 3;
    const [r, g, b] = nearestColor(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2]
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
  const { pixelSize = 32, outputSize = 512 } = options;

  // Downscale to pixel grid
  const smallImage = await sharp(inputPath)
    .resize(pixelSize, pixelSize, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Quantize to 8-bit palette
  const quantized = quantizePixels(
    smallImage.data,
    smallImage.info.width,
    smallImage.info.height
  );

  // Scale back up with nearest-neighbor for crisp pixels
  const result = await sharp(quantized, {
    raw: {
      width: smallImage.info.width,
      height: smallImage.info.height,
      channels: 3,
    },
  })
    .resize(outputSize, outputSize, { kernel: sharp.kernel.nearest })
    .png()
    .toFile(outputPath);

  return {
    inputPath,
    outputPath,
    pixelSize,
    outputSize,
    fileSize: result.size,
  };
}
