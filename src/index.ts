#!/usr/bin/env bun

import { program } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";
import { generateAvatar } from "./pixelator";
import { cleanPath, validateExtension, resolveOutputPath } from "./cli-utils";

const BANNER = `
${chalk.cyan("╔═══════════════════════════════════════╗")}
${chalk.cyan("║")}  ${chalk.bold.magenta("🎮  8-Bit Avatar Generator  🎮")}       ${chalk.cyan("║")}
${chalk.cyan("║")}  ${chalk.gray("Drop your photo, get pixel art!")}      ${chalk.cyan("║")}
${chalk.cyan("╚═══════════════════════════════════════╝")}
`;

interface CLIOptions {
  output?: string;
  pixels: string;
  size: string;
}

program
  .name("avatar")
  .description("Generate 8-bit pixel art avatars from photos")
  .version("1.0.0")
  .argument("[input]", "Path to input image (drag & drop supported)")
  .option("-o, --output <path>", "Output file path")
  .option("-p, --pixels <number>", "Pixel grid size (lower = more pixelated)", "32")
  .option("-s, --size <number>", "Output image size in pixels", "512")
  .action(async (input: string | undefined, opts: CLIOptions) => {
    console.log(BANNER);

    let inputPath = input;

    // Interactive mode: prompt for file if not provided (supports drag & drop)
    if (!inputPath) {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "filePath",
          message: chalk.yellow("📁 Drag & drop your image here (or type the path):"),
          validate: (val: string) => {
            const cleaned = cleanPath(val);
            if (!cleaned) return "Please provide a file path";
            if (!fs.existsSync(cleaned)) return `File not found: ${cleaned}`;
            if (!validateExtension(cleaned))
              return `Unsupported format. Use: jpg, jpeg, png, webp, gif, tiff, bmp`;
            return true;
          },
          filter: (val: string) => cleanPath(val),
        },
      ]);
      inputPath = answers.filePath;
    } else {
      inputPath = cleanPath(inputPath);
    }

    // Validate input file
    if (!fs.existsSync(inputPath!)) {
      console.error(chalk.red(`\n❌ File not found: ${inputPath}`));
      process.exit(1);
    }

    if (!validateExtension(inputPath!)) {
      console.error(
        chalk.red(
          `\n❌ Unsupported format. Use: jpg, jpeg, png, webp, gif, tiff, bmp`
        )
      );
      process.exit(1);
    }

    const outputPath = resolveOutputPath(inputPath!, opts.output);
    const pixelSize = parseInt(opts.pixels, 10);
    const outputSize = parseInt(opts.size, 10);

    if (!pixelSize || pixelSize < 8 || pixelSize > 128) {
      console.error(chalk.red("\n❌ Pixel size must be between 8 and 128"));
      process.exit(1);
    }

    if (!outputSize || outputSize < 32 || outputSize > 2048) {
      console.error(chalk.red("\n❌ Output size must be between 32 and 2048"));
      process.exit(1);
    }

    console.log(chalk.gray(`  Input:      ${inputPath}`));
    console.log(chalk.gray(`  Output:     ${outputPath}`));
    console.log(chalk.gray(`  Grid:       ${pixelSize}x${pixelSize}`));
    console.log(chalk.gray(`  Size:       ${outputSize}x${outputSize}px\n`));
    console.log(chalk.yellow("  ⏳ Generating your 8-bit avatar...\n"));

    try {
      const result = await generateAvatar(inputPath!, outputPath, {
        pixelSize,
        outputSize,
      });

      const sizeKB = (result.fileSize / 1024).toFixed(1);
      console.log(chalk.green.bold("  ✅ Avatar generated successfully!\n"));
      console.log(chalk.white(`  📦 File size: ${sizeKB} KB`));
      console.log(chalk.white(`  📍 Saved to:  ${result.outputPath}\n`));
    } catch (err) {
      console.error(
        chalk.red(`\n❌ Error: ${(err as Error).message}`)
      );
      process.exit(1);
    }
  });

program.parse();
