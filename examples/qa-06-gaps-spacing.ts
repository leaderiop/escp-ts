/**
 * QA Test 06: Gap and Spacing Tests
 *
 * Tests various gap and spacing configurations:
 * - Stack gap values (0, small, large)
 * - Flex gap values
 * - Flex rowGap (for wrapped flex)
 * - Grid columnGap and rowGap
 * - Zero gap edge case
 * - Large gap stress test
 *
 * Run: npx tsx examples/qa-06-gaps-spacing.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Gaps and Spacing');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('GAPS AND SPACING TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Stack gap: 0
    .text('STACK gap: 0 (no spacing)', { bold: true, underline: true })
    .add(
      stack()
        .gap(0)
        .text('Line 1 - gap 0')
        .text('Line 2 - gap 0')
        .text('Line 3 - gap 0')
    )
    .spacer(15)

    // Stack gap: 5
    .text('STACK gap: 5 (small)', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .text('Line 1 - gap 5')
        .text('Line 2 - gap 5')
        .text('Line 3 - gap 5')
    )
    .spacer(15)

    // Stack gap: 30
    .text('STACK gap: 30 (large)', { bold: true, underline: true })
    .add(
      stack()
        .gap(30)
        .text('Line 1 - gap 30')
        .text('Line 2 - gap 30')
        .text('Line 3 - gap 30')
    )
    .spacer(15)

    // Flex gap comparison
    .text('FLEX GAP COMPARISON', { bold: true, underline: true })
    .text('gap: 5')
    .add(
      flex()
        .gap(5)
        .add(stack().text('[A]'))
        .add(stack().text('[B]'))
        .add(stack().text('[C]'))
    )
    .spacer(5)
    .text('gap: 30')
    .add(
      flex()
        .gap(30)
        .add(stack().text('[A]'))
        .add(stack().text('[B]'))
        .add(stack().text('[C]'))
    )
    .spacer(5)
    .text('gap: 80')
    .add(
      flex()
        .gap(80)
        .add(stack().text('[A]'))
        .add(stack().text('[B]'))
        .add(stack().text('[C]'))
    )
    .spacer(15)

    // Flex wrap with rowGap
    .text('FLEX WRAP: gap vs rowGap', { bold: true, underline: true })
    .text('gap: 10, rowGap: 5')
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(5)
        .add(stack().width(200).padding(5).text('Item 1'))
        .add(stack().width(200).padding(5).text('Item 2'))
        .add(stack().width(200).padding(5).text('Item 3'))
        .add(stack().width(200).padding(5).text('Item 4'))
    )
    .spacer(10)
    .text('gap: 10, rowGap: 30')
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(30)
        .add(stack().width(200).padding(5).text('Item 1'))
        .add(stack().width(200).padding(5).text('Item 2'))
        .add(stack().width(200).padding(5).text('Item 3'))
        .add(stack().width(200).padding(5).text('Item 4'))
    )
    .spacer(15)

    // Grid gaps
    .text('GRID: columnGap vs rowGap', { bold: true, underline: true })
    .text('columnGap: 5, rowGap: 5')
    .add(
      grid([150, 150, 150])
        .columnGap(5)
        .rowGap(5)
        .cell('A1').cell('A2').cell('A3').row()
        .cell('B1').cell('B2').cell('B3').row()
    )
    .spacer(10)
    .text('columnGap: 40, rowGap: 20')
    .add(
      grid([150, 150, 150])
        .columnGap(40)
        .rowGap(20)
        .cell('A1').cell('A2').cell('A3').row()
        .cell('B1').cell('B2').cell('B3').row()
    )
    .spacer(15)

    // Zero gap edge case
    .text('ZERO GAP EDGE CASE', { bold: true, underline: true })
    .add(
      grid([100, 100, 100])
        .columnGap(0)
        .rowGap(0)
        .cell('A1').cell('A2').cell('A3').row()
        .cell('B1').cell('B2').cell('B3').row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Gaps and Spacing Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Gaps and Spacing', 'qa-06-gaps-spacing');
}

main().catch(console.error);
