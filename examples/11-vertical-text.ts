/**
 * Example 11: Vertical Text
 *
 * Demonstrates vertical text orientation:
 * - orientation: 'vertical' stacks characters vertically
 * - Useful for labels, margins, or Asian language layouts
 *
 * Run: npx tsx examples/11-vertical-text.ts
 */

import { LayoutEngine, stack, flex, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Vertical Text Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text('VERTICAL TEXT DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Vertical text orientation stacks characters top-to-bottom.', { italic: true })
    .spacer(30)

    // Basic vertical text
    .text('BASIC VERTICAL TEXT', { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .gap(50)
        .add(
          stack()
            .text('Horizontal:', { bold: true })
            .text('HELLO')
        )
        .add(
          stack()
            .text('Vertical:', { bold: true })
            .text('HELLO', { orientation: 'vertical' })
        )
    )
    .spacer(30)

    // Styled vertical text
    .text('STYLED VERTICAL TEXT', { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .gap(40)
        .add(text('BOLD', { orientation: 'vertical', bold: true }))
        .add(text('ITALIC', { orientation: 'vertical', italic: true }))
        .add(text('UNDER', { orientation: 'vertical', underline: true }))
        .add(text('WIDE', { orientation: 'vertical', doubleWidth: true }))
    )
    .spacer(30)

    // Practical example: Side label
    .text('PRACTICAL EXAMPLE: Side Labels', { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .gap(20)
        .add(
          text('LABEL', { orientation: 'vertical', bold: true })
        )
        .add(
          stack()
            .text('Content area with vertical label on the side.')
            .text('This pattern is useful for forms, documents,')
            .text('or decorative purposes.')
        )
    )
    .spacer(30)

    // Multiple vertical texts as headers
    .text('COLUMN HEADERS (Vertical)', { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .gap(30)
        .alignItems('bottom')
        .add(text('NAME', { orientation: 'vertical', bold: true }))
        .add(text('EMAIL', { orientation: 'vertical', bold: true }))
        .add(text('PHONE', { orientation: 'vertical', bold: true }))
        .add(text('ADDRESS', { orientation: 'vertical', bold: true }))
    )
    .spacer(30)

    // Comparison
    .text('ORIENTATION COMPARISON', { bold: true, underline: true })
    .spacer(10)
    .text('Same text in both orientations:')
    .spacer(5)
    .add(
      flex()
        .gap(100)
        .add(
          stack()
            .text('TEST', { bold: true })
            .text('(horizontal)', { italic: true })
        )
        .add(
          stack()
            .text('TEST', { orientation: 'vertical', bold: true })
            .text('(vertical)', { italic: true, orientation: 'vertical' })
        )
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Vertical Text Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Vertical Text Demo', '11-vertical-text');
}

main().catch(console.error);
