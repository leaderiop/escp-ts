/**
 * QA Test 48: Flex Text Merge Bug Investigation
 *
 * CRITICAL BUG: Flex items with same Y position are being merged into single text!
 *
 * When flex items are at the same Y coordinate, the renderer appears to
 * concatenate them into a single text string instead of positioning them
 * separately.
 *
 * Expected: "FIRST" at X=0, "SECOND" at X=180 (after FIRST width + gap)
 * Actual: "FIRSTSECOND" printed as one string
 */

import { LayoutEngine, stack, flex, text } from '@escp/jsx';
import { printSection } from '../../_helpers';

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
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(data.slice(i, i + 16))
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.'))
      .join('');
    lines.push(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48)} ${ascii}`);
  }
  return lines.join('\n');
}

async function main() {
  printSection('QA Test 48: Flex Text Merge Bug');

  // ============================================================
  // BUG REPRODUCTION: Flex items merged into single text
  // ============================================================
  console.log('=== BUG REPRODUCTION ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
    await engine.initYoga();

    const layout = flex()
      .gap(50) // 50 dot gap between items
      .padding(0)
      .margin(0)
      .text('FIRST')
      .text('SECOND')
      .build();

    engine.render(layout);
    const output = engine.getOutput();

    console.log('PRN Hex Dump:');
    console.log(hexDump(output));
    console.log('\nExpected sequence:');
    console.log('  ESC @ (init)');
    console.log('  ESC $ 0 0 (X=0)');
    console.log('  "FIRST"');
    console.log('  ESC $ 33 0 (X=198 dots, after FIRST + gap)');
    console.log('  "SECOND"');
    console.log('\nActual: Text appears to be merged!');
  }

  // ============================================================
  // TEST: Do stacks in flex preserve separation?
  // ============================================================
  console.log('\n\n=== TEST: Flex with stack children ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
    await engine.initYoga();

    const layout = flex()
      .gap(50)
      .padding(0)
      .margin(0)
      .add(stack().text('FIRST'))
      .add(stack().text('SECOND'))
      .build();

    engine.render(layout);
    const output = engine.getOutput();

    console.log('PRN Hex Dump:');
    console.log(hexDump(output));
  }

  // ============================================================
  // TEST: Explicit widths
  // ============================================================
  console.log('\n\n=== TEST: Flex with explicit width children ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
    await engine.initYoga();

    const layout = flex()
      .gap(50)
      .padding(0)
      .margin(0)
      .add(stack().width(200).text('FIRST'))
      .add(stack().width(200).text('SECOND'))
      .build();

    engine.render(layout);
    const output = engine.getOutput();

    console.log('PRN Hex Dump:');
    console.log(hexDump(output));
  }

  // ============================================================
  // TEST: Space-between justify
  // ============================================================
  console.log('\n\n=== TEST: Flex space-between ===\n');
  {
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
    await engine.initYoga();

    const layout = flex()
      .width(600)
      .justify('space-between')
      .padding(0)
      .margin(0)
      .add(stack().width(100).text('A'))
      .add(stack().width(100).text('B'))
      .build();

    engine.render(layout);
    const output = engine.getOutput();

    console.log('PRN Hex Dump:');
    console.log(hexDump(output));
  }

  // ============================================================
  // ROOT CAUSE ANALYSIS
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('ROOT CAUSE ANALYSIS');
  console.log('='.repeat(70));
  console.log(`
The bug is in the render sorting and printing logic:

1. flattenTree() collects all text items with their absolute positions
2. sortRenderItems() sorts by Y then X
3. renderPageItems() iterates through sorted items and:
   - Calls moveToY() to advance vertically
   - Calls moveToX() to position horizontally
   - Prints the text

The problem: moveToX() has a threshold check:
   if (Math.abs(ctx.currentX - x) > 1)

After printing "FIRST", currentX = 0 + width_of_FIRST.
For "SECOND", if its X position is very close to currentX,
the moveToX() is skipped, and "SECOND" prints right after "FIRST".

But wait - looking at the hex dump, there's NO ESC $ between the texts.
This means both texts have the same X position, OR the moveToX is skipped.

Let me check the layout calculation...
`);

  // ============================================================
  // DEBUG: Print layout positions
  // ============================================================
  console.log('\n=== DEBUG: Layout calculation ===\n');
  {
    // We need to manually inspect the layout result
    // For now, let's just verify the gap is working
    const engine = new LayoutEngine({ defaultPaper: ZERO_MARGIN_PAPER });
    engine.initialize();
    await engine.initYoga();

    // Use explicit gap
    const layout = flex()
      .gap(100) // Larger gap for visibility
      .text('AAA')
      .text('BBB')
      .build();

    engine.render(layout);
    const output = engine.getOutput();

    console.log('With gap=100:');
    console.log(hexDump(output));

    // Calculate expected positions
    // 'AAA' at 10 CPI = 3 chars * 36 dots = 108 dots
    // Gap = 100 dots
    // 'BBB' should be at X = 108 + 100 = 208 dots = 34.67 ESC $ units (~35)
    console.log('\nExpected: "BBB" at X = 208 dots = ESC $ 35 (approx)');
  }
}

main().catch(console.error);
