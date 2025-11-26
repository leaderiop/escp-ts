/**
 * Example 1: Basic Printing
 *
 * Demonstrates basic text printing with the LayoutEngine.
 */

import { LayoutEngine, PRINT_QUALITY } from '../src/index';
import * as fs from 'fs';

// Create a new layout engine
const engine = new LayoutEngine();

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

// Get the raw printer output
const output = engine.getOutput();

// Save to file
fs.writeFileSync('output/basic.prn', output);
console.log(`Generated ${output.length} bytes of printer commands`);

// You can also get the output as hex for debugging
console.log('\nFirst 50 bytes as hex:');
console.log(engine.toHex(' ').slice(0, 150));
