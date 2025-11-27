/**
 * QA Test 15: Flex Wrap Behavior
 *
 * Tests flex wrap functionality:
 * - wrap: 'nowrap' (default) - all items on one line
 * - wrap: 'wrap' - items wrap to next line
 * - rowGap vs gap in wrapped flex
 *
 * Run: npx tsx examples/qa-15-flex-wrap-test.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex Wrap');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('FLEX WRAP BEHAVIOR TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Default nowrap
    .text('DEFAULT: nowrap', { bold: true, underline: true })
    .text('Items should stay on one line (may overflow)')
    .add(
      flex()
        .gap(10)
        .add(stack().width(200).padding(5).text('[Item 1]'))
        .add(stack().width(200).padding(5).text('[Item 2]'))
        .add(stack().width(200).padding(5).text('[Item 3]'))
        .add(stack().width(200).padding(5).text('[Item 4]'))
        .add(stack().width(200).padding(5).text('[Item 5]'))
        .add(stack().width(200).padding(5).text('[Item 6]'))
    )
    .spacer(15)

    // Test 2: wrap enabled
    .text('WRAP ENABLED', { bold: true, underline: true })
    .text('Items should wrap to next line when container is full')
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(10)
        .add(stack().width(200).padding(5).text('[Item 1]'))
        .add(stack().width(200).padding(5).text('[Item 2]'))
        .add(stack().width(200).padding(5).text('[Item 3]'))
        .add(stack().width(200).padding(5).text('[Item 4]'))
        .add(stack().width(200).padding(5).text('[Item 5]'))
        .add(stack().width(200).padding(5).text('[Item 6]'))
        .add(stack().width(200).padding(5).text('[Item 7]'))
        .add(stack().width(200).padding(5).text('[Item 8]'))
    )
    .spacer(15)

    // Test 3: wrap with different gap and rowGap
    .text('WRAP WITH GAP=5, ROWGAP=30', { bold: true, underline: true })
    .text('Horizontal gap should be 5, vertical gap should be 30')
    .add(
      flex()
        .wrap('wrap')
        .gap(5)
        .rowGap(30)
        .add(stack().width(180).padding(5).text('[A]'))
        .add(stack().width(180).padding(5).text('[B]'))
        .add(stack().width(180).padding(5).text('[C]'))
        .add(stack().width(180).padding(5).text('[D]'))
        .add(stack().width(180).padding(5).text('[E]'))
        .add(stack().width(180).padding(5).text('[F]'))
    )
    .spacer(15)

    // Test 4: wrap with justify space-between
    .text('WRAP + JUSTIFY: space-between', { bold: true, underline: true })
    .text('Each row should have items at edges')
    .add(
      flex()
        .wrap('wrap')
        .justify('space-between')
        .rowGap(15)
        .add(stack().width(250).padding(5).text('[Row1-A]'))
        .add(stack().width(250).padding(5).text('[Row1-B]'))
        .add(stack().width(250).padding(5).text('[Row1-C]'))
        .add(stack().width(250).padding(5).text('[Row2-A]'))
        .add(stack().width(250).padding(5).text('[Row2-B]'))
    )
    .spacer(15)

    // Test 5: Many small items wrapping
    .text('MANY SMALL ITEMS', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .gap(8)
        .rowGap(8)
        .add(stack().padding(3).text('1'))
        .add(stack().padding(3).text('2'))
        .add(stack().padding(3).text('3'))
        .add(stack().padding(3).text('4'))
        .add(stack().padding(3).text('5'))
        .add(stack().padding(3).text('6'))
        .add(stack().padding(3).text('7'))
        .add(stack().padding(3).text('8'))
        .add(stack().padding(3).text('9'))
        .add(stack().padding(3).text('10'))
        .add(stack().padding(3).text('11'))
        .add(stack().padding(3).text('12'))
        .add(stack().padding(3).text('13'))
        .add(stack().padding(3).text('14'))
        .add(stack().padding(3).text('15'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Wrap Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex Wrap', 'qa-15-flex-wrap-test');
}

main().catch(console.error);
