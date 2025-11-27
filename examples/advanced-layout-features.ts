/**
 * Advanced Layout Features Example
 *
 * This example demonstrates 4 advanced layout features:
 * 1. Min/Max Width Constraints
 * 2. Absolute Positioning
 * 3. Conditional Content
 * 4. Vertical Text
 *
 * Output files are saved to ./output/ directory:
 * - .prn files: Raw ESC/P2 printer commands
 * - .png files: Rendered preview images
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import {
  stack,
  flex,
  grid,
  text,
  line,
  spacer,
  spaceQuery,
} from '../src/layout/builders';
import { measureNode, MeasureContext, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { performLayout } from '../src/layout/layout';
import { renderLayout } from '../src/layout/renderer';
import { VirtualRenderer } from '../src/renderer/VirtualRenderer';
import type { SpaceContext } from '../src/layout/nodes';
import type { VirtualPage } from '../src/renderer/VirtualRenderer';

// Output directory (at project root)
const OUTPUT_DIR = path.join(import.meta.dirname ?? '.', '..', 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}\n`);
}

// Custom paper size from CUPS: Custom.1069x615 (points, 1/72 inch)
// Same configuration as src/preview.ts for consistency
const PAPER_WIDTH_POINTS = 1069;
const PAPER_HEIGHT_POINTS = 615;
const PAPER_WIDTH_INCHES = PAPER_WIDTH_POINTS / 72; // 14.847 inches
const PAPER_HEIGHT_INCHES = PAPER_HEIGHT_POINTS / 72; // 8.542 inches

// Calculate margins to center the printable area on the paper
// LQ-2090II max print width is 13.6 inches (4896 dots at 360 DPI)
const PRINTER_MAX_WIDTH_INCHES = 13.6;
const SIDE_MARGIN = Math.round(((PAPER_WIDTH_INCHES - PRINTER_MAX_WIDTH_INCHES) / 2) * 360);

const CUSTOM_PAPER = {
  widthInches: PAPER_WIDTH_INCHES,
  heightInches: PAPER_HEIGHT_INCHES,
  margins: { top: 90, bottom: 90, left: SIDE_MARGIN, right: SIDE_MARGIN },
  linesPerPage: Math.floor(PAPER_HEIGHT_INCHES * 6), // ~50 lines at 6 LPI
};

// ============================================================
// PREVIEW HELPER FUNCTIONS
// ============================================================

/**
 * Convert a VirtualPage bitmap to ASCII art
 * Focuses on content area (top-left portion of page)
 */
