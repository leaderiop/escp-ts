/**
 * QA Test 45: Deep ESC/P Byte-Level Analysis
 *
 * COMPREHENSIVE PRN ANALYSIS FOR BUG DETECTION
 *
 * This test:
 * 1. Creates layouts with KNOWN expected ESC/P commands
 * 2. Parses the PRN output byte-by-byte
 * 3. Verifies each positioning command against expected values
 * 4. Reports discrepancies with exact byte offsets
 *
 * ESC/P Commands analyzed:
 * - ESC @ (1B 40) - Initialize printer
 * - ESC $ nL nH (1B 24 nL nH) - Absolute horizontal position (X = nL + nH*256, in 1/60")
 * - ESC J n (1B 4A n) - Advance vertical n/180"
 * - ESC E (1B 45) - Bold on
 * - ESC F (1B 46) - Bold off
 *
 * Key conversion: 360 DPI layout dots to ESC $ units:
 *   ESC $ units = dots / 6 (since 360/60 = 6)
 *
 * Key conversion: 360 DPI layout dots to ESC J units:
 *   ESC J units = dots / 2 (since 360/180 = 2)
 */

import { LayoutEngine, stack, flex, grid, text } from '../src/index';
import { DEFAULT_PAPER, printSection } from './_helpers';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface ParsedCommand {
  offset: number;
  type: string;
  bytes: number[];
  value?: number;
  description: string;
}

interface LayoutTestCase {
  name: string;
  layout: ReturnType<typeof stack>['prototype'] extends { build(): infer R } ? R : never;
  expectedXPositions?: number[];  // In 1/60" units (ESC $ format)
  expectedYAdvances?: number[];   // In 1/180" units (ESC J format)
  notes: string;
}

function parseEscpCommands(data: Uint8Array): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    // ESC (0x1B) command
    if (byte === 0x1B && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC @ - Initialize
      if (cmd === 0x40) {
        commands.push({
          offset: i,
          type: 'ESC @',
          bytes: [0x1B, 0x40],
          description: 'Initialize printer'
        });
        i += 2;
        continue;
      }

      // ESC J n - Advance vertical
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        commands.push({
          offset: i,
          type: 'ESC J',
          bytes: [0x1B, 0x4A, n],
          value: n,
          description: `Advance ${n}/180" (${(n * 2).toFixed(0)} dots at 360 DPI)`
        });
        i += 3;
        continue;
      }

      // ESC $ nL nH - Absolute horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const position = nL + nH * 256;
        commands.push({
          offset: i,
          type: 'ESC $',
          bytes: [0x1B, 0x24, nL, nH],
          value: position,
          description: `X=${position} (${position} * 6 = ${position * 6} dots at 360 DPI)`
        });
        i += 4;
        continue;
      }

      // ESC E - Bold on
      if (cmd === 0x45) {
        commands.push({
          offset: i,
          type: 'ESC E',
          bytes: [0x1B, 0x45],
          description: 'Bold ON'
        });
        i += 2;
        continue;
      }

      // ESC F - Bold off
      if (cmd === 0x46) {
        commands.push({
          offset: i,
          type: 'ESC F',
          bytes: [0x1B, 0x46],
          description: 'Bold OFF'
        });
        i += 2;
        continue;
      }

      // ESC W n - Double width
      if (cmd === 0x57 && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        commands.push({
          offset: i,
          type: 'ESC W',
          bytes: [0x1B, 0x57, n],
          value: n,
          description: `Double width ${n ? 'ON' : 'OFF'}`
        });
        i += 3;
        continue;
      }

      // ESC - n - Underline
      if (cmd === 0x2D && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        commands.push({
          offset: i,
          type: 'ESC -',
          bytes: [0x1B, 0x2D, n],
          value: n,
          description: `Underline ${n ? 'ON' : 'OFF'}`
        });
        i += 3;
        continue;
      }

      // ESC 4 - Italic on
      if (cmd === 0x34) {
        commands.push({
          offset: i,
          type: 'ESC 4',
          bytes: [0x1B, 0x34],
          description: 'Italic ON'
        });
        i += 2;
        continue;
      }

      // ESC 5 - Italic off
      if (cmd === 0x35) {
        commands.push({
          offset: i,
          type: 'ESC 5',
          bytes: [0x1B, 0x35],
          description: 'Italic OFF'
        });
        i += 2;
        continue;
      }
    }

    i++;
  }

  return commands;
}

function dotsToEscDollar(dots: number): number {
  // ESC $ uses 1/60" units, layout uses 360 DPI
  // 360/60 = 6, so divide by 6
  return Math.round(dots / 6);
}

function dotsToEscJ(dots: number): number {
  // ESC J uses 1/180" units, layout uses 360 DPI
  // 360/180 = 2, so divide by 2
  return Math.round(dots / 2);
}

