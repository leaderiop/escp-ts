/**
 * QA PRN Analysis: Flex Layout Positioning Commands
 *
 * This test creates simple flex layouts and analyzes the ESC/P commands
 * generated to verify correct horizontal positioning.
 *
 * ESC/P Commands of Interest:
 * - ESC $ nL nH (0x1B 0x24 nL nH): Absolute horizontal position
 *   Position in dots = (nL + nH * 256) * 6 (at 360 DPI, units are 1/60 inch)
 * - ESC J n (0x1B 0x4A n): Advance vertical position by n/180 inch
 */
import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview } from '../../_helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Paper with zero margins for precise position analysis
const ZERO_MARGIN_PAPER = {
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  linesPerPage: 66,
};

interface PositionRecord {
  type: 'ESC_$' | 'ESC_J' | 'text' | 'ESC_@' | 'other';
  byteOffset: number;
  hexBytes: string;
  value?: number;
  dotsCalculated?: number;
  textContent?: string;
}

/**
 * Parse PRN data and extract positioning commands
 */
function parsePrnCommands(data: Uint8Array): PositionRecord[] {
  const records: PositionRecord[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1b) {
      // ESC
      const nextByte = data[i + 1];

      if (nextByte === 0x24) {
        // ESC $
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const position = nL + nH * 256;
        const dots = position * 6; // Convert 1/60 inch to dots at 360 DPI
        records.push({
          type: 'ESC_$',
          byteOffset: i,
          hexBytes: `1B 24 ${nL.toString(16).padStart(2, '0').toUpperCase()} ${nH.toString(16).padStart(2, '0').toUpperCase()}`,
          value: position,
          dotsCalculated: dots,
        });
        i += 4;
      } else if (nextByte === 0x4a) {
        // ESC J
        const n = data[i + 2] ?? 0;
        const dots = Math.round((n / 180) * 360); // n/180 inch to dots
        records.push({
          type: 'ESC_J',
          byteOffset: i,
          hexBytes: `1B 4A ${n.toString(16).padStart(2, '0').toUpperCase()}`,
          value: n,
          dotsCalculated: dots,
        });
        i += 3;
      } else if (nextByte === 0x40) {
        // ESC @
        records.push({
          type: 'ESC_@',
          byteOffset: i,
          hexBytes: '1B 40',
        });
        i += 2;
      } else {
        records.push({
          type: 'other',
          byteOffset: i,
          hexBytes: `1B ${(nextByte ?? 0).toString(16).padStart(2, '0').toUpperCase()}`,
        });
        // Skip command bytes
        i += 2;
        // Skip additional parameter bytes for known commands
        if (nextByte === 0x45 || nextByte === 0x46)
          i += 0; // Bold on/off
        else if (nextByte === 0x57)
          i += 1; // Double width
        else if (nextByte === 0x77) i += 1; // Double height
      }
    } else if (byte !== undefined && byte >= 0x20 && byte < 0x7f) {
      // Printable ASCII - collect text
      let textStart = i;
      let text = '';
      while (i < data.length && data[i] !== undefined && data[i]! >= 0x20 && data[i]! < 0x7f) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      records.push({
        type: 'text',
        byteOffset: textStart,
        hexBytes: text
          .split('')
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
          .join(' '),
        textContent: text,
      });
    } else {
      i++;
    }
  }

  return records;
}

/**
 * Analyze and report on positioning commands
 */
