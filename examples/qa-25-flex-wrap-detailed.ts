/**
 * QA Test 25: Detailed Flex Wrap Analysis
 *
 * This test performs detailed analysis of flex wrap behavior to determine
 * if wrapping is working but with incorrect positioning, or if wrap is
 * completely non-functional.
 *
 * Tests:
 * 1. Very wide items that MUST wrap (wider than container)
 * 2. Exact boundary case (items exactly fill container)
 * 3. Just over boundary (one pixel too many)
 * 4. Wrap with different rowGap values
 * 5. Wrap with different justify combinations
 *
 * Run: npx tsx examples/qa-25-flex-wrap-detailed.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Detailed Flex Wrap Analysis');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  // Container width is approximately 4900 dots (13.6 inches at 360 DPI)
  const containerWidth = 4900;

  const layout = stack()
    .gap(30)
    .padding(30)

    // Title
    .text('DETAILED FLEX WRAP ANALYSIS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .text(`Container width: ~${containerWidth} dots`, { italic: true })
    .spacer(20)

    // Test 1: Items MUST wrap - each item is 2000 dots
    .text('TEST 1: LARGE ITEMS (2000 dots each)', { bold: true, underline: true })
    .text('3 items x 2000 = 6000 dots > container. MUST wrap.')
    .add(
      flex()
        .wrap('wrap')
        .gap(20)
        .rowGap(10)
        .add(stack().width(2000).padding(10).text('[ITEM-A: 2000 dots]'))
        .add(stack().width(2000).padding(10).text('[ITEM-B: 2000 dots]'))
        .add(stack().width(2000).padding(10).text('[ITEM-C: 2000 dots]'))
    )
    .spacer(30)

    // Test 2: Items barely fit - each 1600 dots, 3 items = 4800
    .text('TEST 2: ITEMS BARELY FIT (1600 dots each)', { bold: true, underline: true })
    .text('3 items x 1600 = 4800 dots < container. Should NOT wrap.')
    .add(
      flex()
        .wrap('wrap')
        .gap(20)
        .rowGap(10)
        .add(stack().width(1600).padding(10).text('[A: 1600]'))
        .add(stack().width(1600).padding(10).text('[B: 1600]'))
        .add(stack().width(1600).padding(10).text('[C: 1600]'))
    )
    .spacer(30)

    // Test 3: Exactly at boundary
    .text('TEST 3: EXACTLY AT BOUNDARY', { bold: true, underline: true })
    .text('2 items x 2400 + gap = ~4850 dots. Should just fit.')
    .add(
      flex()
        .wrap('wrap')
        .gap(50)
        .rowGap(10)
        .add(stack().width(2400).padding(10).text('[A: 2400 dots]'))
        .add(stack().width(2400).padding(10).text('[B: 2400 dots]'))
    )
    .spacer(30)

    // Test 4: No wrap mode comparison
    .text('TEST 4: NOWRAP COMPARISON (same items)', { bold: true, underline: true })
    .text('Same 2000-dot items WITHOUT wrap. Should overflow.')
    .add(
      flex()
        .gap(20)
        .add(stack().width(2000).padding(10).text('[NOWRAP-A]'))
        .add(stack().width(2000).padding(10).text('[NOWRAP-B]'))
        .add(stack().width(2000).padding(10).text('[NOWRAP-C]'))
    )
    .spacer(30)

    // Test 5: Many small items
    .text('TEST 5: MANY SMALL ITEMS (300 dots each)', { bold: true, underline: true })
    .text('20 items x 300 = 6000 dots. Should wrap to multiple rows.')
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(20)
        .add(stack().width(300).padding(5).text('[1]'))
        .add(stack().width(300).padding(5).text('[2]'))
        .add(stack().width(300).padding(5).text('[3]'))
        .add(stack().width(300).padding(5).text('[4]'))
        .add(stack().width(300).padding(5).text('[5]'))
        .add(stack().width(300).padding(5).text('[6]'))
        .add(stack().width(300).padding(5).text('[7]'))
        .add(stack().width(300).padding(5).text('[8]'))
        .add(stack().width(300).padding(5).text('[9]'))
        .add(stack().width(300).padding(5).text('[10]'))
        .add(stack().width(300).padding(5).text('[11]'))
        .add(stack().width(300).padding(5).text('[12]'))
        .add(stack().width(300).padding(5).text('[13]'))
        .add(stack().width(300).padding(5).text('[14]'))
        .add(stack().width(300).padding(5).text('[15]'))
        .add(stack().width(300).padding(5).text('[16]'))
        .add(stack().width(300).padding(5).text('[17]'))
        .add(stack().width(300).padding(5).text('[18]'))
        .add(stack().width(300).padding(5).text('[19]'))
        .add(stack().width(300).padding(5).text('[20]'))
    )
    .spacer(30)

    // Test 6: Text items without explicit width
    .text('TEST 6: TEXT ITEMS (no explicit width)', { bold: true, underline: true })
    .text('Long text items that should wrap based on content width.')
    .add(
      flex()
        .wrap('wrap')
        .gap(30)
        .rowGap(15)
        .text('This is a fairly long text item')
        .text('Another long piece of text here')
        .text('Third text item in the flex')
        .text('Fourth item should maybe wrap')
        .text('Fifth text element')
        .text('Sixth text in row')
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Detailed Flex Wrap Analysis', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Detailed Flex Wrap Analysis', 'qa-25-flex-wrap-detailed');
}

main().catch(console.error);
