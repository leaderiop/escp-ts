/**
 * QA Test 14: Grid Column Overlap Detection
 *
 * Tests grid columns for text overlap issues:
 * - Columns with content that might overlap
 * - Different gap sizes to detect spacing issues
 * - Various column width combinations
 *
 * Run: npx tsx examples/qa-14-grid-overlap-test.ts
 */

import { LayoutEngine, stack, grid, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Overlap Detection');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('GRID COLUMN OVERLAP TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Tight columns with no gap
    .text('TIGHT COLUMNS (gap: 0)', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(0)
        .cell('Column1Content')
        .cell('Column2Content')
        .cell('Column3Content')
        .row()
        .cell('Row2Col1')
        .cell('Row2Col2')
        .cell('Row2Col3')
        .row()
    )
    .spacer(15)

    // Test 2: Columns with small gap
    .text('SMALL GAP (gap: 5)', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(5)
        .cell('Column1Content')
        .cell('Column2Content')
        .cell('Column3Content')
        .row()
    )
    .spacer(15)

    // Test 3: Long content in narrow columns
    .text('LONG CONTENT IN NARROW COLUMNS', { bold: true, underline: true })
    .add(
      grid([150, 150, 150])
        .columnGap(10)
        .cell('VeryLongTextHere')
        .cell('AnotherLongText')
        .cell('MoreLongContent')
        .row()
    )
    .spacer(15)

    // Test 4: Mixed column widths
    .text('MIXED COLUMN WIDTHS', { bold: true, underline: true })
    .add(
      grid([100, 300, 100])
        .columnGap(15)
        .cell('Small')
        .cell('This column is much wider than others')
        .cell('Small')
        .row()
    )
    .spacer(15)

    // Test 5: Invoice-style overlap test
    .text('INVOICE OVERLAP TEST', { bold: true, underline: true })
    .add(
      grid([80, 400, 150, 150])
        .columnGap(10)
        .cell('Qty', { bold: true })
        .cell('Description', { bold: true })
        .cell('Price', { bold: true, align: 'right' })
        .cell('Total', { bold: true, align: 'right' })
        .headerRow()
        .cell('10')
        .cell('Very Long Product Description That May Overflow')
        .cell('$999.99', { align: 'right' })
        .cell('$9999.90', { align: 'right' })
        .row()
        .cell('100')
        .cell('Short')
        .cell('$1.00', { align: 'right' })
        .cell('$100.00', { align: 'right' })
        .row()
    )
    .spacer(15)

    // Test 6: Numeric columns alignment
    .text('NUMERIC ALIGNMENT TEST', { bold: true, underline: true })
    .add(
      grid([200, 150, 150])
        .columnGap(20)
        .cell('Item', { bold: true })
        .cell('Quantity', { bold: true, align: 'right' })
        .cell('Total', { bold: true, align: 'right' })
        .headerRow()
        .cell('Widget A')
        .cell('1', { align: 'right' })
        .cell('$10.00', { align: 'right' })
        .row()
        .cell('Widget B')
        .cell('100', { align: 'right' })
        .cell('$1000.00', { align: 'right' })
        .row()
        .cell('Widget C')
        .cell('10000', { align: 'right' })
        .cell('$100000.00', { align: 'right' })
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Overlap Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Overlap', 'qa-14-grid-overlap-test');
}

main().catch(console.error);
