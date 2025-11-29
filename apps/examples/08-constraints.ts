/**
 * Example 08: Size Constraints
 *
 * Demonstrates min/max width and height constraints:
 * - minWidth: Ensures element is at least this wide
 * - maxWidth: Limits element width
 * - minHeight: Ensures element is at least this tall
 * - maxHeight: Limits element height
 *
 * Run: npx tsx examples/08-constraints.ts
 */

import { LayoutEngine, stack, flex, text, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Size Constraints Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('SIZE CONSTRAINTS DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // minWidth demonstration
    .text('minWidth CONSTRAINT', { bold: true, underline: true })
    .spacer(10)
    .text('Short text without constraint:', { italic: true })
    .add(
      stack().padding(10).text('Hi') // Short text, natural width
    )
    .spacer(5)
    .text('Same text with minWidth(400):', { italic: true })
    .add(
      stack()
        .minWidth(400) // Force minimum width
        .padding(10)
        .text('Hi')
    )
    .spacer(20)

    // maxWidth demonstration
    .text('maxWidth CONSTRAINT', { bold: true, underline: true })
    .spacer(10)
    .text('Long text without constraint:', { italic: true })
    .add(
      stack()
        .padding(10)
        .text(
          'This is a very long line of text that would normally extend across the full page width'
        )
    )
    .spacer(5)
    .text('Same text with maxWidth(600):', { italic: true })
    .add(
      stack()
        .maxWidth(600) // Limit width
        .padding(10)
        .text(
          'This is a very long line of text that would normally extend across the full page width'
        )
    )
    .spacer(20)

    // minHeight demonstration
    .text('minHeight CONSTRAINT', { bold: true, underline: true })
    .spacer(10)
    .text('Content without minHeight:', { italic: true })
    .add(stack().padding(10).text('Short content'))
    .spacer(5)
    .text('Same content with minHeight(100):', { italic: true })
    .add(
      stack()
        .minHeight(100) // Force minimum height
        .padding(10)
        .text('Short content')
    )
    .spacer(20)

    // Combined constraints
    .text('COMBINED CONSTRAINTS', { bold: true, underline: true })
    .spacer(10)
    .text('Box with minWidth(300), maxWidth(500), minHeight(80):', { italic: true })
    .add(
      stack()
        .minWidth(300)
        .maxWidth(500)
        .minHeight(80)
        .padding(15)
        .text('Constrained content box')
        .text('Width: 300-500 dots')
        .text('Height: min 80 dots')
    )
    .spacer(30)

    // Practical example
    .text('PRACTICAL EXAMPLE: Form Fields', { bold: true, underline: true })
    .spacer(10)
    .add(
      stack()
        .gap(10)
        .add(
          flex()
            .gap(20)
            .text('Name:', { bold: true })
            .add(stack().minWidth(400).text('_______________________'))
        )
        .add(
          flex()
            .gap(20)
            .text('Email:', { bold: true })
            .add(stack().minWidth(400).text('_______________________'))
        )
        .add(
          flex()
            .gap(20)
            .text('Phone:', { bold: true })
            .add(stack().minWidth(200).maxWidth(300).text('_____________'))
        )
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Constraints Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Size Constraints Demo', '08-constraints');
}

main().catch(console.error);
