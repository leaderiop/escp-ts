/**
 * Example 10: Conditional Content
 *
 * Demonstrates conditional content rendering:
 * - when(callback): Show content based on function result
 * - when(SpaceQuery): Show content based on space constraints
 * - fallback(node): Alternative content when condition is false
 *
 * Run: npx tsx examples/10-conditional.ts
 */

import { LayoutEngine, stack, flex, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Conditional Content Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text('CONDITIONAL CONTENT DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Conditional content changes based on available space.', { italic: true })
    .spacer(20)

    // Callback-based condition
    .text('CALLBACK-BASED CONDITIONS', { bold: true, underline: true })
    .spacer(10)
    .text('Using when((ctx) => ctx.availableWidth > threshold)', { italic: true })
    .spacer(10)

    // This shows when width > 1000
    .add(
      stack()
        .when((ctx) => ctx.availableWidth > 1000)
        .text('WIDE LAYOUT: This appears when width > 1000 dots', { bold: true })
    )

    // This shows when width > 2000 (unlikely for typical paper)
    .add(
      stack()
        .when((ctx) => ctx.availableWidth > 5000)
        .text('VERY WIDE: This text requires 5000+ dots width')
        .fallback(text('FALLBACK: Not enough width for very wide content', { italic: true }))
    )
    .spacer(30)

    // SpaceQuery-based conditions
    .text('SPACEQUERY-BASED CONDITIONS', { bold: true, underline: true })
    .spacer(10)
    .text('Using { minWidth, maxWidth, minHeight, maxHeight }', { italic: true })
    .spacer(10)

    // Condition met
    .add(
      stack()
        .when({ minWidth: 500 })
        .text('This shows because minWidth(500) is satisfied', { bold: true })
    )

    // Condition not met (needs more height than available)
    .add(
      stack()
        .when({ minHeight: 10000 })
        .text('This requires minHeight of 10000 dots')
        .fallback(
          stack()
            .text('FALLBACK: Compact version shown instead', { italic: true })
            .text('(10000 dots height not available)', { italic: true })
        )
    )
    .spacer(30)

    // Practical example: Responsive content
    .text('PRACTICAL EXAMPLE: Responsive Content', { bold: true, underline: true })
    .spacer(10)
    .text('Content adapts based on available space:', { italic: true })
    .spacer(10)

    // Full details vs compact
    .add(
      stack()
        .when({ minWidth: 2000 })
        .add(
          flex()
            .gap(50)
            .text('DETAILED VIEW:', { bold: true })
            .text('Name: John Doe')
            .text('Email: john@example.com')
            .text('Phone: 555-1234')
        )
        .fallback(
          stack()
            .text('COMPACT VIEW:', { bold: true })
            .text('John Doe <john@example.com>')
        )
    )
    .spacer(30)

    // SpaceContext properties
    .text('SPACECONTEXT PROPERTIES', { bold: true, underline: true })
    .spacer(10)
    .text('The callback receives a SpaceContext object with:', { italic: true })
    .text('  - availableWidth: Total width available')
    .text('  - availableHeight: Total height available')
    .text('  - remainingWidth: Width after siblings')
    .text('  - remainingHeight: Height after siblings')
    .text('  - pageNumber: Current page (0-indexed)')
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Conditional Content Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Conditional Content Demo', '10-conditional');
}

main().catch(console.error);
