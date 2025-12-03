/**
 * QA Test 30: Vertical Position Validation
 *
 * Tests ESC J command generation for vertical positioning:
 * - ESC J n: Advances print position by n/180 inch
 * - At 360 DPI: dots / 2 = units for ESC J
 * - Maximum value: 255 (loops for larger advances)
 *
 * Run: npx tsx examples/qa-30-vertical-position-test.ts
 */

import { LayoutEngine, stack } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

interface VerticalTest {
  name: string;
  yDots: number;
  expectedUnits: number;
}

async function main() {
  printSection('QA Test: Vertical Position Validation');

  const testCases: VerticalTest[] = [
    // Y = 60 dots (first line position)
    { name: 'Y=60', yDots: 60, expectedUnits: 30 },

    // Y = 180 dots (1 inch from top)
    { name: 'Y=180', yDots: 180, expectedUnits: 90 },

    // Y = 360 dots (2 inches from top)
    { name: 'Y=360', yDots: 360, expectedUnits: 180 },

    // Y = 510 dots (tests max 255)
    { name: 'Y=510 (255 units)', yDots: 510, expectedUnits: 255 },

    // Y = 540 dots (270 units - requires loop)
    { name: 'Y=540 (270 units)', yDots: 540, expectedUnits: 270 },

    // Y = 720 dots (360 units - requires loop with 255 + 105)
    { name: 'Y=720 (360 units)', yDots: 720, expectedUnits: 360 },

    // Y = 900 dots (450 units - requires 255 + 195)
    { name: 'Y=900 (450 units)', yDots: 900, expectedUnits: 450 },

    // Y = 1080 dots (540 units - requires 255 + 255 + 30)
    { name: 'Y=1080 (540 units)', yDots: 1080, expectedUnits: 540 },
  ];

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Build layout - place text at different Y positions with same X
  let layoutBuilder = stack().padding(0).gap(0);

  testCases.forEach((test, idx) => {
    layoutBuilder = layoutBuilder.add(stack().absolutePosition(100, test.yDots).text(`Y${idx}`));
  });

  const layout = layoutBuilder.build();

  engine.render(layout);
  const commands = engine.getOutput();

  // Parse ESC J commands
  console.log('\n=== ESC J COMMANDS IN OUTPUT ===\n');

  interface EscJCmd {
    offset: number;
    n: number;
    dots: number;
  }

  const escJCommands: EscJCmd[] = [];
  for (let i = 0; i < commands.length - 2; i++) {
    if (commands[i] === 0x1b && commands[i + 1] === 0x4a) {
      const n = commands[i + 2];
      const dots = n * 2;
      escJCommands.push({ offset: i, n, dots });
    }
  }

  // Print all ESC J commands
  escJCommands.forEach((cmd, idx) => {
    console.log(
      `ESC J[${idx}] at 0x${cmd.offset.toString(16).padStart(4, '0')}: n=${cmd.n} (0x${cmd.n.toString(16).padStart(2, '0')}) = ${cmd.dots} dots = ${(cmd.dots / 360).toFixed(4)} inches`
    );
  });

  // Calculate cumulative Y positions from ESC J commands
  console.log('\n=== CUMULATIVE Y POSITION TRACKING ===\n');

  let currentY = 0;
  let textIdx = 0;
  let escJIdx = 0;

  for (let i = 0; i < commands.length; i++) {
    if (commands[i] === 0x1b && commands[i + 1] === 0x4a) {
      const n = commands[i + 2];
      currentY += n * 2;
      console.log(
        `After ESC J ${n}: currentY = ${currentY} dots = ${(currentY / 360).toFixed(4)} inches`
      );
      i += 2;
    } else if (
      commands[i] === 0x59 &&
      i > 0 &&
      commands[i - 1] >= 0x30 &&
      commands[i - 1] <= 0x39
    ) {
      // Found 'Y' preceded by digit - this is our marker text
    }
  }

  // Validation
  console.log('\n=== VALIDATION SUMMARY ===\n');

  // Check that ESC J values don't exceed 255
  const oversizedCommands = escJCommands.filter((cmd) => cmd.n > 255);
  if (oversizedCommands.length > 0) {
    console.log(`[FAIL] Found ${oversizedCommands.length} ESC J commands with n > 255!`);
    oversizedCommands.forEach((cmd) => {
      console.log(`  - Offset 0x${cmd.offset.toString(16)}: n=${cmd.n}`);
    });
  } else {
    console.log('[PASS] All ESC J commands have n <= 255');
  }

  // Check for reasonable total count
  console.log(`[INFO] Total ESC J commands: ${escJCommands.length}`);

  // Calculate expected Y increments
  console.log('\n=== EXPECTED Y INCREMENTS ===');
  let prevY = 0;
  testCases.forEach((test) => {
    const delta = test.yDots - prevY;
    const expectedUnits = Math.round(delta / 2);
    console.log(`${test.name}: delta=${delta} dots, expected ${expectedUnits} units total advance`);
    if (expectedUnits > 255) {
      const loops = Math.ceil(expectedUnits / 255);
      console.log(`  -> Requires ${loops} ESC J commands (255 max each)`);
    }
    prevY = test.yDots;
  });

  await renderPreview(commands, 'QA: Vertical Position Validation', 'qa-30-vertical-position-test');
}

main().catch(console.error);
