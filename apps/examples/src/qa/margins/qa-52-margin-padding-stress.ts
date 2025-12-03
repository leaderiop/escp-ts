/**
 * QA Example 52: Margin and Padding Stress Test
 *
 * This example stress-tests margin and padding interactions
 * to expose spacing calculation bugs.
 *
 * Test Cases:
 * - Large margins
 * - Negative-looking edge cases
 * - Margin collapse behavior
 * - Auto margins in different contexts
 * - Padding + margin combination
 * - Asymmetric margins
 * - Margins on nested containers
 *
 * Run: npx tsx examples/qa-52-margin-padding-stress.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('QA: Margin/Padding Stress Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(10)
    .padding(20)

    // Title
    .text('MARGIN/PADDING STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // TEST 1: Large margins
    .text('TEST 1: Large margins (100px all sides)', { bold: true, underline: true })
    .add(
      stack()
        .text('Before large margin box')
        .add(stack().margin(100).padding(10).text('Content with 100px margin'))
        .text('After large margin box')
    )
    .spacer(10)

    // TEST 2: Auto margin centering with explicit width
    .text('TEST 2: Auto margin with explicit width', { bold: true, underline: true })
    .add(
      stack().add(
        stack().width(300).margin('auto').padding(10).text('300px wide, centered via margin auto')
      )
    )
    .spacer(10)

    // TEST 3: Auto margin with percentage width
    .text('TEST 3: Auto margin with 50% width', { bold: true, underline: true })
    .add(stack().add(stack().width('50%').margin('auto').padding(10).text('50% width centered')))
    .spacer(10)

    // TEST 4: Stacked margins (should they collapse?)
    .text('TEST 4: Adjacent margins (40px + 40px)', { bold: true, underline: true })
    .add(
      stack()
        .gap(0) // No gap, testing margin behavior
        .add(stack().margin({ bottom: 40 }).text('Box with 40px bottom margin'))
        .add(stack().margin({ top: 40 }).text('Box with 40px top margin'))
    )
    .spacer(10)

    // TEST 5: Asymmetric margins
    .text('TEST 5: Asymmetric margins', { bold: true, underline: true })
    .add(
      stack().add(
        stack()
          .margin({ top: 10, right: 200, bottom: 30, left: 50 })
          .padding(5)
          .text('T:10, R:200, B:30, L:50')
      )
    )
    .spacer(10)

    // TEST 6: Nested margins
    .text('TEST 6: Nested containers with margins', { bold: true, underline: true })
    .add(
      stack()
        .margin(20)
        .padding(10)
        .text('Outer: margin(20) padding(10)')
        .add(
          stack()
            .margin(15)
            .padding(8)
            .text('Middle: margin(15) padding(8)')
            .add(stack().margin(10).padding(5).text('Inner: margin(10) padding(5)'))
        )
    )
    .spacer(10)

    // TEST 7: Margins in flex
    .text('TEST 7: Margins in flex layout', { bold: true, underline: true })
    .add(
      flex()
        .gap(0)
        .add(stack().margin({ left: 20, right: 20 }).text('LR:20'))
        .add(stack().margin({ left: 40, right: 10 }).text('L:40 R:10'))
        .add(stack().margin({ left: 10, right: 40 }).text('L:10 R:40'))
    )
    .spacer(10)

    // TEST 8: Padding only (no margin)
    .text('TEST 8: Large padding (50px)', { bold: true, underline: true })
    .add(stack().padding(50).text('Content with 50px padding all around').text('Second line'))
    .spacer(10)

    // TEST 9: Zero margin/padding
    .text('TEST 9: Zero margin and padding', { bold: true, underline: true })
    .add(stack().margin(0).padding(0).text('No margin').text('No padding'))
    .spacer(10)

    // TEST 10: Auto margins in horizontal stack
    .text('TEST 10: Auto margin in row stack', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .add(stack().width(100).text('Left'))
        .add(stack().width(100).margin('auto').text('Center?'))
        .add(stack().width(100).text('Right'))
    )
    .spacer(10)

    // TEST 11: Text with margin
    .text('TEST 11: Direct text margin', { bold: true, underline: true })
    .add(
      stack()
        .gap(0)
        .text('Normal text')
        .text('Text with margin(30)', { margin: 30 } as any)
        .text('Back to normal')
    )
    .spacer(10)

    // Footer
    .line('-', 'fill')
    .text('End of Margin/Padding Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Margin/Padding', 'qa-52-margin-padding-stress');
}

main().catch(console.error);
