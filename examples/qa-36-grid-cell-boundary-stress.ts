/**
 * QA Test 36: Grid Cell Boundary Stress Test
 *
 * This test targets grid layout edge cases:
 * - Zero and minimal column gaps
 * - Text overflow at cell boundaries
 * - Mixed column width specifications (fixed, %, fill, auto)
 * - Cell alignment with different content sizes
 * - Nested containers in grid cells
 *
 * Run: npx tsx examples/qa-36-grid-cell-boundary-stress.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Cell Boundary Stress');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('GRID CELL BOUNDARY STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Zero gap with exact-fit content
    .text('TEST 1: Zero gap - content should NOT overlap', { bold: true, underline: true })
    .add(
      grid([300, 300, 300])
        .columnGap(0)
        .rowGap(5)
        .cell('AAAAAAAAAA').cell('BBBBBBBBBB').cell('CCCCCCCCCC').row()
        .cell('1234567890').cell('ABCDEFGHIJ').cell('KLMNOPQRST').row()
    )
    .spacer(15)

    // Test 2: Zero gap with overflow text
    .text('TEST 2: Zero gap - long text should clip at boundary', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(0)
        .rowGap(5)
        .cell('VeryLongTextHere').cell('MoreLongText').cell('AnotherLongOne').row()
        .cell('Short').cell('AlsoShort').cell('OK').row()
    )
    .spacer(15)

    // Test 3: 1-dot gap (minimal)
    .text('TEST 3: Minimal gap (1 dot) - visual separation', { bold: true, underline: true })
    .add(
      grid([250, 250, 250])
        .columnGap(1)
        .rowGap(1)
        .cell('Col1-Header', { bold: true }).cell('Col2-Header', { bold: true }).cell('Col3-Header', { bold: true }).headerRow()
        .cell('Data-1A').cell('Data-1B').cell('Data-1C').row()
        .cell('Data-2A').cell('Data-2B').cell('Data-2C').row()
    )
    .spacer(15)

    // Test 4: Mixed width specs with zero gap
    .text('TEST 4: Mixed widths (fixed, %, fill) with zero gap', { bold: true, underline: true })
    .add(
      grid([200, '50%', 'fill'])
        .columnGap(0)
        .rowGap(5)
        .cell('Fixed 200').cell('50% Width Column').cell('Fill remaining').row()
        .cell('Fixed').cell('Percentage').cell('Flexible').row()
    )
    .spacer(15)

    // Test 5: Right alignment at cell boundary
    .text('TEST 5: Right-aligned text at zero-gap boundaries', { bold: true, underline: true })
    .add(
      grid([300, 300, 300])
        .columnGap(0)
        .rowGap(5)
        .cell('Left').cell('Center', { align: 'center' }).cell('Right', { align: 'right' }).row()
        .cell('$100.00', { align: 'right' }).cell('$200.00', { align: 'right' }).cell('$300.00', { align: 'right' }).row()
    )
    .spacer(15)

    // Test 6: Auto columns with varying content
    .text('TEST 6: Auto columns - should size to content', { bold: true, underline: true })
    .add(
      grid(['auto', 'auto', 'auto', 'fill'])
        .columnGap(10)
        .rowGap(5)
        .cell('ID').cell('Name').cell('Status').cell('Description').headerRow()
        .cell('1').cell('Short').cell('OK').cell('A longer description text').row()
        .cell('123').cell('Much Longer Name').cell('PENDING').cell('Brief').row()
        .cell('99').cell('X').cell('Y').cell('Z').row()
    )
    .spacer(15)

    // Test 7: Nested flex in grid cells
    .text('TEST 7: Flex containers inside grid cells', { bold: true, underline: true })
    .add(
      grid([400, 400, 400])
        .columnGap(5)
        .rowGap(10)
        .cell(
          flex()
            .justify('space-between')
            .text('[A]')
            .text('[B]')
            .build()
        )
        .cell(
          flex()
            .justify('center')
            .gap(10)
            .text('[C]')
            .text('[D]')
            .build()
        )
        .cell(
          flex()
            .justify('end')
            .text('[E]')
            .build()
        )
        .row()
    )
    .spacer(15)

    // Test 8: Nested stack in grid cells with padding
    .text('TEST 8: Stacks with padding inside grid cells', { bold: true, underline: true })
    .add(
      grid([350, 350, 350])
        .columnGap(0)
        .rowGap(5)
        .cell(
          stack()
            .padding(10)
            .text('Padded stack')
            .text('Line 2')
            .build()
        )
        .cell(
          stack()
            .padding({ left: 20, right: 20, top: 5, bottom: 5 })
            .text('Asymmetric')
            .text('Padding')
            .build()
        )
        .cell(
          stack()
            .text('No padding')
            .text('Flush')
            .build()
        )
        .row()
    )
    .spacer(15)

    // Test 9: Many columns stress test
    .text('TEST 9: Many columns (8) with small gaps', { bold: true, underline: true })
    .add(
      grid([100, 100, 100, 100, 100, 100, 100, 100])
        .columnGap(2)
        .rowGap(2)
        .cell('C1').cell('C2').cell('C3').cell('C4').cell('C5').cell('C6').cell('C7').cell('C8').headerRow()
        .cell('A').cell('B').cell('C').cell('D').cell('E').cell('F').cell('G').cell('H').row()
        .cell('1').cell('2').cell('3').cell('4').cell('5').cell('6').cell('7').cell('8').row()
    )
    .spacer(15)

    // Test 10: Single column edge case
    .text('TEST 10: Single column grid', { bold: true, underline: true })
    .add(
      grid(['fill'])
        .columnGap(0)
        .rowGap(5)
        .cell('Single column row 1').row()
        .cell('Single column row 2 with longer text').row()
        .cell('Row 3').row()
    )
    .spacer(15)

    // Test 11: Empty cells
    .text('TEST 11: Grid with empty cells', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(5)
        .rowGap(5)
        .cell('Data').cell('').cell('Data').row()
        .cell('').cell('Center').cell('').row()
        .cell('Bottom').cell('').cell('Bottom').row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Cell Boundary Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Cell Boundary Stress', 'qa-36-grid-cell-boundary-stress');
}

main().catch(console.error);
