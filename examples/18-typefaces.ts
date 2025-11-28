/**
 * Example 18: Typefaces
 *
 * Demonstrates different typeface options available on ESC/P2 printers:
 * - Roman (default)
 * - Sans Serif
 * - Courier
 * - Prestige
 * - Script
 * - OCR-B
 * - Orator
 * - Orator-S
 * - Script-C
 * - Roman-T
 * - Sans Serif-H
 *
 * Run: npx tsx examples/18-typefaces.ts
 */

import { LayoutEngine, TYPEFACE, PRINT_QUALITY, stack, flex, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Typefaces Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();
  engine.setQuality(PRINT_QUALITY.LQ); // LQ mode for best typeface rendering

  // Sample text for each typeface
  const sampleText = 'The quick brown fox jumps over the lazy dog. 0123456789';

  const layout = stack()
    .gap(15)
    .padding(40)

    // Title
    .text('TYPEFACE SHOWCASE', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Introduction
    .text('ESC/P2 printers support multiple typefaces. Each has unique characteristics.')
    .text('All samples shown in Letter Quality (LQ) mode at 10 CPI.')
    .spacer(20)
    .line('-', 'fill')
    .spacer(10)
    .build();

  engine.render(layout);

  // Demonstrate each typeface
  const typefaces: Array<{ name: string; value: number }> = [
    { name: 'Roman (Default)', value: TYPEFACE.ROMAN },
    { name: 'Sans Serif', value: TYPEFACE.SANS_SERIF },
    { name: 'Courier', value: TYPEFACE.COURIER },
    { name: 'Prestige', value: TYPEFACE.PRESTIGE },
    { name: 'Script', value: TYPEFACE.SCRIPT },
    { name: 'OCR-B', value: TYPEFACE.OCR_B },
    { name: 'Orator', value: TYPEFACE.ORATOR },
    { name: 'Orator-S', value: TYPEFACE.ORATOR_S },
    { name: 'Script-C', value: TYPEFACE.SCRIPT_C },
    { name: 'Roman-T', value: TYPEFACE.ROMAN_T },
    { name: 'Sans Serif-H', value: TYPEFACE.SANS_SERIF_H },
  ];

  for (const tf of typefaces) {
    engine
      .setBold(true)
      .println(`${tf.name}:`)
      .setBold(false)
      .setTypeface(tf.value)
      .println(sampleText)
      .setTypeface(TYPEFACE.ROMAN) // Reset to default
      .newLine();
  }

  // Typeface comparison section
  engine.newLine();
  engine.setBold(true).println('TYPEFACE COMPARISON - Same Text, Different Styles').setBold(false);
  engine.println('');

  const comparisonText = 'INVOICE #12345';

  for (const tf of typefaces.slice(0, 6)) { // First 6 typefaces
    engine
      .setTypeface(tf.value)
      .print(`${tf.name.padEnd(20)}: `)
      .setBold(true)
      .println(comparisonText)
      .setBold(false);
  }

  engine.setTypeface(TYPEFACE.ROMAN); // Reset
  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Typefaces Demo', '18-typefaces');
}

main().catch(console.error);
