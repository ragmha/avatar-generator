export type RGB = [number, number, number];

export interface AvatarOptions {
  pixelSize?: number;
  outputSize?: number;
}

export interface AvatarResult {
  inputPath: string;
  outputPath: string;
  pixelSize: number;
  outputSize: number;
  fileSize: number;
}
