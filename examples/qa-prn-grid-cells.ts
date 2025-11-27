/**
 * QA PRN Analysis: Grid Layout Cell Positioning
 *
 * This test creates grid layouts and analyzes the ESC/P commands
 * generated for cell positioning accuracy.
 *
 * Critical Grid Positioning:
 * - Column positions must be exact
 * - Row positions must accumulate correctly
 * - Cell alignment within columns
 * - Gap handling between columns and rows
 */
import { LayoutEngine, grid } from '../src/index';
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

interface GridCommandRecord {
  type: string;
  offset: number;
  hex: string;
  value?: number;
  dots?: number;
  text?: string;
}

function parseGridPrn(data: Uint8Array): GridCommandRecord[] {
  const records: GridCommandRecord[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1B) {
      const next = data[i + 1];

      if (next === 0x24) { // ESC $
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const pos = nL + nH * 256;
        records.push({
          type: 'ESC_$',
          offset: i,
          hex: `1B 24 ${nL.toString(16).padStart(2, '0')} ${nH.toString(16).padStart(2, '0')}`,
          value: pos,
          dots: pos * 6,
        });
        i += 4;
      } else if (next === 0x4A) { // ESC J
        const n = data[i + 2] ?? 0;
        records.push({
          type: 'ESC_J',
          offset: i,
          hex: `1B 4A ${n.toString(16).padStart(2, '0')}`,
          value: n,
          dots: n * 2,
        });
        i += 3;
      } else if (next === 0x40) { // ESC @
        records.push({ type: 'ESC_@', offset: i, hex: '1B 40' });
        i += 2;
      } else {
        i += 2;
      }
    } else if (byte !== undefined && byte >= 0x20 && byte < 0x7F) {
      let text = '';
      const start = i;
      while (i < data.length && data[i] !== undefined && data[i]! >= 0x20 && data[i]! < 0x7F) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      records.push({ type: 'TEXT', offset: start, hex: '', text });
    } else {
      i++;
    }
  }

  return records;
}

