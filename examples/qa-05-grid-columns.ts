/**
 * QA Test 05: Grid Column Configurations
 *
 * Tests various grid column configurations:
 * - Fixed width columns (numbers)
 * - Auto-sized columns ('auto')
 * - Fill columns ('fill')
 * - Percentage columns ('50%')
 * - Mixed configurations
 * - Many columns (stress test)
 * - Single column edge case
 *
 * Run: npx tsx examples/qa-05-grid-columns.ts
 */

import { LayoutEngine, stack, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Columns');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('GRID COLUMN CONFIGURATIONS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Fixed width columns
    .text('FIXED WIDTH: [100, 200, 100]', { bold: true, underline: true })
    .add(
      grid([100, 200, 100])
        .columnGap(10)
        .cell('100px', { bold: true })
        .cell('200px', { bold: true })
        .cell('100px', { bold: true })
        .headerRow()
        .cell('Col1')
        .cell('Column 2 (wider)')
        .cell('Col3')
        .row()
    )
    .spacer(15)

    // Auto columns
    .text('AUTO WIDTH: [auto, auto, auto]', { bold: true, underline: true })
    .add(
      grid(['auto', 'auto', 'auto'])
        .columnGap(20)
        .cell('Short', { bold: true })
        .cell('Medium Text', { bold: true })
        .cell('Longer Content Here', { bold: true })
        .headerRow()
        .cell('A')
        .cell('BB')
        .cell('CCCCC')
        .row()
    )
    .spacer(15)

    // Fill columns
    .text('FILL WIDTH: [fill, fill, fill]', { bold: true, underline: true })
    .add(
      grid(['fill', 'fill', 'fill'])
        .columnGap(10)
        .cell('Fill 1', { bold: true })
        .cell('Fill 2', { bold: true })
        .cell('Fill 3', { bold: true })
        .headerRow()
        .cell('Equal')
        .cell('Equal')
        .cell('Equal')
        .row()
    )
    .spacer(15)

    // Percentage columns
    .text('PERCENTAGE: [20%, 50%, 30%]', { bold: true, underline: true })
    .add(
      grid(['20%', '50%', '30%'])
        .columnGap(10)
        .cell('20%', { bold: true })
        .cell('50%', { bold: true })
        .cell('30%', { bold: true })
        .headerRow()
        .cell('Small')
        .cell('Large (half of container)')
        .cell('Medium')
        .row()
    )
    .spacer(15)

    // Mixed configuration
    .text('MIXED: [100, auto, fill, 15%]', { bold: true, underline: true })
    .add(
      grid([100, 'auto', 'fill', '15%'])
        .columnGap(10)
        .cell('100px', { bold: true })
        .cell('Auto', { bold: true })
        .cell('Fill', { bold: true })
        .cell('15%', { bold: true })
        .headerRow()
        .cell('Fixed')
        .cell('Content')
        .cell('Takes Rest')
        .cell('%')
        .row()
    )
    .spacer(15)

    // Many columns (5 columns)
    .text('MANY COLUMNS: 5 equal columns', { bold: true, underline: true })
    .add(
      grid(['fill', 'fill', 'fill', 'fill', 'fill'])
        .columnGap(8)
        .cell('1', { bold: true })
        .cell('2', { bold: true })
        .cell('3', { bold: true })
        .cell('4', { bold: true })
        .cell('5', { bold: true })
        .headerRow()
        .cell('A')
        .cell('B')
        .cell('C')
        .cell('D')
        .cell('E')
        .row()
    )
    .spacer(15)

    // Single column edge case
    .text('SINGLE COLUMN EDGE CASE', { bold: true, underline: true })
    .add(
      grid(['fill'])
        .cell('Single Column Header', { bold: true })
        .headerRow()
        .cell('This should take full width')
        .row()
        .cell('Another row')
        .row()
    )
    .spacer(15)

    // Two columns with different gaps
    .text('TWO COLUMNS with varying gaps', { bold: true, underline: true })
    .text('columnGap: 5')
    .add(
      grid([200, 200])
        .columnGap(5)
        .cell('Col A')
        .cell('Col B')
        .row()
    )
    .text('columnGap: 50')
    .add(
      grid([200, 200])
        .columnGap(50)
        .cell('Col A')
        .cell('Col B')
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Columns Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Columns', 'qa-05-grid-columns');
}

main().catch(console.error);
