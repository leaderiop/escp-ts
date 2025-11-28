/**
 * QA Test 50: Vertical Alignment (vAlign) Deep Analysis
 *
 * INVESTIGATE: vAlign=center Y offset implementation
 *
 * ESC J n: Advance paper n/180 inches (at 360 DPI, n/180 * 360 = n*2 dots)
 *   - To advance 60 dots: ESC J 30 (60/2 = 30)
 *
 * For vAlign=center in a row stack:
 *   - Find tallest item height
 *   - Shorter items get Y offset = (tallest - item_height) / 2
 *   - This offset should appear as ESC J before positioning that item
 */

import { LayoutEngine, stack, flex, text } from '../src/index';
import { printSection } from './_helpers';

const ZERO_MARGIN_PAPER = {
  widthInches: 8.5,
  heightInches: 11,
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  linesPerPage: 66,
};

interface ParsedCommand {
  type: 'INIT' | 'X-POS' | 'Y-ADV' | 'TEXT' | 'BOLD-ON' | 'BOLD-OFF' | 'OTHER';
  value?: number;
  text?: string;
  offset: number;
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
        commands.push({ type: 'INIT', offset: i });
        i += 2;
        continue;
      }

      // ESC J n - Advance vertical
      if (cmd === 0x4A && i + 2 < data.length) {
        const n = data[i + 2] ?? 0;
        commands.push({ type: 'Y-ADV', value: n, offset: i });
        i += 3;
        continue;
      }

      // ESC $ nL nH - Horizontal position
      if (cmd === 0x24 && i + 3 < data.length) {
        const nL = data[i + 2] ?? 0;
        const nH = data[i + 3] ?? 0;
        commands.push({ type: 'X-POS', value: nL + nH * 256, offset: i });
        i += 4;
        continue;
      }

      // ESC E - Bold on
      if (cmd === 0x45) {
        commands.push({ type: 'BOLD-ON', offset: i });
        i += 2;
        continue;
      }

      // ESC F - Bold off
      if (cmd === 0x46) {
        commands.push({ type: 'BOLD-OFF', offset: i });
        i += 2;
        continue;
      }

      // Other ESC commands
      commands.push({ type: 'OTHER', offset: i });
      i += 2;
      continue;
    }

    // Printable ASCII
    if (byte >= 0x20 && byte <= 0x7E) {
      let text = '';
      const startOffset = i;
      while (i < data.length && data[i]! >= 0x20 && data[i]! <= 0x7E) {
        text += String.fromCharCode(data[i]!);
        i++;
      }
      commands.push({ type: 'TEXT', text, offset: startOffset });
      continue;
    }

    i++;
  }

  return commands;
}

function printCommandSequence(commands: ParsedCommand[]): void {
  let cumulativeY = 0;

  commands.forEach((cmd, i) => {
    switch (cmd.type) {
      case 'INIT':
        console.log(`${i.toString().padStart(3)}: INIT`);
        cumulativeY = 0;
        break;
      case 'Y-ADV':
        cumulativeY += (cmd.value ?? 0) * 2; // ESC J n = n/180" = n*2 dots
        console.log(`${i.toString().padStart(3)}: Y-ADV ${cmd.value} (${(cmd.value ?? 0) * 2} dots) -> cumY=${cumulativeY}`);
        break;
      case 'X-POS':
        console.log(`${i.toString().padStart(3)}: X-POS ${cmd.value} (${(cmd.value ?? 0) * 6} dots)`);
        break;
      case 'TEXT':
        console.log(`${i.toString().padStart(3)}: TEXT "${cmd.text}"`);
        break;
      case 'BOLD-ON':
        console.log(`${i.toString().padStart(3)}: BOLD-ON`);
        break;
      case 'BOLD-OFF':
        console.log(`${i.toString().padStart(3)}: BOLD-OFF`);
        break;
      default:
        console.log(`${i.toString().padStart(3)}: OTHER`);
    }
  });
}

