/**
 * QA Stack Stress Test - Comprehensive edge case testing
 *
 * Tests stack layout system for visual bugs:
 * 1. Deeply nested stacks (5+ levels)
 * 2. Mixed column/row directions in nested hierarchy
 * 3. Stack with explicit widths/heights
 * 4. Zero gap edge cases
 * 5. Single child stacks
 * 6. Empty stacks
 * 7. Alignment combinations
 * 8. Overlapping detection scenarios
 *
 * Run: npx tsx examples/qa-stack-stress-test.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Stack Stress Test - Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('STACK STRESS TEST - EDGE CASES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // TEST 1: Deeply nested stacks (5 levels)
    .text('TEST 1: Deeply nested stacks (5 levels deep)', { bold: true, underline: true })
    .add(
      stack() // Level 1
        .gap(5)
        .padding(10)
        .text('Level 1')
        .add(
          stack() // Level 2
            .gap(5)
            .padding(10)
            .text('Level 2')
            .add(
              stack() // Level 3
                .gap(5)
                .padding(10)
                .text('Level 3')
                .add(
                  stack() // Level 4
                    .gap(5)
                    .padding(10)
                    .text('Level 4')
                    .add(
                      stack() // Level 5
                        .gap(5)
                        .padding(10)
                        .text('Level 5 - Deepest')
                    )
                )
            )
        )
    )
    .spacer(15)

    // TEST 2: Mixed column/row nesting
    .text('TEST 2: Mixed column/row nesting pattern', { bold: true, underline: true })
    .add(
      stack() // Column
        .direction('column')
        .gap(10)
        .text('Column Parent')
        .add(
          stack() // Row
            .direction('row')
            .gap(20)
            .text('Row-A')
            .add(
              stack() // Column
                .direction('column')
                .gap(5)
                .text('Col')
                .text('1')
            )
            .add(
              stack() // Column
                .direction('column')
                .gap(5)
                .text('Col')
                .text('2')
            )
            .text('Row-B')
        )
        .text('After nested row')
    )
    .spacer(15)

    // TEST 3: Explicit widths in column stack
    .text('TEST 3: Explicit widths in column stack', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(5)
        .add(stack().width(800).padding(5).text('[800px wide child]'))
        .add(stack().width(400).padding(5).text('[400px]'))
        .add(stack().width(600).padding(5).text('[600px wide]'))
        .add(stack().width(200).padding(5).text('[200]'))
    )
    .spacer(15)

    // TEST 4: Explicit heights in row stack
    .text('TEST 4: Explicit heights in row stack', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(15)
        .vAlign('top')
        .add(stack().width(200).height(40).padding(5).text('H:40'))
        .add(stack().width(200).height(80).padding(5).text('H:80'))
        .add(stack().width(200).height(60).padding(5).text('H:60'))
        .add(stack().width(200).height(100).padding(5).text('H:100'))
    )
    .spacer(15)

    // TEST 5: Zero gap edge case
    .text('TEST 5: Zero gap - items should touch', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(0)
        .add(stack().padding(5).text('[Item A]'))
        .add(stack().padding(5).text('[Item B]'))
        .add(stack().padding(5).text('[Item C]'))
    )
    .add(
      stack()
        .direction('row')
        .gap(0)
        .add(stack().padding(5).text('[X]'))
        .add(stack().padding(5).text('[Y]'))
        .add(stack().padding(5).text('[Z]'))
    )
    .spacer(15)

    // TEST 6: Single child stacks (edge case)
    .text('TEST 6: Single child stacks', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(30)
        .add(
          stack()
            .direction('column')
            .align('center')
            .width(300)
            .text('Single child in centered column')
        )
        .add(
          stack().direction('row').vAlign('center').height(80).text('Single child in centered row')
        )
    )
    .spacer(15)

    // TEST 7: All alignment combinations in column mode
    .text('TEST 7: All alignment combinations (column mode)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(30)
        .add(
          stack()
            .direction('column')
            .align('left')
            .width(350)
            .gap(5)
            .text('align: left')
            .add(stack().width(200).padding(3).text('[200px]'))
            .add(stack().width(150).padding(3).text('[150px]'))
        )
        .add(
          stack()
            .direction('column')
            .align('center')
            .width(350)
            .gap(5)
            .text('align: center')
            .add(stack().width(200).padding(3).text('[200px]'))
            .add(stack().width(150).padding(3).text('[150px]'))
        )
        .add(
          stack()
            .direction('column')
            .align('right')
            .width(350)
            .gap(5)
            .text('align: right')
            .add(stack().width(200).padding(3).text('[200px]'))
            .add(stack().width(150).padding(3).text('[150px]'))
        )
    )
    .spacer(15)

    // TEST 8: All vAlign combinations in row mode
    .text('TEST 8: All vAlign combinations (row mode)', { bold: true, underline: true })
    .text('vAlign: top')
    .add(
      stack()
        .direction('row')
        .vAlign('top')
        .gap(20)
        .add(stack().width(150).padding(5).text('A'))
        .add(stack().width(150).padding(20).text('B').text('taller'))
        .add(stack().width(150).padding(10).text('C'))
    )
    .text('vAlign: center')
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(20)
        .add(stack().width(150).padding(5).text('A'))
        .add(stack().width(150).padding(20).text('B').text('taller'))
        .add(stack().width(150).padding(10).text('C'))
    )
    .text('vAlign: bottom')
    .add(
      stack()
        .direction('row')
        .vAlign('bottom')
        .gap(20)
        .add(stack().width(150).padding(5).text('A'))
        .add(stack().width(150).padding(20).text('B').text('taller'))
        .add(stack().width(150).padding(10).text('C'))
    )
    .spacer(15)

    // TEST 9: Large gap values
    .text('TEST 9: Large gap values', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(50)
        .text('Item 1 (50px gap below)')
        .text('Item 2 (50px gap below)')
        .text('Item 3')
    )
    .spacer(15)

    // TEST 10: Padding vs margin in stacks
    .text('TEST 10: Padding vs margin distinction', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(30)
        .add(stack().padding(20).text('padding: 20'))
        .add(stack().margin(20).text('margin: 20'))
        .add(stack().padding(10).margin(10).text('both: 10'))
    )
    .spacer(15)

    // TEST 11: Width: fill in column stack children
    .text('TEST 11: Width fill in column children', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .width(800)
        .gap(5)
        .add(stack().width('fill').padding(5).text('fill width child 1'))
        .add(stack().width('fill').padding(5).text('fill width child 2'))
        .add(stack().width(400).padding(5).text('fixed 400px'))
    )
    .spacer(15)

    // TEST 12: Percentage widths
    .text('TEST 12: Percentage widths in column stack', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .width(1000)
        .gap(5)
        .add(stack().width('100%').padding(5).text('100% of parent'))
        .add(stack().width('75%').padding(5).text('75% of parent'))
        .add(stack().width('50%').padding(5).text('50% of parent'))
        .add(stack().width('25%').padding(5).text('25%'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Stack Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Stack Stress Test', 'qa-stack-stress-test');
}

main().catch(console.error);
