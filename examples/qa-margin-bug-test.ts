/**
 * QA Test: Margin Bug Verification
 *
 * This test verifies BUG-01: First element not positioned when margin exists
 *
 * The renderer initializes currentX to startX (the margin), but the printer
 * head is actually at position 0 after ESC @. This means the first ESC $
 * command is skipped because the code thinks we're already at the margin.
 */
import { LayoutEngine, stack, grid } from '../src/index';
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
        console.log(`  [${i.toString().padStart(3)}] ESC $ nL=${nL} nH=${nH} -> position at ${units} units = ${dots} dots`);
        i += 4;
      } else if (byte2 === 0x4A) {
        const n = data[i + 2] ?? 0;
        const dots = Math.round((n / 180) * 360);
        console.log(`  [${i.toString().padStart(3)}] ESC J n=${n} -> advance ${dots} dots vertically`);
        i += 3;
      } else if (byte2 === 0x45) {
        console.log(`  [${i.toString().padStart(3)}] ESC E (bold on)`);
        i += 2;
      } else if (byte2 === 0x46) {
        console.log(`  [${i.toString().padStart(3)}] ESC F (bold off)`);
        i += 2;
      } else {
        console.log(`  [${i.toString().padStart(3)}] ESC 0x${byte2?.toString(16).padStart(2, '0')} (other command)`);
        i += 2;
      }
    } else if (byte1 !== undefined && byte1 >= 32 && byte1 < 127) {
      // Printable text
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
}

async function main() {
  console.log('='.repeat(70));
  console.log('  QA MARGIN BUG VERIFICATION TEST');
  console.log('='.repeat(70));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Test 1: NO margin - should NOT have ESC $ before first text
  console.log('\n### Test 1: Grid with NO margin (left=0) ###');
  console.log('Expected: Text at X=0, no initial ESC $ needed');

  const engine1 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      linesPerPage: 66,
    },
  });
  engine1.initialize();
  engine1.render(grid([100, 100]).columnGap(10).cell('A').cell('B').row().build());
  const out1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-margin-test-no-margin.prn'), out1);
  analyzeBytes(out1, 'NO MARGIN (left=0)');

  // Test 2: WITH margin of 100 dots - SHOULD have ESC $ before first text
  console.log('\n### Test 2: Grid with left margin=100 ###');
  console.log('Expected: ESC $ to position 17 units (102 dots) before first text');
  console.log('BUG: First text may print at X=0 if ESC $ is missing');

  const engine2 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 100, right: 0 },
      linesPerPage: 66,
    },
  });
  engine2.initialize();
  engine2.render(grid([100, 100]).columnGap(10).cell('A').cell('B').row().build());
  const out2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-margin-test-with-margin.prn'), out2);
  analyzeBytes(out2, 'WITH MARGIN (left=100)');

  // Test 3: Large margin of 360 dots (1 inch)
  console.log('\n### Test 3: Grid with left margin=360 (1 inch) ###');
  console.log('Expected: ESC $ to position 60 units (360 dots) before first text');

  const engine3 = new LayoutEngine({
    defaultPaper: {
      widthInches: 8.5,
      heightInches: 11,
      margins: { top: 0, bottom: 0, left: 360, right: 0 },
      linesPerPage: 66,
    },
  });
  engine3.initialize();
  engine3.render(grid([100, 100]).columnGap(10).cell('X').cell('Y').row().build());
  const out3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-margin-test-large-margin.prn'), out3);
  analyzeBytes(out3, 'LARGE MARGIN (left=360)');

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  BUG ANALYSIS');
  console.log('='.repeat(70));
  console.log('\nIn renderer.ts lines 595-596:');
  console.log('  const ctx: RenderContext = {');
  console.log('    currentX: options.startX ?? 0,');
  console.log('    ...');
  console.log('  };');
  console.log('\nThis initializes currentX to the margin value. However, after');
  console.log('ESC @ (initialize), the printer head is at physical position 0.');
  console.log('\nWhen moveToX() is called with x=100 (the margin position):');
  console.log('  Math.abs(ctx.currentX - x) = Math.abs(100 - 100) = 0');
  console.log('  0 is NOT > 1, so ESC $ is NOT emitted');
  console.log('\nResult: Text prints at X=0 instead of X=100');
  console.log('\nFix: Initialize currentX to 0, not startX. Or always emit initial ESC $.');
}

main().catch(console.error);
