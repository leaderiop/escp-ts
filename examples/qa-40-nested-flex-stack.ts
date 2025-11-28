/**
 * QA Test 40: Deeply Nested Flex/Stack Combinations
 *
 * Stress test for nested layout containers to verify:
 * - Deep nesting (4+ levels) preserves alignment
 * - Mixed flex/stack at different levels
 * - Width propagation through nested containers
 * - Gap accumulation doesn't cause overflow
 * - Alignment inheritance vs override at each level
 *
 * Run: npx tsx examples/qa-40-nested-flex-stack.ts
 */

import { LayoutEngine, stack, flex, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Deeply Nested Flex/Stack');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('DEEPLY NESTED FLEX/STACK STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: 4 levels of alternating flex/stack
    .text('TEST 1: Alternating Flex/Stack (4 levels deep)', { bold: true, underline: true })
    .add(
      flex()  // Level 1: Flex
        .gap(20)
        .add(
          stack()  // Level 2: Stack
            .width(600)
            .gap(5)
            .padding(10)
            .text('Stack L2-A')
            .add(
              flex()  // Level 3: Flex
                .gap(10)
                .add(
                  stack()  // Level 4: Stack
                    .width(150)
                    .padding(5)
                    .text('L4-1')
                )
                .add(
                  stack()
                    .width(150)
                    .padding(5)
                    .text('L4-2')
                )
            )
        )
        .add(
          stack()  // Level 2: Stack
            .width(600)
            .gap(5)
            .padding(10)
            .text('Stack L2-B')
            .add(
              flex()  // Level 3: Flex
                .gap(10)
                .add(
                  stack()  // Level 4: Stack
                    .width(150)
                    .padding(5)
                    .text('L4-3')
                )
                .add(
                  stack()
                    .width(150)
                    .padding(5)
                    .text('L4-4')
                )
            )
        )
    )
    .spacer(15)

    // Test 2: Nested stacks with different alignments
    .text('TEST 2: Nested stacks with alignment overrides', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('center')  // Parent: center
        .width(1500)
        .padding(10)
        .text('[Outer: align=center]')
        .add(
          stack()
            .align('left')  // Override: left
            .width(800)
            .padding(10)
            .text('[Inner: align=left]')
            .add(
              stack()
                .align('right')  // Override: right
                .width(400)
                .padding(10)
                .text('[Innermost: right]')
            )
        )
    )
    .spacer(15)

    // Test 3: Flex with nested row stacks
    .text('TEST 3: Flex containing row stacks', { bold: true, underline: true })
    .add(
      flex()
        .gap(30)
        .justify('space-between')
        .width(2000)
        .add(
          stack()
            .direction('row')
            .vAlign('center')
            .width(600)
            .gap(10)
            .add(stack().width(100).padding(10).text('A1'))
            .add(stack().width(100).padding(20).text('A2'))
            .add(stack().width(100).padding(10).text('A3'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('bottom')
            .width(600)
            .gap(10)
            .add(stack().width(100).padding(10).text('B1'))
            .add(stack().width(100).padding(30).text('B2'))
            .add(stack().width(100).padding(10).text('B3'))
        )
    )
    .spacer(15)

    // Test 4: Triple nested flex with wrapping
    .text('TEST 4: Nested flex with wrap at different levels', { bold: true, underline: true })
    .add(
      flex()  // Outer flex: no wrap
        .gap(20)
        .add(
          flex()  // Inner flex: wrap
            .wrap('wrap')
            .width(800)
            .gap(10)
            .rowGap(10)
            .add(stack().width(200).padding(5).text('[W1]'))
            .add(stack().width(200).padding(5).text('[W2]'))
            .add(stack().width(200).padding(5).text('[W3]'))
            .add(stack().width(200).padding(5).text('[W4]'))
            .add(stack().width(200).padding(5).text('[W5]'))
        )
        .add(
          flex()  // Another inner flex: wrap
            .wrap('wrap')
            .width(600)
            .gap(10)
            .rowGap(10)
            .add(stack().width(150).padding(5).text('[X1]'))
            .add(stack().width(150).padding(5).text('[X2]'))
            .add(stack().width(150).padding(5).text('[X3]'))
            .add(stack().width(150).padding(5).text('[X4]'))
        )
    )
    .spacer(15)

    // Test 5: Stack inside flex inside stack inside flex
    .text('TEST 5: Complex nesting pattern', { bold: true, underline: true })
    .add(
      flex()  // L1: Flex
        .gap(15)
        .alignItems('top')
        .add(
          stack()  // L2: Column Stack
            .width(500)
            .gap(8)
            .padding(10)
            .text('Column A')
            .add(
              flex()  // L3: Flex
                .gap(5)
                .justify('center')
                .add(stack().width(100).padding(5).text('1'))
                .add(stack().width(100).padding(5).text('2'))
            )
            .add(
              flex()  // L3: Another Flex
                .gap(5)
                .justify('end')
                .add(stack().width(100).padding(5).text('3'))
                .add(stack().width(100).padding(5).text('4'))
            )
        )
        .add(
          stack()  // L2: Another Column Stack
            .width(500)
            .gap(8)
            .padding(10)
            .text('Column B')
            .add(
              flex()
                .gap(5)
                .justify('start')
                .add(stack().width(100).padding(5).text('5'))
                .add(stack().width(100).padding(5).text('6'))
            )
            .add(
              flex()
                .gap(5)
                .justify('space-between')
                .add(stack().width(100).padding(5).text('7'))
                .add(stack().width(100).padding(5).text('8'))
            )
        )
    )
    .spacer(15)

    // Test 6: Deep nesting with percentage widths
    .text('TEST 6: Nested containers with percentage widths', { bold: true, underline: true })
    .add(
      stack()
        .width('80%')
        .padding(10)
        .text('[80% of container]')
        .add(
          stack()
            .width('70%')
            .padding(10)
            .text('[70% of parent = 56% total]')
            .add(
              stack()
                .width('60%')
                .padding(10)
                .text('[60% of parent = 33.6% total]')
            )
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Nested Flex/Stack Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Nested Flex/Stack', 'qa-40-nested-flex-stack');
}

main().catch(console.error);
