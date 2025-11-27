/**
 * QA Test 16: Grid Zero Gap Bug Verification
 *
 * This test specifically targets BUG-001: Grid columns with zero gap
 * should still maintain proper column boundaries and not overlap text.
 *
 * Expected behavior:
 * - Each column's text should stay within its boundaries
 * - Text should be truncated at column edge, not overlap into next column
 * - Column boundaries should be visually clear
 *
 * Run: npx tsx examples/qa-16-grid-zero-gap-bug.ts
 */

import { LayoutEngine, stack, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Grid Zero Gap Bug Verification');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('GRID ZERO GAP BUG TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Control: Gap = 20 (should work)
    .text('CONTROL: columnGap = 20', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(20)
        .cell('Column A')
        .cell('Column B')
        .cell('Column C')
        .row()
        .cell('Data 1')
        .cell('Data 2')
        .cell('Data 3')
        .row()
    )
    .spacer(15)

    // Test: Gap = 10 (might have issues)
    .text('TEST: columnGap = 10', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(10)
        .cell('Column A')
        .cell('Column B')
        .cell('Column C')
        .row()
        .cell('Data 1')
        .cell('Data 2')
        .cell('Data 3')
        .row()
    )
    .spacer(15)

    // Bug case: Gap = 0
    .text('BUG CASE: columnGap = 0', { bold: true, underline: true })
    .text('Each column should show its own text, not overlap:')
    .add(
      grid([200, 200, 200])
        .columnGap(0)
        .cell('Column A')
        .cell('Column B')
        .cell('Column C')
        .row()
        .cell('Data 1')
        .cell('Data 2')
        .cell('Data 3')
        .row()
    )
    .spacer(15)

    // Bug case with longer text
    .text('BUG CASE: Gap=0 with longer text', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(0)
        .cell('LongerTextA')
        .cell('LongerTextB')
        .cell('LongerTextC')
        .row()
    )
    .spacer(15)

    // Minimal gap test
    .text('MINIMAL GAP: columnGap = 1', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(1)
        .cell('Column A')
        .cell('Column B')
        .cell('Column C')
        .row()
    )
    .spacer(15)

    // Expected visual markers
    .text('EXPECTED COLUMN POSITIONS:', { bold: true })
    .text('Col 1 starts at X=0, ends at X=200')
    .text('Col 2 starts at X=200, ends at X=400')
    .text('Col 3 starts at X=400, ends at X=600')

    // Footer
    .line('-', 'fill')
    .text('End of Zero Gap Bug Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Grid Zero Gap Bug', 'qa-16-grid-zero-gap-bug');
}

main().catch(console.error);
