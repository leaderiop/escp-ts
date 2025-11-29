/**
 * Example 23: Horizontal and Vertical Tabs
 *
 * Demonstrates tab stop functionality:
 * - Setting horizontal tab stops
 * - Setting vertical tab stops
 * - Using tabs for column alignment
 * - Tab-based form layouts
 *
 * Run: npx tsx examples/23-tabs.ts
 */

import { LayoutEngine, PRINT_QUALITY, stack, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Tabs Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();
  engine.setQuality(PRINT_QUALITY.LQ);

  const layout = stack()
    .gap(15)
    .padding(40)

    // Title
    .text('HORIZONTAL & VERTICAL TABS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Tabs provide quick column alignment without calculating positions.')
    .text('Set tab stops once, then use tab characters to jump between columns.')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  // Basic Horizontal Tabs
  engine.newLine();
  engine.setBold(true).println('HORIZONTAL TABS - BASIC').setBold(false);
  engine.println('Tab stops at columns: 10, 25, 40, 55, 70');
  engine.println('');

  // Set tab stops (in column positions at current CPI)
  engine.setHorizontalTabs([10, 25, 40, 55, 70]);

  // Use tabs to create aligned columns
  engine.print('Col 1');
  engine.tab();
  engine.print('Col 2');
  engine.tab();
  engine.print('Col 3');
  engine.tab();
  engine.print('Col 4');
  engine.tab();
  engine.println('Col 5');

  engine.print('Data A');
  engine.tab();
  engine.print('Data B');
  engine.tab();
  engine.print('Data C');
  engine.tab();
  engine.print('Data D');
  engine.tab();
  engine.println('Data E');

  engine.print('12345');
  engine.tab();
  engine.print('67890');
  engine.tab();
  engine.print('ABCDE');
  engine.tab();
  engine.print('FGHIJ');
  engine.tab();
  engine.println('KLMNO');

  engine.newLine();

  // Invoice-style tabs
  engine.println('----------------------------------------');
  engine.setBold(true).println('HORIZONTAL TABS - INVOICE LAYOUT').setBold(false);
  engine.println('Tab stops at columns: 5, 45, 60, 75');
  engine.println('');

  engine.setHorizontalTabs([5, 45, 60, 75]);

  // Header row
  engine.tab();
  engine.setBold(true);
  engine.print('Description');
  engine.tab();
  engine.print('Qty');
  engine.tab();
  engine.print('Price');
  engine.tab();
  engine.println('Total');
  engine.setBold(false);

  engine.println('  --------------------------------------------');

  // Data rows
  const items = [
    { desc: 'Widget Pro X1', qty: 5, price: 49.99, total: 249.95 },
    { desc: 'Widget Standard', qty: 10, price: 24.99, total: 249.90 },
    { desc: 'Widget Mini', qty: 25, price: 9.99, total: 249.75 },
    { desc: 'Support Package', qty: 1, price: 299.00, total: 299.00 },
  ];

  for (const item of items) {
    engine.tab();
    engine.print(item.desc);
    engine.tab();
    engine.print(item.qty.toString());
    engine.tab();
    engine.print(`$${item.price.toFixed(2)}`);
    engine.tab();
    engine.println(`$${item.total.toFixed(2)}`);
  }

  engine.println('  --------------------------------------------');
  engine.tab();
  engine.tab();
  engine.tab();
  engine.setBold(true);
  engine.print('TOTAL:');
  engine.tab();
  engine.println('$1,048.60');
  engine.setBold(false);

  engine.newLine();

  // Form-style tabs
  engine.println('----------------------------------------');
  engine.setBold(true).println('HORIZONTAL TABS - FORM LAYOUT').setBold(false);
  engine.println('Tab stops for labels and values');
  engine.println('');

  engine.setHorizontalTabs([3, 20, 50, 67]);

  engine.tab();
  engine.print('Name:');
  engine.tab();
  engine.print('John Smith');
  engine.tab();
  engine.print('Date:');
  engine.tab();
  engine.println('2024-01-15');

  engine.tab();
  engine.print('Address:');
  engine.tab();
  engine.print('123 Main Street');
  engine.tab();
  engine.print('Phone:');
  engine.tab();
  engine.println('555-1234');

  engine.tab();
  engine.print('City:');
  engine.tab();
  engine.print('New York, NY 10001');
  engine.tab();
  engine.print('Email:');
  engine.tab();
  engine.println('john@example.com');

  engine.newLine();

  // Different CPI with tabs
  engine.println('----------------------------------------');
  engine.setBold(true).println('TABS WITH DIFFERENT CPI').setBold(false);
  engine.println('');

  engine.setHorizontalTabs([10, 30, 50]);

  engine.setCpi(10);
  engine.print('10 CPI:');
  engine.tab();
  engine.print('Column 2');
  engine.tab();
  engine.println('Column 3');

  engine.setCpi(12);
  engine.print('12 CPI:');
  engine.tab();
  engine.print('Column 2');
  engine.tab();
  engine.println('Column 3');

  engine.setCpi(15);
  engine.print('15 CPI:');
  engine.tab();
  engine.print('Column 2');
  engine.tab();
  engine.println('Column 3');

  engine.setCpi(10); // Reset

  engine.newLine();
  engine.println('----------------------------------------');
  engine.setBold(true).println('NOTE').setBold(false);
  engine.println('Tab stops are in character columns at current CPI.');
  engine.println('For pixel-precise alignment, use the layout system.');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Tabs Demo', '23-tabs');
}

main().catch(console.error);
