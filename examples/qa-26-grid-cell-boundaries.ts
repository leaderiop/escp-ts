/**
 * QA Test 26: Grid Cell Boundary Enforcement
 *
 * This test examines whether grid cells properly contain their content
 * within cell boundaries, testing various scenarios:
 *
 * 1. Long text in narrow columns
 * 2. Zero columnGap with content that should clip
 * 3. Text overflow modes in grid cells
 * 4. Numeric data alignment in financial columns
 *
 * Run: npx tsx examples/qa-26-grid-cell-boundaries.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Cell Boundary Enforcement');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('GRID CELL BOUNDARY TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Long text in narrow columns with clip
    .text('TEST 1: LONG TEXT IN 100-DOT COLUMNS', { bold: true, underline: true })
    .text('Each column is 100 dots. Text should be clipped.')
    .add(
      grid([100, 100, 100, 100])
        .columnGap(5)
        .rowGap(5)
        .cell('VeryLongColumnHeader1')
        .cell('VeryLongColumnHeader2')
        .cell('VeryLongColumnHeader3')
        .cell('VeryLongColumnHeader4')
        .row()
        .cell('DataThatIsTooLong')
        .cell('MoreDataHere')
        .cell('EvenMoreData')
        .cell('LastColumnData')
        .row()
    )
    .spacer(20)

    // Test 2: Zero gap with long content
    .text('TEST 2: ZERO GAP - CONTENT MUST NOT OVERLAP', { bold: true, underline: true })
    .add(
      grid([150, 150, 150, 150])
        .columnGap(0)
        .rowGap(0)
        .cell('COLUMN-A-LONG')
        .cell('COLUMN-B-LONG')
        .cell('COLUMN-C-LONG')
        .cell('COLUMN-D-LONG')
        .row()
        .cell('Row2DataAAA')
        .cell('Row2DataBBB')
        .cell('Row2DataCCC')
        .cell('Row2DataDDD')
        .row()
    )
    .spacer(20)

    // Test 3: Financial table with right alignment
    .text('TEST 3: FINANCIAL TABLE - RIGHT ALIGNED NUMBERS', { bold: true, underline: true })
    .add(
      grid([200, 'fill', 120, 120])
        .columnGap(10)
        .rowGap(5)
        .cell('CODE', { bold: true })
        .cell('DESCRIPTION', { bold: true })
        .cell('QTY', { bold: true, align: 'right' })
        .cell('AMOUNT', { bold: true, align: 'right' })
        .headerRow()
        .cell('PRD-001')
        .cell('Premium Widget Standard Edition')
        .cell('100', { align: 'right' })
        .cell('$1,500.00', { align: 'right' })
        .row()
        .cell('PRD-002')
        .cell('Basic Gadget')
        .cell('50', { align: 'right' })
        .cell('$750.00', { align: 'right' })
        .row()
        .cell('PRD-003')
        .cell('Ultra Deluxe Component XL Series')
        .cell('5', { align: 'right' })
        .cell('$2,999.99', { align: 'right' })
        .row()
        .cell('')
        .cell('')
        .cell('TOTAL:', { bold: true, align: 'right' })
        .cell('$5,249.99', { bold: true, align: 'right' })
        .row()
    )
    .spacer(20)

    // Test 4: Mixed alignments in same grid
    .text('TEST 4: MIXED ALIGNMENTS', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(20)
        .rowGap(10)
        .cell('LEFT', { align: 'left', bold: true })
        .cell('CENTER', { align: 'center', bold: true })
        .cell('RIGHT', { align: 'right', bold: true })
        .headerRow()
        .cell('LeftData', { align: 'left' })
        .cell('CenterData', { align: 'center' })
        .cell('RightData', { align: 'right' })
        .row()
        .cell('L', { align: 'left' })
        .cell('C', { align: 'center' })
        .cell('R', { align: 'right' })
        .row()
        .cell('LongLeftText', { align: 'left' })
        .cell('LongCenterText', { align: 'center' })
        .cell('LongRightText', { align: 'right' })
        .row()
    )
    .spacer(20)

    // Test 5: Extremely narrow columns
    .text('TEST 5: EXTREME NARROW COLUMNS (50 dots)', { bold: true, underline: true })
    .add(
      grid([50, 50, 50, 50, 50, 50])
        .columnGap(2)
        .rowGap(5)
        .cell('A1').cell('B1').cell('C1').cell('D1').cell('E1').cell('F1').row()
        .cell('AA').cell('BB').cell('CC').cell('DD').cell('EE').cell('FF').row()
    )
    .spacer(20)

    // Test 6: Single wide column
    .text('TEST 6: SINGLE WIDE COLUMN', { bold: true, underline: true })
    .add(
      grid(['fill'])
        .columnGap(0)
        .rowGap(5)
        .cell('This single column should take the full width')
        .row()
        .cell('Second row in single column grid')
        .row()
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Cell Boundary Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Cell Boundaries', 'qa-26-grid-cell-boundaries');
}

main().catch(console.error);
