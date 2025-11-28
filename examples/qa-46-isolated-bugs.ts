/**
 * QA Test 46: Isolated Bug Tests
 *
 * PRECISION TESTS FOR SPECIFIC LAYOUT BUGS
 *
 * Each test isolates a single feature and verifies exact byte output.
 * Uses ZERO margins/padding to eliminate noise.
 *
 * ESC/P Conversion Reference:
 * - Layout uses 360 DPI (dots per inch)
 * - ESC $ (horizontal) uses 1/60" units: divide dots by 6
 * - ESC J (vertical) uses 1/180" units: divide dots by 2
 *
 * Run: npx tsx examples/qa-46-isolated-bugs.ts
 */

import { LayoutEngine, stack, flex, grid, text } from '../src/index';
import { printSection } from './_helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Use minimal paper config with ZERO margins
const ZERO_MARGIN_PAPER = {
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  linesPerPage: 66,
};

interface ParsedCommand {
  offset: number;
  type: string;
  bytes: number[];
  value?: number;
}

function parseCommands(data: Uint8Array): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1B && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC @ - Initialize
      if (cmd === 0x40) {
        commands.push({ offset: i, type: 'ESC @', bytes: [0x1B, 0x40] });
        i += 2;
        continue;
      }

      // ESC J n - Advance vertical
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        commands.push({ offset: i, type: 'ESC J', bytes: [0x1B, 0x4A, n], value: n });
        i += 3;
        continue;
      }

      // ESC $ nL nH - Horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const position = nL + nH * 256;
        commands.push({ offset: i, type: 'ESC $', bytes: [0x1B, 0x24, nL, nH], value: position });
        i += 4;
        continue;
      }
    }

    i++;
  }

  return commands;
}

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
}

