/**
 * QA Test 10: Mixed Layout Stress Test
 *
 * Comprehensive test combining multiple layout features:
 * - Multiple container types in one document
 * - Deep nesting
 * - Various sizing modes
 * - Real-world document simulation
 *
 * Run: npx tsx examples/qa-10-mixed-layouts.ts
 */

import { LayoutEngine, stack, flex, grid, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Mixed Layout Stress Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Header section with flex
    .add(
      flex()
        .justify('space-between')
        .add(
          stack()
            .text('COMPANY NAME', { bold: true, doubleWidth: true })
            .text('123 Business Street')
            .text('City, State 12345')
        )
        .add(
          stack()
            .text('INVOICE', { bold: true, doubleWidth: true, align: 'right' })
            .text('Invoice #: INV-2024-001', { align: 'right' })
            .text('Date: 2024-12-15', { align: 'right' })
        )
    )
    .add(line('=', 'fill'))
    .spacer(10)

    // Customer info in grid
    .add(
      grid(['50%', '50%'])
        .columnGap(30)
        .cell(
          stack()
            .gap(3)
            .text('BILL TO:', { bold: true, underline: true })
            .text('John Customer')
            .text('456 Client Avenue')
            .text('Clientville, ST 67890')
            .build()
        )
        .cell(
          stack()
            .gap(3)
            .text('SHIP TO:', { bold: true, underline: true })
            .text('John Customer')
            .text('789 Delivery Lane')
            .text('Shiptown, ST 11111')
            .build()
        )
        .row()
    )
    .spacer(20)

    // Items table with grid
    .text('ORDER DETAILS', { bold: true, underline: true })
    .spacer(5)
    .add(
      grid([60, 'fill', 80, 80, 100])
        .columnGap(10)
        .rowGap(5)
        .cell('Qty', { bold: true, align: 'center' })
        .cell('Description', { bold: true })
        .cell('Unit', { bold: true, align: 'right' })
        .cell('Disc', { bold: true, align: 'right' })
        .cell('Total', { bold: true, align: 'right' })
        .headerRow()
        .cell('2', { align: 'center' })
        .cell('Premium Widget Pro')
        .cell('$49.99', { align: 'right' })
        .cell('10%', { align: 'right' })
        .cell('$89.98', { align: 'right' })
        .row()
        .cell('5', { align: 'center' })
        .cell('Standard Gadget')
        .cell('$24.99', { align: 'right' })
        .cell('-', { align: 'right' })
        .cell('$124.95', { align: 'right' })
        .row()
        .cell('1', { align: 'center' })
        .cell('Deluxe Accessory Kit')
        .cell('$99.99', { align: 'right' })
        .cell('5%', { align: 'right' })
        .cell('$94.99', { align: 'right' })
        .row()
        .cell('3', { align: 'center' })
        .cell('Basic Component')
        .cell('$15.00', { align: 'right' })
        .cell('-', { align: 'right' })
        .cell('$45.00', { align: 'right' })
        .row()
    )
    .add(line('-', 'fill'))
    .spacer(10)

    // Totals section with flex justify end
    .add(
      flex()
        .justify('end')
        .add(
          stack()
            .width(300)
            .gap(5)
            .add(
              flex()
                .justify('space-between')
                .add(stack().text('Subtotal:'))
                .add(stack().text('$354.92', { bold: true }))
            )
            .add(
              flex()
                .justify('space-between')
                .add(stack().text('Discount:'))
                .add(stack().text('-$14.49'))
            )
            .add(
              flex()
                .justify('space-between')
                .add(stack().text('Tax (8%):'))
                .add(stack().text('$27.23'))
            )
            .add(line('-', 'fill'))
            .add(
              flex()
                .justify('space-between')
                .add(stack().text('TOTAL:', { bold: true }))
                .add(stack().text('$367.66', { bold: true, doubleWidth: true }))
            )
        )
    )
    .spacer(20)

    // Payment info and notes in two columns
    .add(
      flex()
        .gap(40)
        .add(
          stack()
            .width('45%')
            .gap(5)
            .text('PAYMENT INFORMATION', { bold: true, underline: true })
            .text('Payment Method: Credit Card')
            .text('Card ending: ****1234')
            .text('Payment Status: PAID')
        )
        .add(
          stack()
            .width('45%')
            .gap(5)
            .text('NOTES', { bold: true, underline: true })
            .text('Thank you for your business!')
            .text('Please contact us with any questions.')
            .text('Returns accepted within 30 days.')
        )
    )
    .spacer(20)

    // Footer with centered content
    .add(line('=', 'fill'))
    .add(
      stack()
        .margin('auto')
        .width(500)
        .gap(5)
        .text('Questions? Contact us:', { align: 'center', bold: true })
        .add(
          flex()
            .justify('space-around')
            .add(stack().text('Phone: 555-1234'))
            .add(stack().text('Email: info@company.com'))
        )
    )
    .spacer(10)
    .text('Thank you for choosing our services!', { align: 'center', italic: true })

    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Mixed Layouts', 'qa-10-mixed-layouts');
}

main().catch(console.error);
