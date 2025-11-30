/**
 * QA Test 42: Complex Margin/Padding Interactions
 *
 * Stress test for margin and padding to verify:
 * - Margin collapse behavior (or lack thereof)
 * - Auto margins for centering
 * - Negative margin effects (if supported)
 * - Padding with percentage widths
 * - Nested margin/padding accumulation
 *
 * Run: npx tsx examples/qa-42-margin-padding-edge.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('QA Test: Margin/Padding Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('MARGIN/PADDING EDGE CASES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Auto margins for centering
    .text('TEST 1: Auto margins for centering', { bold: true, underline: true })
    .add(stack().width(400).margin('auto').padding(10).text('Auto margin centers this box'))
    .add(
      stack().width(600).margin('auto').padding(10).text('Wider box also centered with auto margin')
    )
    .spacer(15)

    // Test 2: Different padding on each side
    .text('TEST 2: Asymmetric padding (T:20 R:50 B:10 L:100)', { bold: true, underline: true })
    .add(
      stack()
        .width(800)
        .padding({ top: 20, right: 50, bottom: 10, left: 100 })
        .text('Asymmetric padding around this text')
        .text('Notice the different spacing on each side')
    )
    .spacer(15)

    // Test 3: Asymmetric margins
    .text('TEST 3: Asymmetric margins (T:5 R:200 B:5 L:50)', { bold: true, underline: true })
    .add(
      stack()
        .width(600)
        .margin({ top: 5, right: 200, bottom: 5, left: 50 })
        .padding(10)
        .text('Box with asymmetric margins')
    )
    .spacer(15)

    // Test 4: Nested margins
    .text('TEST 4: Nested containers with margins', { bold: true, underline: true })
    .add(
      stack()
        .margin({ left: 50, right: 50 })
        .padding(10)
        .text('Outer: margin L:50 R:50')
        .add(
          stack()
            .margin({ left: 30, right: 30 })
            .padding(10)
            .text('Middle: +margin L:30 R:30')
            .add(
              stack().margin({ left: 20, right: 20 }).padding(10).text('Inner: +margin L:20 R:20')
            )
        )
    )
    .spacer(15)

    // Test 5: Padding with percentage width
    .text('TEST 5: Padding inside percentage-width container', { bold: true, underline: true })
    .add(
      stack()
        .width('60%')
        .padding(30)
        .text('60% width container with 30px padding on all sides')
        .text('Content should respect padding boundaries')
    )
    .spacer(15)

    // Test 6: Zero padding/margin edge case
    .text('TEST 6: Zero padding and margin (edge case)', { bold: true, underline: true })
    .add(
      stack()
        .width(500)
        .padding(0)
        .margin({ top: 0, right: 0, bottom: 0, left: 0 })
        .text('No padding or margin - tight to boundaries')
    )
    .spacer(15)

    // Test 7: Large padding compared to content
    .text('TEST 7: Large padding vs small content', { bold: true, underline: true })
    .add(stack().width(800).padding(100).text('X'))
    .spacer(15)

    // Test 8: Margin between siblings in stack
    .text('TEST 8: Margin between siblings (vertical stack)', { bold: true, underline: true })
    .add(
      stack()
        .gap(0) // No gap, only margins
        .add(
          stack().width(400).padding(10).margin({ bottom: 30 }).text('Item 1: margin-bottom: 30')
        )
        .add(
          stack()
            .width(400)
            .padding(10)
            .margin({ top: 20, bottom: 10 })
            .text('Item 2: margin-top: 20, bottom: 10')
        )
        .add(stack().width(400).padding(10).margin({ top: 40 }).text('Item 3: margin-top: 40'))
    )
    .spacer(15)

    // Test 9: Flex items with margins
    .text('TEST 9: Flex items with individual margins', { bold: true, underline: true })
    .add(
      flex()
        .gap(0) // No gap, margins create spacing
        .add(stack().width(200).padding(10).margin({ right: 30 }).text('M-R:30'))
        .add(stack().width(200).padding(10).margin({ left: 20, right: 20 }).text('M-LR:20'))
        .add(stack().width(200).padding(10).margin({ left: 40 }).text('M-L:40'))
    )
    .spacer(15)

    // Test 10: Combined padding and margin with alignment
    .text('TEST 10: Margin + padding + center alignment', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('center')
        .add(
          stack()
            .width(600)
            .margin({ top: 10, bottom: 10 })
            .padding(20)
            .text('Centered with margin and padding', { align: 'center' })
        )
        .add(
          stack()
            .width(400)
            .margin('auto')
            .padding(15)
            .text('Auto-centered child', { align: 'center' })
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Margin/Padding Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Margin/Padding Edge Cases', 'qa-42-margin-padding-edge');
}

main().catch(console.error);
