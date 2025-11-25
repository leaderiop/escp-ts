/**
 * Example usage of the ESC/P2 Layout Engine
 * This demonstrates how to create documents for the EPSON LQ-2090II
 */

import {
  LayoutEngine,
  CommandBuilder,
  PRINT_QUALITY,
  TYPEFACE,
  JUSTIFICATION,
  BIT_IMAGE_MODE,
  stack,
  flex,
  grid,
  text,
  line,
  spacer,
  StackBuilder,
  FlexBuilder,
} from './index';

// Example 1: Simple text document
function simpleDocument() {
  const engine = new LayoutEngine();

  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .setTypeface(TYPEFACE.ROMAN)
    .setCpi(10)
    .setBold(true)
    .printCentered('INVOICE')
    .setBold(false)
    .newLine()
    .newLine()
    .setJustification(JUSTIFICATION.LEFT)
    .println('Customer: John Doe')
    .println('Date: 2024-01-15')
    .newLine()
    .setUnderline(true)
    .println('Items:')
    .setUnderline(false)
    .println('  1. Widget A          $10.00')
    .println('  2. Widget B          $15.00')
    .println('  3. Widget C          $20.00')
    .newLine()
    .setBold(true)
    .printRightAligned('Total: $45.00')
    .setBold(false)
    .formFeed();

  return engine.getOutput();
}

// Example 2: Using CommandBuilder directly
function lowLevelCommands() {
  const commands: Uint8Array[] = [];

  // Initialize printer
  commands.push(CommandBuilder.initialize());

  // Set to LQ mode
  commands.push(CommandBuilder.selectQuality(PRINT_QUALITY.LQ));

  // Print bold text
  commands.push(CommandBuilder.boldOn());
  commands.push(CommandBuilder.printLine('Hello, World!'));
  commands.push(CommandBuilder.boldOff());

  // Print normal text
  commands.push(CommandBuilder.printLine('This is a test document.'));

  // Form feed
  commands.push(CommandBuilder.formFeed());

  // Concatenate all commands
  const totalLength = commands.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const cmd of commands) {
    result.set(cmd, offset);
    offset += cmd.length;
  }

  return result;
}

// Example 3: Graphics printing
function graphicsExample() {
  const engine = new LayoutEngine();

  // Create a simple test pattern
  const width = 100;
  const height = 48; // Multiple of 24 for 24-pin printer

  const imageData = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create a diagonal pattern
      imageData[y * width + x] = ((x + y) % 8 < 4) ? 255 : 0;
    }
  }

  const image = { width, height, data: imageData };

  engine
    .initialize()
    .println('Graphics Test:')
    .printImage(image, { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN })
    .newLine()
    .println('End of graphics test')
    .formFeed();

  return engine.getOutput();
}

// Example 4: Barcode printing (LQ-2090II specific)
function barcodeExample() {
  const engine = new LayoutEngine();

  engine
    .initialize()
    .println('Barcode Test:')
    .newLine()
    .printBarcode('123456789012', {
      type: 0, // EAN-13
      moduleWidth: 2,
      height: 80,
      hriPosition: 2, // Below barcode
      hriFont: 0,
    })
    .newLine()
    .newLine()
    .println('Code 39:')
    .printBarcode('ABC123', {
      type: 5, // Code 39
      moduleWidth: 2,
      height: 60,
      hriPosition: 2,
      hriFont: 0,
    })
    .formFeed();

  return engine.getOutput();
}

// Utility to save output to file for use with emulators
import { writeFileSync } from 'fs';

function saveToFile(data: Uint8Array, filename: string) {
  writeFileSync(filename, data);
  console.log(`Saved: ${filename} (${data.length} bytes)`);
}

