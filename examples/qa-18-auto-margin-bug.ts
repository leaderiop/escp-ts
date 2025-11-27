/**
 * QA Test 18: Auto Margin Centering Bug Verification
 *
 * This test specifically targets BUG-004: Auto margin centering truncates text.
 *
 * Expected behavior:
 * - Elements with margin='auto' should be horizontally centered
 * - The element's content area should be the specified width
 * - Text should NOT be truncated if it fits within the specified width
 *
 * Run: npx tsx examples/qa-18-auto-margin-bug.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Auto Margin Bug Verification');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('AUTO MARGIN CENTERING BUG TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Reference: No auto margin (left aligned)
    .text('REFERENCE: No auto margin (left aligned)', { bold: true, underline: true })
    .add(
      stack()
        .width(800)
        .padding(10)
        .text('This is text in an 800-dot wide box')
        .text('It should NOT be truncated')
    )
    .spacer(15)

    // Bug case: Auto margin with explicit width
    .text('BUG TEST: margin=auto with width=800', { bold: true, underline: true })
    .text('EXPECTED: Same text as above, but centered on page:')
    .add(
      stack()
        .margin('auto')
        .width(800)
        .padding(10)
        .text('This is text in an 800-dot wide box')
        .text('It should NOT be truncated')
    )
    .spacer(15)

    // Wider box test
    .text('BUG TEST: margin=auto with width=1200', { bold: true, underline: true })
    .add(
      stack()
        .margin('auto')
        .width(1200)
        .padding(10)
        .text('This is a wider centered box with 1200 dots of width')
        .text('All of this text should be visible without truncation')
    )
    .spacer(15)

    // Very short text (should definitely fit)
    .text('BUG TEST: Short text in 600-dot centered box', { bold: true, underline: true })
    .add(
      stack()
        .margin('auto')
        .width(600)
        .padding(10)
        .text('Short text', { align: 'center' })
    )
    .spacer(15)

    // Comparison: Different widths centered
    .text('WIDTH COMPARISON (all centered):', { bold: true, underline: true })
    .add(
      stack()
        .margin('auto')
        .width(400)
        .padding(5)
        .text('Width: 400', { align: 'center' })
    )
    .add(
      stack()
        .margin('auto')
        .width(600)
        .padding(5)
        .text('Width: 600', { align: 'center' })
    )
    .add(
      stack()
        .margin('auto')
        .width(800)
        .padding(5)
        .text('Width: 800', { align: 'center' })
    )
    .add(
      stack()
        .margin('auto')
        .width(1000)
        .padding(5)
        .text('Width: 1000', { align: 'center' })
    )
    .spacer(15)

    // Auto margin with nested content
    .text('AUTO MARGIN WITH NESTED CONTENT:', { bold: true, underline: true })
    .add(
      stack()
        .margin('auto')
        .width(900)
        .padding(15)
        .text('Centered Container', { bold: true, align: 'center' })
        .line('-', 'fill')
        .add(
          flex()
            .justify('space-between')
            .add(stack().text('Left Item'))
            .add(stack().text('Right Item'))
        )
        .line('-', 'fill')
        .text('Footer text in centered container', { align: 'center' })
    )
    .spacer(15)

    // Expected measurements
    .text('MEASUREMENT REFERENCE:', { bold: true })
    .text('Container width: ~4900 dots (13.6 inches @ 360 DPI)')
    .text('Width 800 box should have ~2050 dots margin on each side')
    .text('Width 1200 box should have ~1850 dots margin on each side')

    // Footer
    .line('-', 'fill')
    .text('End of Auto Margin Bug Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Auto Margin Bug', 'qa-18-auto-margin-bug');
}

main().catch(console.error);
