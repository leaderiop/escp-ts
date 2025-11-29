/**
 * QA Test 02: Flex AlignItems Values
 *
 * Tests all alignItems values for vertical alignment within flex:
 * - top: items aligned to top of flex container
 * - center: items vertically centered
 * - bottom: items aligned to bottom of flex container
 *
 * Uses items of different heights to make alignment visible.
 *
 * Run: npx tsx examples/qa-02-flex-align-items.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex AlignItems');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('FLEX ALIGN ITEMS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // alignItems: top (default)
    .text('alignItems: TOP (default)', { bold: true, underline: true })
    .add(
      flex()
        .alignItems('top')
        .gap(30)
        .height(150)
        .add(
          stack()
            .padding(10)
            .text('Short')
        )
        .add(
          stack()
            .padding(10)
            .text('Medium')
            .text('Item')
        )
        .add(
          stack()
            .padding(10)
            .text('Tall')
            .text('Item')
            .text('Here')
        )
    )
    .spacer(20)

    // alignItems: center
    .text('alignItems: CENTER', { bold: true, underline: true })
    .add(
      flex()
        .alignItems('center')
        .gap(30)
        .height(150)
        .add(
          stack()
            .padding(10)
            .text('Short')
        )
        .add(
          stack()
            .padding(10)
            .text('Medium')
            .text('Item')
        )
        .add(
          stack()
            .padding(10)
            .text('Tall')
            .text('Item')
            .text('Here')
        )
    )
    .spacer(20)

    // alignItems: bottom
    .text('alignItems: BOTTOM', { bold: true, underline: true })
    .add(
      flex()
        .alignItems('bottom')
        .gap(30)
        .height(150)
        .add(
          stack()
            .padding(10)
            .text('Short')
        )
        .add(
          stack()
            .padding(10)
            .text('Medium')
            .text('Item')
        )
        .add(
          stack()
            .padding(10)
            .text('Tall')
            .text('Item')
            .text('Here')
        )
    )
    .spacer(20)

    // Combined with justify
    .text('COMBINED: alignItems + justify', { bold: true, underline: true })
    .spacer(10)
    .text('alignItems: center, justify: space-between')
    .add(
      flex()
        .alignItems('center')
        .justify('space-between')
        .height(120)
        .add(stack().padding(8).text('Left'))
        .add(stack().padding(8).text('Center').text('Taller'))
        .add(stack().padding(8).text('Right'))
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Flex AlignItems Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex AlignItems', 'qa-02-flex-align-items');
}

main().catch(console.error);
