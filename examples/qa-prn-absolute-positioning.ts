/**
 * QA PRN Analysis: Absolute and Relative Positioning
 *
 * This test analyzes the ESC/P commands generated for absolute
 * and relative positioning modes.
 *
 * ESC/P Commands:
 * - ESC $ nL nH: Absolute horizontal (from left margin)
 * - ESC J n: Advance vertical by n/180 inch
 * - ESC ( V: Absolute vertical position (ESC/P2)
 * - ESC ( v: Relative vertical position (ESC/P2)
 */
import { LayoutEngine, stack, flex } from '../src/index';
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

function hexDump(data: Uint8Array, maxBytes: number = 200): string {
  const lines: string[] = [];
  for (let i = 0; i < Math.min(data.length, maxBytes); i += 16) {
    const hex = Array.from(data.slice(i, i + 16))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
    const ascii = Array.from(data.slice(i, i + 16))
      .map(b => (b >= 0x20 && b < 0x7F) ? String.fromCharCode(b) : '.')
      .join('');
    lines.push(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48)} ${ascii}`);
  }
  if (data.length > maxBytes) {
    lines.push(`... (${data.length - maxBytes} more bytes)`);
  }
  return lines.join('\n');
}

interface PositionCommand {
  type: string;
  offset: number;
  bytes: string;
  xDots?: number;
  yDots?: number;
  text?: string;
}

function parsePositionCommands(data: Uint8Array): PositionCommand[] {
  const commands: PositionCommand[] = [];
  let i = 0;

  while (i < data.length) {
    const b = data[i];

    if (b === 0x1B) {
      const next = data[i + 1];

      if (next === 0x24) { // ESC $
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const dots = (nL + nH * 256) * 6;
        commands.push({
          type: 'ESC_$',
          offset: i,
          bytes: `1B 24 ${nL.toString(16).padStart(2, '0')} ${nH.toString(16).padStart(2, '0')}`,
          xDots: dots,
        });
        i += 4;
      } else if (next === 0x4A) { // ESC J
        const n = data[i + 2] ?? 0;
        const dots = n * 2; // n/180 * 360
        commands.push({
          type: 'ESC_J',
          offset: i,
          bytes: `1B 4A ${n.toString(16).padStart(2, '0')}`,
          yDots: dots,
        });
        i += 3;
      } else if (next === 0x28) { // ESC (
        const cmd = data[i + 2];
        if (cmd === 0x56) { // ESC ( V - Absolute vertical
          const nL = data[i + 3] ?? 0;
          const nH = data[i + 4] ?? 0;
          // Skip byte count, read position
          const m1 = data[i + 5] ?? 0;
          const m2 = data[i + 6] ?? 0;
          const m3 = data[i + 7] ?? 0;
          const m4 = data[i + 8] ?? 0;
          const pos = m1 + m2 * 256 + m3 * 65536 + m4 * 16777216;
          commands.push({
            type: 'ESC_(V',
            offset: i,
            bytes: `1B 28 56 ${nL.toString(16)} ${nH.toString(16)} ...`,
            yDots: pos,
          });
          i += 9;
        } else if (cmd === 0x76) { // ESC ( v - Relative vertical
          const nL = data[i + 3] ?? 0;
          const nH = data[i + 4] ?? 0;
          const m1 = data[i + 5] ?? 0;
          const m2 = data[i + 6] ?? 0;
          const m3 = data[i + 7] ?? 0;
          const m4 = data[i + 8] ?? 0;
          const pos = m1 + m2 * 256 + m3 * 65536 + m4 * 16777216;
          commands.push({
            type: 'ESC_(v',
            offset: i,
            bytes: `1B 28 76 ${nL.toString(16)} ${nH.toString(16)} ...`,
            yDots: pos,
          });
          i += 9;
        } else {
          i += 3;
        }
      } else if (next === 0x40) { // ESC @
        commands.push({ type: 'ESC_@', offset: i, bytes: '1B 40' });
        i += 2;
      } else {
        i += 2;
      }
    } else if (b !== undefined && b >= 0x20 && b < 0x7F) {
      let text = '';
      const start = i;
      while (i < data.length && data[i] !== undefined && data[i]! >= 0x20 && data[i]! < 0x7F) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      commands.push({ type: 'TEXT', offset: start, bytes: '', text });
    } else {
      i++;
    }
  }

  return commands;
}

function analyzeAbsolutePositioning(label: string, data: Uint8Array, expectedX: number, expectedY: number): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));
  console.log(`Expected Position: (${expectedX}, ${expectedY}) dots`);

  console.log('\nHex Dump (first 200 bytes):');
  console.log(hexDump(data));

  const commands = parsePositionCommands(data);

  let currentX = 0;
  let currentY = 0;

  console.log('\nPosition Commands:');
  console.log('-'.repeat(70));

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'ESC_@':
        console.log(`  [${cmd.offset.toString().padStart(4)}] RESET`);
        currentX = 0;
        currentY = 0;
        break;
      case 'ESC_$':
        console.log(`  [${cmd.offset.toString().padStart(4)}] ESC $ : X = ${cmd.xDots} dots`);
        console.log(`         Bytes: ${cmd.bytes}`);
        currentX = cmd.xDots ?? 0;
        break;
      case 'ESC_J':
        console.log(`  [${cmd.offset.toString().padStart(4)}] ESC J : Y += ${cmd.yDots} dots`);
        console.log(`         Bytes: ${cmd.bytes}`);
        currentY += cmd.yDots ?? 0;
        break;
      case 'ESC_(V':
        console.log(`  [${cmd.offset.toString().padStart(4)}] ESC (V: Y = ${cmd.yDots} dots (absolute)`);
        currentY = cmd.yDots ?? 0;
        break;
      case 'ESC_(v':
        console.log(`  [${cmd.offset.toString().padStart(4)}] ESC (v: Y += ${cmd.yDots} dots (relative)`);
        currentY += cmd.yDots ?? 0;
        break;
      case 'TEXT':
        console.log(`  [${cmd.offset.toString().padStart(4)}] TEXT  : "${cmd.text}" at (${currentX}, ${currentY})`);
        currentX += (cmd.text?.length ?? 0) * 36;
        break;
    }
  }

  console.log('-'.repeat(70));

  // Check if first text is at expected position
  const firstText = commands.find(c => c.type === 'TEXT');
  if (firstText) {
    // Find last position command before text
    let textX = 0;
    let textY = 0;
    for (const cmd of commands) {
      if (cmd === firstText) break;
      if (cmd.type === 'ESC_$') textX = cmd.xDots ?? 0;
      if (cmd.type === 'ESC_J') textY += cmd.yDots ?? 0;
      if (cmd.type === 'ESC_(V') textY = cmd.yDots ?? 0;
      if (cmd.type === 'ESC_(v') textY += cmd.yDots ?? 0;
      if (cmd.type === 'ESC_@') { textX = 0; textY = 0; }
    }

    console.log(`\nFirst Text Position: (${textX}, ${textY})`);
    console.log(`Expected Position:   (${expectedX}, ${expectedY})`);

    const xMatch = textX === expectedX;
    const yMatch = textY === expectedY;

    console.log(`X Position: ${xMatch ? 'PASS' : `FAIL (diff: ${textX - expectedX})`}`);
    console.log(`Y Position: ${yMatch ? 'PASS' : `FAIL (diff: ${textY - expectedY})`}`);
  }
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log('  QA PRN ANALYSIS: ABSOLUTE POSITIONING');
  console.log('='.repeat(70));
  console.log('\nThis test verifies absolute and relative positioning commands.\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ========================================
  // Test 1: Absolute position at (0, 0)
  // ========================================
  console.log('\n### TEST 1: Absolute position at (0, 0) ###');

  const engine1 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine1.initialize();
  engine1.render(
    stack()
      .absolutePosition(0, 0)
      .text('Origin')
      .build()
  );

  const prn1 = engine1.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-01-origin.prn'), prn1);
  analyzeAbsolutePositioning('Test 1: Position (0,0)', prn1, 0, 0);
  await renderPreview(prn1, 'Test 1: Origin', 'qa-prn-abs-01-origin', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 2: Absolute position at (100, 0)
  // ========================================
  console.log('\n### TEST 2: Absolute position at (100, 0) ###');
  console.log('Expected ESC $ units: 100/6 = 16.67 -> 17 -> 102 dots');

  const engine2 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine2.initialize();
  engine2.render(
    stack()
      .absolutePosition(100, 0)
      .text('X=100')
      .build()
  );

  const prn2 = engine2.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-02-x100.prn'), prn2);
  analyzeAbsolutePositioning('Test 2: Position (100,0)', prn2, 100, 0);
  await renderPreview(prn2, 'Test 2: X=100', 'qa-prn-abs-02-x100', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 3: Absolute position at (0, 100)
  // ========================================
  console.log('\n### TEST 3: Absolute position at (0, 100) ###');
  console.log('Expected ESC J: 100 dots = 50 units (n/180 * 360 = n*2)');

  const engine3 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine3.initialize();
  engine3.render(
    stack()
      .absolutePosition(0, 100)
      .text('Y=100')
      .build()
  );

  const prn3 = engine3.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-03-y100.prn'), prn3);
  analyzeAbsolutePositioning('Test 3: Position (0,100)', prn3, 0, 100);
  await renderPreview(prn3, 'Test 3: Y=100', 'qa-prn-abs-03-y100', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 4: Absolute position at (200, 150)
  // ========================================
  console.log('\n### TEST 4: Absolute position at (200, 150) ###');
  console.log('Expected ESC $ units: 200/6 = 33.33 -> 33 -> 198 dots');
  console.log('Expected ESC J units: 150/2 = 75 -> 150 dots');

  const engine4 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine4.initialize();
  engine4.render(
    stack()
      .absolutePosition(200, 150)
      .text('HERE')
      .build()
  );

  const prn4 = engine4.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-04-xy.prn'), prn4);
  analyzeAbsolutePositioning('Test 4: Position (200,150)', prn4, 200, 150);
  await renderPreview(prn4, 'Test 4: XY Position', 'qa-prn-abs-04-xy', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 5: Multiple absolute positioned elements
  // ========================================
  console.log('\n### TEST 5: Multiple absolute positioned elements ###');

  const engine5 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine5.initialize();
  engine5.render(
    stack()
      .add(stack().absolutePosition(0, 0).text('TopLeft'))
      .add(stack().absolutePosition(500, 0).text('TopRight'))
      .add(stack().absolutePosition(0, 200).text('BotLeft'))
      .add(stack().absolutePosition(500, 200).text('BotRight'))
      .build()
  );

  const prn5 = engine5.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-05-multi.prn'), prn5);
  analyzeAbsolutePositioning('Test 5: Multiple positions', prn5, 0, 0);
  await renderPreview(prn5, 'Test 5: Multiple', 'qa-prn-abs-05-multi', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 6: Relative positioning
  // ========================================
  console.log('\n### TEST 6: Relative positioning (offset from flow) ###');
  console.log('Using relativePosition(50, 20) - element in flow but rendered with offset');

  const engine6 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine6.initialize();
  engine6.render(
    stack()
      .gap(0)
      .text('Normal1')
      .add(stack().relativePosition(50, 20).text('Offset'))
      .text('Normal2')
      .build()
  );

  const prn6 = engine6.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-06-relative.prn'), prn6);
  analyzeAbsolutePositioning('Test 6: Relative offset', prn6, 0, 0);
  await renderPreview(prn6, 'Test 6: Relative', 'qa-prn-abs-06-relative', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Test 7: Large Y position (tests ESC J overflow handling)
  // ========================================
  console.log('\n### TEST 7: Large Y position (Y=600, tests ESC J max) ###');
  console.log('ESC J max n=255, which is 510 dots');
  console.log('For Y=600, need multiple ESC J commands');

  const engine7 = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
  engine7.initialize();
  engine7.render(
    stack()
      .absolutePosition(0, 600)
      .text('Far down')
      .build()
  );

  const prn7 = engine7.getOutput();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'qa-prn-abs-07-large-y.prn'), prn7);
  analyzeAbsolutePositioning('Test 7: Large Y=600', prn7, 0, 600);
  await renderPreview(prn7, 'Test 7: Large Y', 'qa-prn-abs-07-large-y', { paper: ZERO_MARGIN_PAPER });

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('  VERIFICATION CHECKLIST');
  console.log('='.repeat(70));
  console.log(`
ESC $ Horizontal Position:
  - Units = 1/60 inch
  - Dots = units * 6 at 360 DPI
  - Rounding: dots/6 rounded to nearest integer
  - Max position = 65535 units = 393,210 dots

ESC J Vertical Advance:
  - Units = 1/180 inch
  - Dots = units * 2 at 360 DPI
  - Max n = 255 (510 dots per command)
  - Multiple commands needed for large moves

Critical Bugs to Check:
  [1] X position rounding error (should be within 5 dots)
  [2] Y position rounding error (should be within 1 dot)
  [3] Large Y positions should emit multiple ESC J commands
  [4] Absolute positions should override flow positioning
  [5] Relative offsets should add to flow position
`);
}

main().catch(console.error);
