/**
 * QA Test 41: Grid with Varying Column Widths and Alignments
 *
 * Stress test for grid layout to verify:
 * - Mixed fixed/auto/fill/percentage column widths
 * - Cell alignment (left, center, right) within columns
 * - Row height calculation with varying content
 * - Column gap and row gap interactions
 * - Content overflow/truncation in cells
 *
 * Run: npx tsx examples/qa-41-grid-stress.ts
 */

import { LayoutEngine, stack, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Stress Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('GRID LAYOUT STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Mixed width specifications
    .text('TEST 1: Mixed column width specs (fixed, auto, fill, %)', { bold: true, underline: true })
    .add(
      grid([400, 'auto', 'fill', '20%'])
        .columnGap(15)
        .rowGap(10)
        .cell('Fixed 400').cell('Auto width').cell('Fill remaining').cell('20% width').row()
        .cell('Row 2 Col 1').cell('Short').cell('This fills the rest').cell('Percentage').row()
        .cell('R3C1').cell('Much longer text for auto').cell('Fill').cell('%').row()
    )
    .spacer(15)

    // Test 2: Cell alignment
    .text('TEST 2: Cell alignment in fixed-width columns', { bold: true, underline: true })
    .add(
      grid([600, 600, 600])
        .columnGap(20)
        .rowGap(5)
        .cell('LEFT aligned', { align: 'left' }).cell('CENTER aligned', { align: 'center' }).cell('RIGHT aligned', { align: 'right' }).row()
        .cell('Short', { align: 'left' }).cell('Short', { align: 'center' }).cell('Short', { align: 'right' }).row()
        .cell('Longer left text', { align: 'left' }).cell('Longer center text', { align: 'center' }).cell('Longer right text', { align: 'right' }).row()
    )
    .spacer(15)

    // Test 3: Variable row heights
    .text('TEST 3: Variable row heights with multi-line content', { bold: true, underline: true })
    .add(
      grid([500, 500, 500])
        .columnGap(10)
        .rowGap(15)
        .cell('Single line').cell('Single line').cell('Single line').row()
        .cell('Tall cell').cell('Medium').cell('Short').row()
        .cell('A').cell('Text in middle column').cell('B').row()
    )
    .spacer(15)

    // Test 4: Many columns with narrow widths
    .text('TEST 4: Many narrow columns (stress test)', { bold: true, underline: true })
    .add(
      grid([200, 200, 200, 200, 200, 200, 200])
        .columnGap(5)
        .rowGap(5)
        .cell('C1').cell('C2').cell('C3').cell('C4').cell('C5').cell('C6').cell('C7').row()
        .cell('A').cell('B').cell('C').cell('D').cell('E').cell('F').cell('G').row()
        .cell('1').cell('2').cell('3').cell('4').cell('5').cell('6').cell('7').row()
    )
    .spacer(15)

    // Test 5: Fill columns competition
    .text('TEST 5: Multiple fill columns compete for space', { bold: true, underline: true })
    .add(
      grid(['fill', 300, 'fill', 300, 'fill'])
        .columnGap(10)
        .rowGap(5)
        .cell('Fill1').cell('Fixed').cell('Fill2').cell('Fixed').cell('Fill3').row()
        .cell('A').cell('300px').cell('B').cell('300px').cell('C').row()
    )
    .spacer(15)

    // Test 6: Auto columns with varying content
    .text('TEST 6: Auto columns adapt to content', { bold: true, underline: true })
    .add(
      grid(['auto', 'auto', 'auto'])
        .columnGap(20)
        .rowGap(5)
        .cell('X').cell('Medium length').cell('Very long text that determines col width').row()
        .cell('Short').cell('Y').cell('Z').row()
        .cell('ABC').cell('DEFGH').cell('IJKLMN').row()
    )
    .spacer(15)

    // Test 7: Percentage columns totaling 100%
    .text('TEST 7: Percentage columns (25% + 50% + 25% = 100%)', { bold: true, underline: true })
    .add(
      grid(['25%', '50%', '25%'])
        .columnGap(0)
        .rowGap(5)
        .cell('25%').cell('50%').cell('25%').row()
        .cell('Quarter').cell('Half of the width').cell('Quarter').row()
    )
    .spacer(15)

    // Test 8: Header row styling
    .text('TEST 8: Header row with styling', { bold: true, underline: true })
    .add(
      grid([500, 500, 500])
        .columnGap(15)
        .rowGap(8)
        .rowStyle({ bold: true })
        .cell('COLUMN A').cell('COLUMN B').cell('COLUMN C').headerRow()
        .cell('Value 1').cell('Value 2').cell('Value 3').row()
        .cell('Value 4').cell('Value 5').cell('Value 6').row()
        .cell('Total A').cell('Total B').cell('Total C').row()
    )
    .spacer(15)

    // Test 9: Single row single column (edge case)
    .text('TEST 9: Single cell grid (edge case)', { bold: true, underline: true })
    .add(
      grid([800])
        .cell('Single cell in single column grid').row()
    )
    .spacer(15)

    // Test 10: Mixed alignment in same row
    .text('TEST 10: Mixed alignment within same row', { bold: true, underline: true })
    .add(
      grid([400, 400, 400, 400])
        .columnGap(10)
        .cell('Left', { align: 'left' }).cell('Center', { align: 'center' }).cell('Right', { align: 'right' }).cell('Center', { align: 'center' }).row()
        .cell('$10.00', { align: 'right' }).cell('$100.00', { align: 'right' }).cell('$1,000.00', { align: 'right' }).cell('$10,000.00', { align: 'right' }).row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Stress Test', 'qa-41-grid-stress');
}

main().catch(console.error);
