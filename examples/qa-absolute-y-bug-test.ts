/**
 * QA Test: Absolute Y Position Bug Verification
 *
 * This test verifies BUG-02: Y coordinate of absolute positioning not applied
 */
import { LayoutEngine, stack } from '../src/index';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function analyzeBytes(data: Uint8Array, label: string): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));

  // Show raw hex
  const hexParts: string[] = [];
  for (let j = 0; j < Math.min(data.length, 80); j++) {
    hexParts.push((data[j] ?? 0).toString(16).padStart(2, '0'));
  }
  console.log('Raw hex:', hexParts.join(' '));

  // Decode and annotate
  let i = 0;
  console.log('\nCommand sequence:');
  let escJCount = 0;
  let escDollarCount = 0;

  while (i < data.length) {
    const byte1 = data[i];
    const byte2 = data[i + 1];

    if (byte1 === 0x1B) {
      if (byte2 === 0x40) {
        console.log(`  [${i.toString().padStart(3)}] ESC @ (initialize printer)`);
        i += 2;
      } else if (byte2 === 0x24) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const units = nL + nH * 256;
        const dots = units * 6;
        console.log(`  [${i.toString().padStart(3)}] ESC $ nL=${nL} nH=${nH} -> X=${dots} dots`);
        escDollarCount++;
        i += 4;
      } else if (byte2 === 0x4A) {
        const n = data[i + 2] ?? 0;
        const dots = Math.round((n / 180) * 360);
        console.log(`  [${i.toString().padStart(3)}] ESC J n=${n} -> Y advance ${dots} dots`);
        escJCount++;
        i += 3;
      } else {
        console.log(`  [${i.toString().padStart(3)}] ESC 0x${byte2?.toString(16).padStart(2, '0')}`);
        i += 2;
      }
    } else if (byte1 !== undefined && byte1 >= 32 && byte1 < 127) {
      let text = '';
      const startPos = i;
      while (i < data.length && data[i] !== undefined && data[i]! >= 32 && data[i]! < 127 && data[i] !== 0x1B) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      console.log(`  [${startPos.toString().padStart(3)}] TEXT "${text}"`);
    } else {
      i++;
    }
  }

  console.log(`\nSummary: ${escJCount} ESC J commands, ${escDollarCount} ESC $ commands`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('  QA ABSOLUTE Y POSITION BUG VERIFICATION');
  console.log('='.repeat(70));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Test 1: Absolute position at (0, 0) - should not need positioning
  console.log('\n### Test 1: Absolute position at (0, 0) ###');
  console.log('Expected: No ESC J needed (Y=0 is default)');

  const engine1 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });
  engine1.initialize();
  engine1.render(stack().absolutePosition(0, 0).text('ORIGIN').build());
  const out1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-abs-y-test-origin.prn'), out1);
  analyzeBytes(out1, 'ABSOLUTE (0, 0)');

  // Test 2: Absolute position at (0, 100) - should have Y positioning
  console.log('\n### Test 2: Absolute position at (0, 100) ###');
  console.log('Expected: ESC J to advance to Y=100 (n=50 for 100/2)');

  const engine2 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });
  engine2.initialize();
  engine2.render(stack().absolutePosition(0, 100).text('AT_Y_100').build());
  const out2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-abs-y-test-y100.prn'), out2);
  analyzeBytes(out2, 'ABSOLUTE (0, 100)');

  // Test 3: Absolute position at (200, 300)
  console.log('\n### Test 3: Absolute position at (200, 300) ###');
  console.log('Expected: ESC J for Y=300 (n=150), ESC $ for X=200');

  const engine3 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });
  engine3.initialize();
  engine3.render(stack().absolutePosition(200, 300).text('POSITIONED').build());
  const out3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-abs-y-test-200-300.prn'), out3);
  analyzeBytes(out3, 'ABSOLUTE (200, 300)');

  // Test 4: Multiple absolute elements
  console.log('\n### Test 4: Multiple absolute elements ###');
  console.log('Expected: Multiple ESC J commands for different Y positions');

  const engine4 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });
  engine4.initialize();
  engine4.render(
    stack()
      .add(stack().absolutePosition(0, 60).text('LINE1'))
      .add(stack().absolutePosition(0, 120).text('LINE2'))
      .add(stack().absolutePosition(0, 180).text('LINE3'))
      .build()
  );
  const out4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-abs-y-test-multiple.prn'), out4);
  analyzeBytes(out4, 'MULTIPLE ABSOLUTE ELEMENTS');

  console.log('\n' + '='.repeat(70));
  console.log('  ANALYSIS');
  console.log('='.repeat(70));
  console.log('\nAbsolute positioning should emit:');
  console.log('  1. ESC J to advance to the Y position (if Y > 0)');
  console.log('  2. ESC $ to set the X position (if X > 0 or X != currentX)');
  console.log('\nIf ESC J is missing for Y > 0 positions, there is a bug.');
}

main().catch(console.error);
