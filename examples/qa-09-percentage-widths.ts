/**
 * QA Test 09: Percentage Width Tests
 *
 * Tests percentage-based sizing:
 * - Various percentage widths (10%, 25%, 50%, 75%, 100%)
 * - Percentage in flex containers
 * - Percentage in grid columns
 * - Combined percentages (should add up correctly)
 * - Percentage with margins
 *
 * Run: npx tsx examples/qa-09-percentage-widths.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Percentage Widths');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('PERCENTAGE WIDTH TESTS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Basic percentages - Box style (top & bottom lines)
    .text('BASIC PERCENTAGES', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(stack().width('100%').line('-', 'fill').padding(5).text('100% width').line('-', 'fill'))
        .add(stack().width('75%').line('-', 'fill').padding(5).text('75% width').line('-', 'fill'))
        .add(stack().width('50%').line('-', 'fill').padding(5).text('50% width').line('-', 'fill'))
        .add(stack().width('25%').line('-', 'fill').padding(5).text('25% width').line('-', 'fill'))
        .add(stack().width('10%').line('-', 'fill').padding(5).text('10%').line('-', 'fill'))
    )
    .spacer(15)

    // Flex with percentages - Ruler style (bottom line only)
    .text('FLEX WITH PERCENTAGES (25% + 50% + 25%)', { bold: true, underline: true })
    .add(
      flex()
        .gap(0)
        .add(stack().width('25%').padding(10).text('25%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('50%').padding(10).text('50%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('25%').padding(10).text('25%', { align: 'center' }).line('-', 'fill'))
    )
    .spacer(15)

    // Percentages that exceed 100% - Ruler style (bottom line only)
    .text('PERCENTAGES EXCEEDING 100% (40% + 40% + 40%)', { bold: true, underline: true })
    .text('Should wrap or overflow:')
    .add(
      flex()
        .wrap('wrap')
        .gap(5)
        .rowGap(5)
        .add(stack().width('40%').padding(10).text('40%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('40%').padding(10).text('40%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('40%').padding(10).text('40%', { align: 'center' }).line('-', 'fill'))
    )
    .spacer(15)

    // Grid with percentage columns
    .text('GRID WITH PERCENTAGE COLUMNS', { bold: true, underline: true })
    .text('Columns: 15%, 35%, 35%, 15%')
    .add(
      grid(['15%', '35%', '35%', '15%'])
        .columnGap(5)
        .cell('15%', { bold: true })
        .cell('35%', { bold: true })
        .cell('35%', { bold: true })
        .cell('15%', { bold: true })
        .headerRow()
        .cell('A')
        .cell('B - wider')
        .cell('C - wider')
        .cell('D')
        .row()
    )
    .spacer(15)

    // Percentage with margin
    .text('PERCENTAGE WITH MARGINS', { bold: true, underline: true })
    .text('50% width with margin: 20')
    .add(
      stack()
        .width('50%')
        .margin(20)
        .padding(10)
        .text('50% width')
        .text('margin: 20')
    )
    .spacer(10)
    .text('50% width with auto margin (should center):')
    .add(
      stack()
        .width('50%')
        .margin('auto')
        .padding(10)
        .text('50% centered', { align: 'center' })
    )
    .spacer(15)

    // Percentage in nested container
    .text('PERCENTAGE IN NESTED CONTAINER', { bold: true, underline: true })
    .text('Outer: 80% width, Inner: 50% of outer')
    .add(
      stack()
        .width('80%')
        .padding(15)
        .text('Outer container (80%)', { bold: true })
        .add(
          stack()
            .width('50%')
            .padding(10)
            .text('Inner (50% of 80% = 40%)')
        )
    )
    .spacer(15)

    // Comparison row - Box style (top & bottom lines)
    .text('VISUAL COMPARISON', { bold: true, underline: true })
    .add(
      stack()
        .gap(3)
        .add(stack().width('100%').line('-', 'fill').padding(3).text('100%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('80%').line('-', 'fill').padding(3).text('80%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('60%').line('-', 'fill').padding(3).text('60%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('40%').line('-', 'fill').padding(3).text('40%', { align: 'center' }).line('-', 'fill'))
        .add(stack().width('20%').line('-', 'fill').padding(3).text('20%', { align: 'center' }).line('-', 'fill'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Percentage Width Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Percentage Widths', 'qa-09-percentage-widths');
}

main().catch(console.error);
