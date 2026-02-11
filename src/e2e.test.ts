import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { $ } from "bun";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const TEST_DIR = path.join(import.meta.dir, "../.test-e2e");
const TEST_INPUT = path.join(TEST_DIR, "portrait.png");
const TEST_OUTPUT = path.join(TEST_DIR, "portrait_8bit.png");
const CUSTOM_OUTPUT = path.join(TEST_DIR, "custom_avatar.png");

beforeAll(async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });

  // Create a realistic-ish 200x200 test "portrait"
  const width = 200;
  const height = 200;
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const cx = x - 100;
      const cy = y - 100;
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist < 70) {
        pixels[i] = 230;
        pixels[i + 1] = 190;
        pixels[i + 2] = 160;
      } else {
        pixels[i] = 70;
        pixels[i + 1] = 130;
        pixels[i + 2] = 200;
      }
    }
  }
  await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toFile(TEST_INPUT);
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("E2E: CLI avatar generation", () => {
  test("generates avatar via CLI with default options", async () => {
    const result =
      await $`bun run src/index.ts ${TEST_INPUT}`.text();

    expect(result).toContain("Avatar generated successfully");
    expect(fs.existsSync(TEST_OUTPUT)).toBe(true);

    const meta = await sharp(TEST_OUTPUT).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  test("generates avatar with custom pixel size and output", async () => {
    const result =
      await $`bun run src/index.ts ${TEST_INPUT} -o ${CUSTOM_OUTPUT} -p 16 -s 256`.text();

    expect(result).toContain("Avatar generated successfully");
    expect(fs.existsSync(CUSTOM_OUTPUT)).toBe(true);

    const meta = await sharp(CUSTOM_OUTPUT).metadata();
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
  });

  test("output pixels are valid 8-bit palette colors", async () => {
    const outputFile = path.join(TEST_DIR, "palette_check_8bit.png");
    await $`bun run src/index.ts ${TEST_INPUT} -o ${outputFile} -p 8 -s 64`.text();

    const { data } = await sharp(outputFile)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const validValues = new Set([0, 85, 170, 255]);
    for (let i = 0; i < data.length; i++) {
      expect(validValues.has(data[i])).toBe(true);
    }
  });

  test("shows error for non-existent file", async () => {
    try {
      await $`bun run src/index.ts /nonexistent/photo.png`.text();
      expect(true).toBe(false); // should not reach
    } catch (err: any) {
      expect(err.stderr.toString()).toContain("File not found");
    }
  });

  test("shows error for unsupported format", async () => {
    const txtFile = path.join(TEST_DIR, "fake.txt");
    fs.writeFileSync(txtFile, "not an image");
    try {
      await $`bun run src/index.ts ${txtFile}`.text();
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.stderr.toString()).toContain("Unsupported format");
    }
  });
});
