/**
 * Example 4: Barcode Printing
 *
 * Demonstrates barcode generation for various barcode types.
 */

import { LayoutEngine, stack, flex, text } from '../src/index';
import * as fs from 'fs';

const engine = new LayoutEngine();
engine.initialize();

// Print title
engine.setBold(true).println('Barcode Examples').setBold(false);
engine.println('');

// Barcode types available (EPSON ESC/P2)
// Type 0: UPC-A
// Type 1: UPC-E
// Type 2: EAN-13 (JAN-13)
// Type 3: EAN-8 (JAN-8)
// Type 4: Code 39
// Type 5: ITF (Interleaved 2 of 5)
// Type 6: Codabar
// Type 7: Code 128

// Example 1: Code 39 barcode
engine.println('Code 39:');
engine.printBarcode('12345', {
  type: 4, // Code 39
  moduleWidth: 2, // Module width (1-3)
  height: 50, // Height in dots
  hriPosition: 2, // HRI below barcode
  hriFont: 0, // Font A
});
engine.println('');

// Example 2: EAN-13 barcode
engine.println('EAN-13:');
engine.printBarcode('4901234567890', {
  type: 2, // EAN-13
  moduleWidth: 2,
  height: 60,
  hriPosition: 2,
  hriFont: 0,
});
engine.println('');

// Example 3: UPC-A barcode
engine.println('UPC-A:');
engine.printBarcode('012345678905', {
  type: 0, // UPC-A
  moduleWidth: 2,
  height: 60,
  hriPosition: 2,
  hriFont: 0,
});
engine.println('');

// Example 4: Code 128 barcode
engine.println('Code 128:');
engine.printBarcode('ABC-123', {
  type: 7, // Code 128
  moduleWidth: 2,
  height: 50,
  hriPosition: 2,
  hriFont: 0,
});
engine.println('');

// Example 5: Barcode with layout integration
const labelLayout = stack()
  .gap(10)
  .padding(20)
  .text('PRODUCT LABEL', { bold: true })
  .child(
    flex()
      .justify('space-between')
      .text('SKU: ABC-123')
      .text('Price: $19.99')
      .build()
  )
  .build();

engine.render(labelLayout);
engine.println('');
engine.printBarcode('ABC123', {
  type: 4, // Code 39
  moduleWidth: 2,
  height: 40,
  hriPosition: 2,
  hriFont: 0,
});
engine.println('');

engine.formFeed();

// Save output
const output = engine.getOutput();
fs.writeFileSync('output/barcodes.prn', output);
console.log(`Generated ${output.length} bytes`);
