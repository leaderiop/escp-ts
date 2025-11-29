/**
 * QA Test 43: Flex alignItems + justify Combinations
 *
 * Comprehensive test of all flex alignment combinations:
 * - justify: start, center, end, space-between, space-around, space-evenly
 * - alignItems: top, center, bottom
 * - Combined effects with varying child heights
 *
 * Run: npx tsx examples/qa-43-flex-align-justify.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex Align + Justify');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Helper to create test items with different heights
  const createItems = () => [
    stack().width(150).padding(10).text('Short'),
    stack().width(150).padding(30).text('Tall'),
    stack().width(150).padding(20).text('Med'),
  ];

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('FLEX ALIGN + JUSTIFY COMBINATIONS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Section 1: justify variations with alignItems=top
    .text('SECTION 1: alignItems=TOP with all justify options', { bold: true, underline: true })

    .text('justify=start:')
    .add(
      flex()
        .width(1500)
        .alignItems('top')
        .justify('start')
        .gap(10)
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(30).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=center:')
    .add(
      flex()
        .width(1500)
        .alignItems('top')
        .justify('center')
        .gap(10)
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(30).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=end:')
    .add(
      flex()
        .width(1500)
        .alignItems('top')
        .justify('end')
        .gap(10)
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(30).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=space-between:')
    .add(
      flex()
        .width(1500)
        .alignItems('top')
        .justify('space-between')
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(30).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=space-around:')
    .add(
      flex()
        .width(1500)
        .alignItems('top')
        .justify('space-around')
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(30).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=space-evenly:')
    .add(
      flex()
        .width(1500)
        .alignItems('top')
        .justify('space-evenly')
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(30).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )
    .spacer(15)

    // Section 2: justify variations with alignItems=center
    .text('SECTION 2: alignItems=CENTER with key justify options', { bold: true, underline: true })

    .text('justify=start + alignItems=center:')
    .add(
      flex()
        .width(1500)
        .alignItems('center')
        .justify('start')
        .gap(10)
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(40).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=space-between + alignItems=center:')
    .add(
      flex()
        .width(1500)
        .alignItems('center')
        .justify('space-between')
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(40).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )
    .spacer(15)

    // Section 3: justify variations with alignItems=bottom
    .text('SECTION 3: alignItems=BOTTOM with key justify options', { bold: true, underline: true })

    .text('justify=start + alignItems=bottom:')
    .add(
      flex()
        .width(1500)
        .alignItems('bottom')
        .justify('start')
        .gap(10)
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(40).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )

    .text('justify=end + alignItems=bottom:')
    .add(
      flex()
        .width(1500)
        .alignItems('bottom')
        .justify('end')
        .gap(10)
        .add(stack().width(150).padding(10).text('Short'))
        .add(stack().width(150).padding(40).text('Tall'))
        .add(stack().width(150).padding(20).text('Med'))
    )
    .spacer(15)

    // Section 4: Single item edge cases
    .text('SECTION 4: Single item in flex (edge case)', { bold: true, underline: true })

    .text('Single item with space-between (should act as start):')
    .add(
      flex()
        .width(1000)
        .justify('space-between')
        .add(stack().width(200).padding(10).text('Only one'))
    )

    .text('Single item with space-around (should center):')
    .add(
      flex()
        .width(1000)
        .justify('space-around')
        .add(stack().width(200).padding(10).text('Only one'))
    )

    .text('Single item with space-evenly (should center):')
    .add(
      flex()
        .width(1000)
        .justify('space-evenly')
        .add(stack().width(200).padding(10).text('Only one'))
    )
    .spacer(15)

    // Section 5: Two items edge cases
    .text('SECTION 5: Two items in flex', { bold: true, underline: true })

    .text('Two items with space-between:')
    .add(
      flex()
        .width(1200)
        .justify('space-between')
        .add(stack().width(200).padding(15).text('First'))
        .add(stack().width(200).padding(25).text('Second'))
    )

    .text('Two items with space-evenly:')
    .add(
      flex()
        .width(1200)
        .justify('space-evenly')
        .alignItems('center')
        .add(stack().width(200).padding(15).text('First'))
        .add(stack().width(200).padding(25).text('Second'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Align/Justify Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex Align + Justify', 'qa-43-flex-align-justify');
}

main().catch(console.error);
