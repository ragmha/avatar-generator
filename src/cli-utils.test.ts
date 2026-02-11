import { describe, expect, test } from "bun:test";
import { cleanPath, validateExtension, resolveOutputPath } from "./cli-utils";

describe("cleanPath", () => {
  test("strips surrounding single quotes", () => {
    expect(cleanPath("'/path/to/file.png'")).toBe("/path/to/file.png");
  });

  test("strips surrounding double quotes", () => {
    expect(cleanPath('"/path/to/file.png"')).toBe("/path/to/file.png");
  });

  test("trims whitespace", () => {
    expect(cleanPath("  /path/to/file.png  ")).toBe("/path/to/file.png");
  });

  test("handles combination of quotes and whitespace", () => {
    expect(cleanPath("  '/path/to/file.png'  ")).toBe("/path/to/file.png");
  });

  test("returns path unchanged if no quotes", () => {
    expect(cleanPath("/path/to/file.png")).toBe("/path/to/file.png");
  });

  test("handles escaped spaces from drag and drop", () => {
    expect(cleanPath("/path/to/my\\ file.png")).toBe("/path/to/my file.png");
  });
});

describe("validateExtension", () => {
  test("accepts .png", () => {
    expect(validateExtension("photo.png")).toBe(true);
  });

  test("accepts .jpg", () => {
    expect(validateExtension("photo.jpg")).toBe(true);
  });

  test("accepts .jpeg", () => {
    expect(validateExtension("photo.jpeg")).toBe(true);
  });

  test("accepts .webp", () => {
    expect(validateExtension("photo.webp")).toBe(true);
  });

  test("rejects .txt", () => {
    expect(validateExtension("file.txt")).toBe(false);
  });

  test("rejects .pdf", () => {
    expect(validateExtension("doc.pdf")).toBe(false);
  });

  test("is case insensitive", () => {
    expect(validateExtension("photo.PNG")).toBe(true);
    expect(validateExtension("photo.JPG")).toBe(true);
  });
});

describe("resolveOutputPath", () => {
  test("appends _8bit.png to input filename", () => {
    expect(resolveOutputPath("/photos/me.jpg")).toBe("/photos/me_8bit.png");
  });

  test("replaces any extension with _8bit.png", () => {
    expect(resolveOutputPath("/photos/me.webp")).toBe("/photos/me_8bit.png");
  });

  test("uses custom output path when provided", () => {
    expect(resolveOutputPath("/photos/me.jpg", "/out/avatar.png")).toBe(
      "/out/avatar.png"
    );
  });
});
