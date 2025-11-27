/**
 * QA Test 22: Grid Cell Alignment Comprehensive
 *
 * Tests all grid cell alignment scenarios:
 * - Cell text align: left, center, right
 * - Zero column gap with alignment
 * - Wide cells with alignment
 * - Mixed alignment in same row
 * - Numbers and text aligned differently
 *
 * Run: npx tsx examples/qa-22-grid-cell-alignment.ts
 */

import { LayoutEngine, stack, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Cell Alignment');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('GRID CELL ALIGNMENT TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Basic alignment in each column
    .text('TEST 1: Basic Column Alignment', { bold: true, underline: true })
    .add(
      grid([400, 400, 400])
        .columnGap(20)
        .rowGap(10)
        .cell('LEFT ALIGN', { bold: true, align: 'left' })
        .cell('CENTER ALIGN', { bold: true, align: 'center' })
        .cell('RIGHT ALIGN', { bold: true, align: 'right' })
        .headerRow()
        .cell('Left text', { align: 'left' })
        .cell('Centered', { align: 'center' })
        .cell('Right text', { align: 'right' })
        .row()
        .cell('Short', { align: 'left' })
        .cell('Med', { align: 'center' })
        .cell('X', { align: 'right' })
        .row()
        .cell('Longer content here', { align: 'left' })
        .cell('Also longer', { align: 'center' })
        .cell('Even more', { align: 'right' })
        .row()
    )
    .spacer(20)

    // Test 2: Zero gap alignment (critical for adjacent cells)
    .text('TEST 2: Zero Column Gap with Alignment', { bold: true, underline: true })
    .text('Each cell should stay within its bounds:')
    .add(
      grid([300, 300, 300, 300])
        .columnGap(0)
        .rowGap(5)
        .cell('|LEFT|', { align: 'left' })
        .cell('|CENTER|', { align: 'center' })
        .cell('|RIGHT|', { align: 'right' })
        .cell('|LEFT|', { align: 'left' })
        .row()
        .cell('A', { align: 'left' })
        .cell('B', { align: 'center' })
        .cell('C', { align: 'right' })
        .cell('D', { align: 'left' })
        .row()
    )
    .spacer(20)

    // Test 3: Numeric data alignment (common use case)
    .text('TEST 3: Invoice-Style Table', { bold: true, underline: true })
    .add(
      grid([100, 'fill', 150, 150])
        .columnGap(15)
        .rowGap(8)
        .cell('QTY', { bold: true, align: 'center' })
        .cell('DESCRIPTION', { bold: true, align: 'left' })
        .cell('PRICE', { bold: true, align: 'right' })
        .cell('TOTAL', { bold: true, align: 'right' })
        .headerRow()
        .cell('5', { align: 'center' })
        .cell('Widget Standard', { align: 'left' })
        .cell('$10.00', { align: 'right' })
        .cell('$50.00', { align: 'right' })
        .row()
        .cell('3', { align: 'center' })
        .cell('Widget Premium XL', { align: 'left' })
        .cell('$25.99', { align: 'right' })
        .cell('$77.97', { align: 'right' })
        .row()
        .cell('12', { align: 'center' })
        .cell('Basic Item', { align: 'left' })
        .cell('$1.50', { align: 'right' })
        .cell('$18.00', { align: 'right' })
        .row()
        .cell('', { align: 'left' })
        .cell('', { align: 'left' })
        .cell('SUBTOTAL:', { bold: true, align: 'right' })
        .cell('$145.97', { bold: true, align: 'right' })
        .row()
    )
    .spacer(20)

    // Test 4: Wide columns with short text
    .text('TEST 4: Wide Columns, Short Text', { bold: true, underline: true })
    .add(
      grid([600, 600])
        .columnGap(20)
        .cell('X', { align: 'left' })
        .cell('X', { align: 'right' })
        .row()
        .cell('AB', { align: 'center' })
        .cell('AB', { align: 'center' })
        .row()
    )
    .spacer(20)

    // Test 5: All alignments in single row
    .text('TEST 5: All Alignments in One Row', { bold: true, underline: true })
    .add(
      grid([200, 200, 200, 200, 200])
        .columnGap(5)
        .cell('LEFT', { align: 'left' })
        .cell('CENTER', { align: 'center' })
        .cell('RIGHT', { align: 'right' })
        .cell('LEFT', { align: 'left' })
        .cell('CENTER', { align: 'center' })
        .row()
    )
    .spacer(20)

    // Test 6: Single column alignment
    .text('TEST 6: Single Column with Different Alignments per Row', { bold: true, underline: true })
    .add(
      grid([500])
        .rowGap(5)
        .cell('Left aligned text', { align: 'left' })
        .row()
        .cell('Center aligned text', { align: 'center' })
        .row()
        .cell('Right aligned text', { align: 'right' })
        .row()
    )
    .spacer(20)

    // Test 7: Percentage columns with alignment
    .text('TEST 7: Percentage Columns with Alignment', { bold: true, underline: true })
    .add(
      grid(['30%', '40%', '30%'])
        .columnGap(10)
        .cell('30% LEFT', { align: 'left' })
        .cell('40% CENTER', { align: 'center' })
        .cell('30% RIGHT', { align: 'right' })
        .row()
        .cell('Data 1', { align: 'left' })
        .cell('Data 2', { align: 'center' })
        .cell('Data 3', { align: 'right' })
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Cell Alignment Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Cell Alignment', 'qa-22-grid-cell-alignment');
}

main().catch(console.error);
