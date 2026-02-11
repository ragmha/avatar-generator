export type RGB = [number, number, number];

export type BitStyle = "1bit" | "2bit" | "4bit" | "8bit" | "16bit" | "retro" | "notion";

export interface AvatarOptions {
  pixelSize?: number;
  outputSize?: number;
  style?: BitStyle;
}

export interface AvatarResult {
  inputPath: string;
  outputPath: string;
  pixelSize: number;
  outputSize: number;
  style: BitStyle;
  fileSize: number;
}
