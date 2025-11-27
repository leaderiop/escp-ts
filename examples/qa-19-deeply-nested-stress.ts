/**
 * QA Test 19: Deeply Nested Layout Stress Test
 *
 * Tests layout system with deeply nested structures:
 * - 4+ levels of nesting
 * - Mixed container types at each level
 * - Different gap/padding/margin combinations
 * - Looking for position calculation errors or black holes
 *
 * Run: npx tsx examples/qa-19-deeply-nested-stress.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Deeply Nested Stress Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('DEEPLY NESTED LAYOUT STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Stack > Flex > Stack > Text (4 levels)
    .text('TEST 1: Stack > Flex > Stack > Text (4 levels)', { bold: true, underline: true })
    .add(
      stack()
        .gap(8)
        .padding(10)
        .margin(5)
        .text('Level 1 (Stack with gap=8, padding=10, margin=5)')
        .add(
          flex()
            .gap(15)
            .padding(8)
            .text('L2-Flex:', { bold: true })
            .add(
              stack()
                .gap(5)
                .padding(5)
                .text('L3-Stack:')
                .text('Nested Text A')
                .text('Nested Text B')
            )
            .add(
              stack()
                .gap(5)
                .padding(5)
                .text('L3-Stack:')
                .text('Nested Text C')
                .text('Nested Text D')
            )
        )
    )
    .spacer(20)

    // Test 2: Flex > Stack > Grid > Text
    .text('TEST 2: Flex > Stack > Grid > Text', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .padding(10)
        .add(
          stack()
            .width(600)
            .gap(5)
            .padding(8)
            .text('Container 1', { bold: true })
            .add(
              grid([150, 150])
                .columnGap(10)
                .rowGap(5)
                .cell('A1').cell('B1').row()
                .cell('A2').cell('B2').row()
            )
        )
        .add(
          stack()
            .width(600)
            .gap(5)
            .padding(8)
            .text('Container 2', { bold: true })
            .add(
              grid([150, 150])
                .columnGap(10)
                .rowGap(5)
                .cell('C1').cell('D1').row()
                .cell('C2').cell('D2').row()
            )
        )
    )
    .spacer(20)

    // Test 3: Grid containing Flex containing Stack
    .text('TEST 3: Grid > Flex > Stack', { bold: true, underline: true })
    .add(
      grid([500, 500])
        .columnGap(20)
        .rowGap(10)
        .padding(10)
        .cell(
          flex()
            .gap(10)
            .add(
              stack()
                .padding(5)
                .text('Cell(0,0)')
                .text('Item 1')
                .text('Item 2')
            )
            .add(
              stack()
                .padding(5)
                .text('Flex Item 2')
                .text('More content')
            )
        )
        .cell(
          flex()
            .gap(10)
            .justify('end')
            .add(
              stack()
                .padding(5)
                .text('Cell(0,1)')
                .text('Right aligned')
            )
        )
        .row()
        .cell(
          stack()
            .gap(5)
            .text('Cell(1,0) - Simple Stack')
            .text('Line 1')
            .text('Line 2')
        )
        .cell(
          stack()
            .gap(5)
            .text('Cell(1,1) - Simple Stack')
            .text('Line A')
            .text('Line B')
        )
        .row()
    )
    .spacer(20)

    // Test 4: Deep nesting with margins at each level
    .text('TEST 4: 5-Level Deep with Margins', { bold: true, underline: true })
    .add(
      stack()
        .margin(10)
        .padding(5)
        .text('L1: margin=10, padding=5')
        .add(
          stack()
            .margin(8)
            .padding(4)
            .text('L2: margin=8, padding=4')
            .add(
              stack()
                .margin(6)
                .padding(3)
                .text('L3: margin=6, padding=3')
                .add(
                  stack()
                    .margin(4)
                    .padding(2)
                    .text('L4: margin=4, padding=2')
                    .add(
                      stack()
                        .margin(2)
                        .text('L5: margin=2 (deepest)')
                    )
                )
            )
        )
    )
    .spacer(20)

    // Test 5: Multiple siblings at deep levels
    .text('TEST 5: Multiple Siblings Deep', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .add(
          stack()
            .width(300)
            .gap(5)
            .padding(10)
            .text('Branch A', { bold: true })
            .add(
              flex()
                .gap(5)
                .text('A1')
                .text('A2')
                .text('A3')
            )
            .add(
              flex()
                .gap(5)
                .text('A4')
                .text('A5')
                .text('A6')
            )
        )
        .add(
          stack()
            .width(300)
            .gap(5)
            .padding(10)
            .text('Branch B', { bold: true })
            .add(
              flex()
                .gap(5)
                .text('B1')
                .text('B2')
                .text('B3')
            )
            .add(
              flex()
                .gap(5)
                .text('B4')
                .text('B5')
                .text('B6')
            )
        )
        .add(
          stack()
            .width(300)
            .gap(5)
            .padding(10)
            .text('Branch C', { bold: true })
            .add(
              flex()
                .gap(5)
                .text('C1')
                .text('C2')
                .text('C3')
            )
            .add(
              flex()
                .gap(5)
                .text('C4')
                .text('C5')
                .text('C6')
            )
        )
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Deeply Nested Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Deeply Nested Stress', 'qa-19-deeply-nested-stress');
}

main().catch(console.error);
