/**
 * Shared helper functions for examples
 * @internal - Not meant to be run directly
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { VirtualRenderer, type VirtualPage } from '@escp/preview';

// ============================================================
// CONSTANTS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// CUPS Custom.1069x615 page size
// lpoptions -p EPSON_LQ_2090II -o PageSize=Custom.1069x615
// 1069x615 points (1 point = 1/72 inch)
const PAPER_WIDTH_POINTS = 1069;
const PAPER_HEIGHT_POINTS = 615;
const PAPER_WIDTH_INCHES = PAPER_WIDTH_POINTS / 72; // 14.847 inches
const PAPER_HEIGHT_INCHES = PAPER_HEIGHT_POINTS / 72; // 8.542 inches
const PRINTER_MAX_WIDTH_INCHES = 13.6; // LQ-2090II max print width
const SIDE_MARGIN = Math.round(((PAPER_WIDTH_INCHES - PRINTER_MAX_WIDTH_INCHES) / 2) * 360); // ~225 dots

// Default paper configuration (matches DEFAULT_ENGINE_OPTIONS.defaultPaper)
export const DEFAULT_PAPER = {
  widthInches: PAPER_WIDTH_INCHES,
  heightInches: PAPER_HEIGHT_INCHES,
  margins: { top: 90, bottom: 90, left: SIDE_MARGIN, right: SIDE_MARGIN },
  linesPerPage: Math.floor(PAPER_HEIGHT_INCHES * 6), // ~51 lines at 6 LPI
};

// ============================================================
// PREVIEW HELPER FUNCTIONS
// ============================================================

/**
 * Convert a VirtualPage bitmap to ASCII art
 * Focuses on content area (top-left portion of page)
 */
export function pageToAscii(
  page: VirtualPage,
  options: {
    width?: number;
    height?: number;
    chars?: string;
    contentHeight?: number;
  } = {}
): string {
  const targetWidth = options.width ?? 80;
  const targetHeight = options.height ?? 40;
  const chars = options.chars ?? ' .:-=+*#%@';

  const contentHeight = options.contentHeight ?? Math.min(page.height, 1000);
  const contentWidth = Math.min(page.width, Math.floor(contentHeight * 2));

  const scaleX = contentWidth / targetWidth;
  const scaleY = contentHeight / targetHeight;

  const lines: string[] = [];

  for (let ty = 0; ty < targetHeight; ty++) {
    let line = '';
    for (let tx = 0; tx < targetWidth; tx++) {
      const startX = Math.floor(tx * scaleX);
      const startY = Math.floor(ty * scaleY);
      const endX = Math.floor((tx + 1) * scaleX);
      const endY = Math.floor((ty + 1) * scaleY);

      let maxVal = 0;

      for (let y = startY; y < endY && y < page.height; y++) {
        for (let x = startX; x < endX && x < page.width; x++) {
          const val = page.data[y * page.width + x] ?? 0;
          if (val > maxVal) maxVal = val;
        }
      }

      const charIndex = maxVal > 0 ? chars.length - 1 : 0;
      line += chars[charIndex];
    }
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Ensure output directory exists
 */
export function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Save PRN file (raw ESC/P2 commands)
 */
export function savePrnFile(commands: Uint8Array, filename: string): string {
  ensureOutputDir();
  const filepath = path.join(OUTPUT_DIR, `${filename}.prn`);
  fs.writeFileSync(filepath, commands);
  return filepath;
}

/**
 * Save PNG file from VirtualPage using sharp
 */
export async function savePngFile(page: VirtualPage, filename: string): Promise<string> {
  ensureOutputDir();
  const filepath = path.join(OUTPUT_DIR, `${filename}.png`);

  const rgba = new Uint8Array(page.width * page.height * 4);
  for (let i = 0; i < page.data.length; i++) {
    const gray = page.data[i] ?? 0;
    const inverted = 255 - gray;
    rgba[i * 4] = inverted;
    rgba[i * 4 + 1] = inverted;
    rgba[i * 4 + 2] = inverted;
    rgba[i * 4 + 3] = 255;
  }

  await sharp(Buffer.from(rgba), {
    raw: {
      width: page.width,
      height: page.height,
      channels: 4,
    },
  })
    .png()
    .toFile(filepath);

  return filepath;
}

/**
 * Render ESC/P2 commands, save files, and show ASCII preview
 */
export async function renderPreview(
  commands: Uint8Array,
  title: string,
  filename: string,
  options: {
    width?: number;
    height?: number;
    paper?: typeof DEFAULT_PAPER;
  } = {}
): Promise<void> {
  const paper = options.paper ?? DEFAULT_PAPER;

  const renderer = new VirtualRenderer(paper, {
    horizontalDpi: 360,
    verticalDpi: 360,
    scale: 1,
  });

  renderer.render(commands);
  const pages = renderer.getPages();

  if (pages.length === 0) {
    console.log(`${title}: No content rendered`);
    return;
  }

  const page = pages[0];
  if (!page) {
    console.log(`${title}: No page available`);
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(80)}`);

  // Save PRN file
  const prnPath = savePrnFile(commands, filename);
  console.log(`PRN: ${prnPath} (${commands.length} bytes)`);

  // Save PNG file
  try {
    const pngPath = await savePngFile(page, filename);
    console.log(`PNG: ${pngPath} (${page.width}x${page.height})`);
  } catch (e) {
    console.log(`PNG: Could not save (sharp not available)`, e);
  }

  // Show ASCII preview
  console.log(`\nPreview:`);
  console.log(
    pageToAscii(page, {
      width: options.width ?? 80,
      height: options.height ?? 30,
    })
  );
}

/**
 * Simple helper to print a section header
 */
export function printSection(title: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}
