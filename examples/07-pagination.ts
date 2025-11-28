/**
 * Example 07: Multi-Page Documents
 *
 * Demonstrates multi-page document handling:
 * - Documents that span multiple pages
 * - Content flow across pages
 * - Table structures using flex layouts
 *
 * Note: Pagination hints (breakBefore, breakAfter, keepTogether)
 * have been removed as they are incompatible with Yoga layout.
 *
 * Run: npx tsx examples/07-pagination.ts
 */

import { LayoutEngine, stack, flex, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Multi-Page Document Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Helper to create a table row
  const tableRow = (item: string, desc: string, amount: string, opts?: { bold?: boolean }) =>
    flex()
      .gap(20)
      .add(stack().width(200).text(item, opts))
      .add(stack().width(200).text(desc, opts))
      .add(stack().width(150).text(amount, { ...opts, align: 'right' }))
      .build();

  // Build a multi-page document
  const layout = stack()
    .gap(15)
    .padding(30)

    // Page 1: Introduction
    .text('PAGE 1: INTRODUCTION', { bold: true, doubleWidth: true })
    .add(line('=', 'fill'))
    .add(stack().height(20))
    .text('This document demonstrates multi-page document handling.')
    .text('Content will automatically flow across multiple pages.')
    .add(stack().height(20))
    .text('The layout system handles content distribution.')
    .add(stack().height(30))

    // Section 2: Content
    .text('CONTENT SECTION', { bold: true, doubleWidth: true })
    .add(line('=', 'fill'))
    .add(stack().height(20))
    .text('This section contains structured content.')
    .text('Use stack and flex layouts to organize content.')
    .add(stack().height(30))

    // Grouped section
    .text('GROUPED SECTION', { bold: true })
    .add(line('-', 'fill'))
    .text('Line 1 of grouped content')
    .text('Line 2 of grouped content')
    .text('Line 3 of grouped content')
    .text('Line 4 of grouped content')
    .text('Content is organized using stack layouts.')
    .add(line('-', 'fill'))
    .add(stack().height(30))

    // Table using flex rows
    .text('TABLE EXAMPLE', { bold: true })
    .text('Tables are created using nested flex layouts.', { italic: true })
    .add(stack().height(10))
    .add(
      stack()
        .gap(5)
        .add(tableRow('Item', 'Description', 'Amount', { bold: true }))
        .add(line('-', 'fill'))
        .add(tableRow('Product A', 'Widget', '$100.00'))
        .add(tableRow('Product B', 'Gadget', '$250.00'))
        .add(tableRow('Product C', 'Gizmo', '$75.00'))
        .add(line('-', 'fill'))
        .add(tableRow('', 'Subtotal', '$425.00', { bold: true }))
        .add(tableRow('', 'Tax (10%)', '$42.50', { bold: true }))
        .add(line('=', 'fill'))
        .add(tableRow('', 'TOTAL', '$467.50', { bold: true }))
    )
    .add(stack().height(30))

    // Final section
    .text('FINAL SECTION', { bold: true, doubleWidth: true })
    .add(line('=', 'fill'))
    .text('This demonstrates a complete multi-section document.')
    .add(stack().height(30))
    .text('End of Document', { italic: true })
    .build();

  // Render the layout
  engine.render(layout);

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Multi-Page Document Demo', '07-pagination');
}

main().catch(console.error);
