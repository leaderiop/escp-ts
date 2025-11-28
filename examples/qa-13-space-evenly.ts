/**
 * QA Test 13: Flex space-evenly Test
 *
 * Tests the space-evenly justify value specifically:
 * - space-evenly should create equal space between all items AND edges
 * - Comparison with space-between and space-around
 *
 * Run: npx tsx examples/qa-13-space-evenly.ts
 */

import { LayoutEngine, stack, flex, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex space-evenly');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('FLEX SPACE-EVENLY TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Reference: space-between
    .text('REFERENCE: space-between', { bold: true, underline: true })
    .text('First at start, last at end, even space between')
    .add(
      flex()
        .justify('space-between')
        .add(stack().padding(8).text('[A]'))
        .add(stack().padding(8).text('[B]'))
        .add(stack().padding(8).text('[C]'))
        .add(stack().padding(8).text('[D]'))
    )
    .spacer(15)

    // Reference: space-around
    .text('REFERENCE: space-around', { bold: true, underline: true })
    .text('Equal space around each item (half-space at edges)')
    .add(
      flex()
        .justify('space-around')
        .add(stack().padding(8).text('[A]'))
        .add(stack().padding(8).text('[B]'))
        .add(stack().padding(8).text('[C]'))
        .add(stack().padding(8).text('[D]'))
    )
    .spacer(15)

    // Test: space-evenly
    .text('TEST: space-evenly', { bold: true, underline: true })
    .text('Equal space between items AND at edges')
    .add(
      flex()
        .justify('space-evenly')
        .add(stack().padding(8).text('[A]'))
        .add(stack().padding(8).text('[B]'))
        .add(stack().padding(8).text('[C]'))
        .add(stack().padding(8).text('[D]'))
    )
    .spacer(15)

    // Visual comparison with 2 items
    .text('COMPARISON WITH 2 ITEMS', { bold: true, underline: true })
    .spacer(5)
    .text('space-between:')
    .add(
      flex()
        .justify('space-between')
        .add(stack().padding(8).text('[LEFT]'))
        .add(stack().padding(8).text('[RIGHT]'))
    )
    .spacer(5)
    .text('space-around:')
    .add(
      flex()
        .justify('space-around')
        .add(stack().padding(8).text('[LEFT]'))
        .add(stack().padding(8).text('[RIGHT]'))
    )
    .spacer(5)
    .text('space-evenly:')
    .add(
      flex()
        .justify('space-evenly')
        .add(stack().padding(8).text('[LEFT]'))
        .add(stack().padding(8).text('[RIGHT]'))
    )
    .spacer(15)

    // Single item test
    .text('SINGLE ITEM TEST', { bold: true, underline: true })
    .text('space-evenly with 1 item (should be centered):')
    .add(
      flex()
        .justify('space-evenly')
        .add(stack().padding(8).text('[ONLY]'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of space-evenly Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: space-evenly', 'qa-13-space-evenly');
}

main().catch(console.error);
