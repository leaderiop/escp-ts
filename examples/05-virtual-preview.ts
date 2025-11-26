/**
 * Example 5: Virtual Preview
 *
 * Demonstrates using the VirtualRenderer to preview output without a printer.
 */

import {
  LayoutEngine,
  VirtualRenderer,
  stack,
  flex,
  text,
  line,
} from '../src/index';

// Create a simple document
const engine = new LayoutEngine();
engine.initialize();

const document = stack()
  .gap(15)
  .padding(36)
  .text('Virtual Preview Demo', { bold: true, doubleWidth: true })
  .child(line('horizontal'))
  .text('This document is rendered to a virtual page buffer')
  .text('instead of a physical printer.')
  .child(
    flex()
      .gap(20)
      .justify('space-between')
      .text('Left aligned')
      .text('Right aligned')
      .build()
  )
  .text('You can use this for:')
  .text('  - Print preview functionality')
  .text('  - Testing without a printer')
  .text('  - Generating PNG images')
  .build();

engine.render(document);
engine.formFeed();

// Get ESC/P2 command bytes
const escpData = engine.getOutput();

// Create virtual renderer with custom options
const renderer = new VirtualRenderer({
  dpi: 180, // Render at 180 DPI (half of 360)
  pageWidth: 8.5, // Inches
  pageHeight: 11, // Inches
});

// Render the ESC/P2 commands to virtual pages
renderer.render(escpData);

// Get the rendered pages
const pages = renderer.getPages();

console.log(`Rendered ${pages.length} page(s)`);

for (let i = 0; i < pages.length; i++) {
  const page = pages[i];
  console.log(`\nPage ${i + 1}:`);
  console.log(`  Dimensions: ${page.width} x ${page.height} pixels`);
  console.log(`  Data size: ${page.data.length} bytes`);

  // The page.data is compatible with ImageData (RGBA format)
  // You can use libraries like sharp or canvas to save as PNG

  // Count non-white pixels to see how much content there is
  let nonWhitePixels = 0;
  for (let j = 0; j < page.data.length; j += 4) {
    // Check if pixel is not white (R, G, B all 255)
    if (page.data[j] !== 255 || page.data[j + 1] !== 255 || page.data[j + 2] !== 255) {
      nonWhitePixels++;
    }
  }
  console.log(`  Non-white pixels: ${nonWhitePixels}`);
}

// Example: Convert to PNG using sharp (if available)
async function saveAsPng(): Promise<void> {
  try {
    const sharp = await import('sharp');

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const filename = `output/preview-page-${i + 1}.png`;

      await sharp
        .default(Buffer.from(page.data), {
          raw: {
            width: page.width,
            height: page.height,
            channels: 4,
          },
        })
        .png()
        .toFile(filename);

      console.log(`Saved ${filename}`);
    }
  } catch {
    console.log('\nNote: Install sharp to save PNG files: pnpm add sharp');
  }
}

// Uncomment to save PNG files
// saveAsPng();
