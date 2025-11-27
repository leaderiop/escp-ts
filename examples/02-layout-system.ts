/**
 * Example 02: Layout System
 *
 * Demonstrates the virtual DOM layout system with stack, flex, and grid layouts.
 *
 * Run: npx tsx examples/02-layout-system.ts
 */

import { LayoutEngine, stack, flex, grid, spacer, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Layout System Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });
  engine.initialize();

  // Example 1: Stack Layout (vertical arrangement)
  const header = stack()
    .gap(10) // 10 dots between items
    .text('INVOICE', { bold: true, doubleWidth: true })
    .add(line('-', 'fill'))
    .build();

  // Example 2: Flex Layout (horizontal arrangement with distribution)
  const addressRow = flex()
    .justify('space-between')
    .add(
      stack()
        .text('Bill To:', { bold: true })
        .text('John Smith')
        .text('123 Main Street')
        .text('Anytown, ST 12345')
    )
    .add(
      stack()
        .text('Ship To:', { bold: true })
        .text('Jane Doe')
        .text('456 Oak Avenue')
        .text('Somewhere, ST 67890')
    )
    .build();

  // Example 3: Grid Layout (table structure)
  const itemsTable = grid([80, 'fill', 120, 120]) // Column widths: 80, flexible, 120, 120
    .columnGap(20)
    .rowGap(8)
    // Header row
    .cell('Qty', { bold: true })
    .cell('Description', { bold: true })
    .cell('Price', { bold: true, align: 'right' })
    .cell('Total', { bold: true, align: 'right' })
    .headerRow()
    // Data rows
    .cell('2').cell('Widget A').cell('$10.00', { align: 'right' }).cell('$20.00', { align: 'right' }).row()
    .cell('5').cell('Widget B (Premium)').cell('$15.00', { align: 'right' }).cell('$75.00', { align: 'right' }).row()
    .cell('1').cell('Widget C').cell('$25.00', { align: 'right' }).cell('$25.00', { align: 'right' }).row()
    .build();

  // Example 4: Nested Layouts
  const totalsSection = flex()
    .justify('end')
    .add(
      stack()
        .gap(5)
        .add(
          flex()
            .gap(50)
            .text('Subtotal:')
            .text('$120.00', { bold: true })
        )
        .add(
          flex()
            .gap(50)
            .text('Tax (8%):')
            .text('$9.60')
        )
        .add(line('-', 200))
        .add(
          flex()
            .gap(50)
            .text('TOTAL:', { bold: true })
            .text('$129.60', { bold: true, doubleWidth: true })
        )
    )
    .build();

  // Combine everything into a complete document
  const document = stack()
    .gap(20)
    .padding(36) // Half inch margins (36 dots at 360 DPI)
    .add(header)
    .add(spacer(20))
    .add(addressRow)
    .add(spacer(30))
    .add(itemsTable)
    .add(spacer(20))
    .add(line('-', 'fill'))
    .add(totalsSection)
    .add(spacer(40))
    .text('Thank you for your business!', { italic: true })
    .build();

  // Render the layout
  engine.render(document);

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Layout System Demo', '02-layout-system');
}

main().catch(console.error);
