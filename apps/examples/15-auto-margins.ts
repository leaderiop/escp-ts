/**
 * Example 15: Auto Margins for Centering
 *
 * Demonstrates using auto margins to center elements:
 * - margin: 'auto' centers horizontally
 * - margin: { left: 'auto', right: 'auto' } also centers
 * - Useful for centering elements without explicit alignment
 *
 * Run: npx tsx examples/15-auto-margins.ts
 */

import { LayoutEngine, stack, flex, text, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Auto Margins Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('AUTO MARGINS FOR CENTERING', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Auto margins automatically center elements horizontally.', { italic: true })
    .text('This is similar to the CSS "margin: 0 auto" technique.', { italic: true })
    .spacer(20)

    // Simple auto margin centering
    .text('BASIC AUTO MARGIN', { bold: true, underline: true })
    .spacer(10)
    .text('Text centered with margin: "auto":')
    .spacer(10)
    .add(
      stack()
        .margin('auto')
        .width(300)
        .padding(15)
        .text('This box is centered!', { align: 'center' })
        .text('Using margin: "auto"', { align: 'center' })
    )
    .spacer(30)

    // Object notation for auto margins
    .text('SELECTIVE AUTO MARGINS', { bold: true, underline: true })
    .spacer(10)
    .text('Using { left: "auto", right: "auto" } with top/bottom values:')
    .spacer(10)
    .add(
      stack()
        .margin({ left: 'auto', right: 'auto', top: 20, bottom: 20 })
        .width(350)
        .padding(15)
        .text('Centered with custom top/bottom margins', { align: 'center' })
        .text('Top: 20 dots, Bottom: 20 dots', { align: 'center' })
    )
    .spacer(30)

    // Multiple centered elements
    .text('MULTIPLE CENTERED ELEMENTS', { bold: true, underline: true })
    .spacer(10)
    .text('Several elements, each centered independently:')
    .spacer(10)
    .add(
      stack()
        .gap(10)
        .add(
          stack()
            .margin('auto')
            .width(400)
            .padding(10)
            .text('Wide centered element (400px)', { align: 'center' })
        )
        .add(
          stack()
            .margin('auto')
            .width(250)
            .padding(10)
            .text('Medium element (250px)', { align: 'center' })
        )
        .add(
          stack().margin('auto').width(150).padding(10).text('Small (150px)', { align: 'center' })
        )
    )
    .spacer(30)

    // Comparison with explicit alignment
    .text('AUTO MARGIN VS ALIGN CENTER', { bold: true, underline: true })
    .spacer(10)
    .text('Auto margin (element is centered):')
    .add(stack().margin('auto').width(300).text('[====== AUTO MARGIN ======]', { align: 'center' }))
    .spacer(10)
    .text('Align center (text within element is centered):')
    .add(
      stack()
        .align('center')
        .add(stack().width(300).text('[====== ALIGN CENTER ======]', { align: 'center' }))
    )
    .spacer(30)

    // Practical use case: Centered card
    .text('PRACTICAL EXAMPLE: CENTERED CARD', { bold: true, underline: true })
    .spacer(10)
    .add(
      stack()
        .margin('auto')
        .width(450)
        .padding(20)
        .gap(10)
        .text('NOTIFICATION', { bold: true, doubleWidth: true, align: 'center' })
        .line('-', 'fill')
        .text('Your order has been confirmed!', { align: 'center' })
        .text('Order #12345', { align: 'center' })
        .spacer(10)
        .text('Expected delivery: December 15, 2024', { italic: true, align: 'center' })
        .line('-', 'fill')
        .text('Thank you for your purchase.', { align: 'center' })
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Auto Margins Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Auto Margins Demo', '15-auto-margins');
}

main().catch(console.error);