// Example 5: Complex Composable Layout - Professional Invoice
function composableLayoutExample() {
  const engine = new LayoutEngine();

  // === REUSABLE COMPONENTS ===

  // Company header component
  const companyHeader = (): FlexBuilder =>
    flex()
      .width('fill')
      .justify('space-between')
      .add(
        stack()
          .text('ACME CORPORATION', { bold: true, doubleWidth: true })
          .text('123 Business Street')
          .text('New York, NY 10001')
          .text('Tel: (555) 123-4567')
      )
      .add(
        stack()
          .align('right')
          .text('INVOICE', { bold: true, doubleWidth: true, doubleHeight: true })
          .text('Invoice #: INV-2024-0042', { bold: true })
          .text('Date: January 15, 2024')
          .text('Due: February 15, 2024')
      );

  // Customer info component
  const customerInfo = (
    name: string,
    address: string,
    city: string,
    email: string
  ): StackBuilder =>
    stack()
      .padding({ top: 20, bottom: 20 })
      .text('BILL TO:', { bold: true, underline: true })
      .add(spacer(10))
      .text(name, { bold: true })
      .text(address)
      .text(city)
      .text(email);

  // Line item row helper
  interface LineItem {
    qty: number;
    description: string;
    unitPrice: number;
    total: number;
  }

  const formatCurrency = (amount: number): string =>
    `$${amount.toFixed(2).padStart(10)}`;

  // Items table component
  const itemsTable = (items: LineItem[]): StackBuilder => {
    const tableGrid = grid([60, 'fill', 100, 120])
      .columnGap(20)
      .rowGap(5)
      // Header row
      .cell('QTY', { bold: true, align: 'center' })
      .cell('DESCRIPTION', { bold: true })
      .cell('UNIT PRICE', { bold: true, align: 'right' })
      .cell('TOTAL', { bold: true, align: 'right' })
      .headerRow();

    // Data rows
    items.forEach(item => {
      tableGrid
        .cell(item.qty.toString(), { align: 'center' })
        .cell(item.description)
        .cell(formatCurrency(item.unitPrice), { align: 'right' })
        .cell(formatCurrency(item.total), { align: 'right' })
        .row();
    });

    return stack()
      .add(line('=', 'fill'))
      .add(spacer(5))
      .add(tableGrid)
      .add(spacer(5))
      .add(line('=', 'fill'));
  };

  // Totals component
  const totalsSection = (
    subtotal: number,
    taxRate: number,
    tax: number,
    total: number
  ): FlexBuilder =>
    flex()
      .width('fill')
      .justify('end')
      .add(
        stack()
          .align('right')
          .padding({ top: 20 })
          .add(
            flex()
              .gap(50)
              .text('Subtotal:')
              .text(formatCurrency(subtotal), { align: 'right' })
          )
          .add(
            flex()
              .gap(50)
              .text(`Tax (${taxRate}%):`)
              .text(formatCurrency(tax), { align: 'right' })
          )
          .add(spacer(10))
          .add(line('-', 200))
          .add(spacer(10))
          .add(
            flex()
              .gap(50)
              .bold()
              .text('TOTAL DUE:', { bold: true })
              .text(formatCurrency(total), { bold: true, align: 'right' })
          )
      );

  // Payment info component
  const paymentInfo = (): StackBuilder =>
    stack()
      .padding({ top: 40 })
      .text('PAYMENT INFORMATION', { bold: true, underline: true })
      .add(spacer(10))
      .add(
        grid([150, 'fill'])
          .columnGap(20)
          .cell('Bank:', { bold: true })
          .cell('First National Bank')
          .row()
          .cell('Account:', { bold: true })
          .cell('1234567890')
          .row()
          .cell('Routing:', { bold: true })
          .cell('021000021')
          .row()
      );

  // Terms component
  const termsAndConditions = (): StackBuilder =>
    stack()
      .padding({ top: 30 })
      .cpi(12) // Smaller text for terms
      .text('TERMS AND CONDITIONS', { bold: true })
      .add(spacer(5))
      .text('1. Payment is due within 30 days of invoice date.')
      .text('2. Late payments subject to 1.5% monthly interest.')
      .text('3. Please include invoice number with payment.')
      .add(spacer(20))
      .cpi(10)
      .align('center')
      .text('Thank you for your business!', { italic: true });

  // Footer component
  const footer = (): FlexBuilder =>
    flex()
      .width('fill')
      .justify('space-between')
      .cpi(12)
      .text('Page 1 of 1')
      .text('Generated by ESCP-TS Layout Engine');

  // === COMPOSE THE FULL INVOICE ===

  const items: LineItem[] = [
    { qty: 5, description: 'Widget Pro X1 - Premium Model', unitPrice: 49.99, total: 249.95 },
    { qty: 10, description: 'Widget Standard S2', unitPrice: 24.99, total: 249.90 },
    { qty: 2, description: 'Widget Deluxe D3 - Limited Edition', unitPrice: 99.99, total: 199.98 },
    { qty: 25, description: 'Widget Mini M1 - Bulk Pack', unitPrice: 9.99, total: 249.75 },
    { qty: 1, description: 'Premium Support Package (1 Year)', unitPrice: 299.00, total: 299.00 },
  ];

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 8.25;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  // Build the complete invoice layout
  const invoice = stack()
    .width('fill')
    .padding(40)
    .gap(10)
    // Header
    .add(companyHeader())
    .add(spacer(30))
    .add(line('-', 'fill'))
    // Customer info
    .add(customerInfo(
      'John Smith',
      '456 Customer Avenue, Suite 100',
      'Los Angeles, CA 90001',
      'john.smith@example.com'
    ))
    // Items table
    .add(itemsTable(items))
    // Totals
    .add(totalsSection(subtotal, taxRate, tax, total))
    // Payment info
    .add(paymentInfo())
    // Terms
    .add(termsAndConditions())
    // Footer
    .add(spacer(40))
    .add(line('-', 'fill'))
    .add(spacer(10))
    .add(footer())
    .build();

  // Render the layout
  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .setTypeface(TYPEFACE.ROMAN)
    .render(invoice)
    .formFeed();

  return engine.getOutput();
}

