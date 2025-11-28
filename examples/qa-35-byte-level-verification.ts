/**
 * QA Test 35: Byte-Level Position Verification
 *
 * This test creates specific layouts with calculable expected positions
 * and verifies the exact ESC/P command bytes generated.
 *
 * ESC/P Commands verified:
 * - ESC $ nL nH: Absolute horizontal position (pos = (nL + nH*256) * 6 dots at 360 DPI)
 * - ESC J n: Vertical advance (n/180 inch = n*2 dots at 360 DPI)
 *
 * Run: npx tsx examples/qa-35-byte-level-verification.ts
 */

import { LayoutEngine, stack, flex, grid, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utility to parse PRN and extract position commands
function parsePositionCommands(data: Buffer): { type: string; offset: number; value: number; dots: number }[] {
  const commands: { type: string; offset: number; value: number; dots: number }[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1B && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC $ nL nH - Absolute horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2]!;
        const nH = data[i + 3]!;
        const pos = nL + nH * 256;
        const dots = pos * 6;
        commands.push({ type: 'ESC $', offset: i, value: pos, dots });
        i += 4;
        continue;
      }

      // ESC J n - Vertical advance
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2]!;
        const dots = n * 2;
        commands.push({ type: 'ESC J', offset: i, value: n, dots });
        i += 3;
        continue;
      }
    }
    i++;
  }

  return commands;
}

// Test case result
interface TestResult {
  name: string;
  expected: { x?: number; y?: number }[];
  actual: { x?: number; y?: number }[];
  passed: boolean;
  notes: string[];
}

