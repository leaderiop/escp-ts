/**
 * Example 22: International Character Sets
 *
 * Demonstrates international character set selection:
 * - USA (default)
 * - France, Germany, UK
 * - Denmark, Sweden, Norway
 * - Italy, Spain
 * - Japan
 *
 * Each charset maps certain ASCII codes to locale-specific characters.
 *
 * Run: npx tsx examples/22-international-charsets.ts
 */

import {
  LayoutEngine,
  PRINT_QUALITY,
  INTERNATIONAL_CHARSET,
  stack,
  type InternationalCharset,
} from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

async function main() {
  printSection('International Character Sets Demo');

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
    .text('INTERNATIONAL CHARACTER SETS', {
      bold: true,
      doubleWidth: true,
      align: 'center',
    })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('ESC/P2 printers can switch between international character sets.')
    .text('Each set maps specific ASCII codes to locale-appropriate characters.')
    .text('Characters affected: # $ @ [ \\ ] ^ ` { | } ~')
    .spacer(20)
    .line('-', 'fill')
    .build();

  engine.render(layout);

  // Test characters that vary between charsets
  const testChars = '# $ @ [ \\ ] ^ ` { | } ~';

  // Define all charsets
  const charsets: Array<{ name: string; value: InternationalCharset; sample: string }> = [
    {
      name: 'USA',
      value: INTERNATIONAL_CHARSET.USA,
      sample: 'Hello, World! Price: $99.99',
    },
    {
      name: 'France',
      value: INTERNATIONAL_CHARSET.FRANCE,
      sample: 'Bonjour! Prix: 99,99 EUR',
    },
    {
      name: 'Germany',
      value: INTERNATIONAL_CHARSET.GERMANY,
      sample: 'Guten Tag! Preis: 99,99 EUR',
    },
    {
      name: 'United Kingdom',
      value: INTERNATIONAL_CHARSET.UK,
      sample: 'Hello! Price: 99.99 GBP',
    },
    {
      name: 'Denmark I',
      value: INTERNATIONAL_CHARSET.DENMARK_I,
      sample: 'Hej! Pris: 99,99 DKK',
    },
    {
      name: 'Sweden',
      value: INTERNATIONAL_CHARSET.SWEDEN,
      sample: 'Hej! Pris: 99,99 SEK',
    },
    {
      name: 'Italy',
      value: INTERNATIONAL_CHARSET.ITALY,
      sample: 'Ciao! Prezzo: 99,99 EUR',
    },
    {
      name: 'Spain I',
      value: INTERNATIONAL_CHARSET.SPAIN_I,
      sample: 'Hola! Precio: 99,99 EUR',
    },
    {
      name: 'Japan',
      value: INTERNATIONAL_CHARSET.JAPAN,
      sample: 'Price: 9999 JPY',
    },
    {
      name: 'Norway',
      value: INTERNATIONAL_CHARSET.NORWAY,
      sample: 'Hei! Pris: 99,99 NOK',
    },
    {
      name: 'Denmark II',
      value: INTERNATIONAL_CHARSET.DENMARK_II,
      sample: 'Hej! Pris: 99,99 DKK',
    },
    {
      name: 'Spain II',
      value: INTERNATIONAL_CHARSET.SPAIN_II,
      sample: 'Hola! Precio: 99,99 EUR',
    },
    {
      name: 'Latin America',
      value: INTERNATIONAL_CHARSET.LATIN_AMERICA,
      sample: 'Hola! Precio: $99.99',
    },
  ];

  engine.newLine();
  engine.setBold(true).println('CHARACTER SET COMPARISON').setBold(false);
  engine.println('Test characters: ' + testChars);
  engine.println('');

  // Show each charset
  for (const cs of charsets) {
    engine.setInternationalCharset(cs.value);
    engine
      .setBold(true)
      .print(`${cs.name.padEnd(18)}: `)
      .setBold(false);
    engine.println(testChars);
  }

  engine.newLine();
  engine.println('----------------------------------------');
  engine.newLine();

  // Sample text in each locale
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.USA); // Reset
  engine.setBold(true).println('SAMPLE TEXT BY LOCALE').setBold(false);
  engine.println('');

  for (const cs of charsets.slice(0, 8)) {
    // First 8 for space
    engine.setInternationalCharset(cs.value);
    engine.setBold(true).print(`${cs.name}: `).setBold(false);
    engine.println(cs.sample);
  }

  engine.newLine();
  engine.println('----------------------------------------');
  engine.newLine();

  // Practical example: Multi-language invoice header
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.USA);
  engine.setBold(true).println('PRACTICAL EXAMPLE: MULTI-LANGUAGE HEADERS').setBold(false);
  engine.println('');

  // English header
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.USA);
  engine.println('English:  INVOICE #12345 - Total: $1,234.56');

  // French header
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.FRANCE);
  engine.println('French:   FACTURE #12345 - Total: 1.234,56 EUR');

  // German header
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.GERMANY);
  engine.println('German:   RECHNUNG #12345 - Gesamt: 1.234,56 EUR');

  // Spanish header
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.SPAIN_I);
  engine.println('Spanish:  FACTURA #12345 - Total: 1.234,56 EUR');

  // Reset to USA
  engine.setInternationalCharset(INTERNATIONAL_CHARSET.USA);

  engine.newLine();
  engine.println('----------------------------------------');
  engine.setBold(true).println('NOTE').setBold(false);
  engine.println('Character set affects specific ASCII positions only.');
  engine.println('For full Unicode support, use appropriate code pages.');

  engine.formFeed();

  const commands = engine.getOutput();
  await renderPreview(commands, 'International Character Sets Demo', '22-international-charsets');
}

main().catch(console.error);
