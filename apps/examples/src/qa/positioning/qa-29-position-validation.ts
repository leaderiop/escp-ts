/**
 * QA Test 29: Position Validation - Detailed Analysis
 *
 * This test performs detailed validation of position calculations by:
 * 1. Creating elements at known absolute positions
 * 2. Capturing the byte output
 * 3. Validating ESC $ and ESC J parameters against expected values
 *
 * ESC/P Position Units Reference:
 * - ESC $ nL nH: Position in 1/60 inch units from left margin
 *   Formula: dots / 6 = units (at 360 DPI)
 *   nL = units & 0xFF, nH = (units >> 8) & 0xFF
 *
 * - ESC J n: Vertical advance in 1/180 inch units
 *   Formula: dots / 2 = units (at 360 DPI)
 *   n = units (max 255, loop for larger)
 *
 * Run: npx tsx examples/qa-29-position-validation.ts
 */

import { LayoutEngine, stack } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

interface PositionTest {
  name: string;
  xDots: number;
  yDots: number;
  expectedEscDollar: { nL: number; nH: number };
}

function calculateExpectedPosition(xDots: number): { nL: number; nH: number } {
  const units = Math.round(xDots / 6);
  return {
    nL: units & 0xff,
    nH: (units >> 8) & 0xff,
  };
}

async function main() {
  printSection('QA Test: Position Validation');

  const testCases: PositionTest[] = [
    // Test at position 0
    { name: 'Origin', xDots: 0, yDots: 60, expectedEscDollar: calculateExpectedPosition(0) },

    // Test at 1 inch (360 dots)
    { name: '1 inch', xDots: 360, yDots: 60, expectedEscDollar: calculateExpectedPosition(360) },

    // Test at 2 inches (720 dots)
    { name: '2 inch', xDots: 720, yDots: 60, expectedEscDollar: calculateExpectedPosition(720) },

    // Test at 3 inches (1080 dots)
    { name: '3 inch', xDots: 1080, yDots: 60, expectedEscDollar: calculateExpectedPosition(1080) },

    // Test at 256 units boundary (1536 dots - tests nH rollover)
    {
      name: '256 units',
      xDots: 1536,
      yDots: 120,
      expectedEscDollar: calculateExpectedPosition(1536),
    },

    // Test at 300 units (1800 dots)
    {
      name: '300 units',
      xDots: 1800,
      yDots: 120,
      expectedEscDollar: calculateExpectedPosition(1800),
    },

    // Test at 512 units (3072 dots)
    {
      name: '512 units',
      xDots: 3072,
      yDots: 180,
      expectedEscDollar: calculateExpectedPosition(3072),
    },

    // Test at 600 units (3600 dots - 10 inches)
    {
      name: '600 units',
      xDots: 3600,
      yDots: 180,
      expectedEscDollar: calculateExpectedPosition(3600),
    },
  ];

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Build layout with all test positions
  let layoutBuilder = stack().padding(0).gap(0);

  testCases.forEach((test) => {
    layoutBuilder = layoutBuilder.add(
      stack().absolutePosition(test.xDots, test.yDots).text(`[${test.name}]`)
    );
  });

  const layout = layoutBuilder.build();

  engine.render(layout);
  const commands = engine.getOutput();

  // Analysis
  console.log('\n=== EXPECTED vs ACTUAL POSITION ANALYSIS ===\n');

  testCases.forEach((test) => {
    const expected = test.expectedEscDollar;
    console.log(`Test: ${test.name}`);
    console.log(`  X Position: ${test.xDots} dots = ${test.xDots / 360} inches`);
    console.log(
      `  Expected ESC $: nL=0x${expected.nL.toString(16).padStart(2, '0')} nH=0x${expected.nH.toString(16).padStart(2, '0')} (${expected.nL + expected.nH * 256} units)`
    );
  });

  // Parse actual ESC $ commands from output
  console.log('\n=== ACTUAL ESC $ COMMANDS IN OUTPUT ===\n');
  const escDollarCommands: Array<{
    offset: number;
    nL: number;
    nH: number;
    units: number;
    dots: number;
  }> = [];

  for (let i = 0; i < commands.length - 3; i++) {
    if (commands[i] === 0x1b && commands[i + 1] === 0x24) {
      const nL = commands[i + 2];
      const nH = commands[i + 3];
      const units = nL + nH * 256;
      const dots = units * 6;
      escDollarCommands.push({ offset: i, nL, nH, units, dots });
      console.log(
        `Offset 0x${i.toString(16).padStart(4, '0')}: ESC $ 0x${nL.toString(16).padStart(2, '0')} 0x${nH.toString(16).padStart(2, '0')} = ${units} units = ${dots} dots = ${dots / 360} inches`
      );
    }
  }

  // Parse ESC J commands
  console.log('\n=== ACTUAL ESC J COMMANDS IN OUTPUT ===\n');
  const escJCommands: Array<{ offset: number; n: number; dots: number }> = [];

  for (let i = 0; i < commands.length - 2; i++) {
    if (commands[i] === 0x1b && commands[i + 1] === 0x4a) {
      const n = commands[i + 2];
      const dots = n * 2;
      escJCommands.push({ offset: i, n, dots });
      console.log(
        `Offset 0x${i.toString(16).padStart(4, '0')}: ESC J 0x${n.toString(16).padStart(2, '0')} = ${n}/180 inch = ${dots} dots = ${dots / 360} inches`
      );
    }
  }

  // Validate
  console.log('\n=== VALIDATION RESULTS ===\n');
  let allPass = true;

  testCases.forEach((test) => {
    const expectedUnits = Math.round(test.xDots / 6);
    const found = escDollarCommands.find((cmd) => cmd.units === expectedUnits);
    if (found) {
      console.log(
        `[PASS] ${test.name}: Found ESC $ with ${found.units} units (expected ${expectedUnits})`
      );
    } else {
      console.log(`[FAIL] ${test.name}: Expected ${expectedUnits} units, not found in output!`);
      allPass = false;
    }
  });

  // Check for anomalies
  console.log('\n=== ANOMALY CHECK ===\n');

  // Check for duplicate ESC $ commands at same position
  const unitCounts = new Map<number, number>();
  escDollarCommands.forEach((cmd) => {
    unitCounts.set(cmd.units, (unitCounts.get(cmd.units) || 0) + 1);
  });
  unitCounts.forEach((count, units) => {
    if (count > 1) {
      console.log(`[WARNING] Duplicate ESC $ at ${units} units appears ${count} times`);
    }
  });

  // Check for out-of-order positioning (Y should increase or stay same)
  let lastY = 0;
  let yIssues = 0;
  escJCommands.forEach((cmd, idx) => {
    if (cmd.dots < 0) {
      console.log(`[ERROR] Negative vertical advance at offset 0x${cmd.offset.toString(16)}`);
      yIssues++;
    }
  });

  if (yIssues === 0) {
    console.log('[PASS] All ESC J commands have valid positive values');
  }

  // Check for missing ESC @ initialization
  if (commands[0] === 0x1b && commands[1] === 0x40) {
    console.log('[PASS] ESC @ initialization present at start');
  } else {
    console.log('[FAIL] Missing ESC @ initialization at start!');
    allPass = false;
  }

  console.log(`\n=== OVERALL: ${allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===\n`);

  await renderPreview(commands, 'QA: Position Validation', 'qa-29-position-validation');
}

main().catch(console.error);
