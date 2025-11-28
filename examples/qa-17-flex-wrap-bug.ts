/**
 * QA Test 17: Flex Wrap Verification
 *
 * Demonstrates flex wrap behavior - items wrap to new rows when total width
 * exceeds container width.
 *
 * KEY INSIGHT: Wrapping only occurs when content exceeds container width.
 * Tests 2, 4, 5 use explicit .width() to constrain the container.
 * Test 3 naturally wraps because 15 items exceed paper width.
 *
 * Expected behavior:
 * - When wrap='wrap' is set, items flow to next line when container width is exceeded
 * - rowGap creates spacing between wrapped rows
 * - Each row respects the justify setting
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

    // Test 2: wrap enabled with constrained width to force wrapping
    .text('TEST 2: wrap=wrap with width=2000 (6 x 500 = 3050 dots)', { bold: true, underline: true })
    .text('EXPECTED: Items wrap to 2 rows (container 2000 dots < content 3050 dots)')
    .add(
      flex()
        .wrap('wrap')
        .width(2000)
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

    // Test 3: Many items that exceed full paper width (no explicit width needed)
    .text('TEST 3: 15 items x 400 = 6140 dots (exceeds ~4840 paper width)', { bold: true, underline: true })
    .text('EXPECTED: Wraps to 2 rows (11 items on row 1, 4 on row 2)')
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

    // Test 4: Variable width items with constrained container
    .text('TEST 4: Variable widths with width=2500', { bold: true, underline: true })
    .text('EXPECTED: Items wrap (total 3675 dots > container 2500 dots)')
    .add(
      flex()
        .wrap('wrap')
        .width(2500)
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

    // Test 5: Wrap with justify and constrained width
    .text('TEST 5: Wrap + justify=space-between with width=2000', { bold: true, underline: true })
    .text('EXPECTED: Each row has items at edges (3000 dots > container 2000 dots)')
    .add(
      flex()
        .wrap('wrap')
        .width(2000)
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
