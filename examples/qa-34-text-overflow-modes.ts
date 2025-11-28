/**
 * QA Test 34: Text Overflow Modes
 *
 * Tests text overflow behavior to verify:
 * - 'visible': Text overflows container (default)
 * - 'clip': Text is truncated at boundary
 * - 'ellipsis': Text is truncated with '...'
 * - Overflow in constrained width containers
 * - Overflow in grid cells
 *
 * Run: npx tsx examples/qa-34-text-overflow-modes.ts
 */

import { LayoutEngine, stack, grid, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Text Overflow Modes');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const longText = 'This is a very long piece of text that should overflow or be truncated depending on the mode setting';

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('TEXT OVERFLOW MODES TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Overflow visible (default)
    .text('TEST 1: overflow: VISIBLE (default)', { bold: true, underline: true })
    .text('Text extends beyond container boundary')
    .add(
      stack()
        .width(400)
        .padding(5)
        .text(longText, { overflow: 'visible' })
    )
    .spacer(15)

    // Test 2: Overflow clip
    .text('TEST 2: overflow: CLIP', { bold: true, underline: true })
    .text('Text truncated at container edge')
    .add(
      stack()
        .width(400)
        .padding(5)
        .text(longText, { overflow: 'clip', width: 400 })
    )
    .spacer(15)

    // Test 3: Overflow ellipsis
    .text('TEST 3: overflow: ELLIPSIS', { bold: true, underline: true })
    .text('Text truncated with "..." appended')
    .add(
      stack()
        .width(400)
        .padding(5)
        .text(longText, { overflow: 'ellipsis', width: 400 })
    )
    .spacer(15)

    // Test 4: Comparison at same width
    .text('TEST 4: Side-by-side comparison (width: 300)', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(
          flex()
            .gap(20)
            .add(stack().text('visible:', { bold: true }))
            .add(stack().width(300).text(longText, { overflow: 'visible' }))
        )
        .add(
          flex()
            .gap(20)
            .add(stack().text('clip:', { bold: true }))
            .add(stack().width(300).text(longText, { overflow: 'clip', width: 300 }))
        )
        .add(
          flex()
            .gap(20)
            .add(stack().text('ellipsis:', { bold: true }))
            .add(stack().width(300).text(longText, { overflow: 'ellipsis', width: 300 }))
        )
    )
    .spacer(15)

    // Test 5: Grid cell overflow
    .text('TEST 5: Grid cells with overflow modes', { bold: true, underline: true })
    .add(
      grid([200, 200, 200])
        .columnGap(10)
        .cell('Mode', { bold: true })
        .cell('Result', { bold: true })
        .cell('Expected', { bold: true })
        .headerRow()
        .cell('visible')
        .cell(longText.slice(0, 50), { overflow: 'visible' })
        .cell('Overflows')
        .row()
        .cell('clip')
        .cell(longText.slice(0, 50), { overflow: 'clip' })
        .cell('Truncated')
        .row()
        .cell('ellipsis')
        .cell(longText.slice(0, 50), { overflow: 'ellipsis' })
        .cell('Has ...')
        .row()
    )
    .spacer(15)

    // Test 6: Very narrow container
    .text('TEST 6: Very narrow container (width: 100)', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .text('clip:')
        .add(stack().width(100).text('ABCDEFGHIJKLMNOPQRSTUVWXYZ', { overflow: 'clip', width: 100 }))
        .text('ellipsis:')
        .add(stack().width(100).text('ABCDEFGHIJKLMNOPQRSTUVWXYZ', { overflow: 'ellipsis', width: 100 }))
    )
    .spacer(15)

    // Test 7: Text exactly at boundary
    .text('TEST 7: Text exactly at or near boundary', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .text('10 chars in 360px (should fit):')
        .add(stack().width(360).text('0123456789', { overflow: 'clip', width: 360 }))
        .text('20 chars in 360px (should clip):')
        .add(stack().width(360).text('01234567890123456789', { overflow: 'clip', width: 360 }))
    )
    .spacer(15)

    // Test 8: Styled text overflow
    .text('TEST 8: Styled text with overflow', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .text('Bold text:')
        .add(stack().width(300).text(longText, { bold: true, overflow: 'ellipsis', width: 300 }))
        .text('Double width:')
        .add(stack().width(300).text(longText, { doubleWidth: true, overflow: 'ellipsis', width: 300 }))
        .text('Condensed:')
        .add(stack().width(300).text(longText, { condensed: true, overflow: 'ellipsis', width: 300 }))
    )
    .spacer(15)

    // Test 9: Unicode and special characters
    .text('TEST 9: Special characters with overflow', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .text('Numbers and symbols:')
        .add(stack().width(200).text('$1,234.56 / $9,999.99', { overflow: 'ellipsis', width: 200 }))
    )
    .spacer(15)

    // Test 10: Overflow with alignment
    .text('TEST 10: Overflow with text alignment', { bold: true, underline: true })
    .add(
      grid([300, 300])
        .columnGap(20)
        .cell('Left aligned:')
        .cell(longText.slice(0, 40), { align: 'left', overflow: 'ellipsis' })
        .row()
        .cell('Center aligned:')
        .cell(longText.slice(0, 40), { align: 'center', overflow: 'ellipsis' })
        .row()
        .cell('Right aligned:')
        .cell(longText.slice(0, 40), { align: 'right', overflow: 'ellipsis' })
        .row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Text Overflow Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Text Overflow Modes', 'qa-34-text-overflow-modes');
}

main().catch(console.error);
