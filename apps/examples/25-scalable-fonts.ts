/**
 * Example 25: Scalable Fonts (ESC/P2)
 *
 * Demonstrates scalable font capabilities:
 * - Variable point sizes (8pt to 32pt)
 * - Pitch control (characters per inch)
 * - Combining with other font features
 *
 * Note: Scalable fonts are an ESC/P2 feature.
 *
 * Run: npx tsx examples/25-scalable-fonts.ts
 */

import { LayoutEngine, PRINT_QUALITY, TYPEFACE, stack, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Scalable Fonts Demo');

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
    .text('SCALABLE FONTS (ESC/P2)', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('ESC/P2 supports scalable fonts with variable point sizes.')
    .text('Point size controls character height, pitch controls width.')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  const sampleText = 'Scalable Font Sample';

  // Point size demonstration
  engine.newLine();
  engine.setBold(true).println('POINT SIZE VARIATIONS').setBold(false);
  engine.println('Same pitch (10.5 CPI), different point sizes:');
  engine.println('');

  const pointSizes = [8, 10, 12, 14, 16, 20, 24];

  for (const pts of pointSizes) {
    engine.setScalableFont(pts, 10.5);
    engine.println(`${pts}pt: ${sampleText}`);
  }

  engine.setCpi(10); // Reset to standard
  engine.newLine();

  // Pitch demonstration
  engine.println('----------------------------------------');
  engine.setBold(true).println('PITCH VARIATIONS').setBold(false);
  engine.println('Same point size (12pt), different pitches:');
  engine.println('');

  const pitches = [5, 7.5, 10, 12, 15, 17, 20];

  for (const pitch of pitches) {
    engine.setScalableFont(12, pitch);
    engine.println(`${pitch.toString().padEnd(4)} CPI: ${sampleText}`);
  }

  engine.setCpi(10); // Reset
  engine.newLine();

  // Combined variations
  engine.println('----------------------------------------');
  engine.setBold(true).println('POINT SIZE + PITCH COMBINATIONS').setBold(false);
  engine.println('');

  const combinations = [
    { pts: 8, pitch: 15, desc: 'Small, condensed' },
    { pts: 10, pitch: 12, desc: 'Standard' },
    { pts: 12, pitch: 10, desc: 'Medium, normal' },
    { pts: 14, pitch: 8, desc: 'Large, expanded' },
    { pts: 16, pitch: 6, desc: 'Extra large' },
  ];

  for (const combo of combinations) {
    engine.setScalableFont(combo.pts, combo.pitch);
    engine.println(`${combo.pts}pt @ ${combo.pitch}CPI: ${combo.desc}`);
  }

  engine.setCpi(10); // Reset
  engine.newLine();

  // With different typefaces
  engine.println('----------------------------------------');
  engine.setBold(true).println('SCALABLE FONTS WITH TYPEFACES').setBold(false);
  engine.println('');

  const typefaces = [
    { name: 'Roman', value: TYPEFACE.ROMAN },
    { name: 'Sans Serif', value: TYPEFACE.SANS_SERIF },
    { name: 'Courier', value: TYPEFACE.COURIER },
  ];

  for (const tf of typefaces) {
    engine.setTypeface(tf.value);
    engine.setScalableFont(14, 10);
    engine.println(`${tf.name}: ${sampleText}`);
  }

  engine.setTypeface(TYPEFACE.ROMAN);
  engine.setCpi(10); // Reset
  engine.newLine();

  // With styles
  engine.println('----------------------------------------');
  engine.setBold(true).println('SCALABLE FONTS WITH STYLES').setBold(false);
  engine.println('');

  engine.setScalableFont(14, 10);

  engine.println('Normal: ' + sampleText);

  engine.setBold(true);
  engine.println('Bold: ' + sampleText);
  engine.setBold(false);

  engine.setItalic(true);
  engine.println('Italic: ' + sampleText);
  engine.setItalic(false);

  engine.setBold(true);
  engine.setItalic(true);
  engine.println('Bold Italic: ' + sampleText);
  engine.setBold(false);
  engine.setItalic(false);

  engine.setCpi(10); // Reset
  engine.newLine();

  // Practical use cases
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL USE CASES').setBold(false);
  engine.println('');

  // Headlines
  engine.setScalableFont(20, 8);
  engine.setBold(true);
  engine.println('COMPANY NEWS');
  engine.setBold(false);

  // Subheading
  engine.setScalableFont(14, 10);
  engine.setBold(true);
  engine.println('Quarterly Report Summary');
  engine.setBold(false);

  // Body text
  engine.setScalableFont(10, 12);
  engine.println('This is body text at a comfortable reading size.');
  engine.println('Scalable fonts allow precise typography control.');

  // Fine print
  engine.setScalableFont(8, 15);
  engine.println('Fine print: Terms and conditions may apply. See store for details.');

  engine.setCpi(10); // Reset

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Scalable Fonts Demo', '25-scalable-fonts');
}

main().catch(console.error);
