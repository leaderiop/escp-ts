/**
 * QA Test 28: Nested Flex Layouts Stress Test
 *
 * Tests deeply nested flex layouts to verify:
 * - Correct propagation of widths through nested containers
 * - Justify behaviors in nested contexts
 * - Gap calculations at multiple nesting levels
 * - No black holes or rendering artifacts
 *
 * Run: npx tsx examples/qa-28-nested-flex-stress.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Nested Flex Stress Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('NESTED FLEX STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Simple 2-level nesting
    .text('TEST 1: Two-level nesting (flex > flex)', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .add(
          flex()
            .gap(10)
            .add(stack().width(200).padding(5).text('[A1]'))
            .add(stack().width(200).padding(5).text('[A2]'))
        )
        .add(
          flex()
            .gap(10)
            .add(stack().width(200).padding(5).text('[B1]'))
            .add(stack().width(200).padding(5).text('[B2]'))
        )
    )
    .spacer(15)

    // Test 2: Three-level nesting
    .text('TEST 2: Three-level nesting', { bold: true, underline: true })
    .add(
      flex()
        .gap(15)
        .add(
          flex()
            .gap(10)
            .add(
              flex()
                .gap(5)
                .add(stack().width(100).text('[L3-A]'))
                .add(stack().width(100).text('[L3-B]'))
            )
            .add(stack().width(150).text('[L2-C]'))
        )
        .add(stack().width(200).text('[L1-D]'))
    )
    .spacer(15)

    // Test 3: Nested flex with different justify modes
    .text('TEST 3: Nested flex with varying justify modes', { bold: true, underline: true })
    .add(
      flex()
        .justify('space-between')
        .add(
          flex()
            .justify('start')
            .gap(5)
            .add(stack().width(100).text('[start-A]'))
            .add(stack().width(100).text('[start-B]'))
        )
        .add(
          flex()
            .justify('center')
            .gap(5)
            .add(stack().width(100).text('[center-A]'))
            .add(stack().width(100).text('[center-B]'))
        )
        .add(
          flex()
            .justify('end')
            .gap(5)
            .add(stack().width(100).text('[end-A]'))
            .add(stack().width(100).text('[end-B]'))
        )
    )
    .spacer(15)

    // NOTE: Test 4 (wrapping parent) removed - flex-wrap no longer supported

    // Test 4: Deep nesting edge case (5 levels)
    .text('TEST 5: Five-level deep nesting', { bold: true, underline: true })
    .add(
      flex()
        .gap(10)
        .add(
          flex()
            .gap(8)
            .add(
              flex()
                .gap(6)
                .add(
                  flex()
                    .gap(4)
                    .add(
                      flex()
                        .gap(2)
                        .add(stack().width(60).text('[L5]'))
                        .add(stack().width(60).text('[L5]'))
                    )
                    .add(stack().width(80).text('[L4]'))
                )
                .add(stack().width(100).text('[L3]'))
            )
            .add(stack().width(120).text('[L2]'))
        )
        .add(stack().width(150).text('[L1]'))
    )
    .spacer(15)

    // Test 6: Nested flex with spacers
    .text('TEST 6: Nested flex with spacers', { bold: true, underline: true })
    .add(
      flex()
        .add(
          flex()
            .add(stack().width(100).text('[Left]'))
            .spacer()
            .add(stack().width(100).text('[Right]'))
        )
        .add(stack().width(200).text('[Outside]'))
    )
    .spacer(15)

    // Test 7: Mixed alignItems in nested flex
    .text('TEST 7: Mixed vertical alignment in nested flex', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .alignItems('center')
        .add(
          flex()
            .alignItems('top')
            .gap(5)
            .add(stack().padding(10).text('[Top-A]'))
            .add(stack().padding(20).text('[Top-B Tall]'))
        )
        .add(
          flex()
            .alignItems('bottom')
            .gap(5)
            .add(stack().padding(10).text('[Bot-A]'))
            .add(stack().padding(20).text('[Bot-B Tall]'))
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Nested Flex Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Nested Flex Stress', 'qa-28-nested-flex-stress');
}

main().catch(console.error);
