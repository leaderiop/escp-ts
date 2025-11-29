/**
 * QA PRN Analysis: Stack Layout Vertical Spacing Commands
 *
 * This test creates stack layouts and analyzes the ESC/P commands
 * generated for vertical positioning.
 *
 * ESC/P Commands of Interest:
 * - ESC J n (0x1B 0x4A n): Advance vertical by n/180 inch
 *   Dots = (n / 180) * 360 at 360 DPI = n * 2
 * - ESC $ nL nH (0x1B 0x24 nL nH): Absolute horizontal position
 *   For returning to left margin after each line
 */
import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview } from './_helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const ZERO_MARGIN_PAPER = {
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  linesPerPage: 66,
};

interface CommandRecord {
  type: string;
  byteOffset: number;
  hexBytes: string;
  value?: number;
  dots?: number;
  text?: string;
}

function parsePrnForVertical(data: Uint8Array): CommandRecord[] {
  const records: CommandRecord[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1b) {
      const next = data[i + 1];

      if (next === 0x4a) {
        // ESC J
        const n = data[i + 2] ?? 0;
        records.push({
          type: 'ESC_J',
          byteOffset: i,
          hexBytes: `1B 4A ${n.toString(16).padStart(2, '0').toUpperCase()}`,
          value: n,
          dots: n * 2, // n/180 inch * 360 DPI = n * 2
        });
        i += 3;
      } else if (next === 0x24) {
        // ESC $
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const pos = nL + nH * 256;
        records.push({
          type: 'ESC_$',
          byteOffset: i,
          hexBytes: `1B 24 ${nL.toString(16).padStart(2, '0').toUpperCase()} ${nH.toString(16).padStart(2, '0').toUpperCase()}`,
          value: pos,
          dots: pos * 6,
        });
        i += 4;
      } else if (next === 0x40) {
        // ESC @
        records.push({
          type: 'ESC_@',
          byteOffset: i,
          hexBytes: '1B 40',
        });
        i += 2;
      } else {
        i += 2;
      }
    } else if (byte !== undefined && byte >= 0x20 && byte < 0x7f) {
      let text = '';
      const start = i;
      while (i < data.length && data[i] !== undefined && data[i]! >= 0x20 && data[i]! < 0x7f) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      records.push({
        type: 'TEXT',
        byteOffset: start,
        hexBytes: '',
        text,
      });
    } else {
      i++;
    }
  }

  return records;
}

