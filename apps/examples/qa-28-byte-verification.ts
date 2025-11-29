/**
 * QA Test 28: ESC/P Byte Verification
 *
 * This test generates simple, predictable positioning scenarios
 * for byte-level verification of ESC/P commands.
 *
 * Key ESC/P commands under test:
 * - ESC @ (1B 40) - Initialize printer
 * - ESC $ nL nH (1B 24 nL nH) - Absolute horizontal position
 * - ESC J n (1B 4A n) - Advance print position vertically n/180 inch
 * - ESC E (1B 45) - Bold on
 * - ESC F (1B 46) - Bold off
 *
 * Position calculation:
 * - ESC $ uses 1/60 inch units for horizontal position
 * - At 360 DPI: position_dots / 6 = units for ESC $
 * - ESC J uses 1/180 inch units for vertical advance
 * - At 360 DPI: position_dots / 2 = units for ESC J
 *
 * Run: npx tsx examples/qa-28-byte-verification.ts
 */

import { LayoutEngine, stack, text } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: ESC/P Byte Verification');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Simple layout to generate predictable byte sequences
  // Each element placed at calculated positions for verification
  const layout = stack()
    .padding(0) // No padding for exact position control
    .gap(0)

    // Test 1: Simple text at X=0 (should have ESC $ 00 00)
    // Expected: After ESC @, immediate text at position 0
    .text('A')

    // Test 2: Text at specific X positions
    // X = 360 dots (1 inch at 360 DPI)
    // ESC $ position = 360/6 = 60 (0x3C)
    // Expected: ESC $ 3C 00
    .add(stack().absolutePosition(360, 60).text('B'))

    // Test 3: Text at X = 720 dots (2 inches)
    // ESC $ position = 720/6 = 120 (0x78)
    // Expected: ESC $ 78 00
    .add(stack().absolutePosition(720, 60).text('C'))

    // Test 4: Text at X = 1800 dots (5 inches)
    // ESC $ position = 1800/6 = 300 = 0x012C
    // Expected: ESC $ 2C 01
    .add(stack().absolutePosition(1800, 60).text('D'))

    // Test 5: Vertical position test
    // Y = 180 dots (1 inch vertical)
    // ESC J units = 180/2 = 90 (0x5A)
    .add(stack().absolutePosition(0, 180).text('E'))

    // Test 6: Y = 360 dots (2 inches vertical)
    // Total ESC J advance from Y=180 to Y=360 = 180 dots = 90 units
    .add(stack().absolutePosition(0, 360).text('F'))

    // Test 7: Combined X and Y
    // X = 360 (1 inch), Y = 540 (1.5 inches)
    .add(stack().absolutePosition(360, 540).text('G'))

    // Test 8: Large X position test
    // X = 3600 dots (10 inches)
    // ESC $ position = 3600/6 = 600 = 0x0258
    // Expected: ESC $ 58 02
    .add(stack().absolutePosition(3600, 540).text('H'))

    .build();

  engine.render(layout);
  const commands = engine.getOutput();

  // Print hex dump of first 200 bytes for analysis
  console.log('\n=== HEX DUMP OF FIRST 200 BYTES ===');
  const hexDump = Array.from(commands.slice(0, 200))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  console.log(hexDump);

  // Parse and identify ESC sequences
  console.log('\n=== ESC/P COMMAND ANALYSIS ===');
  let i = 0;
  while (i < commands.length) {
    if (commands[i] === 0x1b) {
      const cmd = commands[i + 1];
      if (cmd === 0x40) {
        console.log(`[${i.toString(16).padStart(4, '0')}] ESC @ - Initialize printer`);
        i += 2;
      } else if (cmd === 0x24) {
        const nL = commands[i + 2];
        const nH = commands[i + 3];
        const pos = nL + nH * 256;
        const dots = pos * 6;
        console.log(
          `[${i.toString(16).padStart(4, '0')}] ESC $ ${nL.toString(16).padStart(2, '0')} ${nH.toString(16).padStart(2, '0')} - Horizontal position: ${pos} units = ${dots} dots = ${(dots / 360).toFixed(3)} inches`
        );
        i += 4;
      } else if (cmd === 0x4a) {
        const n = commands[i + 2];
        const dots = n * 2;
        console.log(
          `[${i.toString(16).padStart(4, '0')}] ESC J ${n.toString(16).padStart(2, '0')} - Vertical advance: ${n}/180 inch = ${dots} dots = ${(dots / 360).toFixed(3)} inches`
        );
        i += 3;
      } else if (cmd === 0x45) {
        console.log(`[${i.toString(16).padStart(4, '0')}] ESC E - Bold on`);
        i += 2;
      } else if (cmd === 0x46) {
        console.log(`[${i.toString(16).padStart(4, '0')}] ESC F - Bold off`);
        i += 2;
      } else if (cmd === 0x57) {
        const n = commands[i + 2];
        console.log(
          `[${i.toString(16).padStart(4, '0')}] ESC W ${n} - Double width ${n ? 'on' : 'off'}`
        );
        i += 3;
      } else if (cmd === 0x34) {
        console.log(`[${i.toString(16).padStart(4, '0')}] ESC 4 - Italic on`);
        i += 2;
      } else if (cmd === 0x35) {
        console.log(`[${i.toString(16).padStart(4, '0')}] ESC 5 - Italic off`);
        i += 2;
      } else {
        console.log(
          `[${i.toString(16).padStart(4, '0')}] ESC ${cmd.toString(16).padStart(2, '0')} (${String.fromCharCode(cmd)})`
        );
        i += 2;
      }
    } else if (commands[i] >= 0x20 && commands[i] < 0x7f) {
      // Printable ASCII
      let text = '';
      const startPos = i;
      while (i < commands.length && commands[i] >= 0x20 && commands[i] < 0x7f) {
        text += String.fromCharCode(commands[i]);
        i++;
      }
      if (text.length <= 40) {
        console.log(`[${startPos.toString(16).padStart(4, '0')}] TEXT: "${text}"`);
      } else {
        console.log(
          `[${startPos.toString(16).padStart(4, '0')}] TEXT: "${text.slice(0, 37)}..." (${text.length} chars)`
        );
      }
    } else {
      i++;
    }
  }

  await renderPreview(commands, 'QA: ESC/P Byte Verification', 'qa-28-byte-verification');
}

main().catch(console.error);
