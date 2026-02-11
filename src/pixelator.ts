import type { RGB } from "./types";

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
