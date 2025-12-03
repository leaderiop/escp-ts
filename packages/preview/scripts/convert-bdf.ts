#!/usr/bin/env tsx
/**
 * BDF to TypeScript Font Converter
 *
 * Converts BDF (Bitmap Distribution Format) font files to TypeScript
 * font data structures for use in the VirtualRenderer.
 *
 * Usage:
 *   npx tsx packages/preview/scripts/convert-bdf.ts <input.bdf> [options]
 *
 * Options:
 *   --typeface <id>    Typeface ID (0-31, default: 0)
 *   --name <name>      Font name (default: derived from filename)
 *   --output <path>    Output file path (default: stdout)
 *
 * Example:
 *   npx tsx packages/preview/scripts/convert-bdf.ts spleen-8x16.bdf --typeface 2 --name "Courier"
 */

import * as fs from 'fs';
import * as path from 'path';

interface BDFGlyph {
  encoding: number;
  name: string;
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
  bitmap: number[];
}

interface BDFFont {
  name: string;
  pixelSize: number;
  glyphs: Map<number, BDFGlyph>;
}

/**
 * Parse a BDF font file
 */
function parseBDF(content: string): BDFFont {
  const lines = content.split('\n');
  const font: BDFFont = {
    name: 'Unknown',
    pixelSize: 16,
    glyphs: new Map(),
  };

  let currentGlyph: Partial<BDFGlyph> | null = null;
  let inBitmap = false;
  let bitmapLines: string[] = [];
  let bbxParsed = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('FONT ')) {
      font.name = line.substring(5).trim();
    } else if (line.startsWith('PIXEL_SIZE ')) {
      font.pixelSize = parseInt(line.substring(11), 10);
    } else if (line.startsWith('STARTCHAR ')) {
      currentGlyph = {
        name: line.substring(10).trim(),
        width: 8,
        height: 16,
        xOffset: 0,
        yOffset: 0,
        bitmap: [],
      };
      bitmapLines = [];
      bbxParsed = false;
    } else if (line.startsWith('ENCODING ') && currentGlyph) {
      currentGlyph.encoding = parseInt(line.substring(9), 10);
    } else if (line.startsWith('BBX ') && currentGlyph) {
      const parts = line.substring(4).split(/\s+/);
      currentGlyph.width = parseInt(parts[0] ?? '8', 10);
      currentGlyph.height = parseInt(parts[1] ?? '16', 10);
      currentGlyph.xOffset = parseInt(parts[2] ?? '0', 10);
      currentGlyph.yOffset = parseInt(parts[3] ?? '0', 10);
      bbxParsed = true;
    } else if (line === 'BITMAP') {
      inBitmap = true;
    } else if (line === 'ENDCHAR' && currentGlyph) {
      if (bitmapLines.length > 0) {
        // Convert bitmap lines to 8x16 format
        currentGlyph.bitmap = convertBitmap(
          bitmapLines,
          currentGlyph.width ?? 8,
          currentGlyph.height ?? 16,
          currentGlyph.xOffset ?? 0,
          currentGlyph.yOffset ?? 0
        );

        if (currentGlyph.encoding !== undefined) {
          font.glyphs.set(currentGlyph.encoding, currentGlyph as BDFGlyph);
        }
      }
      currentGlyph = null;
      inBitmap = false;
    } else if (inBitmap && line && !line.startsWith('ENDCHAR')) {
      bitmapLines.push(line);
    }
  }

  return font;
}

/**
 * Convert a glyph's bitmap to our standard 8x16 format
 */
function convertBitmap(
  bitmapLines: string[],
  width: number,
  height: number,
  xOffset: number,
  yOffset: number
): number[] {
  // Our target format: 8 pixels wide, 16 pixels tall
  const result: number[] = new Array(16).fill(0);

  // Calculate where to place the glyph in the 8x16 cell
  // BDF yOffset is from baseline, we need to adjust for our 16-pixel height
  // Typically baseline is around row 12-13 in a 16-pixel font
  const baseline = 13; // Standard baseline position
  const startRow = baseline - height - yOffset;

  for (let row = 0; row < bitmapLines.length && row < height; row++) {
    const hexLine = bitmapLines[row] ?? '00';
    let value = parseInt(hexLine, 16);

    // Handle fonts wider than 8 pixels - take the leftmost 8 bits
    if (width > 8) {
      // Shift right to get the leftmost 8 bits
      const extraBits = hexLine.length * 4 - 8;
      if (extraBits > 0) {
        value = value >> extraBits;
      }
    }

    // Handle xOffset - shift the bits
    if (xOffset > 0) {
      value = value >> xOffset;
    } else if (xOffset < 0) {
      value = value << -xOffset;
    }

    // Mask to 8 bits
    value = value & 0xff;

    const targetRow = startRow + row;
    if (targetRow >= 0 && targetRow < 16) {
      result[targetRow] = value;
    }
  }

  return result;
}

/**
 * Generate TypeScript font data
 */
