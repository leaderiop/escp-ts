/**
 * QA Test 38: Positioning and Overlap Test
 *
 * Tests absolute/relative positioning edge cases:
 * - Overlapping absolutely positioned elements
 * - Relative offsets in nested containers
 * - Mixed flow and positioned elements
 * - Position at page boundaries
 * - Position with explicit dimensions
 *
 * Run: npx tsx examples/qa-38-positioning-overlap-test.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('QA Test: Positioning and Overlap');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('POSITIONING AND OVERLAP TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Intentional overlap with absolute
    .text('TEST 1: Intentional overlap - 3 elements at similar coords', {
      bold: true,
      underline: true,
    })
    .add(
      stack()
        .height(120)
        .add(stack().absolutePosition(300, 200).text('[First at 300,200]', { bold: true }))
        .add(stack().absolutePosition(310, 210).text('[Second at 310,210]'))
        .add(stack().absolutePosition(320, 220).text('[Third at 320,220]', { italic: true }))
    )
    .spacer(15)

    // Test 2: Relative positioning staircase
    .text('TEST 2: Relative positioning staircase effect', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(stack().relativePosition(0, 0).text('[Base - no offset]'))
        .add(stack().relativePosition(50, 0).text('[+50x offset]'))
        .add(stack().relativePosition(100, 0).text('[+100x offset]'))
        .add(stack().relativePosition(150, 0).text('[+150x offset]'))
        .add(stack().relativePosition(200, 0).text('[+200x offset]'))
    )
    .spacer(15)

    // Test 3: Negative relative offsets
    .text('TEST 3: Negative relative offsets (overlap previous)', { bold: true, underline: true })
    .add(
      stack()
        .gap(30)
        .add(stack().text('[Line 1 - baseline]'))
        .add(stack().relativePosition(0, -15).text('[Line 2 - offset Y:-15 overlaps above]'))
        .add(stack().text('[Line 3 - normal flow]'))
    )
    .spacer(15)

    // Test 4: Absolute inside nested containers
    .text('TEST 4: Absolute position ignores parent offset', { bold: true, underline: true })
    .add(
      flex()
        .gap(50)
        .add(
          stack()
            .width(400)
            .padding(20)
            .text('Container A (with padding)')
            .add(stack().absolutePosition(200, 550).text('[Absolute: 200,550]'))
        )
        .add(
          stack()
            .width(400)
            .padding(20)
            .text('Container B (with padding)')
            .add(stack().absolutePosition(1000, 550).text('[Absolute: 1000,550]'))
        )
    )
    .spacer(15)

    // Test 5: Relative positioning in flex items
    .text('TEST 5: Relative offset in flex items', { bold: true, underline: true })
    .add(
      flex()
        .gap(30)
        .alignItems('center')
        .add(stack().width(200).text('[Normal flex item]'))
        .add(stack().width(200).relativePosition(0, -20).text('[Shifted up 20]'))
        .add(stack().width(200).text('[Normal flex item]'))
        .add(stack().width(200).relativePosition(0, 20).text('[Shifted down 20]'))
    )
    .spacer(15)

    // Test 6: Absolute at origin (0,0)
    .text('TEST 6: Absolute at origin and edges', { bold: true, underline: true })
    .add(
      stack()
        .height(80)
        .add(stack().absolutePosition(0, 750).text('[Origin-ish: 0,750]'))
        .add(stack().absolutePosition(4500, 750).text('[Far right: 4500,750]'))
    )
    .spacer(15)

    // Test 7: Stacked relative offsets (cumulative)
    .text('TEST 7: Nested relative offsets - should accumulate', { bold: true, underline: true })
    .add(
      stack()
        .relativePosition(50, 0)
        .gap(5)
        .text('Parent: +50x')
        .add(
          stack()
            .relativePosition(50, 0)
            .gap(5)
            .text('Child: +50x (total +100)')
            .add(stack().relativePosition(50, 0).text('Grandchild: +50x (total +150)'))
        )
    )
    .spacer(15)

    // Test 8: Absolute with explicit size
    .text('TEST 8: Absolute positioned with explicit width', { bold: true, underline: true })
    .add(
      stack()
        .height(100)
        .add(
          stack()
            .absolutePosition(400, 1000)
            .width(600)
            .padding(10)
            .text('Absolute at 400,1000 with width:600')
            .text('Content should wrap within 600px')
        )
    )
    .spacer(15)

    // Test 9: Dense overlapping cluster
    .text('TEST 9: Dense overlap cluster (stress test)', { bold: true, underline: true })
    .add(
      stack()
        .height(150)
        .add(stack().absolutePosition(500, 1100).text('[A]', { bold: true }))
        .add(stack().absolutePosition(505, 1105).text('[B]'))
        .add(stack().absolutePosition(510, 1110).text('[C]'))
        .add(stack().absolutePosition(515, 1115).text('[D]'))
        .add(stack().absolutePosition(520, 1120).text('[E]'))
        .add(stack().absolutePosition(530, 1100).text('[F]'))
        .add(stack().absolutePosition(535, 1105).text('[G]'))
        .add(stack().absolutePosition(540, 1110).text('[H]'))
    )
    .spacer(15)

    // Test 10: Mix of all positioning modes
    .text('TEST 10: All positioning modes together', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(stack().text('[1. Static - normal flow]'))
        .add(stack().relativePosition(100, 0).text('[2. Relative +100x]'))
        .add(stack().text('[3. Static - normal flow]'))
        .add(stack().absolutePosition(1800, 1350).text('[4. Absolute 1800,1350]'))
        .add(stack().relativePosition(-50, 0).text('[5. Relative -50x]'))
        .add(stack().text('[6. Static - normal flow]'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Positioning and Overlap Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Positioning and Overlap', 'qa-38-positioning-overlap-test');
}

main().catch(console.error);
