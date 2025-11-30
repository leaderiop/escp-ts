/**
 * QA Test 44: Mix of Percentage and Fixed Widths
 *
 * Tests complex width interactions:
 * - Percentage widths in nested containers
 * - Fixed widths inside percentage containers
 * - Fill width behavior
 * - Width constraints (minWidth, maxWidth)
 * - Width overflow scenarios
 *
 * Run: npx tsx examples/qa-44-width-interaction.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('QA Test: Width Interactions');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('WIDTH INTERACTION STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Nested percentage widths
    .text('TEST 1: Nested percentage widths', { bold: true, underline: true })
    .add(
      stack()
        .width('100%')
        .padding(5)
        .text('[100% container]')
        .add(
          stack()
            .width('75%')
            .padding(5)
            .text('[75% of 100% = 75%]')
            .add(stack().width('50%').padding(5).text('[50% of 75% = 37.5%]'))
        )
    )
    .spacer(15)

    // Test 2: Fixed inside percentage
    .text('TEST 2: Fixed width inside percentage container', { bold: true, underline: true })
    .add(
      stack()
        .width('60%')
        .padding(10)
        .text('[60% container]')
        .add(stack().width(500).padding(10).text('[Fixed 500px inside 60%]'))
        .add(stack().width(800).padding(10).text('[Fixed 800px - may overflow 60%]'))
    )
    .spacer(15)

    // Test 3: Fill width in flex
    .text('TEST 3: Fill width items in flex', { bold: true, underline: true })
    .add(
      flex()
        .width(2000)
        .gap(10)
        .add(stack().width(300).padding(10).text('[Fixed 300]'))
        .add(stack().width('fill').padding(10).text('[Fill - takes remaining]'))
        .add(stack().width(200).padding(10).text('[Fixed 200]'))
    )
    .spacer(15)

    // Test 4: Multiple fill competing
    .text('TEST 4: Multiple fill widths compete', { bold: true, underline: true })
    .add(
      flex()
        .width(2000)
        .gap(10)
        .add(stack().width('fill').padding(10).text('[Fill 1]'))
        .add(stack().width(300).padding(10).text('[Fixed]'))
        .add(stack().width('fill').padding(10).text('[Fill 2]'))
    )
    .spacer(15)

    // Test 5: Auto width vs explicit width
    .text('TEST 5: Auto width vs explicit width comparison', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(stack().padding(10).text('Auto width - fits content'))
        .add(stack().width(1000).padding(10).text('Explicit 1000px width'))
        .add(stack().width('50%').padding(10).text('50% width'))
    )
    .spacer(15)

    // Test 6: Width with constraints
    .text('TEST 6: Width constraints (minWidth/maxWidth)', { bold: true, underline: true })
    .text('MinWidth 400 on short content:')
    .add(stack().minWidth(400).padding(10).text('X'))
    .text('MaxWidth 300 on long content:')
    .add(
      stack()
        .maxWidth(300)
        .padding(10)
        .text('This is a very long piece of text that should be constrained')
    )
    .spacer(15)

    // Test 7: Percentage in flex items
    .text('TEST 7: Percentage widths in flex children', { bold: true, underline: true })
    .add(
      flex()
        .width(2000)
        .gap(10)
        .add(stack().width('25%').padding(10).text('[25%]'))
        .add(stack().width('50%').padding(10).text('[50%]'))
        .add(stack().width('25%').padding(10).text('[25%]'))
    )
    .spacer(15)

    // Test 8: Percentage exceeding 100%
    .text('TEST 8: Percentages exceeding 100% (overflow test)', { bold: true, underline: true })
    .add(
      flex()
        .width(1500)
        .gap(10)
        .add(stack().width('40%').padding(10).text('[40%]'))
        .add(stack().width('40%').padding(10).text('[40%]'))
        .add(stack().width('40%').padding(10).text('[40%]'))
    )
    .spacer(15)

    // Test 9: Width 0 edge case
    .text('TEST 9: Zero and tiny widths (edge case)', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .add(stack().width(1).padding(0).text('|'))
        .add(stack().width(50).padding(5).text('50'))
        .add(stack().width(100).padding(5).text('100'))
    )
    .spacer(15)

    // Test 10: Width inheritance
    .text('TEST 10: Width inheritance in nested containers', { bold: true, underline: true })
    .add(
      stack()
        .width(1200)
        .padding(10)
        .text('[Parent: 1200px]')
        .add(
          stack()
            .padding(10) // No width specified - should inherit/fill
            .text('[Child: no width - fills parent]')
            .add(stack().width('80%').padding(10).text('[Grandchild: 80% of parent]'))
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Width Interaction Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Width Interactions', 'qa-44-width-interaction');
}

main().catch(console.error);
