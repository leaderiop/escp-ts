/**
 * QA Test 21: Flex Wrap with All Justify Values
 *
 * Tests flex wrap combined with every justify value:
 * - wrap + justify: start
 * - wrap + justify: center
 * - wrap + justify: end
 * - wrap + justify: space-between
 * - wrap + justify: space-around
 * - wrap + justify: space-evenly
 *
 * Each wrapped line should be justified independently.
 *
 * Run: npx tsx examples/qa-21-flex-wrap-justify-combo.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex Wrap + Justify Combinations');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Helper to create items that will wrap
  const createItems = () => [
    stack().width(300).padding(8).text('[Item 1]', { align: 'center' }),
    stack().width(300).padding(8).text('[Item 2]', { align: 'center' }),
    stack().width(300).padding(8).text('[Item 3]', { align: 'center' }),
    stack().width(300).padding(8).text('[Item 4]', { align: 'center' }),
    stack().width(300).padding(8).text('[Item 5]', { align: 'center' }),
    stack().width(300).padding(8).text('[Item 6]', { align: 'center' }),
    stack().width(300).padding(8).text('[Item 7]', { align: 'center' }),
  ];

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('FLEX WRAP + JUSTIFY COMBINATIONS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: wrap + justify: start
    .text('WRAP + JUSTIFY: START', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('start')
        .gap(10)
        .rowGap(10)
        .add(createItems()[0])
        .add(createItems()[1])
        .add(createItems()[2])
        .add(createItems()[3])
        .add(createItems()[4])
        .add(createItems()[5])
        .add(createItems()[6])
    )
    .spacer(20)

    // Test 2: wrap + justify: center
    .text('WRAP + JUSTIFY: CENTER', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('center')
        .gap(10)
        .rowGap(10)
        .add(createItems()[0])
        .add(createItems()[1])
        .add(createItems()[2])
        .add(createItems()[3])
        .add(createItems()[4])
        .add(createItems()[5])
        .add(createItems()[6])
    )
    .spacer(20)

    // Test 3: wrap + justify: end
    .text('WRAP + JUSTIFY: END', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('end')
        .gap(10)
        .rowGap(10)
        .add(createItems()[0])
        .add(createItems()[1])
        .add(createItems()[2])
        .add(createItems()[3])
        .add(createItems()[4])
        .add(createItems()[5])
        .add(createItems()[6])
    )
    .spacer(20)

    // Test 4: wrap + justify: space-between
    .text('WRAP + JUSTIFY: SPACE-BETWEEN', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('space-between')
        .gap(10)
        .rowGap(10)
        .add(createItems()[0])
        .add(createItems()[1])
        .add(createItems()[2])
        .add(createItems()[3])
        .add(createItems()[4])
        .add(createItems()[5])
        .add(createItems()[6])
    )
    .spacer(20)

    // Test 5: wrap + justify: space-around
    .text('WRAP + JUSTIFY: SPACE-AROUND', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('space-around')
        .gap(10)
        .rowGap(10)
        .add(createItems()[0])
        .add(createItems()[1])
        .add(createItems()[2])
        .add(createItems()[3])
        .add(createItems()[4])
        .add(createItems()[5])
        .add(createItems()[6])
    )
    .spacer(20)

    // Test 6: wrap + justify: space-evenly
    .text('WRAP + JUSTIFY: SPACE-EVENLY', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .justify('space-evenly')
        .gap(10)
        .rowGap(10)
        .add(createItems()[0])
        .add(createItems()[1])
        .add(createItems()[2])
        .add(createItems()[3])
        .add(createItems()[4])
        .add(createItems()[5])
        .add(createItems()[6])
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Wrap + Justify Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex Wrap + Justify', 'qa-21-flex-wrap-justify-combo');
}

main().catch(console.error);
