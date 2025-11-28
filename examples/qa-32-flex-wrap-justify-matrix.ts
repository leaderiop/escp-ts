/**
 * QA Test 32: Flex Wrap with Justify Content Matrix Test
 *
 * Tests all combinations of wrap and justify to verify:
 * - Each wrapped line respects its own justify mode
 * - Row gaps are correctly applied
 * - No black holes or rendering artifacts
 * - Items flow to next line at correct breakpoints
 *
 * Run: npx tsx examples/qa-32-flex-wrap-justify-matrix.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex Wrap + Justify Matrix');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Create items that will wrap (6 items of 600px each should wrap in ~4900px container)
  const createWrapItems = () => [
    stack().width(600).padding(5).text('[Item 1]'),
    stack().width(600).padding(5).text('[Item 2]'),
    stack().width(600).padding(5).text('[Item 3]'),
    stack().width(600).padding(5).text('[Item 4]'),
    stack().width(600).padding(5).text('[Item 5]'),
    stack().width(600).padding(5).text('[Item 6]'),
    stack().width(600).padding(5).text('[Item 7]'),
  ];

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('FLEX WRAP + JUSTIFY MATRIX', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: wrap + justify: start
    .text('TEST 1: wrap + justify: START', { bold: true, underline: true })
    .text('Expected: Items wrap, each row left-aligned')
    .add(
      flex()
        .wrap('wrap')
        .justify('start')
        .gap(10)
        .rowGap(15)
        .add(createWrapItems()[0]!)
        .add(createWrapItems()[1]!)
        .add(createWrapItems()[2]!)
        .add(createWrapItems()[3]!)
        .add(createWrapItems()[4]!)
        .add(createWrapItems()[5]!)
        .add(createWrapItems()[6]!)
    )
    .spacer(15)

    // Test 2: wrap + justify: center
    .text('TEST 2: wrap + justify: CENTER', { bold: true, underline: true })
    .text('Expected: Items wrap, each row centered')
    .add(
      flex()
        .wrap('wrap')
        .justify('center')
        .gap(10)
        .rowGap(15)
        .add(createWrapItems()[0]!)
        .add(createWrapItems()[1]!)
        .add(createWrapItems()[2]!)
        .add(createWrapItems()[3]!)
        .add(createWrapItems()[4]!)
        .add(createWrapItems()[5]!)
        .add(createWrapItems()[6]!)
    )
    .spacer(15)

    // Test 3: wrap + justify: end
    .text('TEST 3: wrap + justify: END', { bold: true, underline: true })
    .text('Expected: Items wrap, each row right-aligned')
    .add(
      flex()
        .wrap('wrap')
        .justify('end')
        .gap(10)
        .rowGap(15)
        .add(createWrapItems()[0]!)
        .add(createWrapItems()[1]!)
        .add(createWrapItems()[2]!)
        .add(createWrapItems()[3]!)
        .add(createWrapItems()[4]!)
        .add(createWrapItems()[5]!)
        .add(createWrapItems()[6]!)
    )
    .spacer(15)

    // Test 4: wrap + justify: space-between
    .text('TEST 4: wrap + justify: SPACE-BETWEEN', { bold: true, underline: true })
    .text('Expected: Items wrap, each row with items at edges')
    .add(
      flex()
        .wrap('wrap')
        .justify('space-between')
        .rowGap(15)
        .add(createWrapItems()[0]!)
        .add(createWrapItems()[1]!)
        .add(createWrapItems()[2]!)
        .add(createWrapItems()[3]!)
        .add(createWrapItems()[4]!)
        .add(createWrapItems()[5]!)
        .add(createWrapItems()[6]!)
    )
    .spacer(15)

    // Test 5: wrap + justify: space-around
    .text('TEST 5: wrap + justify: SPACE-AROUND', { bold: true, underline: true })
    .text('Expected: Items wrap, equal space around each item')
    .add(
      flex()
        .wrap('wrap')
        .justify('space-around')
        .rowGap(15)
        .add(createWrapItems()[0]!)
        .add(createWrapItems()[1]!)
        .add(createWrapItems()[2]!)
        .add(createWrapItems()[3]!)
        .add(createWrapItems()[4]!)
        .add(createWrapItems()[5]!)
        .add(createWrapItems()[6]!)
    )
    .spacer(15)

    // Test 6: wrap + justify: space-evenly
    .text('TEST 6: wrap + justify: SPACE-EVENLY', { bold: true, underline: true })
    .text('Expected: Items wrap, even spacing everywhere')
    .add(
      flex()
        .wrap('wrap')
        .justify('space-evenly')
        .rowGap(15)
        .add(createWrapItems()[0]!)
        .add(createWrapItems()[1]!)
        .add(createWrapItems()[2]!)
        .add(createWrapItems()[3]!)
        .add(createWrapItems()[4]!)
        .add(createWrapItems()[5]!)
        .add(createWrapItems()[6]!)
    )
    .spacer(15)

    // Test 7: Uneven item widths with wrap
    .text('TEST 7: Variable width items with wrap', { bold: true, underline: true })
    .text('Expected: Items of different sizes wrap correctly')
    .add(
      flex()
        .wrap('wrap')
        .justify('start')
        .gap(10)
        .rowGap(10)
        .add(stack().width(400).padding(5).text('[400px]'))
        .add(stack().width(800).padding(5).text('[800px]'))
        .add(stack().width(600).padding(5).text('[600px]'))
        .add(stack().width(500).padding(5).text('[500px]'))
        .add(stack().width(700).padding(5).text('[700px]'))
        .add(stack().width(300).padding(5).text('[300px]'))
        .add(stack().width(900).padding(5).text('[900px]'))
    )
    .spacer(15)

    // Test 8: Single item on last row
    .text('TEST 8: Single item on last row (justify edge case)', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('space-between')
        .gap(10)
        .rowGap(10)
        .add(stack().width(1500).padding(5).text('[1500px - Row 1]'))
        .add(stack().width(1500).padding(5).text('[1500px - Row 1]'))
        .add(stack().width(1500).padding(5).text('[1500px - Row 2]'))
        .add(stack().width(1500).padding(5).text('[1500px - Row 2]'))
        .add(stack().width(1500).padding(5).text('[1500px - Row 3 SINGLE]'))
    )
    .spacer(15)

    // Test 9: Large row gap
    .text('TEST 9: Large row gap (50 dots)', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('start')
        .gap(10)
        .rowGap(50)
        .add(stack().width(700).padding(5).text('[Row 1 - A]'))
        .add(stack().width(700).padding(5).text('[Row 1 - B]'))
        .add(stack().width(700).padding(5).text('[Row 1 - C]'))
        .add(stack().width(700).padding(5).text('[Row 2 - A]'))
        .add(stack().width(700).padding(5).text('[Row 2 - B]'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Wrap + Justify Matrix Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex Wrap + Justify Matrix', 'qa-32-flex-wrap-justify-matrix');
}

main().catch(console.error);
