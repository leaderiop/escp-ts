/**
 * QA Test: Detailed Positioning Analysis with Edge Cases
 * This test examines ESC $ positioning accuracy and potential anomalies
 */
import { LayoutEngine, stack, flex, grid } from '../src/index';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

interface PositionCommand {
  type: 'ESC $' | 'ESC J' | 'text';
  byteOffset: number;
  value: number;
  dots: number;
  raw?: string;
}

function extractCommands(data: Uint8Array): PositionCommand[] {
  const commands: PositionCommand[] = [];
  let i = 0;
  let textBuffer = '';
  let textStart = -1;

  while (i < data.length) {
    const byte1 = data[i];
    const byte2 = data[i + 1];

    if (byte1 === 0x1B) {
      // Flush text buffer
      if (textBuffer) {
        commands.push({ type: 'text', byteOffset: textStart, value: 0, dots: 0, raw: textBuffer });
        textBuffer = '';
      }

      if (byte2 === 0x24) { // ESC $
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const pos60th = nL + nH * 256;
        const dotPos = pos60th * 6;
        commands.push({ type: 'ESC $', byteOffset: i, value: pos60th, dots: dotPos });
        i += 4;
      } else if (byte2 === 0x4A) { // ESC J
        const n = data[i + 2] ?? 0;
        const dotAdvance = Math.round((n / 180) * 360);
        commands.push({ type: 'ESC J', byteOffset: i, value: n, dots: dotAdvance });
        i += 3;
      } else if (byte2 === 0x40) { // ESC @
        i += 2;
      } else {
        i += 2;
        // Skip additional bytes for other commands
        if (byte2 === 0x45 || byte2 === 0x46 || byte2 === 0x57) i++; // Style commands
      }
    } else if (byte1 !== undefined && byte1 >= 32 && byte1 < 127) {
      if (textBuffer === '') textStart = i;
      textBuffer += String.fromCharCode(byte1);
      i++;
    } else {
      if (textBuffer) {
        commands.push({ type: 'text', byteOffset: textStart, value: 0, dots: 0, raw: textBuffer });
        textBuffer = '';
      }
      i++;
    }
  }

  if (textBuffer) {
    commands.push({ type: 'text', byteOffset: textStart, value: 0, dots: 0, raw: textBuffer });
  }

  return commands;
}

function printAnalysis(label: string, data: Uint8Array): void {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(70));

  const commands = extractCommands(data);
  let currentX = 0;
  let currentY = 0;

  for (const cmd of commands) {
    if (cmd.type === 'ESC $') {
      console.log(`  [byte ${cmd.byteOffset}] ESC $ -> X=${cmd.dots} dots (was ${currentX})`);
      currentX = cmd.dots;
    } else if (cmd.type === 'ESC J') {
      console.log(`  [byte ${cmd.byteOffset}] ESC J -> Y+=${cmd.dots} dots (now Y=${currentY + cmd.dots})`);
      currentY += cmd.dots;
    } else if (cmd.type === 'text') {
      // At 10 CPI, each char is 36 dots wide
      const textWidth = (cmd.raw?.length ?? 0) * 36;
      console.log(`  [byte ${cmd.byteOffset}] TEXT "${cmd.raw}" at X=${currentX} (${cmd.raw?.length} chars, ~${textWidth} dots wide)`);
      currentX += textWidth;
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('  QA DETAILED POSITIONING ANALYSIS');
  console.log('='.repeat(70));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Test 1: Flex with items - should print sequentially
  console.log('\n### Test 1: Flex with gap=0, three items ###');
  console.log('Expected: A at X=0, B at X=36, C at X=72 (sequential, no positioning needed)');

  const engine1 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 0, right: 0 }, linesPerPage: 66 },
  });
  engine1.initialize();
  engine1.render(flex().gap(0).add(stack().text('A')).add(stack().text('B')).add(stack().text('C')).build());
  printAnalysis('Flex gap=0', engine1.getOutput());

  // Test 2: Flex with gap - should have positioning
  console.log('\n### Test 2: Flex with gap=36, three items ###');
  console.log('Expected: A at X=0, B at X=72, C at X=144');

  const engine2 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 0, right: 0 }, linesPerPage: 66 },
  });
  engine2.initialize();
  engine2.render(flex().gap(36).add(stack().text('A')).add(stack().text('B')).add(stack().text('C')).build());
  printAnalysis('Flex gap=36', engine2.getOutput());

  // Test 3: Grid exact positioning
  console.log('\n### Test 3: Grid [100, 100, 100] with columnGap=0 ###');
  console.log('Expected: Col1 at X=0, Col2 at X=100, Col3 at X=200');
  console.log('Note: 100 dots / 6 = 16.67 -> rounds to 17 units -> 102 dots');

  const engine3 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 0, right: 0 }, linesPerPage: 66 },
  });
  engine3.initialize();
  engine3.render(grid([100, 100, 100]).columnGap(0).cell('A').cell('B').cell('C').row().build());
  printAnalysis('Grid [100,100,100] gap=0', engine3.getOutput());

  // Test 4: Grid with margins
  console.log('\n### Test 4: Grid with left margin=100 ###');
  console.log('Expected: Content should start at X=100');

  const engine4 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 100, right: 0 }, linesPerPage: 66 },
  });
  engine4.initialize();
  engine4.render(grid([100, 100, 100]).columnGap(0).cell('A').cell('B').cell('C').row().build());
  printAnalysis('Grid with left margin=100', engine4.getOutput());

  // Test 5: Stack vertical spacing
  console.log('\n### Test 5: Stack with gap=60 (vertical) ###');
  console.log('Expected: ESC J commands for vertical positioning');

  const engine5 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 0, right: 0 }, linesPerPage: 66 },
  });
  engine5.initialize();
  engine5.render(stack().gap(60).text('Line1').text('Line2').text('Line3').build());
  printAnalysis('Stack gap=60', engine5.getOutput());

  // Test 6: Absolute positioning
  console.log('\n### Test 6: Absolute positioning at (200, 100) ###');
  console.log('Expected: ESC $ to position at X=200, ESC J to advance to Y=100');

  const engine6 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 0, right: 0 }, linesPerPage: 66 },
  });
  engine6.initialize();
  engine6.render(stack().absolutePosition(200, 100).text('HERE').build());
  printAnalysis('Absolute (200, 100)', engine6.getOutput());

  // Test 7: Multi-row grid
  console.log('\n### Test 7: Multi-row grid ###');

  const engine7 = new LayoutEngine({
    defaultPaper: { widthInches: 8.5, heightInches: 11, margins: { top: 0, bottom: 0, left: 0, right: 0 }, linesPerPage: 66 },
  });
  engine7.initialize();
  engine7.render(
    grid([100, 100])
      .columnGap(20)
      .rowGap(30)
      .cell('R1C1').cell('R1C2').row()
      .cell('R2C1').cell('R2C2').row()
      .build()
  );
  printAnalysis('Grid 2x2 with gaps', engine7.getOutput());

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  console.log('\nESC $ Command Format: 1B 24 nL nH');
  console.log('  Position = (nL + nH*256) * 6 dots (at 360 DPI)');
  console.log('  Units are 1/60 inch');
  console.log('\nESC J Command Format: 1B 4A n');
  console.log('  Advance = n / 180 * 360 dots (at 360 DPI)');
  console.log('  Units are 1/180 inch');
}

main().catch(console.error);