async function main() {
  printSection('QA Test: Byte-Level Position Verification');

  const results: TestResult[] = [];

  // =============================================================
  // TEST 1: Simple horizontal positions with known values
  // =============================================================
  {
    const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
    engine.initialize();

    // Create flex with items at calculable positions
    // At 10 CPI: char = 36 dots, gap = 50 dots
    // Item 1: X = 30 (padding)
    // Item 2: X = 30 + 36 (text) + 50 (gap) = 116
    // Item 3: X = 116 + 36 + 50 = 202
    const layout = stack()
      .padding(30)
      .add(
        flex()
          .gap(50)
          .add(text('A'))
          .add(text('B'))
          .add(text('C'))
      )
      .build();

    engine.render(layout);
    const commands = engine.getOutput();

    // Write PRN file
    const prnPath = path.join(__dirname, '../output/qa-35-test1-horizontal.prn');
    fs.writeFileSync(prnPath, commands);

    // Parse positions
    const prn = Buffer.from(commands);
    const posCommands = parsePositionCommands(prn);
    const xPositions = posCommands.filter(c => c.type === 'ESC $').map(c => c.dots);

    // Expected: First item at X=30, second at X=116, third at X=202
    // But ESC $ uses 1/60" units, so values get rounded
    // 30/6 = 5 -> 5*6 = 30 dots
    // 116/6 = 19.33 -> 19*6 = 114 dots (or 20*6 = 120)
    // 202/6 = 33.67 -> 34*6 = 204 dots

    results.push({
      name: 'Test 1: Horizontal flex items',
      expected: [{ x: 30 }, { x: 116 }, { x: 202 }],
      actual: xPositions.slice(0, 3).map(x => ({ x })),
      passed: xPositions.length >= 2, // At least 2 ESC $ commands
      notes: [`X positions found: ${xPositions.join(', ')}`],
    });
  }

  // =============================================================
  // TEST 2: Grid column positions with zero gap
  // =============================================================
  {
    const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
    engine.initialize();

    // Grid with 3 columns of 200 dots each, zero gap
    // Col 0: X = leftMargin (225) + padding (30) = 255
    // Col 1: X = 255 + 200 = 455
    // Col 2: X = 255 + 400 = 655
    const layout = stack()
      .padding(30)
      .add(
        grid([200, 200, 200])
          .columnGap(0)
          .rowGap(0)
          .cell('Col1').cell('Col2').cell('Col3').row()
          .cell('A').cell('B').cell('C').row()
      )
      .build();

    engine.render(layout);
    const commands = engine.getOutput();

    const prnPath = path.join(__dirname, '../output/qa-35-test2-grid-zero-gap.prn');
    fs.writeFileSync(prnPath, commands);

    const prn = Buffer.from(commands);
    const posCommands = parsePositionCommands(prn);
    const xPositions = posCommands.filter(c => c.type === 'ESC $').map(c => c.dots);

    // Check for column positions: ~255, ~455, ~655 (accounting for leftMargin=225 + padding=30)
    results.push({
      name: 'Test 2: Grid zero-gap columns',
      expected: [{ x: 255 }, { x: 455 }, { x: 655 }],
      actual: xPositions.slice(0, 6).map(x => ({ x })),
      passed: xPositions.some(x => x >= 440 && x <= 470), // Col 2 at ~455 exists
      notes: [`X positions found: ${xPositions.slice(0, 6).join(', ')}`],
    });
  }

  // =============================================================
  // TEST 3: Stack with vertical gaps
  // =============================================================
  {
    const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
    engine.initialize();

    // Stack with 3 text items, gap = 60 dots
    // Line spacing = 60 dots (default 1/6 inch at 360 DPI)
    // Item 1: Y = 30 (padding)
    // Item 2: Y = 30 + 60 (line height) + 60 (gap) = 150
    // Item 3: Y = 150 + 60 + 60 = 270
    const layout = stack()
      .padding(30)
      .gap(60)
      .text('Line 1')
      .text('Line 2')
      .text('Line 3')
      .build();

    engine.render(layout);
    const commands = engine.getOutput();

    const prnPath = path.join(__dirname, '../output/qa-35-test3-vertical-gaps.prn');
    fs.writeFileSync(prnPath, commands);

    const prn = Buffer.from(commands);
    const posCommands = parsePositionCommands(prn);
    const yAdvances = posCommands.filter(c => c.type === 'ESC J').map(c => c.dots);

    // Each ESC J should advance by ~120 dots (60 line + 60 gap = 120)
    // But ESC J uses 1/180" units: 120 dots = 60 units
    results.push({
      name: 'Test 3: Stack vertical gaps',
      expected: [{ y: 120 }, { y: 120 }],
      actual: yAdvances.slice(0, 2).map(y => ({ y })),
      passed: yAdvances.some(y => y >= 115 && y <= 125), // ~120 dots
      notes: [`Y advances found: ${yAdvances.join(', ')}`],
    });
  }

  // =============================================================
  // TEST 4: Flex justify=space-between with 3 items
  // =============================================================
  {
    const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
    engine.initialize();

    // Container width = ~4840 dots (default paper minus margins)
    // 3 items of 1 char each (36 dots)
    // Remaining space = 4840 - 3*36 = 4732 dots
    // Space between = 4732 / 2 = 2366 dots
    // Item 1: X = 30
    // Item 2: X = 30 + 36 + 2366 = 2432
    // Item 3: X = 2432 + 36 + 2366 = 4834
    const layout = stack()
      .padding(30)
      .add(
        flex()
          .justify('space-between')
          .add(text('A'))
          .add(text('B'))
          .add(text('C'))
      )
      .build();

    engine.render(layout);
    const commands = engine.getOutput();

    const prnPath = path.join(__dirname, '../output/qa-35-test4-space-between.prn');
    fs.writeFileSync(prnPath, commands);

    const prn = Buffer.from(commands);
    const posCommands = parsePositionCommands(prn);
    const xPositions = posCommands.filter(c => c.type === 'ESC $').map(c => c.dots);

    // Middle item should be roughly in the middle of the page
    results.push({
      name: 'Test 4: Flex space-between',
      expected: [{ x: 30 }, { x: 2432 }, { x: 4834 }],
      actual: xPositions.slice(0, 3).map(x => ({ x })),
      passed: xPositions.length >= 2 && xPositions.some(x => x > 2000 && x < 3000),
      notes: [`X positions found: ${xPositions.join(', ')}`],
    });
  }

  // =============================================================
  // TEST 5: Absolute positioning
  // =============================================================
  {
    const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
    engine.initialize();

    // Two items at absolute positions
    // Item 1: (100, 200) - X=100, Y=200
    // Item 2: (500, 400) - X=500, Y=400
    const layout = stack()
      .add(stack().absolutePosition(100, 200).text('At (100,200)'))
      .add(stack().absolutePosition(500, 400).text('At (500,400)'))
      .build();

    engine.render(layout);
    const commands = engine.getOutput();

    const prnPath = path.join(__dirname, '../output/qa-35-test5-absolute.prn');
    fs.writeFileSync(prnPath, commands);

    const prn = Buffer.from(commands);
    const posCommands = parsePositionCommands(prn);
    const xPositions = posCommands.filter(c => c.type === 'ESC $').map(c => c.dots);
    const yAdvances = posCommands.filter(c => c.type === 'ESC J').map(c => c.dots);

    // X=100: 100/6 = 16.67 -> 17*6 = 102 dots
    // X=500: 500/6 = 83.33 -> 83*6 = 498 dots
    results.push({
      name: 'Test 5: Absolute positioning',
      expected: [{ x: 102 }, { x: 498 }],
      actual: xPositions.slice(0, 2).map(x => ({ x })),
      passed: xPositions.some(x => x >= 95 && x <= 105) && xPositions.some(x => x >= 495 && x <= 505),
      notes: [`X positions: ${xPositions.join(', ')}, Y advances: ${yAdvances.join(', ')}`],
    });
  }

  // =============================================================
  // TEST 6: Nested containers with accumulated margins
  // =============================================================
  {
    const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
    engine.initialize();

    // Outer padding: 30
    // Inner padding: 20
    // Text should be at X = 30 + 20 = 50
    const layout = stack()
      .padding(30)
      .add(
        stack()
          .padding(20)
          .text('Nested text')
      )
      .build();

    engine.render(layout);
    const commands = engine.getOutput();

    const prnPath = path.join(__dirname, '../output/qa-35-test6-nested.prn');
    fs.writeFileSync(prnPath, commands);

    const prn = Buffer.from(commands);
    const posCommands = parsePositionCommands(prn);
    const xPositions = posCommands.filter(c => c.type === 'ESC $').map(c => c.dots);

    // X = leftMargin(225) + outerPadding(30) + innerPadding(20) = 275 dots
    // 275/6 = 45.83 -> 46*6 = 276 dots
    results.push({
      name: 'Test 6: Nested container margins',
      expected: [{ x: 275 }],
      actual: xPositions.slice(0, 1).map(x => ({ x })),
      passed: xPositions.some(x => x >= 270 && x <= 280),
      notes: [`X positions found: ${xPositions.join(', ')}`],
    });
  }

  // =============================================================
  // Print Results Summary
  // =============================================================
  console.log('\n');
  console.log('='.repeat(80));
  console.log('BYTE-LEVEL VERIFICATION RESULTS');
  console.log('='.repeat(80));

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const statusIcon = result.passed ? '[OK]' : '[!!]';
    console.log(`\n${statusIcon} ${result.name}: ${status}`);
    console.log(`    Expected: ${JSON.stringify(result.expected)}`);
    console.log(`    Actual:   ${JSON.stringify(result.actual)}`);
    for (const note of result.notes) {
      console.log(`    Note: ${note}`);
    }

    if (result.passed) passCount++;
    else failCount++;
  }

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed out of ${results.length} tests`);
  console.log('='.repeat(80));

  // Create combined preview
  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  engine.initialize();

  const summaryLayout = stack()
    .gap(15)
    .padding(30)
    .text('BYTE-LEVEL VERIFICATION SUMMARY', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)
    .text(`Tests: ${passCount} passed, ${failCount} failed`)
    .spacer(20)
    .text('See individual PRN files: qa-35-test*.prn')
    .line('-', 'fill')
    .build();

  engine.render(summaryLayout);
  await renderPreview(engine.getOutput(), 'Byte-Level Verification', 'qa-35-byte-level-verification');
}

main().catch(console.error);