function analyzePositioning(label: string, data: Uint8Array): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));

  const records = parsePrnCommands(data);

  let currentX = 0;
  let currentY = 0;

  console.log('\nCommand Sequence:');
  console.log('-'.repeat(70));

  for (const record of records) {
    if (record.type === 'ESC_$') {
      console.log(
        `  [${record.byteOffset.toString().padStart(4)}] ESC $ : X = ${record.dotsCalculated} dots (was ${currentX})`
      );
      console.log(`         Hex: ${record.hexBytes}`);
      console.log(`         Units: ${record.value} * 6 = ${record.dotsCalculated} dots`);
      currentX = record.dotsCalculated ?? 0;
    } else if (record.type === 'ESC_J') {
      console.log(
        `  [${record.byteOffset.toString().padStart(4)}] ESC J : Y += ${record.dotsCalculated} dots (Y now ${currentY + (record.dotsCalculated ?? 0)})`
      );
      console.log(`         Hex: ${record.hexBytes}`);
      console.log(`         Units: ${record.value}/180 inch = ${record.dotsCalculated} dots`);
      currentY += record.dotsCalculated ?? 0;
    } else if (record.type === 'text') {
      const charWidth = 36; // At 10 CPI, each char is 36 dots
      const textWidth = (record.textContent?.length ?? 0) * charWidth;
      console.log(
        `  [${record.byteOffset.toString().padStart(4)}] TEXT  : "${record.textContent}" at X=${currentX}`
      );
      console.log(
        `         Width: ${record.textContent?.length} chars * ${charWidth} = ${textWidth} dots`
      );
      currentX += textWidth;
    } else if (record.type === 'ESC_@') {
      console.log(
        `  [${record.byteOffset.toString().padStart(4)}] ESC @ : Initialize printer (reset)`
      );
      currentX = 0;
      currentY = 0;
    }
  }

  console.log('-'.repeat(70));
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('  QA PRN ANALYSIS: FLEX LAYOUT POSITIONING');
  console.log('='.repeat(70));
  console.log('\nThis test analyzes ESC/P positioning commands generated by flex layouts.');
  console.log('All tests use zero margins for precise position analysis.\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ========================================
  // Test 1: Simple flex with no gap
  // ========================================
  console.log('\n### TEST 1: Flex justify=start, gap=0, items: A, B, C ###');
  console.log('Expected: Text should print sequentially without ESC $ commands');
  console.log('At 10 CPI: A at 0, B at 36, C at 72 (each char 36 dots wide)');

  const engine1 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine1.initialize();
  engine1.render(
    flex()
      .justify('start')
      .gap(0)
      .add(stack().text('A'))
      .add(stack().text('B'))
      .add(stack().text('C'))
      .build()
  );

  const prn1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-flex-01-no-gap.prn'), prn1);
  analyzePositioning('Test 1: Flex gap=0', prn1);
  await renderPreview(prn1, 'Test 1: Flex gap=0', 'qa-prn-flex-01-no-gap', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 2: Flex with gap
  // ========================================
  console.log('\n### TEST 2: Flex justify=start, gap=36, items: A, B, C ###');
  console.log('Expected: A at 0, B at 72 (36+36), C at 144 (72+36+36)');
  console.log('Should see ESC $ commands to position B and C');

  const engine2 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine2.initialize();
  engine2.render(
    flex()
      .justify('start')
      .gap(36)
      .add(stack().text('A'))
      .add(stack().text('B'))
      .add(stack().text('C'))
      .build()
  );

  const prn2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-flex-02-gap-36.prn'), prn2);
  analyzePositioning('Test 2: Flex gap=36', prn2);
  await renderPreview(prn2, 'Test 2: Flex gap=36', 'qa-prn-flex-02-gap-36', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 3: Flex justify=end
  // ========================================
  console.log('\n### TEST 3: Flex justify=end, gap=0 ###');
  console.log('Expected: Items should be pushed to right side of container');
  console.log('Page width at 360 DPI = 8.5 * 360 = 3060 dots');
  console.log('3 chars = 108 dots, so first item should start at 3060 - 108 = 2952 dots');

  const engine3 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine3.initialize();
  engine3.render(
    flex()
      .justify('end')
      .gap(0)
      .add(stack().text('A'))
      .add(stack().text('B'))
      .add(stack().text('C'))
      .build()
  );

  const prn3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-flex-03-justify-end.prn'), prn3);
  analyzePositioning('Test 3: Flex justify=end', prn3);
  await renderPreview(prn3, 'Test 3: Flex justify=end', 'qa-prn-flex-03-justify-end', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 4: Flex justify=center
  // ========================================
  console.log('\n### TEST 4: Flex justify=center, gap=0 ###');
  console.log('Expected: Items centered in container');
  console.log('Center offset = (3060 - 108) / 2 = 1476 dots');

  const engine4 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine4.initialize();
  engine4.render(
    flex()
      .justify('center')
      .gap(0)
      .add(stack().text('A'))
      .add(stack().text('B'))
      .add(stack().text('C'))
      .build()
  );

  const prn4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-flex-04-justify-center.prn'), prn4);
  analyzePositioning('Test 4: Flex justify=center', prn4);
  await renderPreview(prn4, 'Test 4: Flex justify=center', 'qa-prn-flex-04-justify-center', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 5: Flex justify=space-between
  // ========================================
  console.log('\n### TEST 5: Flex justify=space-between, 3 items ###');
  console.log('Expected: First at 0, Last at 3060-36=3024, Middle at midpoint');
  console.log('Space = (3060 - 108) / 2 = 1476 dots between items');
  console.log('Positions: A=0, B=0+36+1476=1512, C=1512+36+1476=3024');

  const engine5 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine5.initialize();
  engine5.render(
    flex()
      .justify('space-between')
      .gap(0)
      .add(stack().text('A'))
      .add(stack().text('B'))
      .add(stack().text('C'))
      .build()
  );

  const prn5 = engine5.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-flex-05-space-between.prn'), prn5);
  analyzePositioning('Test 5: Flex justify=space-between', prn5);
  await renderPreview(prn5, 'Test 5: Flex justify=space-between', 'qa-prn-flex-05-space-between', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Test 6: Flex with explicit width constraint
  // ========================================
  console.log('\n### TEST 6: Flex with explicit width=500, justify=space-between ###');
  console.log('Expected: Items distributed within 500 dot width');
  console.log('Space = (500 - 108) / 2 = 196 dots between items');

  const engine6 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine6.initialize();
  engine6.render(
    flex()
      .width(500)
      .justify('space-between')
      .gap(0)
      .add(stack().text('A'))
      .add(stack().text('B'))
      .add(stack().text('C'))
      .build()
  );

  const prn6 = engine6.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-flex-06-width-constraint.prn'), prn6);
  analyzePositioning('Test 6: Flex width=500 space-between', prn6);
  await renderPreview(prn6, 'Test 6: Flex width=500', 'qa-prn-flex-06-width-constraint', {
    paper: ZERO_MARGIN_PAPER,
  });

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('  VERIFICATION CHECKLIST');
  console.log('='.repeat(70));
  console.log(`
ESC $ Command (1B 24 nL nH):
  - Position in 1/60 inch units
  - Dots = (nL + nH * 256) * 6 at 360 DPI
  - Maximum position = 65535 * 6 = 393,210 dots

Character Width at 10 CPI:
  - Each character = 36 dots (360 DPI / 10 CPI)

Verify:
  [1] gap=0 should not emit ESC $ between sequential items
  [2] gap>0 should emit ESC $ to skip gap distance
  [3] justify=end should emit ESC $ to start position
  [4] justify=center should emit ESC $ to center position
  [5] justify=space-between should distribute items evenly
  [6] Width constraint should affect distribution calculations
`);
}

main().catch(console.error);
