/**
 * Example 20: Line Spacing
 *
 * Demonstrates different line spacing options:
 * - 1/6 inch (default, 6 LPI)
 * - 1/8 inch (8 LPI, more compact)
 * - Custom spacing with n/180 inch precision
 * - Custom spacing with n/360 inch precision (ESC/P2)
 *
 * Run: npx tsx examples/20-line-spacing.ts
 */

import { LayoutEngine, PRINT_QUALITY, stack, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Line Spacing Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  engine.setQuality(PRINT_QUALITY.LQ);

  const layout = stack()
    .gap(15)
    .padding(40)

    // Title
    .text('LINE SPACING OPTIONS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Line spacing controls the vertical distance between lines of text.')
    .text('Different spacing options allow for compact or expanded layouts.')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  // 1/6 inch spacing (default)
  engine.newLine();
  engine.setBold(true).println('1/6 INCH SPACING (Default - 6 LPI)').setBold(false);
  engine.setLineSpacing1_6();
  engine.println('Line 1: This is the default line spacing.');
  engine.println('Line 2: Standard for most documents.');
  engine.println('Line 3: Good readability and density.');
  engine.println('Line 4: 6 lines per inch vertical.');
  engine.println('Line 5: Used for general printing.');
  engine.newLine();

  // 1/8 inch spacing (compact)
  engine.println('----------------------------------------');
  engine.setBold(true).println('1/8 INCH SPACING (Compact - 8 LPI)').setBold(false);
  engine.setLineSpacing1_8();
  engine.println('Line 1: More compact line spacing.');
  engine.println('Line 2: Fits more content per page.');
  engine.println('Line 3: Good for listings and tables.');
  engine.println('Line 4: 8 lines per inch vertical.');
  engine.println('Line 5: Saves paper on long documents.');
  engine.println('Line 6: Still readable at this density.');
  engine.println('Line 7: Extra line to show density.');
  engine.println('Line 8: One inch of text here.');
  engine.newLine();

  // Custom n/180 spacing (tight)
  engine.setLineSpacing1_6(); // Reset first
  engine.println('----------------------------------------');
  engine.setBold(true).println('CUSTOM: 15/180 INCH (Very Tight)').setBold(false);
  engine.setLineSpacingN180(15); // 15/180 = 1/12 inch = 12 LPI
  engine.println('Line 1: Very tight line spacing.');
  engine.println('Line 2: Maximum density printing.');
  engine.println('Line 3: 12 lines per inch.');
  engine.println('Line 4: Use for condensed reports.');
  engine.println('Line 5: May reduce readability.');
  engine.println('Line 6: Good for raw data output.');
  engine.newLine();

  // Custom n/180 spacing (expanded)
  engine.setLineSpacing1_6(); // Reset first
  engine.println('----------------------------------------');
  engine.setBold(true).println('CUSTOM: 45/180 INCH (Expanded)').setBold(false);
  engine.setLineSpacingN180(45); // 45/180 = 1/4 inch = 4 LPI
  engine.println('Line 1: Expanded line spacing.');
  engine.println('Line 2: More whitespace between lines.');
  engine.println('Line 3: Good for titles and headers.');
  engine.println('Line 4: Easy to read and annotate.');
  engine.newLine();

  // n/360 inch precision (ESC/P2)
  engine.setLineSpacing1_6(); // Reset first
  engine.println('----------------------------------------');
  engine.setBold(true).println('ESC/P2: n/360 INCH PRECISION').setBold(false);
  engine.println('');

  // Demonstrate various n/360 values
  const spacings = [30, 45, 60, 90, 120];
  for (const n of spacings) {
    engine.setLineSpacingN360(n);
    const lpi = (360 / n).toFixed(1);
    engine.println(`${n}/360 inch = ${lpi} LPI: Sample text line`);
  }
  engine.newLine();

  // Reset to default and show practical use
  engine.setLineSpacing1_6();
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL APPLICATIONS').setBold(false);
  engine.println('');
  engine.println('1/6" (6 LPI): General documents, letters');
  engine.println('1/8" (8 LPI): Listings, reports, tables');
  engine.println('Custom tight: Data dumps, logs');
  engine.println('Custom wide: Titles, forms with fill lines');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Line Spacing Demo', '20-line-spacing');
}

main().catch(console.error);
