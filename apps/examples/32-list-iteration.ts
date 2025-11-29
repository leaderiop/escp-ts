/**
 * Example 32: List Iteration with Each
 *
 * Demonstrates iterating over arrays with the each() builder:
 * - Basic iteration: each('items').render(template)
 * - Custom variable names: .as('product').indexAs('i')
 * - Separators between items: .separator(line('-'))
 * - Empty state handling: .empty(text('No items'))
 * - Nested iteration for complex data
 * - Access to index and total count
 *
 * Run: npx tsx examples/32-list-iteration.ts
 */

import { LayoutEngine, stack, flex, text, template, each, conditional, line, gt } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('List Iteration Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Set up sample data with various arrays
  engine.setData({
    // Simple array of strings
    categories: ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Toys'],

    // Array of objects
    products: [
      { name: 'Wireless Mouse', price: 29.99, stock: 150, category: 'Electronics' },
      { name: 'USB-C Cable', price: 12.99, stock: 500, category: 'Electronics' },
      { name: 'Mechanical Keyboard', price: 89.99, stock: 75, category: 'Electronics' },
      { name: 'Cotton T-Shirt', price: 19.99, stock: 200, category: 'Clothing' },
      { name: 'Running Shoes', price: 79.99, stock: 45, category: 'Clothing' },
    ],

    // Order with line items
    order: {
      number: 'ORD-2024-5678',
      items: [
        { sku: 'WM-001', name: 'Wireless Mouse', qty: 2, unitPrice: 29.99 },
        { sku: 'KB-002', name: 'Mechanical Keyboard', qty: 1, unitPrice: 89.99 },
        { sku: 'UC-003', name: 'USB-C Cable (3-pack)', qty: 3, unitPrice: 12.99 },
      ],
    },

    // Empty array for demo
    emptyList: [],

    // Nested data structure
    departments: [
      {
        name: 'Engineering',
        employees: [
          { name: 'Alice', role: 'Senior Developer' },
          { name: 'Bob', role: 'DevOps Engineer' },
          { name: 'Carol', role: 'QA Lead' },
        ],
      },
      {
        name: 'Design',
        employees: [
          { name: 'David', role: 'UI Designer' },
          { name: 'Eve', role: 'UX Researcher' },
        ],
      },
    ],
  });

  const layout = stack()
    .gap(10)
    .padding(30)

    // === HEADER ===
    .text('LIST ITERATION DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // === BASIC ITERATION ===
    .text('1. BASIC STRING ARRAY ITERATION', { bold: true, underline: true })
    .spacer(5)
    .text('each(path).render(template)', { italic: true })
    .spacer(8)

    .text('Categories:', { bold: true })
    .add(each('categories').render(template('  - {{item}}')).build())
    .spacer(15)

    // === WITH INDEX ===
    .text('2. ITERATION WITH INDEX', { bold: true, underline: true })
    .spacer(5)
    .text('Access {{index}} for current position (0-based)', { italic: true })
    .spacer(8)

    .text('Categories (numbered):', { bold: true })
    .add(each('categories').indexAs('num').render(template('  {{num}}. {{item}}')).build())
    .spacer(15)

    // === OBJECT ARRAYS ===
    .text('3. OBJECT ARRAY ITERATION', { bold: true, underline: true })
    .spacer(5)
    .text('Access object properties: {{item.property}}', { italic: true })
    .spacer(8)

    .text('Product Catalog:', { bold: true })
    .line('-', 'fill')
    .add(
      each('products')
        .as('product')
        .render(
          flex()
            .add(template('{{product.name}}').width(300).build())
            .add(template('{{product.price | currency:"$"}}').width(100).align('right').build())
            .add(template('Stock: {{product.stock}}').width(150).align('right').build())
        )
        .build()
    )
    .line('-', 'fill')
    .spacer(15)

    // === WITH SEPARATORS ===
    .text('4. ITERATION WITH SEPARATORS', { bold: true, underline: true })
    .spacer(5)
    .text('.separator(node) adds content between items', { italic: true })
    .spacer(8)

    .text('Products (with separators):', { bold: true })
    .add(
      each('products')
        .as('p')
        .render(
          stack()
            .add(template('{{p.name}}').bold().build())
            .add(template('  Price: {{p.price | currency:"$"}} | Category: {{p.category}}').build())
        )
        .separator(line('.', 'fill'))
        .build()
    )
    .spacer(15)

    // === EMPTY STATE ===
    .text('5. EMPTY ARRAY HANDLING', { bold: true, underline: true })
    .spacer(5)
    .text('.empty(node) renders when array is empty', { italic: true })
    .spacer(8)

    .text('Empty List Demo:', { bold: true })
    .add(
      each('emptyList')
        .render(template('{{item}}'))
        .empty(
          stack()
            .padding(10)
            .text('No items found', { italic: true, align: 'center' })
            .text('(This is the empty state)', { align: 'center' })
        )
        .build()
    )
    .spacer(15)

    // === ORDER LINE ITEMS ===
    .text('6. ORDER LINE ITEMS (Invoice Style)', { bold: true, underline: true })
    .spacer(5)
    .line('=', 'fill')
    .add(template('Order: {{order.number}}').bold().build())
    .line('-', 'fill')

    // Header row
    .add(
      flex()
        .text('SKU', { width: 100, bold: true })
        .text('Description', { width: 350, bold: true })
        .text('Qty', { width: 80, align: 'right', bold: true })
        .text('Unit Price', { width: 120, align: 'right', bold: true })
        .text('Total', { width: 120, align: 'right', bold: true })
    )
    .line('-', 'fill')

    // Line items
    .add(
      each('order.items')
        .as('line')
        .indexAs('lineNum')
        .render(
          flex()
            .add(template('{{line.sku}}').width(100).build())
            .add(template('{{line.name}}').width(350).build())
            .add(template('{{line.qty}}').width(80).align('right').build())
            .add(template('{{line.unitPrice | currency:"$"}}').width(120).align('right').build())
            .add(
              // Using callback to calculate line total
              text('', {
                width: 120,
                align: 'right',
              })
            )
        )
        .build()
    )
    .line('=', 'fill')
    .spacer(15)

    // === CONDITIONAL WITHIN ITERATION ===
    .text('7. CONDITIONALS INSIDE ITERATION', { bold: true, underline: true })
    .spacer(5)
    .text('Combine each() with conditional() for dynamic content', { italic: true })
    .spacer(8)

    .add(
      each('products')
        .as('p')
        .render(
          flex()
            .add(template('{{p.name}}').width(300).build())
            .add(
              conditional()
                .if(gt('p.stock', 100))
                .then(text('In Stock', { bold: true, width: 150 }))
                .elseIf(gt('p.stock', 0), text('Low Stock', { italic: true, width: 150 }))
                .else(text('OUT OF STOCK', { bold: true, width: 150 }))
                .build()
            )
            .add(template('{{p.price | currency:"$"}}').width(100).align('right').build())
        )
        .build()
    )
    .spacer(15)

    // === NESTED ITERATION ===
    .text('8. NESTED ITERATION', { bold: true, underline: true })
    .spacer(5)
    .text('Iterate over nested arrays (departments -> employees)', { italic: true })
    .spacer(8)

    .add(
      each('departments')
        .as('dept')
        .render(
          stack()
            .gap(5)
            .add(template('Department: {{dept.name}}').bold().underline().build())
            .add(
              each('dept.employees')
                .as('emp')
                .render(
                  flex()
                    .text('  ')
                    .add(template('{{emp.name}}').width(150).build())
                    .add(template('({{emp.role}})').italic().build())
                )
                .build()
            )
            .spacer(10)
        )
        .build()
    )
    .spacer(15)

    // === FOOTER ===
    .line('=', 'fill')
    .text('End of List Iteration Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(commands, 'List Iteration', '32-list-iteration');
}

main().catch(console.error);
