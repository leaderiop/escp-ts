/**
 * Example 34: Complete Invoice - Using Template Engine Features
 *
 * Demonstrates template engine with a professional invoice layout.
 * Uses single-line flex rows to avoid nested stack layout issues.
 *
 * Run: npx tsx examples/34-complete-invoice.ts
 */

import {
  LayoutEngine,
  stack,
  flex,
  text,
  template,
  conditional,
  switchOn,
  each,
  line,
  spacer,
  gt,
  eq,
  type LayoutNode,
} from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

// Item row for the each() iteration
const ItemRow = (): LayoutNode =>
  flex()
    .gap(10)
    .add(template('{{item.name}}').build())
    .spacer()
    .add(template('{{item.quantity}}').width(80).align('right').build())
    .add(template('{{item.unitPrice | currency:"$"}}').width(120).align('right').build())
    .add(template('{{item.total | currency:"$"}}').width(120).align('right').build())
    .build();

async function main() {
  printSection('Complete Invoice Demo');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  engine.initialize();
  await engine.initYoga();

  engine.setData({
    invoice: {
      number: 'INV-2024-001234',
      date: '2024-12-15',
      dueDate: '2025-01-14',
      status: 'pending',
    },
    customer: {
      name: 'Jane Smith',
      company: 'Tech Innovations LLC',
      membership: 'gold',
      street: '456 Innovation Drive',
      cityStateZip: 'San Francisco, CA 94105',
    },
    shipping: {
      name: 'Tech Innovations Warehouse',
      street: '789 Warehouse Blvd',
      cityStateZip: 'Oakland, CA 94607',
    },
    items: [
      { name: 'Wireless Mouse Pro', quantity: 10, unitPrice: 39.99, total: 399.9 },
      { name: 'Mechanical Keyboard', quantity: 5, unitPrice: 89.99, total: 449.95 },
      { name: 'USB-C Hub (7-port)', quantity: 10, unitPrice: 49.99, total: 499.9 },
      { name: 'Monitor Stand 27"', quantity: 5, unitPrice: 79.99, total: 399.95 },
      { name: 'Webcam HD 1080p', quantity: 10, unitPrice: 59.99, total: 599.9 },
    ],
    totals: {
      subtotal: 2349.6,
      discount: { applied: true, percent: 10, amount: 234.96 },
      shipping: { method: 'express', cost: 25.0 },
      tax: { rate: 8.25, amount: 174.46 },
      grandTotal: 2314.1,
    },
    payment: { method: 'net_30' },
  });

  const invoice = stack()
    .padding(20)

    // === HEADER ===
    .text('ACME CORPORATION', { bold: true, doubleWidth: true, align: 'center' })
    .text('123 Business Ave, Commerce City, CA 90210 | (800) 555-ACME', { align: 'center' })
    .add(line('=', 'fill'))

    // === INVOICE INFO LINE ===
    .add(
      flex()
        .add(template('INVOICE #{{invoice.number}}').bold().build())
        .spacer()
        .add(
          conditional()
            .ifPath('customer.membership', 'eq', 'gold')
            .then(text('** GOLD MEMBER **', { bold: true }))
            .elseIf(
              eq('customer.membership', 'platinum'),
              text('*** PLATINUM VIP ***', { bold: true })
            )
            .else(spacer(0))
            .build()
        )
    )
    .add(template('Date: {{invoice.date}} | Due: {{invoice.dueDate}}').build())
    .add(spacer(10))

    // === ADDRESSES - Using parallel lines ===
    .add(
      flex()
        .text('BILL TO:', { bold: true, underline: true })
        .add(spacer(200))
        .text('SHIP TO:', { bold: true, underline: true })
        .spacer()
    )
    .add(
      flex()
        .add(template('{{customer.name}}').bold().build())
        .add(spacer(200))
        .add(template('{{shipping.name}}').bold().build())
        .spacer()
    )
    .add(
      flex()
        .add(template('{{customer.company | default:""}}').build())
        .add(spacer(200))
        .add(template('{{shipping.street}}').build())
        .spacer()
    )
    .add(
      flex()
        .add(template('{{customer.street}}').build())
        .add(spacer(200))
        .add(template('{{shipping.cityStateZip}}').build())
        .spacer()
    )
    .add(template('{{customer.cityStateZip}}').build())
    .add(spacer(10))

    // === LINE ITEMS TABLE ===
    .add(line('-', 'fill'))
    .add(
      flex()
        .gap(10)
        .text('Item', { bold: true })
        .spacer()
        .text('Qty', { width: 80, align: 'right', bold: true })
        .text('Price', { width: 120, align: 'right', bold: true })
        .text('Total', { width: 120, align: 'right', bold: true })
    )
    .add(line('-', 'fill'))
    .add(each('items').as('item').render(ItemRow()).build())
    .add(line('-', 'fill'))

    // === TOTALS ===
    .add(
      flex()
        .spacer()
        .text('Subtotal:')
        .add(template('{{totals.subtotal | currency:"$"}}').width(120).align('right').build())
    )
    .add(
      conditional()
        .ifPath('totals.discount.applied', 'eq', true)
        .then(
          flex()
            .spacer()
            .add(template('Discount ({{totals.discount.percent}}%):').italic().build())
            .add(
              template('-{{totals.discount.amount | currency:"$"}}')
                .width(120)
                .align('right')
                .italic()
                .build()
            )
        )
        .else(spacer(0))
        .build()
    )
    .add(
      flex()
        .spacer()
        .add(
          switchOn('totals.shipping.method')
            .case('express', text('Express Shipping:'))
            .case('free', text('Shipping:'))
            .default(text('Shipping:'))
            .build()
        )
        .add(
          conditional()
            .if(gt('totals.shipping.cost', 0))
            .then(
              template('{{totals.shipping.cost | currency:"$"}}').width(120).align('right').build()
            )
            .else(text('FREE', { width: 120, align: 'right', bold: true }))
            .build()
        )
    )
    .add(
      flex()
        .spacer()
        .add(template('Tax ({{totals.tax.rate}}%):').build())
        .add(template('{{totals.tax.amount | currency:"$"}}').width(120).align('right').build())
    )
    .add(flex().spacer().add(line('-', 200)))
    .add(
      flex()
        .spacer()
        .text('TOTAL DUE:', { bold: true })
        .add(
          template('{{totals.grandTotal | currency:"$"}}').width(120).align('right').bold().build()
        )
    )

    // === FOOTER ===
    .add(spacer(10))
    .add(line('-', 'fill'))
    .add(
      flex()
        .text('Payment: ', { bold: true })
        .add(
          switchOn('payment.method')
            .case('net_30', text('Net 30 Terms'))
            .case('credit_card', template('Card ****{{payment.lastFour}}').build())
            .default(text('Other'))
            .build()
        )
        .spacer()
        .text('Status: ', { bold: true })
        .add(
          switchOn('invoice.status')
            .case('paid', text('PAID', { bold: true }))
            .case('pending', text('PENDING'))
            .default(text('-'))
            .build()
        )
    )
    .text('Thank you for your business!', { italic: true })
    .add(line('=', 'fill'))
    .text('www.acme.example.com', { align: 'center' })
    .build();

  engine.render(invoice);
  await renderPreview(engine.getOutput(), 'Complete Invoice', '34-complete-invoice');
}

main().catch(console.error);
