/**
 * QA Test 47: X Position Bug Deep Analysis
 *
 * INVESTIGATION: Missing ESC $ commands for X=0 positions
 *
 * The renderer appears to optimize away ESC $ 0 0 commands,
 * but this is incorrect when the printer head is NOT at position 0.
 *
 * Key finding: moveToX() in renderer.ts has a threshold check:
 *   if (Math.abs(ctx.currentX - x) > 1)
 *
 * This means if currentX is 0 and target is 0, no command is emitted.
 * But after printing text, currentX changes, and subsequent items at X=0
 * DO need an ESC $ command to return to the start.
 */

import { LayoutEngine, stack, flex, grid, text } from '../src/index';
import { printSection } from './_helpers';

const ZERO_MARGIN_PAPER = {
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  linesPerPage: 66,
};

interface ParsedCommand {
  offset: number;
  type: string;
  value?: number;
  text?: string;
}

function parseDetailed(data: Uint8Array): ParsedCommand[] {
  const commands: ParsedCommand[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === 0x1B && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC @ - Initialize
      if (cmd === 0x40) {
        commands.push({ offset: i, type: 'INIT' });
        i += 2;
        continue;
      }

      // ESC J n - Advance vertical
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        commands.push({ offset: i, type: 'Y-ADV', value: n });
        i += 3;
        continue;
      }

      // ESC $ nL nH - Horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        const position = nL + nH * 256;
        commands.push({ offset: i, type: 'X-POS', value: position });
        i += 4;
        continue;
      }

      // Skip other ESC commands
      i += 2;
      continue;
    }

    // Printable ASCII
    if (byte >= 0x20 && byte <= 0x7E) {
      let text = '';
      while (i < data.length && data[i]! >= 0x20 && data[i]! <= 0x7E) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      commands.push({ offset: i - text.length, type: 'TEXT', text });
      continue;
    }

    i++;
  }

  return commands;
}

