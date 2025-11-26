/**
 * Example 2: Layout System
 *
 * Demonstrates the virtual DOM layout system with stack, flex, and grid layouts.
 */

import { LayoutEngine, stack, flex, grid, text, spacer, line } from '../src/index';
import * as fs from 'fs';

const engine = new LayoutEngine();
engine.initialize();

// Example 1: Stack Layout (vertical arrangement)
const header = stack()
  .gap(10) // 10 dots between items
  .text('INVOICE', { bold: true, doubleWidth: true })
  .child(line('horizontal'))
  .build();

// Example 2: Flex Layout (horizontal arrangement with distribution)
const addressRow = flex()
  .justify('space-between')
  .child(
    stack()
      .text('Bill To:', { bold: true })
      .text('John Smith')
      .text('123 Main Street')
      .text('Anytown, ST 12345')
      .build()
  )
  .child(
    stack()
      .text('Ship To:', { bold: true })
      .text('Jane Doe')
      .text('456 Oak Avenue')
      .text('Somewhere, ST 67890')
      .build()
  )
  .build();

// Example 3: Grid Layout (table structure)
const itemsTable = grid([50, 'fill', 80, 80]) // Column widths: 50, flexible, 80, 80
  .columnGap(10)
  .rowGap(5)
  // Header row
  .cell('Qty', { bold: true })
  .cell('Description', { bold: true })
  .cell('Price', { bold: true })
  .cell('Total', { bold: true })
  .row({ isHeader: true })
  // Data rows
  .cell('2').cell('Widget A').cell('$10.00').cell('$20.00').row()
  .cell('5').cell('Widget B (Premium)').cell('$15.00').cell('$75.00').row()
  .cell('1').cell('Widget C').cell('$25.00').cell('$25.00').row()
  .build();

// Example 4: Nested Layouts
const totalsSection = flex()
  .justify('end')
  .child(
    stack()
      .gap(5)
      .child(
        flex()
          .gap(50)
          .text('Subtotal:')
          .text('$120.00', { bold: true })
          .build()
      )
      .child(
        flex()
          .gap(50)
          .text('Tax (8%):')
          .text('$9.60')
          .build()
      )
      .child(line('horizontal'))
      .child(
        flex()
          .gap(50)
          .text('TOTAL:', { bold: true })
          .text('$129.60', { bold: true, doubleWidth: true })
          .build()
      )
      .build()
  )
  .build();

// Combine everything into a complete document
const document = stack()
  .gap(20)
  .padding(36) // Half inch margins (36 dots at 360 DPI)
  .child(header)
  .child(spacer(undefined, 20))
  .child(addressRow)
  .child(spacer(undefined, 30))
  .child(itemsTable)
  .child(spacer(undefined, 20))
  .child(line('horizontal'))
  .child(totalsSection)
  .child(spacer(undefined, 40))
  .text('Thank you for your business!', { italic: true })
  .build();

// Render the layout
engine.render(document);
engine.formFeed();

// Save output
const output = engine.getOutput();
fs.writeFileSync('output/invoice.prn', output);
console.log(`Generated ${output.length} bytes`);
