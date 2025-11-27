/**
 * Example 12: Advanced Grid Features
 *
 * Demonstrates advanced grid capabilities:
 * - Cell alignment (horizontal and vertical)
 * - Header rows with styling
 * - Row height control
 * - Row-level styles
 * - Column width specs (fixed, auto, fill)
 * - Column and row gaps
 *
 * Run: npx tsx examples/12-grid-advanced.ts
 */

import { LayoutEngine, stack, flex, grid, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Advanced Grid Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('ADVANCED GRID FEATURES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Cell alignment
    .text('CELL ALIGNMENT', { bold: true, underline: true })
    .spacer(10)
    .add(
      grid([200, 200, 200])
        .columnGap(10)
        .rowGap(5)
        .cell('Left (default)', { align: 'left' })
        .cell('Center', { align: 'center' })
        .cell('Right', { align: 'right' })
        .row()
        .cell('Text', { align: 'left' })
        .cell('Text', { align: 'center' })
        .cell('Text', { align: 'right' })
        .row()
    )
    .spacer(30)

    // Header rows
    .text('HEADER ROWS', { bold: true, underline: true })
    .spacer(10)
    .add(
      grid([150, 'fill', 120])
        .columnGap(15)
        .rowGap(5)
        // Header row is automatically styled and tracked
        .cell('Product', { bold: true })
        .cell('Description', { bold: true })
        .cell('Price', { bold: true, align: 'right' })
        .headerRow()
        // Data rows
        .cell('Widget')
        .cell('A useful widget for daily tasks')
        .cell('$29.99', { align: 'right' })
        .row()
        .cell('Gadget')
        .cell('High-tech gadget with features')
        .cell('$49.99', { align: 'right' })
        .row()
        .cell('Gizmo')
        .cell('Simple gizmo for beginners')
        .cell('$14.99', { align: 'right' })
        .row()
    )
    .spacer(30)

    // Row-level styling
    .text('ROW-LEVEL STYLING', { bold: true, underline: true })
    .spacer(10)
    .add(
      grid([200, 200])
        .columnGap(10)
        .rowGap(5)
        .rowStyle({ bold: true })
        .cell('Bold Row')
        .cell('All cells bold')
        .row()
        .rowStyle({ italic: true })
        .cell('Italic Row')
        .cell('All cells italic')
        .row()
        .rowStyle({ underline: true })
        .cell('Underlined Row')
        .cell('All cells underlined')
        .row()
    )
    .spacer(30)

    // Row height control
    .text('ROW HEIGHT CONTROL', { bold: true, underline: true })
    .spacer(10)
    .add(
      grid([200, 200])
        .columnGap(10)
        .rowGap(10)
        .cell('Auto Height')
        .cell('Default height based on content')
        .row()
        .cell('Fixed Height (100)')
        .cell('This row is 100 dots tall')
        .row(100)
        .cell('Fixed Height (60)')
        .cell('This row is 60 dots tall')
        .row(60)
    )
    .spacer(30)

    // Column width specs
    .text('COLUMN WIDTH SPECIFICATIONS', { bold: true, underline: true })
    .spacer(10)
    .text('Fixed (100) | Auto | Fill', { italic: true })
    .add(
      grid([100, 'auto', 'fill'])
        .columnGap(10)
        .rowGap(5)
        .cell('100px', { bold: true })
        .cell('Auto', { bold: true })
        .cell('Fill', { bold: true })
        .headerRow()
        .cell('Fixed')
        .cell('Sized to content')
        .cell('Takes remaining space')
        .row()
    )
    .spacer(30)

    // Complex table example
    .text('COMPLETE TABLE EXAMPLE: Invoice', { bold: true, underline: true })
    .spacer(10)
    .add(
      grid([60, 'fill', 80, 80, 100])
        .columnGap(15)
        .rowGap(8)
        // Header
        .cell('Qty', { bold: true, align: 'right' })
        .cell('Item', { bold: true })
        .cell('Unit', { bold: true, align: 'right' })
        .cell('Disc', { bold: true, align: 'right' })
        .cell('Total', { bold: true, align: 'right' })
        .headerRow()
        // Items
        .cell('2', { align: 'right' })
        .cell('Widget Pro')
        .cell('$50.00', { align: 'right' })
        .cell('10%', { align: 'right' })
        .cell('$90.00', { align: 'right' })
        .row()
        .cell('5', { align: 'right' })
        .cell('Basic Gadget')
        .cell('$25.00', { align: 'right' })
        .cell('0%', { align: 'right' })
        .cell('$125.00', { align: 'right' })
        .row()
        .cell('1', { align: 'right' })
        .cell('Premium Gizmo')
        .cell('$199.00', { align: 'right' })
        .cell('15%', { align: 'right' })
        .cell('$169.15', { align: 'right' })
        .row()
        // Subtotal row (keepWithNext would keep it with Total)
        .cell('')
        .cell('')
        .cell('')
        .cell('Subtotal:', { bold: true, align: 'right' })
        .cell('$384.15', { bold: true, align: 'right' })
        .row()
        // Tax row
        .cell('')
        .cell('')
        .cell('')
        .cell('Tax (8%):', { align: 'right' })
        .cell('$30.73', { align: 'right' })
        .row()
        // Total row
        .cell('')
        .cell('')
        .cell('')
        .cell('TOTAL:', { bold: true, align: 'right' })
        .cell('$414.88', { bold: true, align: 'right' })
        .row()
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Advanced Grid Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Advanced Grid Demo', '12-grid-advanced');
}

main().catch(console.error);
