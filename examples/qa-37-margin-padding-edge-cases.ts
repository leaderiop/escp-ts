/**
 * QA Test 37: Margin/Padding Edge Cases
 *
 * Tests margin and padding interactions:
 * - Auto margins in different container types
 * - Margin collapsing behavior
 * - Padding accumulation in nested containers
 * - Zero margin/padding edge cases
 * - Large margin/padding values
 * - Asymmetric margin/padding combinations
 *
 * Run: npx tsx examples/qa-37-margin-padding-edge-cases.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Margin/Padding Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('MARGIN/PADDING EDGE CASES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Auto margin centering in stack
    .text('TEST 1: Auto margin centering in column stack', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(
          stack()
            .width(600)
            .margin('auto')
            .padding(10)
            .text('Width: 600, margin: auto')
            .text('Should be horizontally centered')
        )
        .add(
          stack()
            .width(400)
            .margin('auto')
            .padding(10)
            .text('Width: 400, margin: auto')
        )
        .add(
          stack()
            .width(800)
            .margin('auto')
            .padding(10)
            .text('Width: 800, margin: auto')
        )
    )
    .spacer(15)

    // Test 2: Auto margin in flex container
    .text('TEST 2: Auto margin items in flex', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .add(stack().width(200).padding(10).text('[Fixed Left]'))
        .add(
          stack()
            .width(300)
            .margin({ left: 'auto', right: 'auto', top: 0, bottom: 0 })
            .padding(10)
            .text('[Auto margin center]')
        )
        .add(stack().width(200).padding(10).text('[Fixed Right]'))
    )
    .spacer(15)

    // Test 3: Deeply nested padding accumulation
    .text('TEST 3: Nested padding accumulation (20+15+10=45 indent)', { bold: true, underline: true })
    .add(
      stack()
        .padding({ left: 20, right: 0, top: 5, bottom: 5 })
        .add(
          stack()
            .padding({ left: 15, right: 0, top: 5, bottom: 5 })
            .add(
              stack()
                .padding({ left: 10, right: 0, top: 5, bottom: 5 })
                .text('[45px total left indent]')
                .text('This should be indented 45px from edge')
            )
        )
    )
    .spacer(15)

    // Test 4: Zero margin/padding
    .text('TEST 4: Zero margin and padding (flush)', { bold: true, underline: true })
    .add(
      stack()
        .margin(0)
        .padding(0)
        .gap(0)
        .text('Zero margin, zero padding')
        .text('Elements should be flush')
        .text('No spacing between lines')
    )
    .spacer(15)

    // Test 5: Large margin values
    .text('TEST 5: Large margin values', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(
          stack()
            .margin({ left: 200, right: 0, top: 0, bottom: 0 })
            .text('Margin-left: 200')
        )
        .add(
          stack()
            .margin({ left: 400, right: 0, top: 0, bottom: 0 })
            .text('Margin-left: 400')
        )
        .add(
          stack()
            .margin({ left: 600, right: 0, top: 0, bottom: 0 })
            .text('Margin-left: 600')
        )
    )
    .spacer(15)

    // Test 6: Asymmetric padding
    .text('TEST 6: Asymmetric padding combinations', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(
          stack()
            .padding({ top: 5, right: 100, bottom: 5, left: 10 })
            .text('Padding: top:5, right:100, bottom:5, left:10')
        )
        .add(
          stack()
            .padding({ top: 30, right: 10, bottom: 5, left: 50 })
            .text('Padding: top:30, right:10, bottom:5, left:50')
        )
    )
    .spacer(15)

    // Test 7: Margin between siblings
    .text('TEST 7: Vertical margins between siblings', { bold: true, underline: true })
    .add(
      stack()
        .gap(0) // No gap, only margins
        .add(stack().margin({ top: 0, bottom: 20, left: 0, right: 0 }).text('Margin-bottom: 20'))
        .add(stack().margin({ top: 20, bottom: 0, left: 0, right: 0 }).text('Margin-top: 20'))
        .add(stack().margin({ top: 10, bottom: 10, left: 0, right: 0 }).text('Margin: top:10, bottom:10'))
    )
    .spacer(15)

    // Test 8: Padding + explicit width interaction
    .text('TEST 8: Padding with explicit width', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(
          stack()
            .width(500)
            .padding(50)
            .text('Width: 500, Padding: 50')
            .text('Content area: 400')
        )
        .add(
          stack()
            .width(500)
            .padding({ left: 100, right: 100, top: 10, bottom: 10 })
            .text('Width: 500, Padding L/R: 100')
            .text('Content area: 300')
        )
    )
    .spacer(15)

    // Test 9: Auto margin with percentage width
    .text('TEST 9: Auto margin with percentage width', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(
          stack()
            .width('50%')
            .margin('auto')
            .padding(10)
            .text('Width: 50%, margin: auto')
        )
        .add(
          stack()
            .width('30%')
            .margin('auto')
            .padding(10)
            .text('Width: 30%, margin: auto')
        )
    )
    .spacer(15)

    // Test 10: Margin in row stack
    .text('TEST 10: Horizontal margins in row stack', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(0)
        .add(stack().width(200).margin({ left: 0, right: 30, top: 0, bottom: 0 }).padding(10).text('[R-margin:30]'))
        .add(stack().width(200).margin({ left: 30, right: 30, top: 0, bottom: 0 }).padding(10).text('[L:30, R:30]'))
        .add(stack().width(200).margin({ left: 30, right: 0, top: 0, bottom: 0 }).padding(10).text('[L-margin:30]'))
    )
    .spacer(15)

    // Test 11: Grid cells with margin
    .text('TEST 11: Margin inside grid cells', { bold: true, underline: true })
    .add(
      grid([400, 400, 400])
        .columnGap(10)
        .rowGap(5)
        .cell(
          stack()
            .margin({ left: 20, right: 20, top: 5, bottom: 5 })
            .text('Cell with margin')
            .build()
        )
        .cell(
          stack()
            .margin(0)
            .padding(20)
            .text('Cell with padding')
            .build()
        )
        .cell(
          stack()
            .margin(10)
            .padding(10)
            .text('Both margin & padding')
            .build()
        )
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Margin/Padding Edge Cases', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Margin/Padding Edge Cases', 'qa-37-margin-padding-edge-cases');
}

main().catch(console.error);