async function main() {
  printSection('QA Test 50: vAlign Deep Analysis');

  // ============================================================
  // TEST 1: vAlign=top (baseline - all same Y)
  // ============================================================
  console.log('=== TEST 1: vAlign=top ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
  await engine.initYoga();

    // Items with different heights (due to padding)
    // Item 1: padding=10 -> adds 20 to height (10 top + 10 bottom)
    // Item 2: padding=40 -> adds 80 to height
    // Item 3: padding=10 -> adds 20 to height
    // Base text height = 60 dots (1/6" at 360 DPI)

    const layout = stack()
      .direction('row')
      .vAlign('top')
      .gap(50)
      .add(stack().width(100).padding(10).text('A'))  // height = 60+20 = 80
      .add(stack().width(100).padding(40).text('B'))  // height = 60+80 = 140
      .add(stack().width(100).padding(10).text('C'))  // height = 60+20 = 80
      .build();

    engine.render(layout);
    const commands = parseCommands(engine.getOutput());

    console.log('Command sequence (vAlign=top):');
    printCommandSequence(commands);
    console.log('\nExpected: All items at same Y (no offset)');
  }

  // ============================================================
  // TEST 2: vAlign=center
  // ============================================================
  console.log('\n\n=== TEST 2: vAlign=center ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
  await engine.initYoga();

    // Same layout but with vAlign=center
    // Row height = max(80, 140, 80) = 140
    // Item A offset: (140-80)/2 = 30 dots
    // Item B offset: 0
    // Item C offset: (140-80)/2 = 30 dots

    const layout = stack()
      .direction('row')
      .vAlign('center')
      .gap(50)
      .add(stack().width(100).padding(10).text('A'))  // needs +30 Y offset
      .add(stack().width(100).padding(40).text('B'))  // no offset
      .add(stack().width(100).padding(10).text('C'))  // needs +30 Y offset
      .build();

    engine.render(layout);
    const commands = parseCommands(engine.getOutput());

    console.log('Command sequence (vAlign=center):');
    printCommandSequence(commands);
    console.log('\nExpected:');
    console.log('  Item A: Y offset +30 dots (ESC J 15 before A)');
    console.log('  Item B: No extra offset');
    console.log('  Item C: Y offset +30 dots (ESC J 15 before C)');
  }

  // ============================================================
  // TEST 3: vAlign=bottom
  // ============================================================
  console.log('\n\n=== TEST 3: vAlign=bottom ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
  await engine.initYoga();

    // With vAlign=bottom:
    // Item A offset: 140-80 = 60 dots
    // Item B offset: 0
    // Item C offset: 140-80 = 60 dots

    const layout = stack()
      .direction('row')
      .vAlign('bottom')
      .gap(50)
      .add(stack().width(100).padding(10).text('A'))  // needs +60 Y offset
      .add(stack().width(100).padding(40).text('B'))  // no offset
      .add(stack().width(100).padding(10).text('C'))  // needs +60 Y offset
      .build();

    engine.render(layout);
    const commands = parseCommands(engine.getOutput());

    console.log('Command sequence (vAlign=bottom):');
    printCommandSequence(commands);
    console.log('\nExpected:');
    console.log('  Item A: Y offset +60 dots (ESC J 30 before A)');
    console.log('  Item B: No extra offset');
    console.log('  Item C: Y offset +60 dots (ESC J 30 before C)');
  }

  // ============================================================
  // TEST 4: Explicit heights for precise verification
  // ============================================================
  console.log('\n\n=== TEST 4: Explicit heights [50, 100, 50] vAlign=center ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
  await engine.initYoga();

    // Explicit heights make calculation easier:
    // Row height = 100
    // Item 1 (h=50): offset = (100-50)/2 = 25 dots = ESC J 12-13
    // Item 2 (h=100): offset = 0
    // Item 3 (h=50): offset = 25 dots

    const layout = stack()
      .direction('row')
      .vAlign('center')
      .gap(50)
      .add(stack().width(100).height(50).text('X'))
      .add(stack().width(100).height(100).text('Y'))
      .add(stack().width(100).height(50).text('Z'))
      .build();

    engine.render(layout);
    const commands = parseCommands(engine.getOutput());

    console.log('Command sequence:');
    printCommandSequence(commands);
    console.log('\nExpected:');
    console.log('  Item X: Y offset +25 dots (ESC J 12-13)');
    console.log('  Item Y: No extra offset');
    console.log('  Item Z: Y offset +25 dots');
  }

  // ============================================================
  // Analysis
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('VALIGN ANALYSIS');
  console.log('='.repeat(70));
  console.log(`
The vAlign property is designed to vertically align items within a row.
Looking at the layout.ts code, vAlign should:

1. Calculate the maximum height of all items in the row
2. For each item shorter than max, calculate offset:
   - top: offset = 0
   - center: offset = (maxHeight - itemHeight) / 2
   - bottom: offset = maxHeight - itemHeight
3. Store this offset in the layout result

The renderer should then apply this Y offset when positioning items.

Let's verify by examining the actual Y positions in the PRN output.
`);
}

main().catch(console.error);