function analyzeGrid(label: string, data: Uint8Array, expectedColumns: number[], expectedRows: number): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));
  console.log(`\nExpected Column Positions (dots): ${expectedColumns.join(', ')}`);
  console.log(`Expected Row Count: ${expectedRows}`);

  const records = parseGridPrn(data);

  let currentX = 0;
  let currentY = 0;
  const actualXPositions: number[] = [];
  const actualYPositions: number[] = [0];
  let currentRow = 0;

  console.log('\nCommand Sequence:');
  console.log('-'.repeat(70));

  for (const record of records) {
    switch (record.type) {
      case 'ESC_@':
        console.log(`  [${record.offset.toString().padStart(4)}] RESET`);
        currentX = 0;
        currentY = 0;
        break;
      case 'ESC_$':
        console.log(`  [${record.offset.toString().padStart(4)}] ESC $ -> X = ${record.dots} dots`);
        currentX = record.dots ?? 0;
        if (!actualXPositions.includes(currentX)) {
          actualXPositions.push(currentX);
        }
        break;
      case 'ESC_J':
        console.log(`  [${record.offset.toString().padStart(4)}] ESC J -> Y += ${record.dots} dots (now ${currentY + (record.dots ?? 0)})`);
        currentY += record.dots ?? 0;
        if (!actualYPositions.includes(currentY)) {
          actualYPositions.push(currentY);
          currentRow++;
        }
        break;
      case 'TEXT':
        console.log(`  [${record.offset.toString().padStart(4)}] TEXT  : "${record.text}" at (${currentX}, ${currentY})`);
        currentX += (record.text?.length ?? 0) * 36;
        break;
    }
  }

  actualXPositions.sort((a, b) => a - b);
  actualYPositions.sort((a, b) => a - b);

  console.log('-'.repeat(70));
  console.log('\nPosition Analysis:');
  console.log(`  X positions found: ${actualXPositions.join(', ')}`);
  console.log(`  Y positions found: ${actualYPositions.join(', ')}`);

  // Compare expected vs actual
  console.log('\nColumn Position Verification:');
  for (let i = 0; i < expectedColumns.length; i++) {
    const expected = expectedColumns[i] ?? 0;
    const actual = actualXPositions[i];
    const status = actual === expected ? 'PASS' : 'FAIL';
    console.log(`  Column ${i}: Expected ${expected}, Got ${actual ?? 'N/A'} [${status}]`);
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('  QA PRN ANALYSIS: GRID CELL POSITIONING');
  console.log('='.repeat(70));
  console.log('\nThis test verifies grid column/row positioning accuracy.\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ========================================
  // Test 1: Simple 3-column grid, fixed widths
  // ========================================
  console.log('\n### TEST 1: Grid [100, 100, 100], columnGap=0 ###');
  console.log('Expected columns at: 0, 100, 200 dots');
  console.log('ESC $ units: 0/6=0, 100/6=16.67->17, 200/6=33.33->33');
  console.log('Actual dots after rounding: 0, 102, 198');

  const engine1 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine1.initialize();
  engine1.render(
    grid([100, 100, 100])
      .columnGap(0)
      .cell('A').cell('B').cell('C').row()
      .build()
  );

  const prn1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-01-fixed.prn'), prn1);
  analyzeGrid('Test 1: Grid [100,100,100] gap=0', prn1, [0, 100, 200], 1);
  await renderPreview(prn1, 'Test 1: Grid fixed columns', 'qa-prn-grid-01-fixed', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 2: Grid with column gap
  // ========================================
  console.log('\n### TEST 2: Grid [100, 100, 100], columnGap=20 ###');
  console.log('Expected columns at: 0, 120, 240 dots');

  const engine2 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine2.initialize();
  engine2.render(
    grid([100, 100, 100])
      .columnGap(20)
      .cell('A').cell('B').cell('C').row()
      .build()
  );

  const prn2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-02-col-gap.prn'), prn2);
  analyzeGrid('Test 2: Grid [100,100,100] gap=20', prn2, [0, 120, 240], 1);
  await renderPreview(prn2, 'Test 2: Grid with columnGap', 'qa-prn-grid-02-col-gap', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 3: Multi-row grid
  // ========================================
  console.log('\n### TEST 3: Grid 3x2, columns [100,100,100], rowGap=30 ###');
  console.log('Expected: Row 2 starts at Y = 60 (line height) + 30 (gap) = 90 dots');

  const engine3 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine3.initialize();
  engine3.render(
    grid([100, 100, 100])
      .columnGap(20)
      .rowGap(30)
      .cell('R1C1').cell('R1C2').cell('R1C3').row()
      .cell('R2C1').cell('R2C2').cell('R2C3').row()
      .build()
  );

  const prn3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-03-multi-row.prn'), prn3);
  analyzeGrid('Test 3: Grid 3x2 with gaps', prn3, [0, 120, 240], 2);
  await renderPreview(prn3, 'Test 3: Multi-row grid', 'qa-prn-grid-03-multi-row', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 4: Grid with 'fill' column
  // ========================================
  console.log('\n### TEST 4: Grid [100, "fill", 100] ###');
  console.log('Page width = 3060 dots, fill = 3060 - 100 - 100 = 2860 dots');
  console.log('Expected columns at: 0, 100, 2960');

  const engine4 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine4.initialize();
  engine4.render(
    grid([100, 'fill', 100])
      .columnGap(0)
      .cell('A').cell('MID').cell('Z').row()
      .build()
  );

  const prn4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-04-fill.prn'), prn4);
  analyzeGrid('Test 4: Grid with fill column', prn4, [0, 100, 2960], 1);
  await renderPreview(prn4, 'Test 4: Grid with fill', 'qa-prn-grid-04-fill', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 5: Grid with cell alignment
  // ========================================
  console.log('\n### TEST 5: Grid with right-aligned cells ###');
  console.log('Cell text should be positioned at cell end minus text width');

  const engine5 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine5.initialize();
  engine5.render(
    grid([200, 200, 200])
      .columnGap(0)
      .cell('A', { align: 'right' })
      .cell('BB', { align: 'right' })
      .cell('CCC', { align: 'right' })
      .row()
      .build()
  );

  const prn5 = engine5.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-05-align.prn'), prn5);
  analyzeGrid('Test 5: Grid with alignment', prn5, [0, 200, 400], 1);
  await renderPreview(prn5, 'Test 5: Grid alignment', 'qa-prn-grid-05-align', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 6: Grid with zero gap - adjacent cells
  // ========================================
  console.log('\n### TEST 6: Grid with zero gaps - text should be adjacent ###');
  console.log('Column widths match text width exactly');

  const engine6 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine6.initialize();
  engine6.render(
    grid([36, 36, 36]) // Each column exactly 1 character wide at 10 CPI
      .columnGap(0)
      .cell('A').cell('B').cell('C').row()
      .build()
  );

  const prn6 = engine6.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-06-tight.prn'), prn6);
  analyzeGrid('Test 6: Tight grid', prn6, [0, 36, 72], 1);
  await renderPreview(prn6, 'Test 6: Tight grid', 'qa-prn-grid-06-tight', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 7: Grid percentage columns
  // ========================================
  console.log('\n### TEST 7: Grid ["33%", "33%", "34%"] ###');
  console.log('Page width = 3060 dots');
  console.log('33% = 1009.8 -> 1009, 33% = 1009, 34% = 1040.4 -> 1040');

  const engine7 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine7.initialize();
  engine7.render(
    grid(['33%', '33%', '34%'])
      .columnGap(0)
      .cell('A').cell('B').cell('C').row()
      .build()
  );

  const prn7 = engine7.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-grid-07-percent.prn'), prn7);
  analyzeGrid('Test 7: Percentage columns', prn7, [0, 1009, 2018], 1);
  await renderPreview(prn7, 'Test 7: Percentage columns', 'qa-prn-grid-07-percent', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('  VERIFICATION CHECKLIST');
  console.log('='.repeat(70));
  console.log(`
Grid Column Position Calculation:
  - Column N starts at: sum(width[0..N-1]) + N * columnGap
  - ESC $ units = dots / 6 (rounded)
  - Rounding can cause 1-5 dot drift

Grid Row Position Calculation:
  - Row N starts at: sum(rowHeight[0..N-1]) + N * rowGap
  - Default row height = line height (60 dots)

Critical Bugs to Check:
  [1] Column position rounding errors (ESC $ uses 1/60" units)
  [2] Row gap accumulation
  [3] Fill column calculation
  [4] Percentage column resolution
  [5] Cell alignment within column bounds
  [6] Zero gap should not emit positioning commands between adjacent cells
`);
}

main().catch(console.error);
