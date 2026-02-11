import path from "path";

const VALID_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".tiff",
  ".bmp",
]);

export function cleanPath(input: string): string {
  return input
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\ /g, " ");
}

export function validateExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return VALID_EXTENSIONS.has(ext);
}

export function resolveOutputPath(
  inputPath: string,
  customOutput?: string
): string {
  if (customOutput) return customOutput;
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  const dir = path.dirname(inputPath);
  return path.join(dir, `${base}_8bit.png`);
}
