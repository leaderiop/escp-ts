/**
 * QA Test 07: Absolute Positioning Edge Cases
 *
 * Tests absolute positioning edge cases:
 * - Position at 0,0
 * - Position at page boundaries
 * - Multiple absolute elements at same position (layering)
 * - Absolute inside container
 * - Negative positions
 * - Large position values
 *
 * Run: npx tsx examples/qa-07-absolute-positioning.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Absolute Positioning Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('ABSOLUTE POSITIONING EDGE CASES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Position at origin
    .text('ORIGIN (0, 0)', { bold: true, underline: true })
    .text('Element positioned at absolute (0, 0):')
    .add(
      stack()
        .absolutePosition(0, 0)
        .text('[AT ORIGIN 0,0]', { bold: true })
    )
    .spacer(30)

    // Position at specific coordinates
    .text('SPECIFIC COORDINATES', { bold: true, underline: true })
    .text('Elements at (50, 400), (300, 400), (550, 400):')
    .add(
      stack()
        .absolutePosition(50, 400)
        .text('[X=50]')
    )
    .add(
      stack()
        .absolutePosition(300, 400)
        .text('[X=300]')
    )
    .add(
      stack()
        .absolutePosition(550, 400)
        .text('[X=550]')
    )
    .spacer(30)

    // Overlapping elements
    .text('OVERLAPPING ELEMENTS', { bold: true, underline: true })
    .text('Three elements at nearly same position (500, 500):')
    .add(
      stack()
        .absolutePosition(500, 500)
        .text('Layer 1 -----')
    )
    .add(
      stack()
        .absolutePosition(510, 520)
        .text('Layer 2 -----')
    )
    .add(
      stack()
        .absolutePosition(520, 540)
        .text('Layer 3 -----')
    )
    .spacer(80)

    // Absolute inside normal flow content
    .text('ABSOLUTE DOES NOT AFFECT FLOW', { bold: true, underline: true })
    .text('This text is in normal flow.')
    .add(
      stack()
        .absolutePosition(600, 700)
        .text('<<< ABSOLUTE AT (600,700)')
    )
    .text('This text continues in normal flow.')
    .text('The absolute element above should not push this down.')
    .spacer(20)

    // Row of absolute positions
    .text('HORIZONTAL ROW AT Y=800', { bold: true, underline: true })
    .add(stack().absolutePosition(100, 800).text('|P1|'))
    .add(stack().absolutePosition(250, 800).text('|P2|'))
    .add(stack().absolutePosition(400, 800).text('|P3|'))
    .add(stack().absolutePosition(550, 800).text('|P4|'))
    .add(stack().absolutePosition(700, 800).text('|P5|'))
    .spacer(50)

    // Diagonal positions
    .text('DIAGONAL PATTERN', { bold: true, underline: true })
    .add(stack().absolutePosition(100, 900).text('D1'))
    .add(stack().absolutePosition(200, 950).text('D2'))
    .add(stack().absolutePosition(300, 1000).text('D3'))
    .add(stack().absolutePosition(400, 1050).text('D4'))
    .add(stack().absolutePosition(500, 1100).text('D5'))
    .spacer(150)

    // Far right edge
    .text('RIGHT EDGE TEST', { bold: true, underline: true })
    .text('Element near right margin (x=4500):')
    .add(
      stack()
        .absolutePosition(4500, 1300)
        .text('[RIGHT EDGE]')
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Absolute Positioning Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Absolute Positioning', 'qa-07-absolute-positioning');
}

main().catch(console.error);