function analyzeVertical(label: string, data: Uint8Array): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));

  const records = parsePrnForVertical(data);

  let currentX = 0;
  let currentY = 0;

  console.log('\nVertical Position Analysis:');
  console.log('-'.repeat(70));

  for (const record of records) {
    switch (record.type) {
      case 'ESC_@':
        console.log(`  [${record.byteOffset.toString().padStart(4)}] RESET : X=0, Y=0`);
        currentX = 0;
        currentY = 0;
        break;
      case 'ESC_J':
        console.log(
          `  [${record.byteOffset.toString().padStart(4)}] ESC J : Y += ${record.dots} dots (${record.value}/180")`
        );
        console.log(`         Hex: ${record.hexBytes}`);
        console.log(`         Y was ${currentY}, now ${currentY + (record.dots ?? 0)}`);
        currentY += record.dots ?? 0;
        break;
      case 'ESC_$':
        console.log(
          `  [${record.byteOffset.toString().padStart(4)}] ESC $ : X = ${record.dots} dots (${record.value} units)`
        );
        console.log(`         Hex: ${record.hexBytes}`);
        currentX = record.dots ?? 0;
        break;
      case 'TEXT':
        const width = (record.text?.length ?? 0) * 36;
        console.log(
          `  [${record.byteOffset.toString().padStart(4)}] TEXT  : "${record.text}" at (${currentX}, ${currentY})`
        );
        currentX += width;
        break;
    }
  }

  console.log('-'.repeat(70));
  console.log(`Final Position: (${currentX}, ${currentY})`);
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('  QA PRN ANALYSIS: STACK VERTICAL SPACING');
  console.log('='.repeat(70));
  console.log('\nThis test analyzes ESC J commands for vertical spacing in stacks.\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ========================================
  // Test 1: Stack with no gap
  // ========================================
  console.log('\n### TEST 1: Stack gap=0 ###');
  console.log('Expected: Default line height between items (60 dots = 1/6 inch)');

  const engine1 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine1.initialize();
  engine1.render(stack().gap(0).text('Line1').text('Line2').text('Line3').build());

  const prn1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-stack-01-no-gap.prn'), prn1);
  analyzeVertical('Test 1: Stack gap=0', prn1);
  await renderPreview(prn1, 'Test 1: Stack gap=0', 'qa-prn-stack-01-no-gap', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 2: Stack with gap=60 (1/6 inch)
  // ========================================
  console.log('\n### TEST 2: Stack gap=60 (1/6 inch additional spacing) ###');
  console.log('Expected: 60 (line height) + 60 (gap) = 120 dots between baselines');
  console.log('ESC J with n=60 adds 60*2 = 120 dots');

  const engine2 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine2.initialize();
  engine2.render(stack().gap(60).text('Line1').text('Line2').text('Line3').build());

  const prn2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-stack-02-gap-60.prn'), prn2);
  analyzeVertical('Test 2: Stack gap=60', prn2);
  await renderPreview(prn2, 'Test 2: Stack gap=60', 'qa-prn-stack-02-gap-60', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 3: Stack with gap=120
  // ========================================
  console.log('\n### TEST 3: Stack gap=120 ###');
  console.log('Expected: 60 (line height) + 120 (gap) = 180 dots between baselines');

  const engine3 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine3.initialize();
  engine3.render(stack().gap(120).text('Line1').text('Line2').text('Line3').build());

  const prn3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-stack-03-gap-120.prn'), prn3);
  analyzeVertical('Test 3: Stack gap=120', prn3);
  await renderPreview(prn3, 'Test 3: Stack gap=120', 'qa-prn-stack-03-gap-120', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 4: Stack direction=row (horizontal stack)
  // ========================================
  console.log('\n### TEST 4: Stack direction=row (horizontal) ###');
  console.log('Expected: Items placed horizontally, no ESC J needed');

  const engine4 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine4.initialize();
  engine4.render(stack().direction('row').gap(36).text('A').text('B').text('C').build());

  const prn4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-stack-04-row.prn'), prn4);
  analyzeVertical('Test 4: Stack direction=row', prn4);
  await renderPreview(prn4, 'Test 4: Stack direction=row', 'qa-prn-stack-04-row', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 5: Nested stacks
  // ========================================
  console.log('\n### TEST 5: Nested stacks ###');
  console.log('Expected: Correct accumulation of vertical positions');

  const engine5 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine5.initialize();
  engine5.render(
    stack()
      .gap(30)
      .text('Outer1')
      .add(stack().gap(10).text('Inner1').text('Inner2'))
      .text('Outer2')
      .build()
  );

  const prn5 = engine5.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-stack-05-nested.prn'), prn5);
  analyzeVertical('Test 5: Nested stacks', prn5);
  await renderPreview(prn5, 'Test 5: Nested stacks', 'qa-prn-stack-05-nested', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 6: Stack with center alignment
  // ========================================
  console.log('\n### TEST 6: Stack align=center ###');
  console.log('Expected: ESC $ commands to center each line');

  const engine6 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine6.initialize();
  engine6.render(
    stack().align('center').gap(30).text('Short').text('A longer line').text('X').build()
  );

  const prn6 = engine6.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-stack-06-centered.prn'), prn6);
  analyzeVertical('Test 6: Stack align=center', prn6);
  await renderPreview(prn6, 'Test 6: Stack align=center', 'qa-prn-stack-06-centered', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('  VERIFICATION CHECKLIST');
  console.log('='.repeat(70));
  console.log(`
ESC J Command (1B 4A n):
  - Advances print position vertically
  - n = value in 1/180 inch units
  - Dots at 360 DPI = n * 2

Default Line Height:
  - 60 dots (1/6 inch) at default line spacing

Verify:
  [1] gap=0 should use only default line height
  [2] gap>0 should add to vertical spacing
  [3] Horizontal row stacks should not emit ESC J between items
  [4] Nested stacks should accumulate spacing correctly
  [5] Centered stacks need ESC $ for each line
`);
}

main().catch(console.error);
