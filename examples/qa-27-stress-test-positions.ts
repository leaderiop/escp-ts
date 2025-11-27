/**
 * QA Test 27: Position Calculation Stress Test
 *
 * This test puts stress on the layout engine by creating complex
 * combinations of positioning to verify calculations are correct:
 *
 * 1. Deep nesting with margins at each level
 * 2. Absolute positioning inside relative containers
 * 3. Multiple elements with auto-margins
 * 4. Grid inside flex inside stack
 * 5. Percentage widths at multiple nesting levels
 *
 * Run: npx tsx examples/qa-27-stress-test-positions.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Position Calculation Stress');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(30)
    .padding(20)

    // Title
    .text('POSITION CALCULATION STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: 5 levels of nesting with margins
    .text('TEST 1: 5 LEVELS OF NESTING WITH MARGINS', { bold: true, underline: true })
    .add(
      stack()
        .margin(10)
        .padding(10)
        .text('Level 1 (margin:10, padding:10)')
        .add(
          stack()
            .margin(10)
            .padding(10)
            .text('Level 2 (margin:10, padding:10)')
            .add(
              stack()
                .margin(10)
                .padding(10)
                .text('Level 3 (margin:10, padding:10)')
                .add(
                  stack()
                    .margin(10)
                    .padding(10)
                    .text('Level 4 (margin:10, padding:10)')
                    .add(
                      stack()
                        .margin(10)
                        .padding(10)
                        .text('Level 5 - DEEPEST')
                    )
                )
            )
        )
    )
    .spacer(20)

    // Test 2: Multiple auto-margin elements
    .text('TEST 2: MULTIPLE AUTO-MARGIN ELEMENTS', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(stack().width(600).margin('auto').text('600 dot centered'))
        .add(stack().width(400).margin('auto').text('400 dot centered'))
        .add(stack().width(800).margin('auto').text('800 dot centered'))
        .add(stack().width(200).margin('auto').text('200 centered'))
    )
    .spacer(20)

    // Test 3: Grid inside Flex inside Stack
    .text('TEST 3: GRID INSIDE FLEX INSIDE STACK', { bold: true, underline: true })
    .add(
      stack()
        .padding(15)
        .gap(10)
        .text('Outer Stack')
        .add(
          flex()
            .gap(30)
            .justify('space-between')
            .add(
              stack()
                .padding(10)
                .text('Flex Item 1')
                .add(
                  grid([100, 100])
                    .columnGap(5)
                    .cell('G1').cell('G2').row()
                    .cell('G3').cell('G4').row()
                )
            )
            .add(
              stack()
                .padding(10)
                .text('Flex Item 2')
                .add(
                  grid([100, 100])
                    .columnGap(5)
                    .cell('A1').cell('A2').row()
                    .cell('A3').cell('A4').row()
                )
            )
            .add(
              stack()
                .padding(10)
                .text('Flex Item 3')
        )
        )
    )
    .spacer(20)

    // Test 4: Percentage widths at multiple levels
    .text('TEST 4: NESTED PERCENTAGE WIDTHS', { bold: true, underline: true })
    .add(
      stack()
        .width('100%')
        .padding(10)
        .text('100% width container')
        .add(
          stack()
            .width('80%')
            .padding(10)
            .text('80% of parent')
            .add(
              stack()
                .width('50%')
                .padding(10)
                .text('50% of 80% = 40%')
                .add(
                  stack()
                    .width('50%')
                    .padding(10)
                    .text('50% of 40% = 20%')
                )
            )
        )
    )
    .spacer(20)

    // Test 5: Flex with percentage width children
    .text('TEST 5: FLEX WITH PERCENTAGE CHILDREN', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .add(stack().width('25%').padding(10).text('25%'))
        .add(stack().width('50%').padding(10).text('50%'))
        .add(stack().width('25%').padding(10).text('25%'))
    )
    .spacer(20)

    // Test 6: Asymmetric margins accumulation
    .text('TEST 6: ASYMMETRIC MARGIN ACCUMULATION', { bold: true, underline: true })
    .add(
      stack()
        .margin({ left: 50, right: 10, top: 5, bottom: 5 })
        .text('Left:50, Right:10')
        .add(
          stack()
            .margin({ left: 30, right: 20 })
            .text('Nested: Left:30, Right:20')
            .add(
              stack()
                .margin({ left: 20, right: 30 })
                .text('Deep: Left:20, Right:30')
            )
        )
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Position Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Position Stress Test', 'qa-27-stress-test-positions');
}

main().catch(console.error);
