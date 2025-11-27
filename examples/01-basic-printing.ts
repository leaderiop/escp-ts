/**
 * Example 01: Basic Printing
 *
 * Demonstrates basic text printing with the LayoutEngine.
 *
 * Run: npx tsx examples/01-basic-printing.ts
 */

import { LayoutEngine, PRINT_QUALITY } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Basic Printing Demo');

  // Create a new layout engine
  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  // Initialize the printer and set up basic formatting
  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ) // Letter Quality mode

    // Print a title with bold
    .setBold(true)
    .println('Welcome to escp-ts!')
    .setBold(false)
    .println('')

    // Print some regular text
    .println('This library generates ESC/P2 printer commands')
    .println('for EPSON dot matrix printers.')
    .println('')

    // Different text styles
    .setItalic(true)
    .println('This is italic text')
    .setItalic(false)

    .setUnderline(true)
    .println('This is underlined text')
    .setUnderline(false)

    .setBold(true)
    .setItalic(true)
    .println('This is bold italic text')
    .setBold(false)
    .setItalic(false)
    .println('')

    // Different character densities
    .setCpi(10)
    .println('10 CPI - Standard width')
    .setCpi(12)
    .println('12 CPI - Elite mode')
    .setCpi(15)
    .println('15 CPI - Condensed')
    .setCpi(10) // Reset to default

    // End with a form feed
    .formFeed();

  // Get the raw printer output and render preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Basic Printing Demo', '01-basic-printing');
}

main().catch(console.error);
