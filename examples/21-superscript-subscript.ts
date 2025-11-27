/**
 * Example 21: Superscript and Subscript
 *
 * Demonstrates superscript and subscript text:
 * - Superscript: Raised text (exponents, ordinals)
 * - Subscript: Lowered text (chemical formulas, footnotes)
 *
 * Run: npx tsx examples/21-superscript-subscript.ts
 */

import { LayoutEngine, PRINT_QUALITY, stack, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Superscript & Subscript Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  engine.setQuality(PRINT_QUALITY.LQ);

  const layout = stack()
    .gap(15)
    .padding(40)

    // Title
    .text('SUPERSCRIPT & SUBSCRIPT', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Superscript raises text above the baseline (for exponents, ordinals).')
    .text('Subscript lowers text below the baseline (for chemical formulas, indices).')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  // Superscript Examples
  engine.newLine();
  engine.setBold(true).println('SUPERSCRIPT EXAMPLES').setBold(false);
  engine.println('');

  // Mathematical exponents
  engine.print('Mathematical: x');
  engine.setSuperscript(true).print('2').setSuperscript(false);
  engine.print(' + y');
  engine.setSuperscript(true).print('2').setSuperscript(false);
  engine.print(' = z');
  engine.setSuperscript(true).print('2').setSuperscript(false);
  engine.println('');

  engine.print('Powers: 2');
  engine.setSuperscript(true).print('10').setSuperscript(false);
  engine.print(' = 1024, 10');
  engine.setSuperscript(true).print('6').setSuperscript(false);
  engine.println(' = 1,000,000');

  // Ordinals
  engine.print('Ordinals: 1');
  engine.setSuperscript(true).print('st').setSuperscript(false);
  engine.print(', 2');
  engine.setSuperscript(true).print('nd').setSuperscript(false);
  engine.print(', 3');
  engine.setSuperscript(true).print('rd').setSuperscript(false);
  engine.print(', 4');
  engine.setSuperscript(true).print('th').setSuperscript(false);
  engine.println('');

  // Footnote references
  engine.print('Footnotes: See reference');
  engine.setSuperscript(true).print('[1]').setSuperscript(false);
  engine.print(' and citation');
  engine.setSuperscript(true).print('[2]').setSuperscript(false);
  engine.println('');

  // Trademark symbols
  engine.print('Trademarks: Brand');
  engine.setSuperscript(true).print('TM').setSuperscript(false);
  engine.print(', Product');
  engine.setSuperscript(true).print('(R)').setSuperscript(false);
  engine.println('');

  engine.newLine();

  // Subscript Examples
  engine.println('----------------------------------------');
  engine.setBold(true).println('SUBSCRIPT EXAMPLES').setBold(false);
  engine.println('');

  // Chemical formulas
  engine.print('Water: H');
  engine.setSubscript(true).print('2').setSubscript(false);
  engine.println('O');

  engine.print('Carbon Dioxide: CO');
  engine.setSubscript(true).print('2').setSubscript(false);
  engine.println('');

  engine.print('Sulfuric Acid: H');
  engine.setSubscript(true).print('2').setSubscript(false);
  engine.print('SO');
  engine.setSubscript(true).print('4').setSubscript(false);
  engine.println('');

  engine.print('Glucose: C');
  engine.setSubscript(true).print('6').setSubscript(false);
  engine.print('H');
  engine.setSubscript(true).print('12').setSubscript(false);
  engine.print('O');
  engine.setSubscript(true).print('6').setSubscript(false);
  engine.println('');

  // Array indices
  engine.print('Array indices: a');
  engine.setSubscript(true).print('0').setSubscript(false);
  engine.print(', a');
  engine.setSubscript(true).print('1').setSubscript(false);
  engine.print(', a');
  engine.setSubscript(true).print('2').setSubscript(false);
  engine.print(', ... a');
  engine.setSubscript(true).print('n').setSubscript(false);
  engine.println('');

  // Mathematical sequences
  engine.print('Sequences: x');
  engine.setSubscript(true).print('i').setSubscript(false);
  engine.print(' + x');
  engine.setSubscript(true).print('i+1').setSubscript(false);
  engine.print(' = x');
  engine.setSubscript(true).print('i+2').setSubscript(false);
  engine.println('');

  engine.newLine();

  // Combined Examples
  engine.println('----------------------------------------');
  engine.setBold(true).println('COMBINED SUPER/SUBSCRIPT').setBold(false);
  engine.println('');

  // Einstein's equation
  engine.print('Energy: E = mc');
  engine.setSuperscript(true).print('2').setSuperscript(false);
  engine.println('');

  // Isotope notation
  engine.setSuperscript(true).print('14').setSuperscript(false);
  engine.print('C');
  engine.setSubscript(true).print('6').setSubscript(false);
  engine.println(' (Carbon-14 isotope notation)');

  // Complex formula
  engine.print('Quadratic: x = (-b +/- sqrt(b');
  engine.setSuperscript(true).print('2').setSuperscript(false);
  engine.print(' - 4ac)) / 2a');
  engine.println('');

  engine.newLine();

  // Practical use cases
  engine.println('----------------------------------------');
  engine.setBold(true).println('PRACTICAL USE CASES').setBold(false);
  engine.println('');
  engine.println('Superscript: Exponents, ordinals, TM/R symbols, footnotes');
  engine.println('Subscript: Chemical formulas, indices, mathematical notation');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'Superscript & Subscript Demo', '21-superscript-subscript');
}

main().catch(console.error);
