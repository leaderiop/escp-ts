/**
 * QA Test 35: Nested Flex Alignment Stress Test
 *
 * This test specifically targets potential bugs in nested flex containers
 * with different alignment combinations:
 * - Nested flex with conflicting justify modes
 * - Deep nesting (3+ levels) with mixed alignItems
 * - Flex inside stack inside flex configurations
 * - Edge case: empty flex children
 *
 * Run: npx tsx examples/qa-35-nested-flex-alignment-stress.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Nested Flex Alignment Stress');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('NESTED FLEX ALIGNMENT STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Triple nested flex with different justify modes
    .text('TEST 1: Triple nested flex - justify: start > center > end', { bold: true, underline: true })
    .add(
      flex()
        .justify('start')
        .gap(10)
        .add(
          flex()
            .justify('center')
            .width(600)
            .gap(5)
            .add(
              flex()
                .justify('end')
                .width(500)
                .gap(5)
                .text('[Inner-1]')
                .text('[Inner-2]')
            )
            .text('[Mid-1]')
        )
        .text('[Outer-1]')
    )
    .spacer(15)

    // Test 2: Nested flex with conflicting alignItems
    .text('TEST 2: Nested flex - alignItems: top > center > bottom', { bold: true, underline: true })
    .add(
      flex()
        .alignItems('top')
        .gap(20)
        .add(
          stack().width(150).padding(30).text('[Tall-Top]')
        )
        .add(
          flex()
            .alignItems('center')
            .width(500)
            .gap(10)
            .add(stack().width(100).padding(10).text('[A]'))
            .add(
              flex()
                .alignItems('bottom')
                .width(300)
                .gap(5)
                .add(stack().width(80).padding(5).text('[X]'))
                .add(stack().width(80).padding(20).text('[Y]'))
            )
            .add(stack().width(100).padding(15).text('[B]'))
        )
        .add(
          stack().width(150).padding(10).text('[Short-Top]')
        )
    )
    .spacer(15)

    // Test 3: Flex inside stack inside flex
    .text('TEST 3: Flex > Stack > Flex nesting pattern', { bold: true, underline: true })
    .add(
      flex()
        .justify('space-between')
        .gap(20)
        .add(
          stack()
            .width(600)
            .gap(10)
            .text('Stack header', { bold: true })
            .add(
              flex()
                .justify('center')
                .gap(10)
                .text('[Nested-A]')
                .text('[Nested-B]')
                .text('[Nested-C]')
            )
            .text('Stack footer')
        )
        .add(
          stack()
            .width(600)
            .gap(10)
            .text('Stack header 2', { bold: true })
            .add(
              flex()
                .justify('end')
                .gap(10)
                .text('[Nested-X]')
                .text('[Nested-Y]')
            )
            .text('Stack footer 2')
        )
    )
    .spacer(15)

    // Test 4: Deep nesting (4 levels)
    .text('TEST 4: 4-level deep flex nesting', { bold: true, underline: true })
    .add(
      flex()
        .justify('start')
        .gap(5)
        .text('[L1]')
        .add(
          flex()
            .justify('center')
            .width(1200)
            .gap(5)
            .text('[L2-start]')
            .add(
              flex()
                .justify('end')
                .width(900)
                .gap(5)
                .text('[L3-start]')
                .add(
                  flex()
                    .justify('space-around')
                    .width(600)
                    .gap(5)
                    .text('[L4-A]')
                    .text('[L4-B]')
                    .text('[L4-C]')
                )
                .text('[L3-end]')
            )
            .text('[L2-end]')
        )
    )
    .spacer(15)

    // Test 5: Mixed widths in nested flex
    .text('TEST 5: Nested flex with percentage vs fixed widths', { bold: true, underline: true })
    .add(
      flex()
        .justify('start')
        .gap(20)
        .add(
          flex()
            .width('30%')
            .justify('center')
            .gap(5)
            .text('[30%-A]')
            .text('[30%-B]')
        )
        .add(
          flex()
            .width(800)
            .justify('space-between')
            .gap(5)
            .text('[800px-Start]')
            .text('[800px-End]')
        )
        .add(
          flex()
            .width('20%')
            .justify('end')
            .gap(5)
            .text('[20%]')
        )
    )
    .spacer(15)

    // NOTE: Test 6 (nested flex with wrap) removed - flex-wrap no longer supported

    // Test 6: Single-child nested flex
    .text('TEST 7: Single-child nested flex (edge case)', { bold: true, underline: true })
    .add(
      flex()
        .justify('center')
        .add(
          flex()
            .justify('end')
            .width(800)
            .add(
              flex()
                .justify('start')
                .width(400)
                .text('[Single deeply nested]')
            )
        )
    )
    .spacer(15)

    // Test 8: Nested flex with spacers
    .text('TEST 8: Nested flex with flex spacers', { bold: true, underline: true })
    .add(
      flex()
        .gap(10)
        .text('[Left]')
        .add(
          flex()
            .width(1000)
            .text('[Inner-L]')
            .spacer(true) // flex spacer
            .text('[Inner-R]')
        )
        .text('[Right]')
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Nested Flex Alignment Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Nested Flex Alignment Stress', 'qa-35-nested-flex-alignment-stress');
}

main().catch(console.error);