function generateTypeScript(font: BDFFont, typeface: number, name: string): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${name} Font (Typeface ${typeface})`);
  lines.push(` * Generated from: ${font.name}`);
  lines.push(` * `);
  lines.push(` * This is an 8x16 bitmap font for the VirtualRenderer.`);
  lines.push(` * Each character is represented as 16 bytes (one per row).`);
  lines.push(` */`);
  lines.push(``);
  lines.push(
    `export const FONT_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}: Record<number, number[]> = {`
  );

  // Sort glyphs by encoding for consistent output
  const sortedEntries = Array.from(font.glyphs.entries())
    .filter(([code]) => code >= 32 && code < 256)
    .sort(([a], [b]) => a - b);

  for (const [code, glyph] of sortedEntries) {
    const hexValues = glyph.bitmap.map((b) => `0x${b.toString(16).padStart(2, '0')}`);
    const charName = getCharName(code);
    lines.push(`  // ${charName}`);
    lines.push(`  ${code}: [${hexValues.join(', ')}],`);
  }

  lines.push(`};`);
  lines.push(``);

  return lines.join('\n');
}

/**
 * Get a human-readable name for a character code
 */
function getCharName(code: number): string {
  if (code === 32) return 'Space';
  if (code >= 33 && code <= 47) {
    const chars = '!"#$%&\'()*+,-./';
    return chars[code - 33] ?? `Char ${code}`;
  }
  if (code >= 48 && code <= 57) return `${code - 48}`;
  if (code >= 58 && code <= 64) {
    const chars = ':;<=>?@';
    return chars[code - 58] ?? `Char ${code}`;
  }
  if (code >= 65 && code <= 90) return String.fromCharCode(code);
  if (code >= 91 && code <= 96) {
    const chars = '[\\]^_`';
    return chars[code - 91] ?? `Char ${code}`;
  }
  if (code >= 97 && code <= 122) return String.fromCharCode(code);
  if (code >= 123 && code <= 126) {
    const chars = '{|}~';
    return chars[code - 123] ?? `Char ${code}`;
  }
  if (code >= 0xb0 && code <= 0xdf) return `Box drawing ${code.toString(16).toUpperCase()}`;
  return `Char ${code}`;
}

/**
 * Add missing characters with placeholder glyphs
 */
function addMissingCharacters(font: BDFFont): void {
  // Create a simple placeholder glyph (empty box)
  const placeholder: number[] = [
    0x00, 0x00, 0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e, 0x00, 0x00, 0x00, 0x00,
  ];

  // Ensure all printable ASCII characters exist
  for (let code = 32; code < 127; code++) {
    if (!font.glyphs.has(code)) {
      font.glyphs.set(code, {
        encoding: code,
        name: `missing_${code}`,
        width: 8,
        height: 16,
        xOffset: 0,
        yOffset: 0,
        bitmap: [...placeholder],
      });
    }
  }

  // Add box-drawing characters (CP437 range)
  for (let code = 0xb0; code <= 0xdf; code++) {
    if (!font.glyphs.has(code)) {
      font.glyphs.set(code, {
        encoding: code,
        name: `box_${code.toString(16)}`,
        width: 8,
        height: 16,
        xOffset: 0,
        yOffset: 0,
        bitmap: [...placeholder],
      });
    }
  }
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
BDF to TypeScript Font Converter

Usage:
  npx tsx packages/preview/scripts/convert-bdf.ts <input.bdf> [options]

Options:
  --typeface <id>    Typeface ID (0-31, default: 0)
  --name <name>      Font name (default: derived from filename)
  --output <path>    Output file path (default: stdout)
  --help             Show this help message

Example:
  npx tsx packages/preview/scripts/convert-bdf.ts spleen-8x16.bdf --typeface 2 --name "Courier"
`);
    process.exit(0);
  }

  const inputFile = args[0];
  if (!inputFile) {
    console.error('Error: No input file specified');
    process.exit(1);
  }

  let typeface = 0;
  let name = path.basename(inputFile, '.bdf');
  let output: string | null = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--typeface' && args[i + 1]) {
      typeface = parseInt(args[++i], 10);
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[++i]!;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[++i]!;
    }
  }

  // Read and parse the BDF file
  let content: string;
  try {
    content = fs.readFileSync(inputFile, 'utf-8');
  } catch (err) {
    console.error(`Error reading file: ${inputFile}`);
    process.exit(1);
  }

  const font = parseBDF(content);
  console.error(`Parsed font: ${font.name}`);
  console.error(`Glyphs found: ${font.glyphs.size}`);

  // Add any missing characters
  addMissingCharacters(font);
  console.error(`Total glyphs after padding: ${font.glyphs.size}`);

  // Generate TypeScript output
  const tsContent = generateTypeScript(font, typeface, name);

  if (output) {
    fs.writeFileSync(output, tsContent);
    console.error(`Written to: ${output}`);
  } else {
    console.log(tsContent);
  }
}

main();
