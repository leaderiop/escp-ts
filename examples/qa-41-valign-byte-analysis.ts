/**
 * QA Test 41: Row Stack vAlign Byte-Level Analysis
 *
 * FOCUSED TEST: Verify vAlign creates correct Y offsets in PRN output
 *
 * When items of different heights are placed in a row stack with vAlign,
 * shorter items should be offset within the row's maximum height.
 *
 * Expected behavior for vAlign=center with heights [30, 90, 30]:
 * - Row height = 90 (max)
 * - Item 0 (h=30): Y offset = (90-30)/2 = 30
 * - Item 1 (h=90): Y offset = 0
 * - Item 2 (h=30): Y offset = (90-30)/2 = 30
 *
 * Run: npx tsx examples/qa-41-valign-byte-analysis.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test 41: vAlign Byte-Level Analysis');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(40)
    .padding(30)

    .text('vAlign BYTE-LEVEL VERIFICATION', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')

    // ============================================================
    // TEST 1: vAlign=top (baseline - all start at same Y)
    // ============================================================
    .text('TEST 1: vAlign=TOP (all items at row top)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('top')
        .gap(30)
        // Padding creates different heights: 10*2=20, 40*2=80, 10*2=20
        .add(stack().width(200).padding(10).text('Pad:10'))   // Height ~30
        .add(stack().width(200).padding(40).text('Pad:40'))   // Height ~90
        .add(stack().width(200).padding(10).text('Pad:10'))   // Height ~30
    )

    // ============================================================
    // TEST 2: vAlign=center (shorter items offset down)
    // ============================================================
    .text('TEST 2: vAlign=CENTER (shorter items offset)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(30)
        .add(stack().width(200).padding(10).text('Pad:10'))
        .add(stack().width(200).padding(40).text('Pad:40'))
        .add(stack().width(200).padding(10).text('Pad:10'))
    )

    // ============================================================
    // TEST 3: vAlign=bottom (shorter items at bottom)
    // ============================================================
    .text('TEST 3: vAlign=BOTTOM (shorter items at row bottom)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('bottom')
        .gap(30)
        .add(stack().width(200).padding(10).text('Pad:10'))
        .add(stack().width(200).padding(40).text('Pad:40'))
        .add(stack().width(200).padding(10).text('Pad:10'))
    )

    // ============================================================
    // TEST 4: Explicit heights for precise verification
    // ============================================================
    .text('TEST 4: Explicit heights [50, 100, 50] with vAlign=center', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(30)
        .add(stack().width(200).height(50).text('H:50'))   // Y offset = 25
        .add(stack().width(200).height(100).text('H:100')) // Y offset = 0
        .add(stack().width(200).height(50).text('H:50'))   // Y offset = 25
    )

    // ============================================================
    // TEST 5: Multi-line content alignment
    // ============================================================
    .text('TEST 5: Multi-line content vAlign=center', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(30)
        .add(
          stack()
            .width(250)
            .padding(5)
            .text('One line')
        )
        .add(
          stack()
            .width(250)
            .padding(5)
            .text('Line 1')
            .text('Line 2')
            .text('Line 3')
            .text('Line 4')
        )
        .add(
          stack()
            .width(250)
            .padding(5)
            .text('One line')
        )
    )

    .line('-', 'fill')
    .text('End of vAlign Byte Analysis', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();

  await renderPreview(commands, 'QA: vAlign Byte Analysis', 'qa-41-valign-byte-analysis');

  // Analyze the byte output
  console.log('\n' + '='.repeat(70));
  console.log('vAlign POSITION ANALYSIS');
  console.log('='.repeat(70));

  analyzeVAlignPositions(commands);
}

/**
 * Analyze PRN for vAlign-related positioning
 */
function analyzeVAlignPositions(data: Uint8Array) {
  let i = 0;
  const positions: { offset: number; x: number; y: number }[] = [];
  let currentY = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1B && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC J n - Advance vertical
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        currentY += n;
        i += 3;
        continue;
      }

      // ESC $ nL nH - Horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const x = nL + nH * 256;
        positions.push({ offset: i, x, y: currentY });
        i += 4;
        continue;
      }
    }

    i++;
  }

  // Group positions by approximate Y to identify rows
  const rowGroups = new Map<number, { x: number; y: number }[]>();

  positions.forEach(pos => {
    // Round Y to nearest 10 to group items in the same row
    const rowKey = Math.floor(pos.y / 50) * 50;
    if (!rowGroups.has(rowKey)) {
      rowGroups.set(rowKey, []);
    }
    rowGroups.get(rowKey)?.push(pos);
  });

  console.log('\nPositions by Row Group (Y rounded to 50):');
  console.log('-'.repeat(60));

  const sortedRows = [...rowGroups.entries()].sort((a, b) => a[0] - b[0]);

  sortedRows.forEach(([rowY, items]) => {
    if (items.length > 1) {
      console.log(`\nRow at Y~${rowY}:`);
      const sortedItems = items.sort((a, b) => a.x - b.x);
      sortedItems.forEach((item, idx) => {
        console.log(`  Item ${idx}: X=${item.x}, Y=${item.y}`);
      });

      // Check for vAlign patterns
      const yValues = items.map(i => i.y);
      const uniqueY = [...new Set(yValues)];
      if (uniqueY.length > 1) {
        console.log(`  [INFO] Multiple Y values in row: ${uniqueY.join(', ')}`);
        console.log(`  [INFO] Y offset range: ${Math.max(...yValues) - Math.min(...yValues)} dots`);
      }
    }
  });

  // Summary
  console.log('\n' + '-'.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Total ESC $ commands: ${positions.length}`);
  console.log(`Rows identified: ${rowGroups.size}`);

  // Look for vAlign patterns - rows with 3 items where middle has different Y
  console.log('\nvAlign Pattern Detection:');
  sortedRows.forEach(([rowY, items]) => {
    if (items.length === 3) {
      const sorted = items.sort((a, b) => a.x - b.x);
      const y0 = sorted[0]?.y ?? 0;
      const y1 = sorted[1]?.y ?? 0;
      const y2 = sorted[2]?.y ?? 0;

      if (y0 === y2 && y1 !== y0) {
        const offset = y0 - y1;
        console.log(`  Row Y~${rowY}: Center item Y differs by ${offset} dots`);
        if (offset > 0) {
          console.log(`    -> Indicates vAlign=center or vAlign=bottom with offset`);
        }
      } else if (y0 === y1 && y1 === y2) {
        console.log(`  Row Y~${rowY}: All items at same Y (vAlign=top or equal heights)`);
      }
    }
  });
}

main().catch(console.error);
