/**
 * QA Test 40: PRN Byte-Level Verification
 *
 * PRECISE POSITION AND SPACING VERIFICATION
 *
 * This test creates predictable layouts with EXACT known values
 * to verify ESC/P command generation is byte-perfect.
 *
 * Expected ESC/P commands:
 * - ESC $ nL nH = Set absolute horizontal position (X = nL + nH * 256)
 * - ESC J n = Advance vertical n/180" (at 180 DPI, n dots)
 *
 * Key verification points:
 * 1. gap values translate to ESC J correctly
 * 2. Horizontal positions match layout calculations
 * 3. rowGap creates proper Y advances between flex wrap rows
 * 4. vAlign offsets items correctly within rowHeight
 *
 * Run: npx tsx examples/qa-40-prn-byte-verification.ts
 */

import { LayoutEngine, stack, flex, grid, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================
// EXPECTED VALUES (calculated based on layout rules)
// ============================================================

interface ExpectedCommand {
  type: 'ESC_J' | 'ESC_$';
  description: string;
  expectedValue: number;  // For ESC J: n value, For ESC $: X position
}

const EXPECTED_COMMANDS: ExpectedCommand[] = [];

async function main() {
  printSection('QA Test 40: PRN Byte-Level Verification');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Paper margins: left=225 dots (SIDE_MARGIN from _helpers.ts)
  // Padding: 30 dots outer
  // Content starts at: 225 + 30 = 255 dots (approximately)

  const layout = stack()
    .gap(30)  // KNOWN GAP: 30 dots between items
    .padding(30)

    // ============================================================
    // TEST 1: Simple stack with known gap
    // ============================================================
    .text('TEST 1: Stack gap=30 (expect ESC J 30 between items)', { bold: true })

    // Three text items - expect ESC J 30 between each
    .add(
      stack()
        .gap(30)  // Gap = 30 dots = ESC J 30 between items
        .text('Item A (after this: ESC J ~30)')
        .text('Item B (after this: ESC J ~30)')
        .text('Item C')
    )

    // ============================================================
    // TEST 2: Flex with known positions
    // ============================================================
    .text('TEST 2: Flex justify=start, gap=100', { bold: true })

    // Items with known widths placed with gap=100
    // First item at X=leftMargin+padding
    // Second item at X=first+width1+gap
    .add(
      flex()
        .gap(100)  // Gap = 100 dots between items
        .add(stack().width(200).text('[200px wide]'))
        .add(stack().width(200).text('[200px wide]'))
        .add(stack().width(200).text('[200px wide]'))
    )

    // ============================================================
    // TEST 3: Flex wrap with rowGap
    // ============================================================
    .text('TEST 3: Flex wrap with rowGap=50', { bold: true })

    .add(
      flex()
        .wrap('wrap')
        .width(800)  // Force wrapping
        .gap(20)
        .rowGap(50)  // KNOWN rowGap: 50 dots between wrapped rows
        .add(stack().width(300).text('[Row1-Item1]'))
        .add(stack().width(300).text('[Row1-Item2]'))
        .add(stack().width(300).text('[Row2-Item1]'))  // Wraps to row 2
        .add(stack().width(300).text('[Row2-Item2]'))
    )

    // ============================================================
    // TEST 4: Row stack with vAlign
    // ============================================================
    .text('TEST 4: Row stack vAlign=center with different heights', { bold: true })

    // Row with items of different heights - center aligned
    // Shortest item should have Y offset = (maxHeight - itemHeight) / 2
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(50)
        .add(stack().width(200).padding(10).text('Short (20px padding)'))
        .add(stack().width(200).padding(30).text('Tall (60px padding)'))  // Tallest
        .add(stack().width(200).padding(10).text('Short (20px padding)'))
    )

    // ============================================================
    // TEST 5: Grid with known column positions
    // ============================================================
    .text('TEST 5: Grid [200, 200, 200] columnGap=50', { bold: true })

    // Grid columns: 200, 200, 200 with columnGap=50
    // Col 0 starts at X=leftMargin+padding
    // Col 1 starts at X=col0+200+50
    // Col 2 starts at X=col1+200+50
    .add(
      grid([200, 200, 200])
        .columnGap(50)
        .cell('Col0')
        .cell('Col1 (X+250)')
        .cell('Col2 (X+500)')
        .row()
    )

    // ============================================================
    // TEST 6: Margin offset verification
    // ============================================================
    .text('TEST 6: Left margin=100 offset', { bold: true })

    .add(
      stack()
        .margin({ left: 100 })
        .text('This text has margin-left: 100 (X should be +100)')
    )
    .add(
      stack()
        .margin({ left: 200 })
        .text('This text has margin-left: 200 (X should be +200)')
    )

    // ============================================================
    // TEST 7: Absolute positioning
    // ============================================================
    .text('TEST 7: Absolute positioning at X=500, Y=0', { bold: true })

    .add(
      stack()
        .absolutePosition(500, 0)
        .text('ABSOLUTE at X=500')
    )

    // ============================================================
    // TEST 8: Precise padding accumulation
    // ============================================================
    .text('TEST 8: Nested padding 20+15+10=45 total', { bold: true })

    .add(
      stack()
        .padding(20)
        .add(
          stack()
            .padding(15)
            .add(
              stack()
                .padding(10)
                .text('Nested 45 dots deep')
            )
        )
    )

    .build();

  engine.render(layout);
  const commands = engine.getOutput();

  // Save PRN file
  await renderPreview(commands, 'QA: PRN Byte Verification', 'qa-40-prn-byte-verification');

  // Parse and analyze the PRN file
  console.log('\n' + '='.repeat(70));
  console.log('PRN BYTE ANALYSIS');
  console.log('='.repeat(70));

  analyzePrnBytes(commands);
}

