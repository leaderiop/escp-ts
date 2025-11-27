/**
 * QA Test 12: Text Overflow Behavior
 *
 * Tests text overflow/truncation options:
 * - 'visible': Text overflows container (default)
 * - 'clip': Text is truncated at boundary
 * - 'ellipsis': Text is truncated with '...' appended
 *
 * Run: npx tsx examples/qa-12-text-overflow.ts
 */

import { LayoutEngine, stack, grid, flex, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Text Overflow');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const longText = 'This is a very long text that should overflow the container boundary';
  const mediumText = 'Medium length text here';
  const shortText = 'Short';

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('TEXT OVERFLOW BEHAVIOR TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Direct text with fixed width
    .text('DIRECT TEXT WITH FIXED WIDTH (300 dots)', { bold: true, underline: true })
    .spacer(5)
    .text('overflow: visible (default)')
    .text(longText, { width: 300 })
    .spacer(10)
    .text('overflow: clip')
    .text(longText, { width: 300, overflow: 'clip' })
    .spacer(10)
    .text('overflow: ellipsis')
    .text(longText, { width: 300, overflow: 'ellipsis' })
    .spacer(20)

    // Test 2: Grid cells with overflow - separated to avoid overlap
    .text('GRID CELLS WITH CLIP', { bold: true, underline: true })
    .spacer(5)
    .add(
      grid([400, 400, 400])
        .columnGap(20)
        .cell('Column 1', { bold: true })
        .cell('Column 2', { bold: true })
        .cell('Column 3', { bold: true })
        .headerRow()
        .cell(text(longText, { overflow: 'clip' }))
        .cell(text(longText, { overflow: 'clip' }))
        .cell(text(longText, { overflow: 'clip' }))
        .row()
        .cell(text(mediumText, { overflow: 'clip' }))
        .cell(text(mediumText, { overflow: 'clip' }))
        .cell(text(shortText, { overflow: 'clip' }))
        .row()
    )
    .spacer(15)

    .text('GRID CELLS WITH ELLIPSIS', { bold: true, underline: true })
    .spacer(5)
    .add(
      grid([400, 400, 400])
        .columnGap(20)
        .cell('Column 1', { bold: true })
        .cell('Column 2', { bold: true })
        .cell('Column 3', { bold: true })
        .headerRow()
        .cell(text(longText, { overflow: 'ellipsis' }))
        .cell(text(longText, { overflow: 'ellipsis' }))
        .cell(text(longText, { overflow: 'ellipsis' }))
        .row()
        .cell(text(mediumText, { overflow: 'ellipsis' }))
        .cell(text(mediumText, { overflow: 'ellipsis' }))
        .cell(text(shortText, { overflow: 'ellipsis' }))
        .row()
    )
    .spacer(20)

    // Test 3: Narrow grid columns (stress test) - all with ellipsis
    .text('NARROW COLUMNS WITH ELLIPSIS (150 dots each)', { bold: true, underline: true })
    .spacer(5)
    .add(
      grid([150, 150, 150])
        .columnGap(10)
        .cell('Col 1', { bold: true })
        .cell('Col 2', { bold: true })
        .cell('Col 3', { bold: true })
        .headerRow()
        .cell(text('Long product name here', { overflow: 'ellipsis' }))
        .cell(text('Another long name', { overflow: 'ellipsis' }))
        .cell(text('Short', { overflow: 'ellipsis' }))
        .row()
    )
    .spacer(20)

    // Test 4: Invoice-style layout with truncation
    .text('INVOICE-STYLE TABLE WITH ELLIPSIS', { bold: true, underline: true })
    .spacer(5)
    .add(
      grid([100, 600, 200, 200])
        .columnGap(15)
        .cell('Qty', { bold: true })
        .cell('Description', { bold: true })
        .cell('Unit Price', { bold: true, align: 'right' })
        .cell('Total', { bold: true, align: 'right' })
        .headerRow()
        .cell('2')
        .cell(text('Premium Widget Pro Max Ultra Edition with Extended Warranty', { overflow: 'ellipsis' }))
        .cell('$49.99', { align: 'right' })
        .cell('$99.98', { align: 'right' })
        .row()
        .cell('5')
        .cell(text('Standard Widget Basic Model', { overflow: 'ellipsis' }))
        .cell('$24.99', { align: 'right' })
        .cell('$124.95', { align: 'right' })
        .row()
        .cell('1')
        .cell(text('Deluxe Accessory Kit with Premium Carrying Case and Documentation', { overflow: 'ellipsis' }))
        .cell('$99.99', { align: 'right' })
        .cell('$99.99', { align: 'right' })
        .row()
    )
    .spacer(20)

    // Test 5: Flex with truncation
    .text('FLEX LAYOUT WITH TRUNCATION', { bold: true, underline: true })
    .spacer(5)
    .add(
      flex()
        .gap(20)
        .add(text('Label:', { bold: true }))
        .add(text('Very long value that needs to be truncated properly', { width: 400, overflow: 'ellipsis' }))
    )
    .spacer(10)
    .add(
      flex()
        .gap(20)
        .add(text('Name:', { bold: true }))
        .add(text('John Doe', { width: 400, overflow: 'ellipsis' }))
    )
    .spacer(20)

    // Test 6: Edge cases
    .text('EDGE CASES', { bold: true, underline: true })
    .spacer(5)
    .text('Text shorter than width (no truncation needed):')
    .text('Hi', { width: 500, overflow: 'ellipsis' })
    .spacer(10)
    .text('Text exactly at boundary:')
    .text('1234567890', { width: 360, overflow: 'ellipsis' })
    .spacer(10)
    .text('Very narrow width (100 dots):')
    .text('Hello World!', { width: 100, overflow: 'ellipsis' })
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Text Overflow Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Text Overflow', 'qa-12-text-overflow');
}

main().catch(console.error);
