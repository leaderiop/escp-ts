/**
 * Example 03: Graphics Printing
 *
 * Demonstrates image printing with dithering options.
 *
 * Run: npx tsx examples/03-graphics.ts
 */

import {
  LayoutEngine,
  createTestPattern,
  createCheckerboard,
  type GrayscaleImage,
  type DitheringMethod,
} from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

// Create a gradient test pattern
function createGradient(width: number, height: number): GrayscaleImage {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Horizontal gradient from black to white
      data[y * width + x] = Math.floor((x / width) * 255);
    }
  }
  return { width, height, data };
}

// Create a circular gradient
function createRadialGradient(size: number): GrayscaleImage {
  const data = new Uint8Array(size * size);
  const center = size / 2;
  const maxDist = Math.sqrt(2) * center;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const value = Math.floor((1 - dist / maxDist) * 255);
      data[y * size + x] = Math.max(0, value);
    }
  }
  return { width: size, height: size, data };
}

async function main() {
  printSection('Graphics Printing Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  // Initialize and print header
  engine.initialize();
  engine.setBold(true).println('Graphics Test Page').setBold(false);
  engine.println('');

  // Print images with different dithering methods
  const ditheringMethods: DitheringMethod[] = ['none', 'threshold', 'ordered', 'floydSteinberg'];

  for (const method of ditheringMethods) {
    engine.println(`Dithering: ${method}`);

    // Create a gradient for this demo
    const gradient = createGradient(200, 48);
    engine.printImage(gradient, { dithering: method });
    engine.println('');
  }

  // Print built-in test patterns
  engine.println('Built-in test pattern:');
  const testPattern = createTestPattern(200, 24);
  engine.printImage(testPattern, { dithering: 'none' });
  engine.println('');

  engine.println('Checkerboard pattern:');
  const checker = createCheckerboard(200, 24, 4);
  engine.printImage(checker, { dithering: 'none' });
  engine.println('');

  // Print a radial gradient
  engine.println('Radial gradient (Floyd-Steinberg):');
  const radial = createRadialGradient(100);
  engine.printImage(radial, { dithering: 'floydSteinberg' });
  engine.println('');

  engine.formFeed();

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Graphics Printing Demo', '03-graphics');
}

main().catch(console.error);
