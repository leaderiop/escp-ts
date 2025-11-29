/**
 * Example 28: Graphics Modes
 *
 * Demonstrates different graphics resolution modes:
 * - 8-pin modes: Single density (60 DPI) to Quad density (240 DPI)
 * - 24-pin modes: Single density (60 DPI) to Hex density (360 DPI)
 * - Comparison of quality vs speed tradeoffs
 *
 * Run: npx tsx examples/28-graphics-modes.ts
 */

import {
  LayoutEngine,
  BIT_IMAGE_MODE,
  GRAPHICS_MODES,
  createTestPattern,
  createCheckerboard,
  type GrayscaleImage,
  type BitImageMode,
} from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

// Create a gradient test pattern
function createGradient(width: number, height: number): GrayscaleImage {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Horizontal gradient from white to black
      data[y * width + x] = Math.floor((x / width) * 255);
    }
  }
  return { width, height, data };
}

// Create simple shapes for resolution testing
function createResolutionTest(width: number, height: number): GrayscaleImage {
  const data = new Uint8Array(width * height);
  data.fill(255); // Start with white

  // Draw vertical lines of varying thickness
  for (let x = 0; x < width; x++) {
    const lineGroup = Math.floor(x / 20);
    const thickness = lineGroup + 1;
    const posInGroup = x % 20;

    if (posInGroup < thickness) {
      for (let y = 0; y < height; y++) {
        data[y * width + x] = 0; // Black
      }
    }
  }

  return { width, height, data };
}

