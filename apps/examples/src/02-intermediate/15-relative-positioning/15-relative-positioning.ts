/**
 * Example 16: Relative Positioning
 *
 * Demonstrates relative positioning which allows elements to be
 * offset from their normal flow position while still affecting
 * sibling layout.
 *
 * Key difference from absolute positioning:
 * - Absolute: Element is removed from flow, positioned at exact x,y
 * - Relative: Element stays in flow, but rendered position is offset
 *
 * Run: npx tsx examples/16-relative-positioning.ts
 */

import { LayoutEngine, stack, flex, text, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('Relative Positioning Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('RELATIVE POSITIONING', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Relative positioning offsets an element from its normal position', { italic: true })
    .text('while keeping it in the document flow.', { italic: true })
    .spacer(20)

    // Basic example
    .text('BASIC OFFSET', { bold: true, underline: true })
    .spacer(10)
    .text('Normal text for reference')
    .add(stack().relativePosition(50, 0).text('-> This text is offset 50 dots to the right'))
    .text('Normal text continues in flow')
    .spacer(30)

    // Vertical offset
    .text('VERTICAL OFFSET', { bold: true, underline: true })
    .spacer(10)
    .text('Reference line 1')
    .add(stack().relativePosition(0, -20).text('Offset UP by 20 dots (overlapping above)'))
    .text('Reference line 2 (notice flow is preserved)')
    .spacer(30)

    // Negative offset
    .text('NEGATIVE OFFSETS', { bold: true, underline: true })
    .spacer(10)
    .add(
      stack()
        .padding({ left: 100 })
        .text('Starting at 100px indent')
        .add(stack().relativePosition(-50, 0).text('<- Pulled LEFT by 50 dots'))
        .text('Normal position continues')
    )
    .spacer(30)

    // Combined X and Y offset
    .text('COMBINED X/Y OFFSET', { bold: true, underline: true })
    .spacer(10)
    .text('Normal position marker')
    .add(stack().relativePosition(80, 10).text('Offset: X+80, Y+10'))
    .text('Flow continues as if no offset')
    .spacer(30)

    // Use case: Drop shadow effect
    .text('USE CASE: DROP SHADOW EFFECT', { bold: true, underline: true })
    .spacer(10)
    .add(
      stack()
        .padding(20)
        .add(
          // Shadow (rendered first, offset)
          stack()
            .relativePosition(3, 3)
            .width(300)
            .padding(15)
            .text('__________________________', { align: 'center' })
            .text('|  SHADOW BEHIND BOX  |', { align: 'center' })
            .text('|__________________________|', { align: 'center' })
        )
        .add(
          // Main box (normal position)
          stack()
            .relativePosition(0, -60) // Pull up to overlay shadow
            .width(300)
            .padding(15)
            .text('+==========================+', { align: 'center' })
            .text('|  MAIN CONTENT BOX  |', { align: 'center' })
            .text('+==========================+', { align: 'center' })
        )
    )
    .spacer(50)

    // Comparison with absolute
    .text('RELATIVE VS ABSOLUTE', { bold: true, underline: true })
    .spacer(10)
    .text('Relative: Element stays in flow, siblings are not affected.')
    .text('Absolute: Element is removed from flow, positioned at exact x,y.')
    .spacer(20)

    .add(
      flex()
        .gap(50)
        .add(
          stack()
            .width('40%')
            .padding(10)
            .text('RELATIVE:', { bold: true })
            .text('Item 1')
            .add(stack().relativePosition(30, 0).text('Item 2 (offset)'))
            .text('Item 3 (follows flow)')
        )
        .add(
          stack()
            .width('40%')
            .padding(10)
            .text('ABSOLUTE:', { bold: true })
            .text('Item 1')
            .add(stack().absolutePosition(500, 800).text('Item 2 (absolute)'))
            .text('Item 3 (ignores Item 2)')
        )
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Relative Positioning Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Relative Positioning Demo', '16-relative-positioning');
}

main().catch(console.error);
