/**
 * Example 07: Pagination
 *
 * Demonstrates pagination features:
 * - breakBefore: Force page break before element
 * - breakAfter: Force page break after element
 * - keepTogether: Keep element and children on same page
 * - keepWithNext: Keep grid row with next row
 * - Multi-page document handling
 *
 * Run: npx tsx examples/07-pagination.ts
 */

import { LayoutEngine, stack, grid, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Pagination Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Build a multi-page document with pagination hints
  const layout = stack()
    .gap(15)
    .padding(30)

    // Page 1: Introduction
    .text('PAGE 1: INTRODUCTION', { bold: true, doubleWidth: true })
    .line('=', 'fill')
    .spacer(20)
    .text('This document demonstrates pagination features.')
    .text('Content will automatically flow across multiple pages.')
    .spacer(20)
    .text('The following section will force a page break before it.')
    .spacer(30)

    // Force page break before this section
    .add(
      stack()
        .breakBefore() // <-- This forces a new page
        .text('PAGE 2: BREAK BEFORE', { bold: true, doubleWidth: true })
        .line('=', 'fill')
        .spacer(20)
        .text('This section started on a new page due to breakBefore().')
        .text('Use breakBefore() for chapter headings, sections, etc.')
    )
    .spacer(30)

    // Section with keepTogether
    .add(
      stack()
        .keepTogether() // <-- Keep this entire section on same page
        .text('GROUPED SECTION (keepTogether)', { bold: true })
        .line('-', 'fill')
        .text('Line 1 of grouped content')
        .text('Line 2 of grouped content')
        .text('Line 3 of grouped content')
        .text('Line 4 of grouped content')
        .text('All these lines stay together on the same page.')
        .line('-', 'fill')
    )
    .spacer(30)

    // Table with keepWithNext
    .text('TABLE WITH keepWithNext', { bold: true })
    .text('The subtotal row stays with the total row.', { italic: true })
    .spacer(10)
    .add(
      grid([200, 200, 150])
        .columnGap(20)
        .rowGap(5)
        .cell('Item', { bold: true })
        .cell('Description', { bold: true })
        .cell('Amount', { bold: true, align: 'right' })
        .headerRow()
        .cell('Product A')
        .cell('Widget')
        .cell('$100.00', { align: 'right' })
        .row()
        .cell('Product B')
        .cell('Gadget')
        .cell('$250.00', { align: 'right' })
        .row()
        .cell('Product C')
        .cell('Gizmo')
        .cell('$75.00', { align: 'right' })
        .row()
        .keepWithNext() // Keep subtotal with total
        .cell('')
        .cell('Subtotal', { bold: true })
        .cell('$425.00', { bold: true, align: 'right' })
        .row()
        .cell('')
        .cell('Tax (10%)', { bold: true })
        .cell('$42.50', { bold: true, align: 'right' })
        .row()
    )
    .spacer(30)

    // Force page break after this section
    .add(
      stack()
        .breakAfter() // <-- Force page break after
        .text('END OF CONTENT SECTION', { bold: true })
        .text('A page break will occur after this section.')
    )

    // Final page
    .text('FINAL PAGE', { bold: true, doubleWidth: true })
    .line('=', 'fill')
    .text('This content appears on a new page due to breakAfter() above.')
    .spacer(30)
    .text('End of Document', { align: 'center', italic: true })
    .build();

  // Render the layout
  engine.render(layout);

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Pagination Demo', '07-pagination');
}

main().catch(console.error);
