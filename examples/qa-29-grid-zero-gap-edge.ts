/**
 * QA Test 29: Grid Zero Gap and Small Gap Edge Cases
 *
 * Tests grid layouts with zero or small column/row gaps to verify:
 * - Adjacent cells do not overlap
 * - Text truncation prevents overflow into adjacent cells
 * - Cell boundaries are respected precisely
 * - No black holes or artifacts at cell boundaries
 *
 * Run: npx tsx examples/qa-29-grid-zero-gap-edge.ts
 */

import { LayoutEngine, stack, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Zero Gap Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('GRID ZERO/SMALL GAP EDGE CASES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Zero column gap with fixed widths
    .text('TEST 1: Zero column gap (fixed columns)', { bold: true, underline: true })
    .text('Columns: [200, 200, 200] | columnGap: 0')
    .add(
      grid([200, 200, 200])
        .columnGap(0)
        .rowGap(0)
        .cell('Col1 Text')
        .cell('Col2 Text')
        .cell('Col3 Text')
        .row()
        .cell('AAAAAAAAAA')
        .cell('BBBBBBBBBB')
        .cell('CCCCCCCCCC')
        .row()
    )
    .spacer(15)

    // Test 2: Zero gap with text that would overflow
    .text('TEST 2: Zero gap with long text (truncation test)', { bold: true, underline: true })
    .text('Expected: Text should clip at cell boundary, not overflow')
    .add(
      grid([150, 150, 150])
        .columnGap(0)
        .rowGap(0)
        .cell('VeryLongTextThatShouldClip')
        .cell('MiddleColumnText')
        .cell('RightColumnText')
        .row()
        .cell('Short')
        .cell('AnotherLongTextHere')
        .cell('End')
        .row()
    )
    .spacer(15)

    // Test 3: Very small gap (2 dots)
    .text('TEST 3: Minimal column gap (2 dots)', { bold: true, underline: true })
    .add(
      grid([180, 180, 180])
        .columnGap(2)
        .rowGap(2)
        .cell('Col A', { bold: true })
        .cell('Col B', { bold: true })
        .cell('Col C', { bold: true })
        .headerRow()
        .cell('Data A1')
        .cell('Data B1')
        .cell('Data C1')
        .row()
        .cell('Data A2')
        .cell('Data B2')
        .cell('Data C2')
        .row()
    )
    .spacer(15)

    // Test 4: Zero gap with fill columns
    .text('TEST 4: Zero gap with fill columns', { bold: true, underline: true })
    .add(
      grid(['fill', 'fill', 'fill'])
        .columnGap(0)
        .rowGap(0)
        .cell('Fill 1')
        .cell('Fill 2')
        .cell('Fill 3')
        .row()
        .cell('More text in fill 1')
        .cell('More text in fill 2')
        .cell('More text in fill 3')
        .row()
    )
    .spacer(15)

    // Test 5: Zero gap with percentage columns
    .text('TEST 5: Zero gap with percentage columns', { bold: true, underline: true })
    .text('Columns: [25%, 50%, 25%] | Gap: 0')
    .add(
      grid(['25%', '50%', '25%'])
        .columnGap(0)
        .rowGap(0)
        .cell('25%')
        .cell('50% (half width)')
        .cell('25%')
        .row()
        .cell('Data')
        .cell('This is the wider middle column')
        .cell('Data')
        .row()
    )
    .spacer(15)

    // Test 6: Many columns with zero gap
    .text('TEST 6: 6 columns with zero gap (stress test)', { bold: true, underline: true })
    .add(
      grid([100, 100, 100, 100, 100, 100])
        .columnGap(0)
        .rowGap(0)
        .cell('1')
        .cell('2')
        .cell('3')
        .cell('4')
        .cell('5')
        .cell('6')
        .row()
        .cell('A')
        .cell('B')
        .cell('C')
        .cell('D')
        .cell('E')
        .cell('F')
        .row()
    )
    .spacer(15)

    // Test 7: Zero gap with cell alignment
    .text('TEST 7: Zero gap with different cell alignments', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(0)
        .cell('Left Align', { align: 'left' })
        .cell('Center', { align: 'center' })
        .cell('Right Align', { align: 'right' })
        .row()
        .cell('L')
        .cell('C')
        .cell('R')
        .row()
    )
    .spacer(15)

    // Test 8: Comparison - zero vs small vs medium gap
    .text('TEST 8: Gap size comparison', { bold: true, underline: true })
    .text('Gap: 0')
    .add(
      grid([150, 150, 150])
        .columnGap(0)
        .cell('ABC')
        .cell('DEF')
        .cell('GHI')
        .row()
    )
    .spacer(5)
    .text('Gap: 5')
    .add(
      grid([150, 150, 150])
        .columnGap(5)
        .cell('ABC')
        .cell('DEF')
        .cell('GHI')
        .row()
    )
    .spacer(5)
    .text('Gap: 20')
    .add(
      grid([150, 150, 150])
        .columnGap(20)
        .cell('ABC')
        .cell('DEF')
        .cell('GHI')
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Grid Zero Gap Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Zero Gap Edge', 'qa-29-grid-zero-gap-edge');
}

main().catch(console.error);