async function runTest(testCase: LayoutTestCase) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Notes: ${testCase.notes}`);

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  engine.render(testCase.layout);
  const commands = engine.getOutput();

  // Parse ESC/P commands
  const parsed = parseEscpCommands(commands);

  console.log(`\nParsed ${parsed.length} ESC/P commands:`);
  console.log('-'.repeat(70));

  // Extract position commands
  const xPositions = parsed.filter(c => c.type === 'ESC $');
  const yAdvances = parsed.filter(c => c.type === 'ESC J');

  console.log(`\nHorizontal positions (ESC $): ${xPositions.length}`);
  xPositions.forEach((cmd, idx) => {
    console.log(`  ${idx}: X=${cmd.value} units (${(cmd.value ?? 0) * 6} dots)`);
  });

  console.log(`\nVertical advances (ESC J): ${yAdvances.length}`);
  yAdvances.forEach((cmd, idx) => {
    console.log(`  ${idx}: ${cmd.value}/180" (${(cmd.value ?? 0) * 2} dots)`);
  });

  // Verify expected positions if provided
  if (testCase.expectedXPositions) {
    console.log(`\nX Position Verification:`);
    testCase.expectedXPositions.forEach((expected, idx) => {
      const actual = xPositions[idx]?.value;
      const match = actual === expected;
      console.log(`  [${match ? 'PASS' : 'FAIL'}] Position ${idx}: expected ${expected}, got ${actual}`);
    });
  }

  if (testCase.expectedYAdvances) {
    console.log(`\nY Advance Verification:`);
    testCase.expectedYAdvances.forEach((expected, idx) => {
      const actual = yAdvances[idx]?.value;
      const match = actual === expected;
      console.log(`  [${match ? 'PASS' : 'FAIL'}] Advance ${idx}: expected ${expected}, got ${actual}`);
    });
  }

  return { commands, parsed, xPositions, yAdvances };
}

async function main() {
  printSection('QA Test 45: Deep ESC/P Byte-Level Analysis');

  // Test Case 1: Simple absolute positioning
  // Layout at X=300 dots should produce ESC $ 50 0 (300/6 = 50)
  const test1: LayoutTestCase = {
    name: 'Absolute Positioning at X=300 dots',
    layout: stack()
      .padding(0)
      .add(
        stack()
          .absolutePosition(300, 0)
          .text('At X=300')
      )
      .build(),
    expectedXPositions: [dotsToEscDollar(300)], // 50
    notes: 'Expected: ESC $ 50 0 (X=300 dots / 6 = 50 units)'
  };

  // Test Case 2: Gap between stack items
  // gap=60 dots should produce ESC J 30 (60/2 = 30)
  const test2: LayoutTestCase = {
    name: 'Stack gap=60 dots (should be ESC J 30)',
    layout: stack()
      .gap(60)  // 60 dots
      .padding(0)
      .margin(0)
      .text('Line 1')
      .text('Line 2')
      .build(),
    // Line height is 60 dots, gap is 60 dots
    // After "Line 1": ESC J 60 (line height 120 dots... wait)
    notes: 'gap=60 dots should appear as ESC J 30 between items'
  };

  // Test Case 3: Row stack with gap
  const test3: LayoutTestCase = {
    name: 'Row stack with gap=100 dots',
    layout: stack()
      .direction('row')
      .gap(100)
      .padding(0)
      .margin(0)
      .add(stack().width(100).text('A'))
      .add(stack().width(100).text('B'))
      .build(),
    notes: 'Second item should be at X = first_width + gap = 200 dots'
  };

  // Test Case 4: Grid column positions
  const test4: LayoutTestCase = {
    name: 'Grid [100, 100, 100] with columnGap=50',
    layout: grid([100, 100, 100])
      .columnGap(50)
      .padding(0)
      .margin(0)
      .cell('Col0')
      .cell('Col1')
      .cell('Col2')
      .row()
      .build(),
    notes: 'Col0 at X=0, Col1 at X=150, Col2 at X=300'
  };

  // Test Case 5: Nested padding accumulation
  const test5: LayoutTestCase = {
    name: 'Nested padding: 30 + 20 + 10 = 60 dots',
    layout: stack()
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
      .build(),
    expectedXPositions: [dotsToEscDollar(60)], // 10
    notes: 'Text should be at X=60 dots (30+20+10) = 10 units'
  };

  // Test Case 6: Margin offset
  const test6: LayoutTestCase = {
    name: 'Left margin=120 dots',
    layout: stack()
      .padding(0)
      .margin({ left: 120 })
      .text('Margin 120')
      .build(),
    expectedXPositions: [dotsToEscDollar(120)], // 20
    notes: 'Text should be at X=120 dots = 20 units'
  };

  // Run all tests
  await runTest(test1);
  await runTest(test2);
  await runTest(test3);
  await runTest(test4);
  await runTest(test5);
  await runTest(test6);

  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(70));
}

main().catch(console.error);