async function main() {
  printSection('QA Test 47: X Position Bug Analysis');

  // ============================================================
  // TEST A: Row stack - first item should be at X=0
  // ============================================================
  console.log('\n=== TEST A: Row stack X positions ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();

    const layout = stack()
      .direction('row')
      .gap(100)
      .padding(0)
      .margin(0)
      .add(stack().width(200).padding(0).margin(0).text('LEFT'))
      .add(stack().width(200).padding(0).margin(0).text('RIGHT'))
      .build();

    engine.render(layout);
    const parsed = parseDetailed(engine.getOutput());

    console.log('Command sequence:');
    parsed.forEach((cmd, i) => {
      if (cmd.type === 'TEXT') {
        console.log(`  ${i}: TEXT "${cmd.text}"`);
      } else if (cmd.type === 'X-POS') {
        console.log(`  ${i}: X-POS = ${cmd.value} (${(cmd.value ?? 0) * 6} dots)`);
      } else if (cmd.type === 'Y-ADV') {
        console.log(`  ${i}: Y-ADV = ${cmd.value}`);
      } else {
        console.log(`  ${i}: ${cmd.type}`);
      }
    });

    // Analysis
    const xPosCmds = parsed.filter(c => c.type === 'X-POS');
    const textCmds = parsed.filter(c => c.type === 'TEXT');

    console.log(`\nFound ${xPosCmds.length} X-POS commands`);
    console.log(`Found ${textCmds.length} TEXT items`);

    if (xPosCmds.length < textCmds.length) {
      console.log(`\n[BUG] Missing X-POS command!`);
      console.log(`Each text item should have its own X-POS command.`);
      console.log(`"LEFT" is at X=0 but no ESC $ 0 0 was emitted.`);
    }
  }

  // ============================================================
  // TEST B: Grid first column at X=0
  // ============================================================
  console.log('\n\n=== TEST B: Grid first column X position ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();

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
    const parsed = parseDetailed(engine.getOutput());

    console.log('Command sequence:');
    parsed.forEach((cmd, i) => {
      if (cmd.type === 'TEXT') {
        console.log(`  ${i}: TEXT "${cmd.text}"`);
      } else if (cmd.type === 'X-POS') {
        console.log(`  ${i}: X-POS = ${cmd.value} (${(cmd.value ?? 0) * 6} dots)`);
      } else if (cmd.type === 'Y-ADV') {
        console.log(`  ${i}: Y-ADV = ${cmd.value}`);
      } else {
        console.log(`  ${i}: ${cmd.type}`);
      }
    });

    const xPosCmds = parsed.filter(c => c.type === 'X-POS');
    const textCmds = parsed.filter(c => c.type === 'TEXT');

    console.log(`\nFound ${xPosCmds.length} X-POS commands`);
    console.log(`Found ${textCmds.length} TEXT items (cells)`);

    if (xPosCmds.length < textCmds.length) {
      console.log(`\n[BUG] Missing X-POS for first cell!`);
      console.log(`Cell "A" at X=0 should have ESC $ 0 0`);
    }
  }

  // ============================================================
  // TEST C: Flex justify=start first item
  // ============================================================
  console.log('\n\n=== TEST C: Flex justify=start first item ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();

    const layout = flex()
      .width(600)
      .justify('start')
      .padding(0)
      .margin(0)
      .text('FIRST')
      .text('SECOND')
      .build();

    engine.render(layout);
    const parsed = parseDetailed(engine.getOutput());

    console.log('Command sequence:');
    parsed.forEach((cmd, i) => {
      if (cmd.type === 'TEXT') {
        console.log(`  ${i}: TEXT "${cmd.text}"`);
      } else if (cmd.type === 'X-POS') {
        console.log(`  ${i}: X-POS = ${cmd.value} (${(cmd.value ?? 0) * 6} dots)`);
      } else {
        console.log(`  ${i}: ${cmd.type}`);
      }
    });

    const xPosCmds = parsed.filter(c => c.type === 'X-POS');

    if (!xPosCmds.some(c => c.value === 0)) {
      console.log(`\n[BUG] No X-POS = 0 found!`);
      console.log(`First flex item at X=0 needs explicit positioning.`);
    }
  }

  // ============================================================
  // TEST D: Verify the renderer threshold logic
  // ============================================================
  console.log('\n\n=== TEST D: Renderer threshold check ===\n');
  console.log('In renderer.ts moveToX():');
  console.log('  if (Math.abs(ctx.currentX - x) > 1) { emit ESC $ }');
  console.log('');
  console.log('This optimization SKIPS emitting ESC $ when:');
  console.log('  - currentX is close to target X');
  console.log('');
  console.log('Problem: After ESC @ (initialize), printer head is at X=0.');
  console.log('First item at X=0 has (0 - 0) = 0, which is NOT > 1,');
  console.log('so no ESC $ is emitted. This is CORRECT for the first item.');
  console.log('');
  console.log('But the items are sorted by Y then X, so if two items are');
  console.log('on the same row, the first one (by X) prints without ESC $,');
  console.log('then the head moves right as text is printed.');
  console.log('');
  console.log('The SECOND item DOES get ESC $, but the FIRST might not');
  console.log('if it starts exactly at X=0.');

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('FINDINGS');
  console.log('='.repeat(70));
  console.log(`
1. The renderer optimizes away ESC $ commands when position difference <= 1 dot.
   This is generally fine, but causes issues when:
   - Render items are sorted, and the first item at X=0 skips ESC $
   - The actual print order might not match the logical order

2. For row stacks, grids, and flex layouts, items at X=0 are not getting
   explicit X positioning commands because the renderer assumes the head
   is already at 0.

3. This is NOT necessarily a bug - the first item printed DOES start at 0.
   But it makes byte-level verification harder because we can't see the
   "missing" command - it's an implicit position.

4. The real bugs are elsewhere:
   - vAlign not producing correct Y offsets
   - Flex space-between not positioning first item correctly
`);
}

main().catch(console.error);
