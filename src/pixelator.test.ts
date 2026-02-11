import { describe, expect, test } from "bun:test";
import { generatePalette, nearestColor, quantizePixels } from "./pixelator";

describe("generatePalette", () => {
  test("should return exactly 64 colors", () => {
    const palette = generatePalette();
    expect(palette).toHaveLength(64);
  });

  test("each color should be an RGB tuple with values 0-255", () => {
    const palette = generatePalette();
    for (const [r, g, b] of palette) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  test("should contain black [0,0,0] and white [255,255,255]", () => {
    const palette = generatePalette();
    expect(palette).toContainEqual([0, 0, 0]);
    expect(palette).toContainEqual([255, 255, 255]);
  });

  test("should only use values from the 4-level set [0, 85, 170, 255]", () => {
    const palette = generatePalette();
    const validValues = new Set([0, 85, 170, 255]);
    for (const [r, g, b] of palette) {
      expect(validValues.has(r)).toBe(true);
      expect(validValues.has(g)).toBe(true);
      expect(validValues.has(b)).toBe(true);
    }
  });
});

describe("nearestColor", () => {
  test("exact palette color returns itself", () => {
    expect(nearestColor(0, 0, 0)).toEqual([0, 0, 0]);
    expect(nearestColor(255, 255, 255)).toEqual([255, 255, 255]);
    expect(nearestColor(85, 170, 255)).toEqual([85, 170, 255]);
  });

  test("snaps to nearest palette color", () => {
    // 40 is closer to 0 than to 85
    expect(nearestColor(40, 40, 40)).toEqual([0, 0, 0]);
    // 50 is closer to 85 than to 0
    expect(nearestColor(50, 50, 50)).toEqual([85, 85, 85]);
    // 200 is closer to 170 than to 255
    expect(nearestColor(200, 200, 200)).toEqual([170, 170, 170]);
    // 220 is closer to 255 than to 170
    expect(nearestColor(220, 220, 220)).toEqual([255, 255, 255]);
  });

  test("handles mixed channel values", () => {
    // Each channel snaps independently
    expect(nearestColor(10, 100, 240)).toEqual([0, 85, 255]);
  });

  test("returns RGB tuple type", () => {
    const result = nearestColor(128, 128, 128);
    expect(result).toHaveLength(3);
  });
});

describe("quantizePixels", () => {
  test("quantizes a single pixel to nearest palette color", () => {
    const input = Buffer.from([40, 40, 40]);
    const result = quantizePixels(input, 1, 1);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  test("quantizes multiple pixels", () => {
    const input = Buffer.from([40, 40, 40, 220, 220, 220]);
    const result = quantizePixels(input, 2, 1);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(255);
    expect(result[4]).toBe(255);
    expect(result[5]).toBe(255);
  });

  test("output buffer has same length as input", () => {
    const input = Buffer.from([10, 100, 240, 200, 50, 130]);
    const result = quantizePixels(input, 2, 1);
    expect(result.length).toBe(input.length);
  });

  test("exact palette colors pass through unchanged", () => {
    const input = Buffer.from([85, 170, 255]);
    const result = quantizePixels(input, 1, 1);
    expect(result[0]).toBe(85);
    expect(result[1]).toBe(170);
    expect(result[2]).toBe(255);
  });

  test("handles a 2x2 grid", () => {
    const input = Buffer.from([
      0, 0, 0,       255, 255, 255,
      85, 85, 85,    170, 170, 170,
    ]);
    const result = quantizePixels(input, 2, 2);
    expect(Array.from(result)).toEqual([
      0, 0, 0,       255, 255, 255,
      85, 85, 85,    170, 170, 170,
    ]);
  });
});
