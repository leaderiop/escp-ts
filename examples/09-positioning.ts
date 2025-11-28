/**
 * Example 09: Absolute Positioning
 *
 * Demonstrates absolute positioning:
 * - position: 'absolute' removes element from normal flow
 * - posX: Set absolute X coordinate (in dots)
 * - posY: Set absolute Y coordinate (in dots)
 * - absolutePosition(x, y): Shorthand for setting all three
 *
 * Run: npx tsx examples/09-positioning.ts
 */

import { LayoutEngine, stack, flex, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Absolute Positioning Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text('ABSOLUTE POSITIONING DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Normal Flow vs Absolute Positioning', { bold: true, underline: true })
    .spacer(10)
    .text('Elements in normal flow are positioned sequentially.')
    .text('Absolute positioning places elements at specific coordinates.')
    .spacer(30)

    // Normal flow example
    .text('NORMAL FLOW:', { bold: true })
    .add(
      stack()
        .gap(5)
        .text('Item 1 - flows normally')
        .text('Item 2 - follows Item 1')
        .text('Item 3 - follows Item 2')
    )
    .spacer(30)

    // Absolute positioning explanation
    .text('ABSOLUTE POSITIONING:', { bold: true })
    .text('(See items below - positioned at exact X,Y coordinates)', { italic: true })
    .spacer(30)

    // Practical example: Watermark
    .text('PRACTICAL USE: Watermark-style positioning', { bold: true })
    .text('A watermark can be placed at an absolute position.', { italic: true })
    .spacer(30)

    // More normal content
    .text('Normal content continues here...')
    .text('The watermark above does not affect the flow.')
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Normal Flow Content', { align: 'center', italic: true })
    .spacer(50)

    // === ABSOLUTE POSITIONED ITEMS ===
    // These are placed at exact Y coordinates (after all flow content which ends ~Y=1504)
    // Y=1700+ ensures no overlap with flow content above

    // Row of items at Y=1700
    .add(
      stack()
        .absolutePosition(100, 1700)
        .text('Abs (100, 1700)', { bold: true })
    )
    .add(
      stack()
        .absolutePosition(500, 1700)
        .text('Abs (500, 1700)', { bold: true })
    )
    .add(
      stack()
        .absolutePosition(900, 1700)
        .text('Abs (900, 1700)', { bold: true })
    )

    // Diagonal pattern starting at Y=1800
    .add(
      stack()
        .absolutePosition(150, 1800)
        .text('Diagonal 1')
    )
    .add(
      stack()
        .absolutePosition(400, 1880)
        .text('Diagonal 2')
    )
    .add(
      stack()
        .absolutePosition(650, 1960)
        .text('Diagonal 3')
    )

    // Watermark at Y=2100
    .add(
      stack()
        .absolutePosition(300, 2100)
        .text('SAMPLE DOCUMENT', { bold: true, doubleWidth: true, italic: true })
    )

    // Final marker
    .add(
      stack()
        .absolutePosition(100, 2200)
        .text('--- End of Absolute Positioning Demo ---', { italic: true })
    )

    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Absolute Positioning Demo', '09-positioning');
}

main().catch(console.error);
