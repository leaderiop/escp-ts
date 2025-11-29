/**
 * Example 02: Layout System
 *
 * Demonstrates the virtual DOM layout system with stack and flex layouts.
 *
 * Run: npx tsx examples/02-layout-system.ts
 */

import { LayoutEngine, stack, flex, spacer, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Layout System Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });
  engine.initialize();
  await engine.initYoga();

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

  // Example 3: Table Layout using nested flex rows
  // Helper to create a table row - use spacer for flexible space
  const tableRow = (
    qty: string,
    desc: string,
    price: string,
    total: string,
    opts?: { bold?: boolean }
  ) =>
    flex()
      .gap(20)
      .add(stack().width(80).text(qty, opts))
      .add(stack().text(desc, opts)) // Description takes natural width
      .add(spacer()) // Flexible spacer fills remaining space
      .add(
        stack()
          .width(120)
          .text(price, { ...opts, align: 'right' })
      )
      .add(
        stack()
          .width(120)
          .text(total, { ...opts, align: 'right' })
      )
      .build();

  const itemsTable = stack()
    .gap(8)
    // Header row
    .add(tableRow('Qty', 'Description', 'Price', 'Total', { bold: true }))
    .add(line('-', 'fill'))
    // Data rows
    .add(tableRow('2', 'Widget A', '$10.00', '$20.00'))
    .add(tableRow('5', 'Widget B (Premium)', '$15.00', '$75.00'))
    .add(tableRow('1', 'Widget C', '$25.00', '$25.00'))
    .build();

  // Example 4: Nested Layouts
  const totalsSection = flex()
    .justify('end')
    .add(
      stack()
        .gap(5)
        .add(flex().gap(50).text('Subtotal:').text('$120.00', { bold: true }))
        .add(flex().gap(50).text('Tax (8%):').text('$9.60'))
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
