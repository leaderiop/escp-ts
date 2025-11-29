/**
 * QA Example 50: Nested Flex/Stack Layout Stress Test
 *
 * This example stress-tests nested combinations of flex and stack layouts
 * to expose alignment, spacing, and positioning bugs.
 *
 * Test Cases:
 * - Deep nesting (3+ levels)
 * - Mixed flex inside stack, stack inside flex
 * - Alignment inheritance/override
 * - Gap accumulation
 * - Width distribution in nested flex
 *
 * Run: npx tsx examples/qa-50-nested-flex-stack.ts
 */

import { LayoutEngine, stack, flex, text } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA: Nested Flex/Stack Stress Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text('NESTED FLEX/STACK STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // TEST 1: Stack inside Flex inside Stack
    .text('TEST 1: Stack > Flex > Stack (3-level nesting)', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .text('Outer stack start')
        .add(
          flex()
            .gap(20)
            .add(stack().width(200).text('Inner Stack A').text('Line 2').text('Line 3'))
            .add(stack().width(200).text('Inner Stack B').text('Line 2').text('Line 3'))
            .add(stack().width(200).text('Inner Stack C').text('Line 2'))
        )
        .text('Outer stack end')
    )
    .spacer(10)

    // TEST 2: Flex inside Stack with vAlign
    .text('TEST 2: Flex with vAlign center inside Stack', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(
          flex()
            .gap(20)
            .alignItems('center')
            .add(stack().text('Short'))
            .add(stack().text('Tall').text('Content').text('Here'))
            .add(stack().text('Medium').text('Two'))
        )
    )
    .spacer(10)

    // TEST 3: Flex with vAlign bottom
    .text('TEST 3: Flex with vAlign bottom', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .alignItems('bottom')
        .add(stack().text('One line'))
        .add(stack().text('Line 1').text('Line 2').text('Line 3'))
        .add(stack().text('Line A').text('Line B'))
    )
    .spacer(10)

    // TEST 4: Horizontal stack (row) with vAlign
    .text('TEST 4: Horizontal Stack (row) with vAlign center', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(30)
        .vAlign('center')
        .add(stack().text('Single'))
        .add(stack().text('Multi').text('Line').text('Stack'))
        .add(stack().text('Two').text('Lines'))
    )
    .spacer(10)

    // TEST 5: Deep nesting with alignment
    .text('TEST 5: 4-level deep nesting', { bold: true, underline: true })
    .add(
      stack() // Level 1
        .add(
          flex() // Level 2
            .gap(10)
            .add(
              stack() // Level 3
                .width(300)
                .add(
                  flex() // Level 4
                    .gap(5)
                    .text('L4-A')
                    .text('L4-B')
                    .text('L4-C')
                )
                .text('L3 text after nested flex')
            )
            .add(stack().width(200).text('Sibling stack').text('in level 3'))
        )
    )
    .spacer(10)

    // TEST 6: Mixed width specifications
    .text('TEST 6: Mixed width specs in nested layout', { bold: true, underline: true })
    .add(
      flex()
        .gap(10)
        .add(stack().width(150).text('Fixed 150px'))
        .add(stack().width('30%').text('30% width'))
        .add(stack().width('fill').text('Fill remaining'))
    )
    .spacer(10)

    // TEST 7: Justify content in nested flex
    .text('TEST 7: Nested flex with different justify', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(flex().justify('start').gap(10).text('Start').text('Justify'))
        .add(flex().justify('center').gap(10).text('Center').text('Justify'))
        .add(flex().justify('end').gap(10).text('End').text('Justify'))
        .add(flex().justify('space-between').text('Space').text('Between').text('Items'))
    )
    .spacer(10)

    // TEST 8: Stack alignment in parent stack
    .text('TEST 8: Horizontal align in vertical stack', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .align('center')
        .add(stack().width(200).text('Centered child 1'))
        .add(stack().width(300).text('Centered child 2 (wider)'))
        .add(stack().width(150).text('Centered child 3'))
    )
    .spacer(10)

    // Footer
    .line('-', 'fill')
    .text('End of Nested Flex/Stack Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Nested Flex/Stack', 'qa-50-nested-flex-stack');
}

main().catch(console.error);