function pageToAscii(page: VirtualPage, options: {
  width?: number;
  height?: number;
  chars?: string;
  contentHeight?: number; // Height of content area in page pixels
} = {}): string {
  const targetWidth = options.width ?? 80;
  const targetHeight = options.height ?? 40;
  const chars = options.chars ?? ' .:-=+*#%@';

  // Focus on content area - typically top portion of page
  // Default to showing roughly 1/4 of page height (about 2.5 inches)
  const contentHeight = options.contentHeight ?? Math.min(page.height, 1000);
  const contentWidth = Math.min(page.width, Math.floor(contentHeight * 2)); // 2:1 aspect

  const scaleX = contentWidth / targetWidth;
  const scaleY = contentHeight / targetHeight;

  const lines: string[] = [];

  for (let ty = 0; ty < targetHeight; ty++) {
    let line = '';
    for (let tx = 0; tx < targetWidth; tx++) {
      // Sample the area - use MAX instead of average for better visibility
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

      // Binary: if any pixel is set, show it
      const charIndex = maxVal > 0 ? chars.length - 1 : 0;
      line += chars[charIndex];
    }
    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Save PRN file (raw ESC/P2 commands)
 */
function savePrnFile(commands: Uint8Array, filename: string): string {
  const filepath = path.join(OUTPUT_DIR, `${filename}.prn`);
  fs.writeFileSync(filepath, commands);
  return filepath;
}

/**
 * Save PNG file from VirtualPage using sharp
 */
async function savePngFile(page: VirtualPage, filename: string): Promise<string> {
  const filepath = path.join(OUTPUT_DIR, `${filename}.png`);

  // Convert grayscale to RGBA (white background, black text)
  const rgba = new Uint8Array(page.width * page.height * 4);
  for (let i = 0; i < page.data.length; i++) {
    const gray = page.data[i] ?? 0;
    // Invert: 0 (white paper) -> 255 white, 255 (black ink) -> 0 black
    const inverted = 255 - gray;
    rgba[i * 4] = inverted;     // R
    rgba[i * 4 + 1] = inverted; // G
    rgba[i * 4 + 2] = inverted; // B
    rgba[i * 4 + 3] = 255;      // A (fully opaque)
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
async function renderPreview(
  commands: Uint8Array,
  title: string,
  filename: string,
  options: { width?: number; height?: number } = {}
): Promise<void> {
  // Use 360 DPI to match ESC/P2 native resolution
  // Use CUSTOM_PAPER for consistency with src/preview.ts
  const renderer = new VirtualRenderer(
    CUSTOM_PAPER,
    { horizontalDpi: 360, verticalDpi: 360, scale: 1 }
  );

  renderer.render(commands);
  const pages = renderer.getPages();

  // Save PRN file
  const prnPath = savePrnFile(commands, filename);

  console.log(`\n┌${'─'.repeat(78)}┐`);
  console.log(`│ ${title.padEnd(76)} │`);
  console.log(`├${'─'.repeat(78)}┤`);

  if (pages.length === 0) {
    console.log(`│ (No rendered pages - ${commands.length} bytes of commands)`.padEnd(78) + '│');
    console.log(`│ Saved: ${prnPath}`.padEnd(78) + '│');
    console.log(`└${'─'.repeat(78)}┘`);
    return;
  }

  const page = pages[0];
  if (page) {
    // Save PNG file
    const pngPath = await savePngFile(page, filename);

    // Check if page has any non-zero pixels
    let pixelCount = 0;
    for (let i = 0; i < page.data.length; i++) {
      if (page.data[i] !== 0) pixelCount++;
    }

    if (pixelCount === 0) {
      console.log(`│ (No visible content)`.padEnd(78) + '│');
    } else {
      const ascii = pageToAscii(page, {
        width: options.width ?? 78,
        height: options.height ?? 20,
        chars: ' ░▓█', // Gradient for visibility
      });
      ascii.split('\n').forEach(line => {
        console.log(`│${line.padEnd(78)}│`);
      });
    }

    console.log(`├${'─'.repeat(78)}┤`);
    console.log(`│ PRN: ${path.basename(prnPath).padEnd(70)} │`);
    console.log(`│ PNG: ${path.basename(pngPath).padEnd(70)} │`);
  }

  console.log(`└${'─'.repeat(78)}┘`);
}

// ============================================================
// MAIN FUNCTION (async for file I/O)
// ============================================================

async function main() {

// ============================================================
// 1. MIN/MAX WIDTH CONSTRAINTS
// ============================================================

console.log('=== 1. Min/Max Width Constraints ===\n');

// Printable width: 4896 dots, after padding(60): 4776 dots available
const PRINTABLE_WIDTH = Math.round(PRINTER_MAX_WIDTH_INCHES * 360); // 4896 dots
const CONTENT_WIDTH = PRINTABLE_WIDTH - 120; // 4776 dots after padding

// Create a layout where content has minimum and maximum width limits
const constrainedLayout = stack()
  .width('fill')
  .padding(60)
  .gap(20)
  .text('Min/Max Width Constraints Demo', { bold: true, doubleWidth: true })
  .spacer(20)
  // This text will be at least 500 dots wide, even if content is shorter
  .add(
    stack()
      .minWidth(500)
      .text('Short text with minWidth(500)', { bold: true })
  )
  // This container will never exceed 1200 dots, even with long content
  .add(
    stack()
      .maxWidth(1200)
      .text('This is a very long text that would normally take much more space but is constrained to maxWidth(1200) - watch how it wraps if needed')
  )
  // Combining both: width between 400 and 800 dots
  .add(
    stack()
      .minWidth(400)
      .maxWidth(800)
      .text('Bounded Width (min=400, max=800)')
  )
  .build();

const constrainedMeasured = measureNode(constrainedLayout);
console.log('Constrained layout measured widths:');
constrainedMeasured.children.forEach((child, i) => {
  console.log(`  Child ${i + 1}: ${child.preferredWidth} dots`);
});

// Render preview and save files - use full printable width
const constrainedLayoutResult = performLayout(constrainedMeasured, 0, 0, PRINTABLE_WIDTH, 1000);
const constrainedRendered = renderLayout(constrainedLayoutResult);
await renderPreview(constrainedRendered.commands, 'Min/Max Width Constraints Preview', '01-min-max-constraints', { height: 8 });

// ============================================================
// 2. ABSOLUTE POSITIONING
// ============================================================

console.log('\n=== 2. Absolute Positioning ===\n');

// Note: Absolute positioning allows placing elements at specific X,Y coordinates.
// However, since dot-matrix printers can't move paper backwards, absolutely
// positioned items must have Y positions that increase with render order.

// Create items at specific positions spread across the wide page
// Items are sorted by z-index, then Y, then X before rendering

// Normal flow content ends at approximately Y=220 (padding 60 + title 60 + spacer 10 + desc 60 + spacer 30)
// So all absolute positions must start AFTER Y=220

const absoluteDemo = stack()
  .width('fill')
  .padding(60)
  .height(700)
  // Normal flow content at top
  .text('Absolute Positioning Demo', { bold: true, doubleWidth: true })
  .spacer(10)
  .text('Elements can be placed at specific X,Y coordinates on the page.')
  .spacer(30)
  // Absolutely positioned elements - Y values must be AFTER normal flow ends (~Y=220)
  // Spread across the wide paper (4776 dots content width)
  .add(
    stack()
      .absolutePosition(100, 250)  // Left side, after normal flow
      .text('Position: (100, 250)', { bold: true })
  )
  .add(
    stack()
      .absolutePosition(1800, 310)  // Center-left
      .text('Position: (1800, 310)')
  )
  .add(
    stack()
      .absolutePosition(3500, 370)  // Right side
      .text('Position: (3500, 370)', { italic: true })
  )
  .add(
    stack()
      .absolutePosition(100, 430)  // Left, lower
      .text('Position: (100, 430)', { underline: true })
  )
  .add(
    stack()
      .absolutePosition(1800, 490)  // Center
      .bold()
      .text('Position: (1800, 490)')
  )
  .add(
    stack()
      .absolutePosition(3500, 550)  // Right side
      .text('Position: (3500, 550)')
  )
  .build();

// Show the absolute position properties
console.log('Absolute positioning example nodes:');
console.log('  - Item at (100, 250)');
console.log('  - Item at (1800, 310)');
console.log('  - Item at (3500, 370)');
console.log('  - Item at (100, 430)');
console.log('  - Item at (1800, 490)');
console.log('  - Item at (3500, 550)');

const absoluteMeasured = measureNode(absoluteDemo);
const absoluteResult = performLayout(absoluteMeasured, 0, 0, PRINTABLE_WIDTH, 1000);
const absoluteRendered = renderLayout(absoluteResult);
await renderPreview(absoluteRendered.commands, 'Absolute Positioning Preview', '02-absolute-positioning', { height: 12 });

// ============================================================
// 3. CONDITIONAL CONTENT
// ============================================================

console.log('\n=== 3. Conditional Content ===\n');

// 4a. Callback-based condition
const callbackConditional = stack()
  .width('fill')
  .padding(60)
  .gap(20)
  .text('Conditional Content Demo', { bold: true, doubleWidth: true })
  .spacer(10)
  .text('Always visible header - content below changes based on available space.')
  // Show detailed content only if enough height available
  .add(
    stack()
      .when((ctx: SpaceContext) => ctx.availableHeight > 300)
      .text('Detailed description that requires lots of space...')
      .text('Additional details line 1')
      .text('Additional details line 2')
  )
  // Show compact version when space is limited
  .add(
    stack()
      .when((ctx: SpaceContext) => ctx.availableHeight <= 300)
      .text('Compact: See details on next page')
  )
  .build();

// Test with different available heights
console.log('Callback-based conditional:');

const largeContext: MeasureContext = {
  ...DEFAULT_MEASURE_CONTEXT,
  availableHeight: 500,
  availableWidth: CONTENT_WIDTH,
};
const measuredLarge = measureNode(callbackConditional, largeContext);
console.log(`  With 500 dots height: ${measuredLarge.children.length} visible sections`);

const smallContext: MeasureContext = {
  ...DEFAULT_MEASURE_CONTEXT,
  availableHeight: 200,
  availableWidth: CONTENT_WIDTH,
};
const measuredSmall = measureNode(callbackConditional, smallContext);
console.log(`  With 200 dots height: ${measuredSmall.children.length} visible sections`);

// 4b. Declarative spaceQuery condition
// Note: Column widths must accommodate text width (at 10 CPI, each char is 36 dots)
// Using wider columns for the large paper format
const declarativeConditional = stack()
  .width('fill')
  .padding(60)
  .gap(20)
  .text('Invoice with Conditional Layout', { bold: true, doubleWidth: true })
  .spacer(10)
  // Show full table only if width >= 2000 dots (about half the page)
  .add(
    grid([600, 300, 400])
      .when(spaceQuery({ minWidth: 2000 }))
      .columnGap(60)
      .cell('Product', { bold: true }).cell('Qty', { bold: true }).cell('Price', { bold: true }).headerRow()
      .cell('Widget Pro').cell('5').cell('$50.00').row()
      .cell('Gadget Plus').cell('3').cell('$75.00').row()
  )
  // Show compact list when width < 2000 dots
  .add(
    stack()
      .when(spaceQuery({ maxWidth: 1999 }))
      .gap(5)
      .text('Widget Pro x5: $50.00')
      .text('Gadget Plus x3: $75.00')
  )
  .build();

console.log('\nDeclarative spaceQuery conditional:');

const wideContext: MeasureContext = {
  ...DEFAULT_MEASURE_CONTEXT,
  availableWidth: CONTENT_WIDTH,
};
const measuredWide = measureNode(declarativeConditional, wideContext);
console.log(`  With ${CONTENT_WIDTH} dots width: grid visible = ${measuredWide.children[2]?.conditionMet}`);

const narrowContext: MeasureContext = {
  ...DEFAULT_MEASURE_CONTEXT,
  availableWidth: 1500,
};
const measuredNarrow = measureNode(declarativeConditional, narrowContext);
console.log(`  With 1500 dots width: grid visible = ${measuredNarrow.children[2]?.conditionMet}`);

// 4c. Condition with fallback
const withFallback = stack()
  .width('fill')
  .padding(60)
  .text('Report with Conditional Chart', { bold: true, doubleWidth: true })
  .spacer(10)
  .add(
    stack()
      .when(spaceQuery({ minHeight: 400 }))
      .fallback(text('See appendix for full chart'))
      .text('=== Full Chart ===')
      .line('=', 'fill')
      .text('| Data 1      | Data 2      | Data 3      |')
      .text('|-------------|-------------|-------------|')
      .text('| 100         | 200         | 300         |')
      .line('=', 'fill')
  )
  .build();

console.log('\nConditional with fallback:');
const measuredWithFallback = measureNode(withFallback, smallContext);
const chartSection = measuredWithFallback.children[2];
console.log(`  Condition met: ${chartSection?.conditionMet}`);
console.log(`  Has fallback: ${chartSection?.fallbackMeasured !== undefined}`);

// Render previews and save files for conditional content
const wideConditionalLayout = performLayout(measuredWide, 0, 0, PRINTABLE_WIDTH, 600);
const wideConditionalRendered = renderLayout(wideConditionalLayout);
await renderPreview(wideConditionalRendered.commands, 'Conditional: Wide View (Grid visible)', '04a-conditional-wide', { height: 8 });

const narrowConditionalLayout = performLayout(measuredNarrow, 0, 0, 1620, 600);
const narrowConditionalRendered = renderLayout(narrowConditionalLayout);
await renderPreview(narrowConditionalRendered.commands, 'Conditional: Narrow View (Compact list)', '04b-conditional-narrow', { height: 6 });

// ============================================================
// 4. VERTICAL TEXT
// ============================================================

console.log('\n=== 4. Vertical Text ===\n');

// Note: Vertical text renders character-by-character going DOWN the page.
// Since dot-matrix printers can't move paper backwards, vertical text should
// be rendered BEFORE any horizontal content at the same or lower Y position.

// Demo: Vertical text standalone
// Note: Multiple vertical texts in a flex row will overlap because after
// rendering one vertical text going down, we can't move back up for the next.
// Solution: Use a grid with separate columns, or render vertical texts one at a time.
const verticalStandalone = stack()
  .width('fill')
  .padding(60)
  .gap(20)
  .text('Vertical Text Demo', { bold: true, doubleWidth: true })
  .spacer(10)
  .text('Vertical text prints each character on a new line, going down the page.')
  .spacer(20)
  .text('Single vertical text example:')
  .add(text('HELLO', { orientation: 'vertical', bold: true }))
  .spacer(20)
  .text('(Each character of "HELLO" prints on a separate line going downward)')
  .build();

const verticalMeasured = measureNode(verticalStandalone);
console.log('Vertical text layout measurements:');
verticalMeasured.children.forEach((child, i) => {
  const node = child.node;
  if (node.type === 'text') {
    console.log(`  Child ${i + 1} ("${node.content}"): ${child.preferredWidth}w x ${child.preferredHeight}h, orientation: ${node.orientation ?? 'horizontal'}`);
  } else if (node.type === 'flex') {
    console.log(`  Child ${i + 1} (flex with ${child.children.length} vertical texts)`);
  } else {
    console.log(`  Child ${i + 1} (${node.type}): ${child.preferredWidth}w x ${child.preferredHeight}h`);
  }
});

// Render preview and save files for vertical text
const verticalLayout = performLayout(verticalMeasured, 0, 0, PRINTABLE_WIDTH, 800);
const verticalRendered = renderLayout(verticalLayout);
await renderPreview(verticalRendered.commands, 'Vertical Text Preview', '05-vertical-text', { height: 12 });

// ============================================================
// COMBINED EXAMPLE: Professional Invoice
// ============================================================

console.log('\n=== Combined Example: Professional Invoice ===\n');

// Professional invoice using the same format as composable_invoice in src/preview.ts
// Printable width: 4896 dots, after padding(60): 4776 dots available
// At 10 CPI, each character is 36 dots wide

const invoice = stack()
  .width('fill')
  .padding(60)
  .gap(15)

  // Header: Company name and invoice info
  .add(
    flex()
      .width('fill')
      .justify('space-between')
      .add(
        stack()
          .text('ACME CORPORATION', { bold: true, doubleWidth: true, doubleHeight: true })
          .spacer(10)
          .text('123 Business Street')
          .text('New York, NY 10001')
          .text('Tel: (555) 123-4567')
      )
      .add(
        stack()
          .align('center')
          .text('INVOICE', { bold: true, doubleWidth: true, doubleHeight: true })
          .spacer(20)
          .add(
            grid([400, 500])
              .columnGap(40)
              .cell('Invoice #:', { bold: true }).cell('INV-2024-001').row()
              .cell('Date:', { bold: true }).cell('January 15, 2024').row()
              .cell('Due Date:', { bold: true }).cell('February 15, 2024').row()
          )
      )
      .add(
        stack()
          .align('right')
          .text('ORIGINAL', { bold: true, doubleWidth: true })
      )
  )

  .add(line('-', 'fill'))

  // Customer info
  .add(
    flex()
      .width('fill')
      .gap(100)
      .add(
        stack()
          .minWidth(800)
          .padding({ top: 20, bottom: 20 })
          .text('BILL TO:', { bold: true, underline: true })
          .spacer(10)
          .text('John Doe', { bold: true })
          .text('123 Main Street')
          .text('Anytown, USA 12345')
          .text('Phone: (555) 987-6543')
      )
      .add(
        stack()
          .padding({ top: 20, bottom: 20 })
          .text('SHIP TO:', { bold: true, underline: true })
          .spacer(10)
          .text('John Doe')
          .text('Same as billing address')
      )
  )

  // Line items table - wide format with generous column widths
  .add(line('=', 'fill'))
  .spacer(10)
  .add(
    grid([200, 600, 'fill', 400, 400])
      .when(spaceQuery({ minWidth: 2000 }))
      .columnGap(80)
      .rowGap(8)
      .cell('QTY', { bold: true, align: 'center' })
      .cell('SKU', { bold: true })
      .cell('DESCRIPTION', { bold: true })
      .cell('UNIT PRICE', { bold: true })
      .cell('TOTAL', { bold: true })
      .headerRow()
      .cell('5', { align: 'center' }).cell('WGT-PRO-X1').cell('Widget Pro X1 - Premium Model').cell('$10.00').cell('$50.00').row()
      .cell('3', { align: 'center' }).cell('GDG-PLUS').cell('Gadget Plus - Standard Edition').cell('$25.00').cell('$75.00').row()
      .cell('2', { align: 'center' }).cell('SPR-TOOL').cell('Super Tool - Professional Grade').cell('$15.00').cell('$30.00').row()
  )

  // Compact list fallback for narrow prints
  .add(
    stack()
      .when(spaceQuery({ maxWidth: 1999 }))
      .gap(5)
      .text('5x Widget Pro X1: $50.00')
      .text('3x Gadget Plus: $75.00')
      .text('2x Super Tool: $30.00')
  )

  .spacer(10)
  .add(line('=', 'fill'))

  // Totals section - aligned to the right
  .add(
    flex()
      .width('fill')
      .justify('end')
      .add(
        stack()
          .width(900)
          .padding({ top: 20 })
          .add(
            grid([500, 400])
              .columnGap(40)
              .rowGap(8)
              .cell('Subtotal:').cell('$155.00').row()
              .cell('Tax (10%):').cell('$15.50').row()
              .cell('').cell('').row()
              .cell('TOTAL DUE:', { bold: true }).cell('$170.50', { bold: true }).row()
          )
      )
  )

  .spacer(30)
  .add(line('-', 'fill'))

  // Footer
  .add(
    stack()
      .width('fill')
      .align('center')
      .padding({ top: 20 })
      .text('*** PAID ***', { bold: true, doubleWidth: true })
      .spacer(10)
      .text('Thank you for your business!', { italic: true })
      .text('Payment received: 2024-01-15')
  )

  .build();

// Measure and layout the invoice
const invoiceMeasured = measureNode(invoice);
const invoiceLayout = performLayout(invoiceMeasured, 0, 0, PRINTABLE_WIDTH, 2000);

console.log('Invoice layout summary:');
console.log(`  Total size: ${invoiceLayout.width}w x ${invoiceLayout.height}h dots`);
console.log(`  Total children: ${invoiceMeasured.children.length}`);

// Render to commands
const rendered = renderLayout(invoiceLayout);
console.log(`  Generated ${rendered.commands.length} bytes of ESC/P2 commands`);
console.log(`  Final Y position: ${rendered.finalY} dots`);

// Render invoice preview and save files
await renderPreview(rendered.commands, 'Professional Invoice Preview', '06-professional-invoice', { height: 25 });

console.log('\n=== All Examples Complete ===');
console.log(`\nOutput files saved to: ${OUTPUT_DIR}`);

} // end main()

// Run the main function
main().catch(console.error);
