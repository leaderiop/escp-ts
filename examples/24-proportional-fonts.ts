/**
 * Example 24: Proportional Fonts
 *
 * Demonstrates proportional vs fixed-width printing:
 * - Fixed-width: All characters same width (monospace)
 * - Proportional: Characters have natural widths (like typography)
 *
 * Run: npx tsx examples/24-proportional-fonts.ts
 */

import { LayoutEngine, PRINT_QUALITY, TYPEFACE, stack, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Proportional Fonts Demo');

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
    .text('PROPORTIONAL vs FIXED-WIDTH FONTS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Fixed-width (monospace): Every character occupies the same width.')
    .text('Proportional: Characters have natural widths (i is narrower than W).')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  const sampleText = 'The quick brown fox jumps over the lazy dog.';
  const narrowChars = 'iiiiiiiiii llllllllll ..........';
  const wideChars = 'WWWWWWWWWW MMMMMMMMMM @@@@@@@@@@';
  const mixedText = 'William ill. Minimum Wow!';

  // Fixed-width examples
  engine.newLine();
  engine.setBold(true).println('FIXED-WIDTH (MONOSPACE)').setBold(false);
  engine.setProportional(false);
  engine.println('Each character takes the same horizontal space.');
  engine.println('');
  engine.println(sampleText);
  engine.println(narrowChars);
  engine.println(wideChars);
  engine.println(mixedText);
  engine.newLine();

  // Show character alignment
  engine.println('Character alignment (fixed):');
  engine.println('12345678901234567890');
  engine.println('iiiiiiiiiiiiiiiiiiii');
  engine.println('WWWWWWWWWWWWWWWWWWWW');
  engine.println('||||||||||||||||||||');

  engine.newLine();

  // Proportional examples
  engine.println('----------------------------------------');
  engine.setBold(true).println('PROPORTIONAL SPACING').setBold(false);
  engine.setProportional(true);
  engine.println('Characters have natural, varying widths.');
  engine.println('');
  engine.println(sampleText);
  engine.println(narrowChars);
  engine.println(wideChars);
  engine.println(mixedText);
  engine.newLine();

  // Show character alignment
  engine.println('Character alignment (proportional):');
  engine.println('12345678901234567890');
  engine.println('iiiiiiiiiiiiiiiiiiii');
  engine.println('WWWWWWWWWWWWWWWWWWWW');
  engine.println('||||||||||||||||||||');

  engine.setProportional(false); // Reset
  engine.newLine();

  // Side-by-side comparison
  engine.println('----------------------------------------');
  engine.setBold(true).println('SIDE-BY-SIDE COMPARISON').setBold(false);
  engine.println('');

  const comparisonLines = [
    'Illinois minimum',
    'William Williams',
    'WWW.EXAMPLE.COM',
    '$1,234.56 total',
  ];

  for (const line of comparisonLines) {
    engine.setProportional(false);
    engine.print('Fixed: ' + line.padEnd(25));
    engine.setProportional(true);
    engine.println('Prop: ' + line);
  }

  engine.setProportional(false);
  engine.newLine();

  // Proportional with different typefaces
  engine.println('----------------------------------------');
  engine.setBold(true).println('PROPORTIONAL WITH TYPEFACES').setBold(false);
  engine.println('');

  const typefaces = [
    { name: 'Roman', value: TYPEFACE.ROMAN },
    { name: 'Sans Serif', value: TYPEFACE.SANS_SERIF },
    { name: 'Prestige', value: TYPEFACE.PRESTIGE },
  ];

  for (const tf of typefaces) {
    engine.setTypeface(tf.value);

    engine.setProportional(false);
    engine.println(`${tf.name} Fixed:       ${sampleText.substring(0, 30)}`);

    engine.setProportional(true);
    engine.println(`${tf.name} Proportional: ${sampleText.substring(0, 30)}`);
    engine.println('');
  }

  engine.setTypeface(TYPEFACE.ROMAN);
  engine.setProportional(false);

  // Practical applications
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL APPLICATIONS').setBold(false);
  engine.println('');
  engine.println('Use FIXED-WIDTH for:');
  engine.println('  - Code listings');
  engine.println('  - Tables and columns');
  engine.println('  - ASCII art');
  engine.println('  - Forms with fill-in blanks');
  engine.println('');
  engine.println('Use PROPORTIONAL for:');
  engine.println('  - Body text and paragraphs');
  engine.println('  - Professional documents');
  engine.println('  - Marketing materials');
  engine.println('  - More natural appearance');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Proportional Fonts Demo', '24-proportional-fonts');
}

main().catch(console.error);
