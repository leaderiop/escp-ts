/**
 * Example 26: Inter-Character Spacing
 *
 * Demonstrates control over spacing between characters:
 * - Default spacing (0 extra dots)
 * - Expanded spacing for headings
 * - Tight spacing for compact text
 * - Typography effects
 *
 * Run: npx tsx examples/26-inter-character-spacing.ts
 */

import { LayoutEngine, PRINT_QUALITY, stack, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

async function main() {
  printSection('Inter-Character Spacing Demo');

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
    .text('INTER-CHARACTER SPACING', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Inter-character spacing adds extra dots between each character.')
    .text('Use it for letter-spacing effects common in typography.')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  const sampleText = 'LETTER SPACING';
  const sampleLower = 'letter spacing example';

  // Spacing comparison
  engine.newLine();
  engine.setBold(true).println('SPACING COMPARISON').setBold(false);
  engine.println('');

  const spacings = [0, 2, 4, 6, 8, 12, 16, 24];

  for (const spacing of spacings) {
    engine.setInterCharSpace(spacing);
    engine.println(`${spacing.toString().padStart(2)} dots: ${sampleText}`);
  }

  engine.setInterCharSpace(0); // Reset
  engine.newLine();

  // Effect on lowercase
  engine.println('----------------------------------------');
  engine.setBold(true).println('EFFECT ON LOWERCASE TEXT').setBold(false);
  engine.println('');

  for (const spacing of [0, 4, 8, 12]) {
    engine.setInterCharSpace(spacing);
    engine.println(`${spacing.toString().padStart(2)} dots: ${sampleLower}`);
  }

  engine.setInterCharSpace(0); // Reset
  engine.newLine();

  // Typography effects
  engine.println('----------------------------------------');
  engine.setBold(true).println('TYPOGRAPHY EFFECTS').setBold(false);
  engine.println('');

  // Tight tracking
  engine.setInterCharSpace(0);
  engine.println('Tight (0):  Dense text for compact layouts');

  // Normal
  engine.setInterCharSpace(2);
  engine.println('Normal (2): Standard readable spacing');

  // Loose
  engine.setInterCharSpace(6);
  engine.println('Loose (6):  Airy, open text feel');

  // Very loose (display)
  engine.setInterCharSpace(12);
  engine.println('Display (12): Headlines and titles');

  // Ultra-wide
  engine.setInterCharSpace(20);
  engine.println('Wide (20): Special effects');

  engine.setInterCharSpace(0); // Reset
  engine.newLine();

  // Combined with styles
  engine.println('----------------------------------------');
  engine.setBold(true).println('COMBINED WITH STYLES').setBold(false);
  engine.println('');

  const headline = 'BREAKING NEWS';

  // Normal
  engine.println('Normal spacing:');
  engine.setInterCharSpace(0);
  engine.setBold(true);
  engine.println('  ' + headline);
  engine.setBold(false);

  // Expanded
  engine.println('Expanded (8 dots):');
  engine.setInterCharSpace(8);
  engine.setBold(true);
  engine.println('  ' + headline);
  engine.setBold(false);

  // With underline
  engine.println('Expanded + Underline:');
  engine.setInterCharSpace(8);
  engine.setBold(true);
  engine.setUnderline(true);
  engine.println('  ' + headline);
  engine.setUnderline(false);
  engine.setBold(false);

  engine.setInterCharSpace(0); // Reset
  engine.newLine();

  // Practical examples
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL EXAMPLES').setBold(false);
  engine.println('');

  // Logo-style text
  engine.setInterCharSpace(16);
  engine.setBold(true);
  engine.setDoubleWidth(true);
  engine.println('ACME CORP');
  engine.setDoubleWidth(false);
  engine.setBold(false);

  engine.setInterCharSpace(4);
  engine.println('Premium Quality Products');

  engine.setInterCharSpace(0);
  engine.println('');

  // Menu header
  engine.setInterCharSpace(10);
  engine.setBold(true);
  engine.println('DINNER MENU');
  engine.setBold(false);

  engine.setInterCharSpace(0);
  engine.println('Appetizers - Entrees - Desserts');

  engine.newLine();

  // Form section header
  engine.setInterCharSpace(6);
  engine.setBold(true);
  engine.println('PERSONAL INFORMATION');
  engine.setBold(false);
  engine.setInterCharSpace(0);
  engine.println('Please fill in all required fields.');

  engine.newLine();
  engine.println('----------------------------------------');
  engine.setBold(true).println('NOTE').setBold(false);
  engine.println('Inter-character spacing is in 1/360 inch units.');
  engine.println('Higher values = more space between characters.');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Inter-Character Spacing Demo', '26-inter-character-spacing');
}

main().catch(console.error);