// Example 6: Multi-Column Report Layout
function multiColumnReport() {
  const engine = new LayoutEngine();

  // Section component
  const section = (title: string, content: string[]): StackBuilder => {
    const contentStack = stack().gap(2);
    content.forEach(item => contentStack.add(text(item)));
    return stack()
      .gap(5)
      .text(title, { bold: true, underline: true })
      .add(spacer(5))
      .add(contentStack);
  };

  // Stats box component
  const statsBox = (label: string, value: string): StackBuilder =>
    stack()
      .align('center')
      .padding(10)
      .text(value, { bold: true, doubleWidth: true })
      .text(label, { cpi: 12 });

  // Build the report
  const report = stack()
    .width('fill')
    .padding(30)
    .gap(20)
    // Title
    .add(
      stack()
        .align('center')
        .text('QUARTERLY SALES REPORT', { bold: true, doubleWidth: true, doubleHeight: true })
        .text('Q4 2024', { bold: true })
        .text('Generated: January 15, 2025')
    )
    .add(spacer(20))
    .add(line('=', 'fill'))
    // Stats row
    .add(
      flex()
        .width('fill')
        .justify('space-around')
        .add(statsBox('Total Revenue', '$1.2M'))
        .add(statsBox('Units Sold', '45,230'))
        .add(statsBox('New Customers', '1,847'))
        .add(statsBox('Growth Rate', '+23%'))
    )
    .add(line('-', 'fill'))
    // Two-column content
    .add(
      flex()
        .width('fill')
        .gap(40)
        .alignItems('top')
        .add(
          section('TOP PERFORMERS', [
            '1. Sarah Johnson - $245,000',
            '2. Mike Chen - $198,500',
            '3. Lisa Park - $187,200',
            '4. James Wilson - $165,800',
            '5. Emma Davis - $142,300',
          ])
        )
        .add(
          section('REGIONAL BREAKDOWN', [
            'North America: 45% ($540K)',
            'Europe: 28% ($336K)',
            'Asia Pacific: 18% ($216K)',
            'Latin America: 9% ($108K)',
          ])
        )
    )
    .add(spacer(20))
    // Product table
    .add(
      stack()
        .text('PRODUCT PERFORMANCE', { bold: true, underline: true })
        .add(spacer(10))
        .add(
          grid([150, 'fill', 100, 100])
            .columnGap(15)
            .rowGap(3)
            .cell('Product', { bold: true })
            .cell('Category', { bold: true })
            .cell('Units', { bold: true, align: 'right' })
            .cell('Revenue', { bold: true, align: 'right' })
            .headerRow()
            .cell('Widget Pro').cell('Premium').cell('12,450', { align: 'right' }).cell('$498,000', { align: 'right' }).row()
            .cell('Widget Std').cell('Standard').cell('18,230', { align: 'right' }).cell('$364,600', { align: 'right' }).row()
            .cell('Widget Mini').cell('Budget').cell('14,550', { align: 'right' }).cell('$145,500', { align: 'right' }).row()
        )
    )
    .add(spacer(30))
    .add(line('=', 'fill'))
    .add(
      flex()
        .width('fill')
        .justify('space-between')
        .cpi(12)
        .text('Confidential - Internal Use Only')
        .text('Page 1 of 1')
    )
    .build();

  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .render(report)
    .formFeed();

  return engine.getOutput();
}

