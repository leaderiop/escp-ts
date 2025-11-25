/**
 * Preview script - renders ESC/P2 output to PNG images
 * Usage: npx tsx src/preview.ts
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import {
  LayoutEngine,
  VirtualRenderer,
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

// Create output directory
mkdirSync('output', { recursive: true });

// Custom paper size from CUPS: Custom.1069x615 (points, 1/72 inch)
// lpoptions -p EPSON_LQ_2090II -o PageSize=Custom.1069x615
// 1069 points = 14.847 inches, 615 points = 8.542 inches
// NOTE: LQ-2090II max print width is 13.6 inches (4896 dots)
const PAPER_WIDTH_POINTS = 1069;
const PAPER_HEIGHT_POINTS = 615;
const PAPER_WIDTH_INCHES = PAPER_WIDTH_POINTS / 72; // 14.847 inches
const PAPER_HEIGHT_INCHES = PAPER_HEIGHT_POINTS / 72; // 8.542 inches

// Calculate margins to center the printable area on the paper
const PRINTER_MAX_WIDTH_INCHES = 13.6;
// Extra margin on each side: (14.847 - 13.6) / 2 = 0.624 inches = ~225 dots
const SIDE_MARGIN = Math.round(((PAPER_WIDTH_INCHES - PRINTER_MAX_WIDTH_INCHES) / 2) * 360);

const CUSTOM_PAPER = {
  widthInches: PAPER_WIDTH_INCHES,
  heightInches: PAPER_HEIGHT_INCHES,
  margins: { top: 90, bottom: 90, left: SIDE_MARGIN, right: SIDE_MARGIN },
  linesPerPage: Math.floor(PAPER_HEIGHT_INCHES * 6), // ~50 lines at 6 LPI
};

/**
 * Convert VirtualRenderer bitmap to PNG using sharp
 */
async function renderToPng(renderer: VirtualRenderer, filename: string): Promise<void> {
  const pages = renderer.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page) continue;

    const pageFilename = pages.length > 1
      ? filename.replace('.png', `_page${i + 1}.png`)
      : filename;

    // Convert grayscale to RGBA for sharp (invert: 0=white bg, 255=black text)
    const rgba = new Uint8Array(page.width * page.height * 4);
    for (let j = 0; j < page.data.length; j++) {
      const gray = page.data[j] ?? 0;
      // Invert: 0 (white in renderer) -> 255 (white in image), 255 (black) -> 0
      const inverted = 255 - gray;
      rgba[j * 4] = inverted;     // R
      rgba[j * 4 + 1] = inverted; // G
      rgba[j * 4 + 2] = inverted; // B
      rgba[j * 4 + 3] = 255;      // A
    }

    await sharp(Buffer.from(rgba), {
      raw: {
        width: page.width,
        height: page.height,
        channels: 4
      }
    })
    .png()
    .toFile(pageFilename);

    console.log(`Saved: ${pageFilename} (${page.width}x${page.height})`);
  }
}

// Example 1: Simple invoice document
async function previewInvoice() {
  console.log('\n--- Invoice Preview ---');

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
    .println('Invoice #: INV-2024-001')
    .newLine()
    .setUnderline(true)
    .println('Items:')
    .setUnderline(false)
    .println('  1. Widget A          $10.00')
    .println('  2. Widget B          $15.00')
    .println('  3. Widget C          $20.00')
    .newLine()
    .println('----------------------------------------')
    .setBold(true)
    .printRightAligned('Total: $45.00')
    .setBold(false)
    .newLine()
    .newLine()
    .println('Thank you for your business!')
    .formFeed();

  // Save PRN file
  const output = engine.getOutput();
  writeFileSync('output/invoice.prn', output);
  console.log(`PRN saved: output/invoice.prn (${output.length} bytes)`);

  // Render to virtual display - pass the ESC/P2 command stream
  const renderer = new VirtualRenderer({}, { scale: 1 });
  renderer.render(output);

  await renderToPng(renderer, 'output/invoice.png');
}