async function main() {
  printSection('Graphics Modes Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Header
  engine.setBold(true);
  engine.setDoubleWidth(true);
  engine.println('GRAPHICS MODES COMPARISON');
  engine.setDoubleWidth(false);
  engine.setBold(false);
  engine.println('========================================');
  engine.println('');

  engine.println('ESC/P2 supports multiple graphics modes with different');
  engine.println('resolutions. Higher DPI = better quality but slower printing.');
  engine.println('');

  // Create test images
  const smallGradient = createGradient(120, 24);
  const checker = createCheckerboard(120, 24, 4);
  const resTest = createResolutionTest(120, 24);

  // 24-pin modes (most common for LQ-2090II)
  engine.println('----------------------------------------');
  engine.setBold(true).println('24-PIN GRAPHICS MODES').setBold(false);
  engine.println('');

  const modes24pin: Array<{ mode: BitImageMode; name: string; dpi: number }> = [
    { mode: BIT_IMAGE_MODE.SINGLE_DENSITY_24PIN, name: 'Single Density', dpi: 60 },
    { mode: BIT_IMAGE_MODE.CRT_III_24PIN, name: 'CRT III', dpi: 90 },
    { mode: BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN, name: 'Double Density', dpi: 120 },
    { mode: BIT_IMAGE_MODE.HIGH_SPEED_DOUBLE_24PIN, name: 'High-Speed Double', dpi: 120 },
    { mode: BIT_IMAGE_MODE.TRIPLE_DENSITY_24PIN, name: 'Triple Density', dpi: 180 },
    { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN, name: 'Hex Density', dpi: 360 },
  ];

  for (const modeInfo of modes24pin) {
    const info = GRAPHICS_MODES[modeInfo.mode];
    engine.println(`${modeInfo.name} (${modeInfo.dpi} DPI, ${info.pins}-pin):`);
    engine.printImage(smallGradient, { mode: modeInfo.mode, dithering: 'ordered' });
    engine.println('');
  }

  engine.println('');

  // 8-pin modes (legacy compatibility)
  engine.println('----------------------------------------');
  engine.setBold(true).println('8-PIN GRAPHICS MODES (Legacy)').setBold(false);
  engine.println('');

  const modes8pin: Array<{ mode: BitImageMode; name: string; dpi: number }> = [
    { mode: BIT_IMAGE_MODE.SINGLE_DENSITY_8PIN, name: 'Single Density', dpi: 60 },
    { mode: BIT_IMAGE_MODE.CRT_I_8PIN, name: 'CRT I', dpi: 72 },
    { mode: BIT_IMAGE_MODE.PLOTTER_8PIN, name: 'Plotter', dpi: 80 },
    { mode: BIT_IMAGE_MODE.CRT_II_8PIN, name: 'CRT II', dpi: 90 },
    { mode: BIT_IMAGE_MODE.DOUBLE_DENSITY_8PIN, name: 'Double Density', dpi: 120 },
    { mode: BIT_IMAGE_MODE.QUAD_DENSITY_8PIN, name: 'Quad Density', dpi: 240 },
  ];

  for (const modeInfo of modes8pin) {
    const info = GRAPHICS_MODES[modeInfo.mode];
    engine.println(`${modeInfo.name} (${modeInfo.dpi} DPI, ${info.pins}-pin):`);
    engine.printImage(smallGradient, { mode: modeInfo.mode, dithering: 'ordered' });
    engine.println('');
  }

  engine.println('');

  // Resolution comparison with checker pattern
  engine.println('----------------------------------------');
  engine.setBold(true).println('RESOLUTION COMPARISON (Checkerboard)').setBold(false);
  engine.println('Same pattern at different resolutions:');
  engine.println('');

  const compareChecker = createCheckerboard(100, 24, 2);

  const compareModes: Array<{ mode: BitImageMode; name: string }> = [
    { mode: BIT_IMAGE_MODE.SINGLE_DENSITY_24PIN, name: '60 DPI' },
    { mode: BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN, name: '120 DPI' },
    { mode: BIT_IMAGE_MODE.TRIPLE_DENSITY_24PIN, name: '180 DPI' },
    { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN, name: '360 DPI' },
  ];

  for (const modeInfo of compareModes) {
    engine.print(`${modeInfo.name}: `);
    engine.newLine();
    engine.printImage(compareChecker, { mode: modeInfo.mode, dithering: 'none' });
    engine.println('');
  }

  engine.println('');

  // Built-in test patterns
  engine.println('----------------------------------------');
  engine.setBold(true).println('BUILT-IN TEST PATTERNS').setBold(false);
  engine.println('');

  engine.println('Test Pattern (360 DPI):');
  const testPattern = createTestPattern(200, 24);
  engine.printImage(testPattern, { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN, dithering: 'none' });
  engine.println('');

  engine.println('Checkerboard 4px (360 DPI):');
  const checker4 = createCheckerboard(200, 24, 4);
  engine.printImage(checker4, { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN, dithering: 'none' });
  engine.println('');

  engine.println('Checkerboard 8px (360 DPI):');
  const checker8 = createCheckerboard(200, 24, 8);
  engine.printImage(checker8, { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN, dithering: 'none' });
  engine.println('');

  // Mode characteristics
  engine.println('----------------------------------------');
  engine.setBold(true).println('MODE CHARACTERISTICS').setBold(false);
  engine.println('');
  engine.println('Mode              Pins  DPI  Adjacent  Best For');
  engine.println('--------------------------------------------------------');
  engine.println('Single 24-pin     24    60   Yes       Fast draft');
  engine.println('Double 24-pin     24   120   No        Standard');
  engine.println('HS Double 24-pin  24   120   Yes       Faster 120 DPI');
  engine.println('Triple 24-pin     24   180   Yes       Good quality');
  engine.println('Hex 24-pin        24   360   Yes       Best quality');
  engine.println('');
  engine.println('Adjacent dots: Can adjacent columns be printed?');
  engine.println('  Yes = fuller blacks, No = potential gaps');

  engine.println('');
  engine.println('----------------------------------------');
  engine.setBold(true).println('NOTE').setBold(false);
  engine.println('24-pin modes provide better vertical resolution.');
  engine.println('360 DPI (Hex Density) is highest quality but slowest.');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Graphics Modes Demo', '28-graphics-modes');
}

main().catch(console.error);