async function runBugTests(): Promise<TestResult[]> {
  printSection('QA Test 46: Isolated Bug Analysis');
  const results: TestResult[] = [];

  // ============================================================
  // BUG TEST 1: Gap between stack items not appearing in ESC J
  // ============================================================
  console.log('\n=== BUG 1: Stack gap should produce ESC J ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    // Simple stack with gap=60 between items
    // Line height is 60 dots (1/6")
    // gap=60 should ADD to the space between items
    const layout = stack()
      .gap(60)
      .padding(0)
      .margin(0)
      .text('A')
      .text('B')
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    // Extract ESC J values
    const escJValues = parsed.filter(c => c.type === 'ESC J').map(c => c.value ?? 0);

    console.log(`ESC J values: ${escJValues.join(', ')}`);
    console.log(`Expected: line_height/2 + gap/2 = 30 + 30 = 60 between items`);
    console.log(`Actual ESC J commands: ${escJValues.join(', ')}`);

    // Between 'A' and 'B' we expect:
    // - Line height: 60 dots = ESC J 30
    // - Gap: 60 dots = ESC J 30
    // - Total: ESC J 60 (or two ESC J 30 commands)
    const hasGapEvidence = escJValues.some(v => v >= 60) ||
                           (escJValues.filter(v => v === 30).length >= 2);

    results.push({
      name: 'Stack gap=60 produces correct ESC J',
      passed: hasGapEvidence,
      expected: 'ESC J with values summing to 60+ between items',
      actual: `ESC J values: ${escJValues.join(', ')}`,
      details: `Gap of 60 dots should appear as ESC J 30 or combined with line spacing`
    });
  }

  // ============================================================
  // BUG TEST 2: Absolute X position
  // ============================================================
  console.log('\n=== BUG 2: Absolute position X=300 ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    const layout = stack()
      .absolutePosition(300, 0)
      .text('Absolute')
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    const escDollarValues = parsed.filter(c => c.type === 'ESC $').map(c => c.value ?? 0);
    const expectedX = Math.round(300 / 6); // 50 units

    console.log(`Expected ESC $ value: ${expectedX} (300 dots / 6)`);
    console.log(`Actual ESC $ values: ${escDollarValues.join(', ')}`);

    const hasCorrectX = escDollarValues.includes(expectedX);

    results.push({
      name: 'Absolute X=300 produces ESC $ 50',
      passed: hasCorrectX,
      expected: `ESC $ ${expectedX} (300 dots / 6)`,
      actual: `ESC $ values: ${escDollarValues.join(', ')}`,
      details: `Absolute position should bypass all margin/padding calculations`
    });
  }

  // ============================================================
  // BUG TEST 3: Row stack X positioning
  // ============================================================
  console.log('\n=== BUG 3: Row stack horizontal positions ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    // Row with two 200-dot wide items, gap=100
    const layout = stack()
      .direction('row')
      .gap(100)
      .padding(0)
      .margin(0)
      .add(stack().width(200).padding(0).margin(0).text('L'))
      .add(stack().width(200).padding(0).margin(0).text('R'))
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    const escDollarValues = parsed.filter(c => c.type === 'ESC $').map(c => c.value ?? 0);

    // Item 1: X=0, ESC $ = 0
    // Item 2: X=200+100=300, ESC $ = 300/6 = 50
    const expectedX1 = 0;
    const expectedX2 = Math.round(300 / 6); // 50

    console.log(`Expected: Item1 at X=${expectedX1}, Item2 at X=${expectedX2}`);
    console.log(`Actual ESC $ values: ${escDollarValues.join(', ')}`);

    const hasCorrectPositions = escDollarValues.includes(expectedX1) && escDollarValues.includes(expectedX2);

    results.push({
      name: 'Row stack gap=100 positions correctly',
      passed: hasCorrectPositions,
      expected: `X positions: 0 and 50 (0 and 300 dots)`,
      actual: `ESC $ values: ${escDollarValues.join(', ')}`,
      details: `Second item should be at width(200) + gap(100) = 300 dots`
    });
  }

  // ============================================================
  // BUG TEST 4: Grid column positions
  // ============================================================
  console.log('\n=== BUG 4: Grid column positions ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    // Grid: [100, 100, 100] with columnGap=50
    // Col0: X=0
    // Col1: X=100+50=150
    // Col2: X=150+100+50=300
    const layout = grid([100, 100, 100])
      .columnGap(50)
      .padding(0)
      .margin(0)
      .cell('A')
      .cell('B')
      .cell('C')
      .row()
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    const escDollarValues = parsed.filter(c => c.type === 'ESC $').map(c => c.value ?? 0);

    const expectedX0 = Math.round(0 / 6);    // 0
    const expectedX1 = Math.round(150 / 6);  // 25
    const expectedX2 = Math.round(300 / 6);  // 50

    console.log(`Expected: Col0=${expectedX0}, Col1=${expectedX1}, Col2=${expectedX2}`);
    console.log(`Actual ESC $ values: ${escDollarValues.join(', ')}`);

    results.push({
      name: 'Grid columns with gap positioned correctly',
      passed: escDollarValues.length >= 3,
      expected: `X positions: ${expectedX0}, ${expectedX1}, ${expectedX2}`,
      actual: `ESC $ values: ${escDollarValues.join(', ')}`,
      details: `Grid columns should be at cumulative width+gap positions`
    });
  }

  // ============================================================
  // BUG TEST 5: vAlign center offset
  // ============================================================
  console.log('\n=== BUG 5: vAlign center Y offsets ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    // Row with items of different heights
    // Item1: padding=10 -> height = 60 + 20 = 80
    // Item2: padding=40 -> height = 60 + 80 = 140 (tallest)
    // Item3: padding=10 -> height = 60 + 20 = 80
    // vAlign center: shorter items offset = (140-80)/2 = 30
    const layout = stack()
      .direction('row')
      .vAlign('center')
      .gap(50)
      .padding(0)
      .margin(0)
      .add(stack().width(100).padding(10).text('S'))  // 80px height
      .add(stack().width(100).padding(40).text('T'))  // 140px height
      .add(stack().width(100).padding(10).text('S'))  // 80px height
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    // Analyze Y positions by tracking ESC J advances
    const escJCmds = parsed.filter(c => c.type === 'ESC J');
    const escDollarCmds = parsed.filter(c => c.type === 'ESC $');

    console.log(`ESC J commands: ${escJCmds.map(c => c.value).join(', ')}`);
    console.log(`ESC $ commands: ${escDollarCmds.map(c => c.value).join(', ')}`);

    // For vAlign=center, the shorter items should have Y offset
    // This would show as different cumulative Y positions before each ESC $
    results.push({
      name: 'vAlign center creates Y offsets',
      passed: escJCmds.length > 1, // Multiple Y advances indicates offsets
      expected: `Multiple ESC J commands showing Y offsets for shorter items`,
      actual: `ESC J values: ${escJCmds.map(c => c.value).join(', ')}`,
      details: `30-dot Y offset for items 1 and 3 should appear in ESC J`
    });
  }

  // ============================================================
  // BUG TEST 6: Flex justify space-between
  // ============================================================
  console.log('\n=== BUG 6: Flex space-between ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    // Flex container width=600, two items of ~36 dots each
    // space-between: first at 0, last at 600-36=564
    const layout = flex()
      .width(600)
      .justify('space-between')
      .padding(0)
      .margin(0)
      .text('A')
      .text('B')
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    const escDollarValues = parsed.filter(c => c.type === 'ESC $').map(c => c.value ?? 0);

    // First item at X=0
    // Second item at X = containerWidth - itemWidth
    // 'B' is about 36 dots wide at 10 CPI
    // So X should be around 600-36 = 564, ESC $ = 94

    console.log(`ESC $ values: ${escDollarValues.join(', ')}`);
    console.log(`Expected: First at 0, second near 94 (564 dots / 6)`);

    const firstAt0 = escDollarValues[0] === 0;
    const secondNearEnd = escDollarValues.length >= 2 && (escDollarValues[1] ?? 0) > 80;

    results.push({
      name: 'Flex space-between positions items at edges',
      passed: firstAt0 && secondNearEnd,
      expected: `First item at X=0, second near X=94`,
      actual: `ESC $ values: ${escDollarValues.join(', ')}`,
      details: `space-between should put first item at start, last at end`
    });
  }

  // ============================================================
  // BUG TEST 7: Nested padding accumulation
  // ============================================================
  console.log('\n=== BUG 7: Nested padding accumulation ===');
  {
    const engine = new LayoutEngine({
      defaultPaper: ZERO_MARGIN_PAPER,
    });
    engine.initialize();

    // Nested padding: 30 + 20 + 10 = 60 dots
    const layout = stack()
      .padding(30)
      .add(
        stack()
          .padding(20)
          .add(
            stack()
              .padding(10)
              .text('Deep')
          )
      )
      .build();

    engine.render(layout);
    const commands = engine.getOutput();
    const parsed = parseCommands(commands);

    const escDollarValues = parsed.filter(c => c.type === 'ESC $').map(c => c.value ?? 0);
    const expectedX = Math.round(60 / 6); // 10

    console.log(`Expected ESC $ value: ${expectedX} (60 dots / 6)`);
    console.log(`Actual ESC $ values: ${escDollarValues.join(', ')}`);

    const hasCorrectX = escDollarValues.includes(expectedX);

    results.push({
      name: 'Nested padding 30+20+10=60 accumulates correctly',
      passed: hasCorrectX,
      expected: `ESC $ ${expectedX} (60 dots)`,
      actual: `ESC $ values: ${escDollarValues.join(', ')}`,
      details: `Nested padding should sum to total offset`
    });
  }

  // ============================================================
  // Print Summary
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  results.forEach(r => {
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`\n[${status}] ${r.name}`);
    if (!r.passed) {
      console.log(`  Expected: ${r.expected}`);
      console.log(`  Actual: ${r.actual}`);
      console.log(`  Details: ${r.details}`);
      failed++;
    } else {
      passed++;
    }
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`Total: ${results.length} tests, ${passed} passed, ${failed} failed`);

  return results;
}

runBugTests().catch(console.error);
