import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { generateAvatar } from "./pixelator";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const TEST_DIR = path.join(import.meta.dir, "../.test-fixtures");
const TEST_INPUT = path.join(TEST_DIR, "test_input.png");
const TEST_OUTPUT = path.join(TEST_DIR, "test_output.png");

beforeAll(async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });

  // Create a 100x100 test image with known colors
  const width = 100;
  const height = 100;
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      pixels[i] = x < 50 ? 200 : 50;     // R: left=200, right=50
      pixels[i + 1] = y < 50 ? 180 : 30;  // G: top=180, bottom=30
      pixels[i + 2] = 100;                 // B: constant
    }
  }
  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toFile(TEST_INPUT);
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("generateAvatar", () => {
  test("creates output file", async () => {
    await generateAvatar(TEST_INPUT, TEST_OUTPUT, {
      pixelSize: 16,
      outputSize: 256,
    });
    expect(fs.existsSync(TEST_OUTPUT)).toBe(true);
  });

  test("output is a valid PNG with correct dimensions", async () => {
    await generateAvatar(TEST_INPUT, TEST_OUTPUT, {
      pixelSize: 16,
      outputSize: 256,
    });
    const meta = await sharp(TEST_OUTPUT).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
  });

  test("returns result with correct metadata", async () => {
    const result = await generateAvatar(TEST_INPUT, TEST_OUTPUT, {
      pixelSize: 32,
      outputSize: 512,
    });
    expect(result.inputPath).toBe(TEST_INPUT);
    expect(result.outputPath).toBe(TEST_OUTPUT);
    expect(result.pixelSize).toBe(32);
    expect(result.outputSize).toBe(512);
    expect(result.fileSize).toBeGreaterThan(0);
  });

  test("uses default options when none provided", async () => {
    const result = await generateAvatar(TEST_INPUT, TEST_OUTPUT);
    expect(result.pixelSize).toBe(32);
    expect(result.outputSize).toBe(512);
    const meta = await sharp(TEST_OUTPUT).metadata();
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  test("output pixels are quantized to palette colors", async () => {
    await generateAvatar(TEST_INPUT, TEST_OUTPUT, {
      pixelSize: 8,
      outputSize: 64,
    });
    const { data } = await sharp(TEST_OUTPUT)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const validValues = new Set([0, 85, 170, 255]);
    // Check a sample of pixels — all channels should be palette values
    for (let i = 0; i < Math.min(data.length, 300); i += 3) {
      expect(validValues.has(data[i])).toBe(true);
      expect(validValues.has(data[i + 1])).toBe(true);
      expect(validValues.has(data[i + 2])).toBe(true);
    }
  });

  test("throws on non-existent input file", async () => {
    expect(
      generateAvatar("/nonexistent/file.png", TEST_OUTPUT)
    ).rejects.toThrow();
  });
});
