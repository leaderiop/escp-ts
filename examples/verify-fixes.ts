/**
 * Verification Script for Layout Bug Fixes
 *
 * Run: npx tsx examples/verify-fixes.ts
 * Then open: output/verify-fixes.png
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Bug Fix Verification');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  engine.initialize();

  const layout = stack()
    .padding(30)
    .gap(20)

    .text('BUG FIX VERIFICATION', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')

    // TEST 1: Flex Wrap (BUG-001, BUG-005)
    .text('TEST 1: Flex Wrap + rowGap', { bold: true, underline: true })
    .text('Expected: 3 items on row 1, 2 items on row 2, with 30px gap between rows')
    .add(
      flex()
        .width(600)  // Width constraint is KEY!
        .wrap('wrap')
        .gap(10)
        .rowGap(30)
        .add(stack().width(180).padding(5).text('[Item1]'))
        .add(stack().width(180).padding(5).text('[Item2]'))
        .add(stack().width(180).padding(5).text('[Item3]'))
        .add(stack().width(180).padding(5).text('[Item4]'))
        .add(stack().width(180).padding(5).text('[Item5]'))
    )
    .text('PASS if: Items wrap to 2 rows with visible gap')

    // TEST 2: Flex Width Constraint (PRN-BUG-001)
    .spacer(20)
    .text('TEST 2: Flex Width Constraint + Justify', { bold: true, underline: true })
    .text('Expected: Items spread within 500px, NOT across full page')
    .add(
      flex()
        .width(500)
        .justify('space-between')
        .add(stack().text('[A]'))
        .add(stack().text('[B]'))
        .add(stack().text('[C]'))
    )
    .text('PASS if: [A] [B] [C] are close together (within ~500 dots)')

    // TEST 3: Grid Cell Boundaries (BUG-002)
    .spacer(20)
    .text('TEST 3: Grid Cell Boundaries', { bold: true, underline: true })
    .text('Expected: Columns separated, text truncated not overlapping')
    .add(
      grid([150, 150, 150])
        .columnGap(10)
        .cell('Col1Data')
        .cell('Col2Data')
        .cell('Col3Data')
        .row()
        .cell('LongerText')
        .cell('MoreText')
        .cell('EndText')
    )
    .text('PASS if: Columns are clearly separated')

    // TEST 4: Auto-Margin Centering (BUG-003)
    .spacer(20)
    .text('TEST 4: Auto-Margin Centering', { bold: true, underline: true })
    .text('Expected: Text below should be centered on page')
    .add(
      stack()
        .margin('auto')
        .width(400)
        .text('This text should be CENTERED')
    )
    .text('PASS if: Text above is horizontally centered')

    .spacer(20)
    .line('-', 'fill')
    .text('End of Verification', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Bug Fix Verification', 'verify-fixes');

  console.log('\n✅ Verification complete!');
  console.log('📁 Open output/verify-fixes.png to check results');
}

main().catch(console.error);
