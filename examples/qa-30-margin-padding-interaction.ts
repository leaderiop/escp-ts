/**
 * QA Test 30: Margin and Padding Interaction Edge Cases
 *
 * Tests complex interactions between margins and padding to verify:
 * - Auto margins correctly center elements
 * - Nested padding accumulates correctly
 * - Margin collapse behavior (if any)
 * - No black holes at margin/padding boundaries
 *
 * Run: npx tsx examples/qa-30-margin-padding-interaction.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Margin/Padding Interaction');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('MARGIN/PADDING INTERACTION TESTS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Auto margin centering
    .text('TEST 1: Auto margin centering', { bold: true, underline: true })
    .add(
      stack()
        .width(400)
        .margin('auto')
        .padding(10)
        .text('This stack should be centered', { align: 'center' })
        .text('Width: 400, Margin: auto', { align: 'center' })
    )
    .spacer(15)

    // Test 2: Auto margin on fixed width element
    .text('TEST 2: Auto margin on various widths', { bold: true, underline: true })
    .add(
      stack()
        .width(600)
        .margin('auto')
        .padding(5)
        .text('[600px centered element]', { align: 'center' })
    )
    .add(
      stack()
        .width(300)
        .margin('auto')
        .padding(5)
        .text('[300px centered]', { align: 'center' })
    )
    .add(
      stack()
        .width(800)
        .margin('auto')
        .padding(5)
        .text('[800px centered element]', { align: 'center' })
    )
    .spacer(15)

    // Test 3: Nested padding accumulation
    .text('TEST 3: Nested padding (should accumulate)', { bold: true, underline: true })
    .text('Outer: 20px | Middle: 15px | Inner: 10px = 45px total indent')
    .add(
      stack()
        .padding(20)
        .add(
          stack()
            .padding(15)
            .add(
              stack()
                .padding(10)
                .text('[Deeply nested with accumulated padding]')
            )
        )
    )
    .spacer(15)

    // Test 4: Margin + Padding on same element
    .text('TEST 4: Margin + Padding on same element', { bold: true, underline: true })
    .add(
      stack()
        .width(500)
        .margin({ top: 10, bottom: 10, left: 50, right: 50 })
        .padding(20)
        .text('Margin: 10/50, Padding: 20')
        .text('Content should be inset from margins then padded')
    )
    .spacer(15)

    // Test 5: Auto margin in flex container
    .text('TEST 5: Auto margin inside flex container', { bold: true, underline: true })
    .add(
      flex()
        .gap(10)
        .add(stack().width(200).text('[Fixed Left]'))
        .add(
          stack()
            .width(300)
            .margin('auto')
            .text('[Auto Centered]')
        )
        .add(stack().width(200).text('[Fixed Right]'))
    )
    .spacer(15)

    // Test 6: Individual margin sides
    .text('TEST 6: Individual margin sides', { bold: true, underline: true })
    .add(
      stack()
        .margin({ left: 100 })
        .text('margin-left: 100')
    )
    .add(
      stack()
        .margin({ left: 200 })
        .text('margin-left: 200')
    )
    .add(
      stack()
        .margin({ left: 300 })
        .text('margin-left: 300')
    )
    .spacer(15)

    // Test 7: Padding object notation
    .text('TEST 7: Padding object notation', { bold: true, underline: true })
    .add(
      stack()
        .padding({ top: 5, right: 50, bottom: 5, left: 50 })
        .text('Padding: {top:5, right:50, bottom:5, left:50}')
    )
    .add(
      stack()
        .padding({ top: 20, right: 10, bottom: 20, left: 10 })
        .text('Padding: {top:20, right:10, bottom:20, left:10}')
    )
    .spacer(15)

    // Test 8: Zero margin/padding edge case
    .text('TEST 8: Zero margin/padding (should have no spacing)', { bold: true, underline: true })
    .add(
      stack()
        .margin(0)
        .padding(0)
        .text('Zero margin, zero padding')
        .text('Elements should be flush')
    )
    .spacer(15)

    // Test 9: Large margin/padding stress
    .text('TEST 9: Large values stress test', { bold: true, underline: true })
    .add(
      stack()
        .margin({ left: 200, right: 200 })
        .padding(30)
        .text('Large margins (200 left/right) + padding (30)')
        .text('Should be significantly indented')
    )
    .spacer(15)

    // Test 10: Grid with margin/padding
    .text('TEST 10: Grid cells with margin/padding', { bold: true, underline: true })
    .add(
      grid([300, 300, 300])
        .columnGap(10)
        .padding(10)
        .cell('Cell 1')
        .cell('Cell 2')
        .cell('Cell 3')
        .row()
        .cell('Data A')
        .cell('Data B')
        .cell('Data C')
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Margin/Padding Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Margin/Padding Interaction', 'qa-30-margin-padding-interaction');
}

main().catch(console.error);