// Example 2: Graphics test pattern
async function previewGraphics() {
  console.log('\n--- Graphics Preview ---');

  const engine = new LayoutEngine();

  // Create a test pattern
  const width = 200;
  const height = 48;
  const imageData = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create a gradient + diagonal pattern
      const gradient = Math.floor((x / width) * 255);
      const pattern = ((x + y) % 8 < 4) ? 255 : 0;
      imageData[y * width + x] = (gradient + pattern) / 2;
    }
  }

  const image = { width, height, data: imageData };

  engine
    .initialize()
    .println('Graphics Test Pattern:')
    .newLine()
    .printImage(image, { mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN })
    .newLine()
    .newLine()
    .println('End of graphics test')
    .formFeed();

  // Save PRN file
  const output = engine.getOutput();
  writeFileSync('output/graphics.prn', output);
  console.log(`PRN saved: output/graphics.prn (${output.length} bytes)`);

  // Render to virtual display
  const renderer = new VirtualRenderer({}, { scale: 1 });
  renderer.render(output);

  await renderToPng(renderer, 'output/graphics.png');
}

// Example 3: Font styles demo
async function previewFontStyles() {
  console.log('\n--- Font Styles Preview ---');

  const engine = new LayoutEngine();

  engine
    .initialize()
    .println('=== Font Styles Demo ===')
    .newLine()
    .println('Normal text')
    .setBold(true).println('Bold text').setBold(false)
    .setItalic(true).println('Italic text').setItalic(false)
    .setUnderline(true).println('Underlined text').setUnderline(false)
    .setDoubleStrike(true).println('Double-strike text').setDoubleStrike(false)
    .newLine()
    .println('=== Font Sizes ===')
    .newLine()
    .setCpi(10).println('10 CPI (Characters Per Inch)')
    .setCpi(12).println('12 CPI (Characters Per Inch)')
    .setCpi(15).println('15 CPI (Characters Per Inch)')
    .newLine()
    .setCpi(10)
    .setDoubleWidth(true).println('Double Width').setDoubleWidth(false)
    .setDoubleHeight(true).println('Double Height').setDoubleHeight(false)
    .setCondensed(true).println('Condensed text').setCondensed(false)
    .newLine()
    .println('=== Alignment ===')
    .setJustification(JUSTIFICATION.LEFT).println('Left aligned')
    .setJustification(JUSTIFICATION.CENTER).println('Center aligned')
    .setJustification(JUSTIFICATION.RIGHT).println('Right aligned')
    .setJustification(JUSTIFICATION.LEFT)
    .formFeed();

  // Save PRN file
  const output = engine.getOutput();
  writeFileSync('output/font_styles.prn', output);
  console.log(`PRN saved: output/font_styles.prn (${output.length} bytes)`);

  // Render to virtual display
  const renderer = new VirtualRenderer({}, { scale: 1 });
  renderer.render(output);

  await renderToPng(renderer, 'output/font_styles.png');
}