// Example 7: Nested Grid Layout (Complex Form)
function complexFormLayout() {
  const engine = new LayoutEngine();

  // Form field component
  const formField = (label: string, value: string, width?: number): StackBuilder =>
    stack()
      .width(width ?? 'auto')
      .text(label, { bold: true, cpi: 12 })
      .text(value)
      .add(line('_', width ?? 150));

  // Checkbox component
  const checkbox = (label: string, checked: boolean): FlexBuilder =>
    flex()
      .gap(10)
      .text(checked ? '[X]' : '[ ]')
      .text(label);

  // Build the form
  const form = stack()
    .width('fill')
    .padding(30)
    .gap(15)
    // Header
    .add(
      stack()
        .align('center')
        .text('APPLICATION FORM', { bold: true, doubleWidth: true })
        .text('Please complete all sections')
    )
    .add(line('=', 'fill'))
    // Section 1: Personal Information
    .add(
      stack()
        .gap(10)
        .text('SECTION 1: PERSONAL INFORMATION', { bold: true })
        .add(
          flex()
            .width('fill')
            .gap(30)
            .add(formField('First Name', 'John'))
            .add(formField('Last Name', 'Smith'))
            .add(formField('Middle Initial', 'R'))
        )
        .add(
          flex()
            .width('fill')
            .gap(30)
            .add(formField('Date of Birth', '01/15/1985'))
            .add(formField('SSN', 'XXX-XX-1234'))
            .add(formField('Phone', '(555) 123-4567'))
        )
    )
    .add(line('-', 'fill'))
    // Section 2: Address
    .add(
      stack()
        .gap(10)
        .text('SECTION 2: ADDRESS', { bold: true })
        .add(formField('Street Address', '123 Main Street, Apt 4B', 400))
        .add(
          flex()
            .width('fill')
            .gap(30)
            .add(formField('City', 'New York'))
            .add(formField('State', 'NY'))
            .add(formField('ZIP', '10001'))
        )
    )
    .add(line('-', 'fill'))
    // Section 3: Options
    .add(
      stack()
        .gap(10)
        .text('SECTION 3: OPTIONS', { bold: true })
        .add(
          flex()
            .width('fill')
            .gap(40)
            .add(
              stack()
                .gap(5)
                .text('Employment Status:', { bold: true, cpi: 12 })
                .add(checkbox('Full-time', true))
                .add(checkbox('Part-time', false))
                .add(checkbox('Contract', false))
                .add(checkbox('Self-employed', false))
            )
            .add(
              stack()
                .gap(5)
                .text('Preferred Contact:', { bold: true, cpi: 12 })
                .add(checkbox('Email', true))
                .add(checkbox('Phone', false))
                .add(checkbox('Mail', false))
            )
            .add(
              stack()
                .gap(5)
                .text('Services Requested:', { bold: true, cpi: 12 })
                .add(checkbox('Standard Plan', false))
                .add(checkbox('Premium Plan', true))
                .add(checkbox('Enterprise Plan', false))
            )
        )
    )
    .add(line('-', 'fill'))
    // Signature section
    .add(
      flex()
        .width('fill')
        .justify('space-between')
        .padding({ top: 30 })
        .add(
          stack()
            .add(spacer(30))
            .add(line('_', 250))
            .text('Applicant Signature', { cpi: 12 })
        )
        .add(
          stack()
            .add(spacer(30))
            .add(line('_', 150))
            .text('Date', { cpi: 12 })
        )
    )
    .add(spacer(30))
    .add(line('=', 'fill'))
    .add(
      stack()
        .align('center')
        .cpi(12)
        .text('For Office Use Only')
        .add(
          flex()
            .gap(50)
            .text('Received: ________')
            .text('Processed: ________')
            .text('Approved: ________')
        )
    )
    .build();

  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .render(form)
    .formFeed();

  return engine.getOutput();
}

// Run examples
console.log('ESC/P2 Layout Engine Examples');
console.log('=============================\n');

const simple = simpleDocument();
console.log(`Simple document: ${simple.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(simple.slice(0, 50))}\n`);
saveToFile(simple, 'output/invoice.prn');

const lowLevel = lowLevelCommands();
console.log(`Low-level commands: ${lowLevel.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(lowLevel.slice(0, 50))}\n`);
saveToFile(lowLevel, 'output/hello.prn');

const graphics = graphicsExample();
console.log(`Graphics example: ${graphics.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(graphics.slice(0, 50))}\n`);
saveToFile(graphics, 'output/graphics.prn');

const barcode = barcodeExample();
console.log(`Barcode example: ${barcode.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(barcode.slice(0, 50))}\n`);
saveToFile(barcode, 'output/barcode.prn');

const composable = composableLayoutExample();
console.log(`Composable layout (invoice): ${composable.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(composable.slice(0, 50))}\n`);
saveToFile(composable, 'output/composable-invoice.prn');

const report = multiColumnReport();
console.log(`Multi-column report: ${report.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(report.slice(0, 50))}\n`);
saveToFile(report, 'output/report.prn');

const form = complexFormLayout();
console.log(`Complex form: ${form.length} bytes`);
console.log(`First 50 bytes (hex): ${CommandBuilder.toHex(form.slice(0, 50))}\n`);
saveToFile(form, 'output/form.prn');

console.log('\nAll examples completed successfully!');
console.log('\nTo view output with emulators:');
console.log('  ESCParser:    ESCParser -pdf output/invoice.prn > invoice.pdf');
console.log('  PrinterToPDF: printerToPDF -o . -f font2/Epson-Standard.C16 output/invoice.prn');