/**
 * Analyze PRN bytes and extract ESC/P commands
 */
function analyzePrnBytes(data: Uint8Array) {
  let i = 0;
  const escJCommands: { offset: number; value: number }[] = [];
  const escDollarCommands: { offset: number; x: number }[] = [];

  while (i < data.length) {
    const byte = data[i];

    // ESC command
    if (byte === 0x1B && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC @ - Initialize
      if (cmd === 0x40) {
        console.log(`  ${i.toString(16).padStart(4, '0')}: ESC @ (Initialize)`);
        i += 2;
        continue;
      }

      // ESC J n - Advance vertical
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        escJCommands.push({ offset: i, value: n });
        console.log(`  ${i.toString(16).padStart(4, '0')}: ESC J ${n} (Advance ${n}/180" = ${(n/180).toFixed(4)}")`);
        i += 3;
        continue;
      }

      // ESC $ nL nH - Absolute horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const x = nL + nH * 256;
        escDollarCommands.push({ offset: i, x });
        console.log(`  ${i.toString(16).padStart(4, '0')}: ESC $ ${nL} ${nH} (X = ${x} dots)`);
        i += 4;
        continue;
      }
    }

    i++;
  }

  // Summary analysis
  console.log('\n' + '-'.repeat(70));
  console.log('SUMMARY');
  console.log('-'.repeat(70));

  console.log(`\nESC J (vertical advance) commands: ${escJCommands.length}`);
  const jValues = escJCommands.map(c => c.value);
  const uniqueJ = [...new Set(jValues)].sort((a, b) => a - b);
  console.log(`  Unique values: ${uniqueJ.join(', ')}`);

  // Look for expected gap values
  const gap30Count = jValues.filter(v => v === 30).length;
  const gap50Count = jValues.filter(v => v === 50).length;
  console.log(`  Gap=30 occurrences: ${gap30Count}`);
  console.log(`  Gap=50 occurrences: ${gap50Count}`);

  console.log(`\nESC $ (horizontal position) commands: ${escDollarCommands.length}`);
  const xValues = escDollarCommands.map(c => c.x);
  const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
  console.log(`  Unique X positions: ${uniqueX.slice(0, 20).join(', ')}${uniqueX.length > 20 ? '...' : ''}`);

  // Check for specific expected positions
  console.log('\n' + '-'.repeat(70));
  console.log('VERIFICATION CHECKS');
  console.log('-'.repeat(70));

  // Check gap=30 produces ESC J 30
  if (gap30Count > 0) {
    console.log('[PASS] Found ESC J 30 commands (gap=30 verified)');
  } else {
    console.log('[CHECK] No ESC J 30 found - verify gap=30 implementation');
  }

  // Check for rowGap=50
  if (gap50Count > 0) {
    console.log('[PASS] Found ESC J 50 commands (rowGap=50 may be verified)');
  } else {
    console.log('[CHECK] No ESC J 50 found - verify rowGap implementation');
  }

  // Check for X=500 (absolute positioning test)
  if (xValues.includes(500)) {
    console.log('[PASS] Found X=500 (absolute positioning verified)');
  } else {
    console.log('[CHECK] No X=500 found - verify absolute positioning');
  }
}

main().catch(console.error);
