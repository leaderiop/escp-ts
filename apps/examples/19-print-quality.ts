/**
 * Example 19: Print Quality
 *
 * Demonstrates Draft vs Letter Quality (LQ) print modes:
 * - Draft mode: Faster printing, lower quality
 * - LQ mode: Slower printing, higher quality
 *
 * Run: npx tsx examples/19-print-quality.ts
 */

import { LayoutEngine, PRINT_QUALITY, TYPEFACE, stack, flex, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Print Quality Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const sampleText = 'The quick brown fox jumps over the lazy dog. 0123456789';
  const sampleNumbers = 'Amount: $1,234.56 | Qty: 100 | Total: $123,456.00';

  const layout = stack()
    .gap(15)
    .padding(40)

    // Title
    .text('PRINT QUALITY COMPARISON', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('ESC/P2 printers support two print quality modes:')
    .spacer(10)
    .add(
      stack()
        .padding({ left: 40 })
        .text('DRAFT: Fast printing (~584 CPS), lower quality')
        .text('LQ:    Slower printing (~121 CPS), higher quality')
    )
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  // Draft Mode Section
  engine.newLine();
  engine.setQuality(PRINT_QUALITY.DRAFT);
  engine.setBold(true).println('DRAFT MODE').setBold(false);
  engine.println('Speed: ~584 characters per second');
  engine.println('');
  engine.println(sampleText);
  engine.setBold(true).println(sampleText).setBold(false);
  engine.setItalic(true).println(sampleText).setItalic(false);
  engine.println(sampleNumbers);
  engine.newLine();

  // LQ Mode Section
  engine.println('----------------------------------------');
  engine.newLine();
  engine.setQuality(PRINT_QUALITY.LQ);
  engine.setBold(true).println('LETTER QUALITY (LQ) MODE').setBold(false);
  engine.println('Speed: ~121 characters per second');
  engine.println('');
  engine.println(sampleText);
  engine.setBold(true).println(sampleText).setBold(false);
  engine.setItalic(true).println(sampleText).setItalic(false);
  engine.println(sampleNumbers);
  engine.newLine();

  // Side-by-side comparison with different typefaces
  engine.println('----------------------------------------');
  engine.newLine();
  engine.setBold(true).println('TYPEFACE COMPARISON IN BOTH MODES').setBold(false);
  engine.println('');

  const typefaces = [
    { name: 'Roman', value: TYPEFACE.ROMAN },
    { name: 'Sans Serif', value: TYPEFACE.SANS_SERIF },
    { name: 'Courier', value: TYPEFACE.COURIER },
  ];

  for (const tf of typefaces) {
    engine.setTypeface(tf.value);

    engine.setQuality(PRINT_QUALITY.DRAFT);
    engine.println(`${tf.name} (Draft): ${sampleText.substring(0, 40)}`);

    engine.setQuality(PRINT_QUALITY.LQ);
    engine.println(`${tf.name} (LQ):    ${sampleText.substring(0, 40)}`);
    engine.println('');
  }

  engine.setTypeface(TYPEFACE.ROMAN);
  engine.newLine();

  // Practical use case
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL USE CASES').setBold(false);
  engine.println('');
  engine.println('Use DRAFT for:');
  engine.println('  - Internal documents');
  engine.println('  - Proof copies');
  engine.println('  - High-volume printing');
  engine.println('');
  engine.println('Use LQ for:');
  engine.println('  - Customer-facing documents');
  engine.println('  - Invoices and receipts');
  engine.println('  - Professional correspondence');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Print Quality Demo', '19-print-quality');
}

main().catch(console.error);
