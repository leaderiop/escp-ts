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

    // Absolute positioning example
    .text('ABSOLUTE POSITIONING:', { bold: true })
    .text('(Elements positioned at specific X,Y coordinates)', { italic: true })
    .spacer(10)

    // These will be placed at absolute positions
    .add(
      stack()
        .absolutePosition(100, 600)  // Position at x=100, y=600
        .text('Position (100, 600)', { bold: true })
    )
    .add(
      stack()
        .absolutePosition(400, 600)  // Position at x=400, y=600
        .text('Position (400, 600)', { bold: true })
    )
    .add(
      stack()
        .absolutePosition(700, 600)  // Position at x=700, y=600
        .text('Position (700, 600)', { bold: true })
    )

    // Diagonal positioning
    .add(
      stack()
        .absolutePosition(150, 700)
        .text('Diagonal 1')
    )
    .add(
      stack()
        .absolutePosition(350, 800)
        .text('Diagonal 2')
    )
    .add(
      stack()
        .absolutePosition(550, 900)
        .text('Diagonal 3')
    )

    // Practical example: Watermark
    .spacer(200)
    .text('PRACTICAL USE: Watermark-style positioning', { bold: true })
    .text('A watermark can be placed at an absolute position.', { italic: true })

    // Simulated watermark
    .add(
      stack()
        .absolutePosition(200, 1100)
        .text('SAMPLE DOCUMENT', { bold: true, doubleWidth: true, italic: true })
    )

    // More normal content
    .spacer(100)
    .text('Normal content continues here...')
    .text('The watermark above does not affect the flow.')
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Positioning Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Absolute Positioning Demo', '09-positioning');
}

main().catch(console.error);