// Example 4: Composable Layout - Professional Invoice
// Paper: 37.5 x 21.5 cm = 5315 x 3047 dots, printable width ~5135 dots
async function previewComposableInvoice() {
  console.log('\n--- Composable Invoice Preview ---');

  const engine = new LayoutEngine({ defaultPaper: CUSTOM_PAPER });

  // Reusable components - sized for wide paper
  const companyHeader = (): FlexBuilder =>
    flex()
      .width('fill')
      .justify('space-between')
      .add(
        stack()
          .text('ACME CORPORATION', { bold: true, doubleWidth: true, doubleHeight: true })
          .spacer(10)
          .text('123 Business Street')
          .text('New York, NY 10001')
          .text('Tel: (555) 123-4567')
          .text('Email: sales@acme.com')
      )
      .add(
        stack()
          .align('center')
          .text('INVOICE', { bold: true, doubleWidth: true, doubleHeight: true })
          .spacer(20)
          .add(
            grid([400, 500])
              .columnGap(40)
              .cell('Invoice #:', { bold: true }).cell('INV-2024-0042').row()
              .cell('Date:', { bold: true }).cell('January 15, 2024').row()
              .cell('Due Date:', { bold: true }).cell('February 15, 2024').row()
              .cell('Terms:', { bold: true }).cell('Net 30').row()
          )
      )
      .add(
        stack()
          .align('right')
          .text('ORIGINAL', { bold: true, doubleWidth: true })
          .spacer(10)
          .text('Page 1 of 1')
      );

  const customerInfo = (): FlexBuilder =>
    flex()
      .width('fill')
      .gap(100)
      .add(
        stack()
          .padding({ top: 20, bottom: 20 })
          .text('BILL TO:', { bold: true, underline: true })
          .spacer(10)
          .text('John Smith', { bold: true })
          .text('456 Customer Avenue, Suite 100')
          .text('Los Angeles, CA 90001')
          .text('Phone: (555) 987-6543')
          .text('Email: john.smith@example.com')
      )
      .add(
        stack()
          .padding({ top: 20, bottom: 20 })
          .text('SHIP TO:', { bold: true, underline: true })
          .spacer(10)
          .text('John Smith')
          .text('789 Delivery Road')
          .text('Los Angeles, CA 90002')
          .text('Attn: Receiving Dept.')
      )
      .add(
        stack()
          .padding({ top: 20, bottom: 20 })
          .text('PAYMENT INFO:', { bold: true, underline: true })
          .spacer(10)
          .text('Bank: First National')
          .text('Account: ****7890')
          .text('Routing: 021000021')
      );

  interface LineItem {
    qty: number;
    sku: string;
    description: string;
    unitPrice: number;
    discount: number;
    total: number;
  }

  const formatCurrency = (amount: number): string => {
    // Pad to ensure consistent width for alignment
    const formatted = amount.toFixed(2);
    return `$${formatted}`;
  };

  const itemsTable = (items: LineItem[]): StackBuilder => {
    // Fixed width columns with larger gap between columns
    const tableGrid = grid([80, 380, 'fill', 360, 360, 360])
      .columnGap(80)
      .rowGap(8)
      .cell('QTY', { bold: true, align: 'center' })
      .cell('SKU', { bold: true })
      .cell('DESCRIPTION', { bold: true })
      .cell('UNIT PRICE', { bold: true })
      .cell('DISCOUNT', { bold: true })
      .cell('TOTAL', { bold: true })
      .headerRow();

    items.forEach(item => {
      tableGrid
        .cell(item.qty.toString(), { align: 'center' })
        .cell(item.sku)
        .cell(item.description)
        .cell(formatCurrency(item.unitPrice))
        .cell(item.discount > 0 ? `-${formatCurrency(item.discount)}` : '')
        .cell(formatCurrency(item.total))
        .row();
    });

    return stack()
      .add(line('=', 'fill'))
      .spacer(10)
      .add(tableGrid)
      .spacer(10)
      .add(line('=', 'fill'));
  };

  const totalsSection = (subtotal: number, discount: number, tax: number, total: number): FlexBuilder => {
    // Wider label column to fit "Tax (8.25%):" and "TOTAL DUE:"
    const labelWidth = 450;
    const valueWidth = 360;
    const totalsGrid = grid([labelWidth, valueWidth])
      .columnGap(40)
      .rowGap(8)
      .cell('Subtotal:').cell(formatCurrency(subtotal)).row()
      .cell('Discount:').cell(`-${formatCurrency(discount)}`).row()
      .cell('Tax (8.25%):').cell(formatCurrency(tax)).row()
      .cell('').cell('').row()
      .cell('TOTAL DUE:', { bold: true }).cell(formatCurrency(total), { bold: true }).row();

    return flex()
      .width('fill')
      .justify('end')
      .add(
        stack()
          .width(labelWidth + 40 + valueWidth)
          .padding({ top: 30 })
          .add(totalsGrid)
      );
  };

  const footer = (): StackBuilder =>
    stack()
      .align('center')
      .padding({ top: 40 })
      .text('Thank you for your business!', { italic: true, doubleWidth: true })
      .spacer(20)
      .text('Questions? Contact us at support@acme.com or call (555) 123-4567', { cpi: 12 });

  // Data - more items for wider table
  const items: LineItem[] = [
    { qty: 5, sku: 'WGT-PRO-X1', description: 'Widget Pro X1 - Premium Model with Extended Warranty', unitPrice: 49.99, discount: 0, total: 249.95 },
    { qty: 10, sku: 'WGT-STD-S2', description: 'Widget Standard S2 - Business Edition', unitPrice: 24.99, discount: 25.00, total: 224.90 },
    { qty: 2, sku: 'WGT-DLX-D3', description: 'Widget Deluxe D3 - Limited Edition with Gold Plating', unitPrice: 99.99, discount: 0, total: 199.98 },
    { qty: 25, sku: 'WGT-MIN-M1', description: 'Widget Mini M1 - Bulk Pack (25 units)', unitPrice: 9.99, discount: 50.00, total: 199.75 },
    { qty: 1, sku: 'SVC-SUP-1Y', description: 'Premium Support Package - 1 Year Coverage', unitPrice: 299.00, discount: 0, total: 299.00 },
    { qty: 3, sku: 'ACC-CBL-USB', description: 'USB-C Cable Premium 2m - Braided', unitPrice: 19.99, discount: 0, total: 59.97 },
  ];

  const subtotal = items.reduce((sum, item) => sum + item.total + item.discount, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const taxableAmount = subtotal - totalDiscount;
  const tax = taxableAmount * 0.0825;
  const total = taxableAmount + tax;

  // Build the invoice
  const invoice = stack()
    .width('fill')
    .padding(60)
    .gap(15)
    .add(companyHeader())
    .spacer(30)
    .add(line('-', 'fill'))
    .add(customerInfo())
    .add(itemsTable(items))
    .add(totalsSection(subtotal, totalDiscount, tax, total))
    .add(footer())
    .build();

  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .setTypeface(TYPEFACE.ROMAN)
    .render(invoice)
    .formFeed();

  const output = engine.getOutput();
  writeFileSync('output/composable_invoice.prn', output);
  console.log(`PRN saved: output/composable_invoice.prn (${output.length} bytes)`);

  const renderer = new VirtualRenderer(CUSTOM_PAPER, { scale: 1 });
  renderer.render(output);
  await renderToPng(renderer, 'output/composable_invoice.png');
}

// Example 5: Multi-Column Report
// Paper: 37.5 x 21.5 cm - wide format for dashboard-style reports
async function previewReport() {
  console.log('\n--- Multi-Column Report Preview ---');

  const engine = new LayoutEngine({ defaultPaper: CUSTOM_PAPER });

  // Stats box with border effect
  const statsBox = (label: string, value: string, change?: string): StackBuilder =>
    stack()
      .align('center')
      .padding(20)
      .text(value, { bold: true, doubleWidth: true, doubleHeight: true })
      .spacer(5)
      .text(label, { bold: true })
      .add(change ? text(change, { cpi: 12 }) : spacer(0));

  // Section with list
  const listSection = (title: string, items: string[]): StackBuilder =>
    stack()
      .gap(8)
      .text(title, { bold: true, underline: true, doubleWidth: true })
      .spacer(10)
      .add(items.reduce((s, item) => s.add(text(item)), stack().gap(5)));

  // Data table section
  const dataTable = (
    title: string,
    headers: string[],
    rows: string[][],
    colWidths: (number | 'fill')[]
  ): StackBuilder => {
    const tableGrid = grid(colWidths).columnGap(60).rowGap(10);

    // Header row
    headers.forEach((h, i) => tableGrid.cell(h, { bold: true, align: i > 1 ? 'right' : 'left' }));
    tableGrid.headerRow();

    // Data rows
    rows.forEach(row => {
      row.forEach((cell, i) => tableGrid.cell(cell, { align: i > 1 ? 'right' : 'left' }));
      tableGrid.row();
    });

    return stack()
      .text(title, { bold: true, underline: true, doubleWidth: true })
      .spacer(15)
      .add(tableGrid);
  };

  const report = stack()
    .width('fill')
    .padding(60)
    .gap(20)
    // Header
    .add(
      flex()
        .width('fill')
        .justify('space-between')
        .add(
          stack()
            .text('QUARTERLY SALES REPORT', { bold: true, doubleWidth: true, doubleHeight: true })
            .text('Q4 2024 - October through December', { bold: true })
        )
        .add(
          stack()
            .align('right')
            .text('ACME Corporation')
            .text('Generated: January 15, 2025')
            .text('Prepared by: Finance Dept.')
        )
    )
    .add(line('=', 'fill'))
    // KPI Stats Row
    .add(
      flex()
        .width('fill')
        .justify('space-around')
        .add(statsBox('Total Revenue', '$1.2M', '+18% vs Q3'))
        .add(statsBox('Units Sold', '45,230', '+12% vs Q3'))
        .add(statsBox('New Customers', '1,847', '+25% vs Q3'))
        .add(statsBox('Avg Order Value', '$412', '+5% vs Q3'))
        .add(statsBox('Growth Rate', '+23%', 'YoY'))
    )
    .add(line('-', 'fill'))
    // Three-column section
    .add(
      flex()
        .width('fill')
        .gap(80)
        .alignItems('top')
        .add(listSection('TOP SALES PERFORMERS', [
          '1. Sarah Johnson    $245,000',
          '2. Mike Chen        $198,500',
          '3. Lisa Park        $187,200',
          '4. James Wilson     $165,800',
          '5. Emma Davis       $142,300',
          '6. Robert Brown     $138,900',
          '7. Maria Garcia     $125,400',
        ]))
        .add(listSection('REGIONAL BREAKDOWN', [
          'North America     45% ($540K)',
          'Europe            28% ($336K)',
          'Asia Pacific      18% ($216K)',
          'Latin America      9% ($108K)',
          '',
          'Top Country: USA (38%)',
          'Fastest Growth: APAC (+45%)',
        ]))
        .add(listSection('KEY METRICS', [
          'Customer Retention:  87%',
          'Lead Conversion:     24%',
          'Avg Sales Cycle:     18 days',
          'Support Tickets:     342',
          'NPS Score:           72',
          '',
          'Target Achievement:  112%',
        ]))
    )
    .add(line('-', 'fill'))
    // Product Performance Table - simplified for clarity
    // 5 columns with generous widths (total ~3000 dots out of ~4895 available)
    .add(
      dataTable(
        'PRODUCT PERFORMANCE BY CATEGORY',
        ['Product', 'SKU', 'Units Sold', 'Revenue', 'Growth'],
        [
          ['Widget Pro X1', 'WGT-PRO-X1', '12,450', '$498,000', '+28%'],
          ['Widget Standard S2', 'WGT-STD-S2', '18,230', '$364,600', '+15%'],
          ['Widget Mini M1', 'WGT-MIN-M1', '14,550', '$145,500', '+22%'],
          ['Widget Deluxe D3', 'WGT-DLX-D3', '3,200', '$192,000', '+35%'],
          ['Accessories Bundle', 'ACC-BDL-01', '8,400', '$84,000', '+42%'],
        ],
        [750, 450, 350, 350, 300]
      )
    )
    .spacer(30)
    .add(line('=', 'fill'))
    // Footer
    .add(
      flex()
        .width('fill')
        .justify('space-between')
        .text('CONFIDENTIAL - Internal Use Only', { bold: true })
        .text('Page 1 of 1')
    )
    .build();

  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .render(report)
    .formFeed();

  const output = engine.getOutput();
  writeFileSync('output/report.prn', output);
  console.log(`PRN saved: output/report.prn (${output.length} bytes)`);

  const renderer = new VirtualRenderer(CUSTOM_PAPER, { scale: 1 });
  renderer.render(output);
  await renderToPng(renderer, 'output/report.png');
}

// Example 6: Complex Form
// Paper: 37.5 x 21.5 cm - wide format for detailed forms
async function previewForm() {
  console.log('\n--- Complex Form Preview ---');

  const engine = new LayoutEngine({ defaultPaper: CUSTOM_PAPER });

  // Form field with underline - wider for 37.5cm paper
  const formField = (label: string, value: string, width?: number): StackBuilder =>
    stack()
      .width(width ?? 'auto')
      .text(label, { bold: true, cpi: 12 })
      .spacer(3)
      .text(value)
      .add(line('_', width ?? 250));

  // Checkbox component
  const checkbox = (label: string, checked: boolean): FlexBuilder =>
    flex().gap(15).text(checked ? '[X]' : '[ ]').text(label);

  // Section header
  const sectionHeader = (num: number, title: string): FlexBuilder =>
    flex()
      .width('fill')
      .gap(20)
      .text(`SECTION ${num}:`, { bold: true, doubleWidth: true })
      .text(title, { bold: true, doubleWidth: true });

  const form = stack()
    .width('fill')
    .padding(60)
    .gap(20)
    // Header
    .add(
      flex()
        .width('fill')
        .justify('space-between')
        .add(
          stack()
            .text('EMPLOYEE APPLICATION FORM', { bold: true, doubleWidth: true, doubleHeight: true })
            .text('Human Resources Department')
        )
        .add(
          stack()
            .align('right')
            .text('Form ID: HR-2024-APP')
            .text('Version: 3.1')
            .text('Date: ____________')
        )
    )
    .add(line('=', 'fill'))
    // Section 1: Personal Information
    // Printable width ~4776 dots after padding (4896 - 60 - 60). Fields sized to fill.
    .add(
      stack()
        .gap(15)
        .add(sectionHeader(1, 'PERSONAL INFORMATION'))
        .add(
          flex()
            .width('fill')
            .gap(60)
            .add(formField('First Name', 'John', 1300))
            .add(formField('Middle Name', 'Robert', 1100))
            .add(formField('Last Name', 'Smith', 1300))
            .add(formField('Suffix', '', 350))
        )
        .add(
          flex()
            .width('fill')
            .gap(60)
            .add(formField('Date of Birth', '01/15/1985', 650))
            .add(formField('SSN', 'XXX-XX-1234', 650))
            .add(formField('Phone (Home)', '(555) 123-4567', 850))
            .add(formField('Phone (Cell)', '(555) 987-6543', 850))
            .add(formField('Email', 'john.smith@email.com', 1100))
        )
    )
    .add(line('-', 'fill'))
    // Section 2: Address Information
    .add(
      stack()
        .gap(15)
        .add(sectionHeader(2, 'ADDRESS INFORMATION'))
        .add(
          flex()
            .width('fill')
            .gap(60)
            .add(formField('Street Address', '123 Main Street, Apt 4B', 2200))
            .add(formField('City', 'New York', 1000))
            .add(formField('State', 'NY', 350))
            .add(formField('ZIP Code', '10001', 550))
        )
        .add(
          flex()
            .width('fill')
            .gap(60)
            .add(formField('Mailing Address (if different)', '', 2200))
            .add(formField('City', '', 1000))
            .add(formField('State', '', 350))
            .add(formField('ZIP Code', '', 550))
        )
    )
    .add(line('-', 'fill'))
    // Section 3: Employment Details
    // 5 checkbox columns spread across ~4776 dots with space-between
    .add(
      stack()
        .gap(15)
        .add(sectionHeader(3, 'EMPLOYMENT PREFERENCES'))
        .add(
          flex()
            .width('fill')
            .justify('space-between')
            .add(
              stack()
                .width(800)
                .gap(8)
                .text('Employment Type:', { bold: true })
                .add(checkbox('Full-time', true))
                .add(checkbox('Part-time', false))
                .add(checkbox('Contract', false))
                .add(checkbox('Temporary', false))
                .add(checkbox('Internship', false))
            )
            .add(
              stack()
                .width(950)
                .gap(8)
                .text('Preferred Shift:', { bold: true })
                .add(checkbox('Day (6AM-2PM)', true))
                .add(checkbox('Swing (2PM-10PM)', false))
                .add(checkbox('Night (10PM-6AM)', false))
                .add(checkbox('Flexible', true))
                .add(checkbox('Weekends OK', true))
            )
            .add(
              stack()
                .width(750)
                .gap(8)
                .text('Contact Method:', { bold: true })
                .add(checkbox('Email', true))
                .add(checkbox('Phone', true))
                .add(checkbox('Text/SMS', false))
                .add(checkbox('Mail', false))
            )
            .add(
              stack()
                .width(850)
                .gap(8)
                .text('Position Applied:', { bold: true })
                .add(checkbox('Entry Level', false))
                .add(checkbox('Associate', false))
                .add(checkbox('Senior', true))
                .add(checkbox('Management', false))
                .add(checkbox('Executive', false))
            )
            .add(
              stack()
                .width(750)
                .gap(8)
                .text('Department:', { bold: true })
                .add(checkbox('Engineering', true))
                .add(checkbox('Sales', false))
                .add(checkbox('Marketing', false))
                .add(checkbox('Operations', false))
                .add(checkbox('Finance', false))
            )
        )
    )
    .add(line('-', 'fill'))
    // Section 4: Emergency Contact - spread across full width
    .add(
      stack()
        .gap(15)
        .add(sectionHeader(4, 'EMERGENCY CONTACT'))
        .add(
          flex()
            .width('fill')
            .gap(80)
            .add(formField('Contact Name', 'Jane Smith', 1100))
            .add(formField('Relationship', 'Spouse', 800))
            .add(formField('Phone (Primary)', '(555) 111-2222', 1000))
            .add(formField('Phone (Alternate)', '(555) 333-4444', 1000))
        )
    )
    .add(line('-', 'fill'))
    // Signature Section - spread across full width
    .add(
      flex()
        .width('fill')
        .justify('space-between')
        .padding({ top: 30 })
        .add(
          stack()
            .spacer(40)
            .add(line('_', 1000))
            .text('Applicant Signature', { cpi: 12 })
        )
        .add(
          stack()
            .spacer(40)
            .add(line('_', 450))
            .text('Date', { cpi: 12 })
        )
        .add(
          stack()
            .spacer(40)
            .add(line('_', 1000))
            .text('HR Representative Signature', { cpi: 12 })
        )
        .add(
          stack()
            .spacer(40)
            .add(line('_', 450))
            .text('Date', { cpi: 12 })
        )
    )
    .add(line('=', 'fill'))
    // Office Use Only - centered with fields spread
    .add(
      stack()
        .width('fill')
        .align('center')
        .text('FOR OFFICE USE ONLY', { bold: true })
        .spacer(10)
        .add(
          flex()
            .width('fill')
            .justify('space-around')
            .text('Received: ____________')
            .text('Reviewed: ____________')
            .text('Interview: ____________')
            .text('Decision: ____________')
            .text('Start Date: ____________')
        )
    )
    .build();

  engine
    .initialize()
    .setQuality(PRINT_QUALITY.LQ)
    .render(form)
    .formFeed();

  const output = engine.getOutput();
  writeFileSync('output/form.prn', output);
  console.log(`PRN saved: output/form.prn (${output.length} bytes)`);

  const renderer = new VirtualRenderer(CUSTOM_PAPER, { scale: 1 });
  renderer.render(output);
  await renderToPng(renderer, 'output/form.png');
}

// Run all previews
async function main() {
  console.log('ESC/P2 Preview Generator');
  console.log('========================');

  try {
    await previewInvoice();
    await previewGraphics();
    await previewFontStyles();
    await previewComposableInvoice();
    await previewReport();
    await previewForm();

    console.log('\n========================');
    console.log('All previews generated successfully!');
    console.log('Check the output/ directory for PNG files.');
  } catch (error) {
    console.error('Error generating preview:', error);
    process.exit(1);
  }
}

main();
