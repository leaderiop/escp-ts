/**
 * QA Test 17: Flex Wrap Bug Verification
 *
 * This test specifically targets BUG-003: Flex wrap not creating multiple rows.
 *
 * Expected behavior:
 * - When wrap='wrap' is set, items should flow to next line when container width is exceeded
 * - rowGap should create spacing between wrapped rows
 * - Each row should respect the justify setting
 *
 * Run: npx tsx examples/qa-17-flex-wrap-bug.ts
 */

import { LayoutEngine, stack, flex, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex Wrap Bug Verification');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Calculate approximate container width
  // Default paper printable width is about 4900 dots (13.6 inches * 360 DPI)
  const containerWidth = 4900 - 60; // minus padding

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('FLEX WRAP BUG TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Show container info
    .text(`Container width: ~${containerWidth} dots`, { italic: true })
    .spacer(10)

    // Control: nowrap (default) - should overflow
    .text('CONTROL: wrap=nowrap (6 x 500 = 3000 dots)', { bold: true, underline: true })
    .text('All items should be on one line, may overflow:')
    .add(
      flex()
        .gap(10)
        .add(stack().width(500).text('[Item 1 - 500w]'))
        .add(stack().width(500).text('[Item 2 - 500w]'))
        .add(stack().width(500).text('[Item 3 - 500w]'))
        .add(stack().width(500).text('[Item 4 - 500w]'))
        .add(stack().width(500).text('[Item 5 - 500w]'))
        .add(stack().width(500).text('[Item 6 - 500w]'))
    )
    .spacer(20)

    // Bug case: wrap enabled with items that should wrap
    .text('BUG TEST: wrap=wrap (6 x 500 = 3000 dots)', { bold: true, underline: true })
    .text('EXPECTED: Items should wrap to 2 rows (~2500 dots per row max)')
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(20)
        .add(stack().width(500).text('[Item 1 - 500w]'))
        .add(stack().width(500).text('[Item 2 - 500w]'))
        .add(stack().width(500).text('[Item 3 - 500w]'))
        .add(stack().width(500).text('[Item 4 - 500w]'))
        .add(stack().width(500).text('[Item 5 - 500w]'))
        .add(stack().width(500).text('[Item 6 - 500w]'))
    )
    .spacer(20)

    // Smaller items that should definitely wrap
    .text('BUG TEST: Many small items (15 x 400 = 6000 dots)', { bold: true, underline: true })
    .text('EXPECTED: Should wrap to ~3 rows')
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(15)
        .add(stack().width(400).text('[1]'))
        .add(stack().width(400).text('[2]'))
        .add(stack().width(400).text('[3]'))
        .add(stack().width(400).text('[4]'))
        .add(stack().width(400).text('[5]'))
        .add(stack().width(400).text('[6]'))
        .add(stack().width(400).text('[7]'))
        .add(stack().width(400).text('[8]'))
        .add(stack().width(400).text('[9]'))
        .add(stack().width(400).text('[10]'))
        .add(stack().width(400).text('[11]'))
        .add(stack().width(400).text('[12]'))
        .add(stack().width(400).text('[13]'))
        .add(stack().width(400).text('[14]'))
        .add(stack().width(400).text('[15]'))
    )
    .spacer(20)

    // Variable width items
    .text('BUG TEST: Variable widths with wrap', { bold: true, underline: true })
    .text('EXPECTED: Items wrap based on actual widths')
    .add(
      flex()
        .wrap('wrap')
        .gap(15)
        .rowGap(10)
        .add(stack().width(800).text('[Wide 800]'))
        .add(stack().width(600).text('[Med 600]'))
        .add(stack().width(400).text('[Sm 400]'))
        .add(stack().width(1000).text('[Extra Wide 1000]'))
        .add(stack().width(300).text('[Tiny 300]'))
        .add(stack().width(500).text('[Half 500]'))
    )
    .spacer(20)

    // Wrap with justify
    .text('BUG TEST: Wrap + justify=space-between', { bold: true, underline: true })
    .text('EXPECTED: Each row should have items at edges')
    .add(
      flex()
        .wrap('wrap')
        .justify('space-between')
        .rowGap(20)
        .add(stack().width(600).text('[Row1-A]'))
        .add(stack().width(600).text('[Row1-B]'))
        .add(stack().width(600).text('[Row1-C]'))
        .add(stack().width(600).text('[Row2-A]'))
        .add(stack().width(600).text('[Row2-B]'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Wrap Bug Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex Wrap Bug', 'qa-17-flex-wrap-bug');
}

main().catch(console.error);
