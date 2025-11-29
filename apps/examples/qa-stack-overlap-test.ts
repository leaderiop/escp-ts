/**
 * QA Stack Overlap Test - Testing for overlapping element bugs
 *
 * Tests scenarios where elements might incorrectly overlap:
 * 1. Adjacent stacks with varying sizes
 * 2. Row stacks with mixed height children
 * 3. Nested stacks with padding accumulation
 * 4. Stack with absolute positioned children
 * 5. Stack with negative margin scenarios (if supported)
 *
 * Run: npx tsx examples/qa-stack-overlap-test.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Stack Overlap Test');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('STACK OVERLAP TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // TEST 1: Adjacent column stacks - should not overlap
    .text('TEST 1: Adjacent column stacks (gap: 10)', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(
          stack().padding(10).text('Stack A Line 1').text('Stack A Line 2').text('Stack A Line 3')
        )
        .add(stack().padding(10).text('Stack B Line 1').text('Stack B Line 2'))
        .add(stack().padding(10).text('Stack C Single Line'))
    )
    .spacer(15)

    // TEST 2: Row stacks with different height children
    .text('TEST 2: Row stacks with height differences', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(15)
        .add(stack().width(250).padding(10).text('Short'))
        .add(stack().width(250).padding(10).text('Medium').text('Height'))
        .add(stack().width(250).padding(10).text('Tall').text('Element').text('Here').text('More'))
        .add(stack().width(250).padding(10).text('Short'))
    )
    .spacer(15)

    // TEST 3: Nested stacks with accumulated padding
    .text('TEST 3: Nested stacks with padding accumulation', { bold: true, underline: true })
    .add(
      stack()
        .padding(20)
        .text('Outer padding: 20')
        .add(
          stack()
            .padding(15)
            .text('Middle padding: 15')
            .add(
              stack()
                .padding(10)
                .text('Inner padding: 10')
                .text('Content should be properly indented')
            )
        )
    )
    .spacer(15)

    // TEST 4: Row inside column - boundary test
    .text('TEST 4: Row inside column boundary test', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(5)
        .text('Line before row')
        .add(
          stack()
            .direction('row')
            .gap(20)
            .add(stack().padding(5).text('[Col1]'))
            .add(stack().padding(5).text('[Col2]'))
            .add(stack().padding(5).text('[Col3]'))
        )
        .text('Line after row')
        .add(
          stack()
            .direction('row')
            .gap(20)
            .add(stack().padding(5).text('[A]'))
            .add(stack().padding(5).text('[B]'))
        )
        .text('Final line')
    )
    .spacer(15)

    // TEST 5: Tight spacing test
    .text('TEST 5: Tight spacing (gap: 2)', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(2)
        .text('Line 1')
        .text('Line 2')
        .text('Line 3')
        .text('Line 4')
        .text('Line 5')
    )
    .spacer(15)

    // TEST 6: Wide and narrow alternating
    .text('TEST 6: Alternating wide and narrow elements', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(5)
        .align('left')
        .add(stack().width(1000).padding(5).text('Wide element (1000px)'))
        .add(stack().width(200).padding(5).text('Narrow (200px)'))
        .add(stack().width(800).padding(5).text('Medium-wide (800px)'))
        .add(stack().width(150).padding(5).text('Tiny'))
        .add(stack().width(1200).padding(5).text('Extra wide element (1200px)'))
    )
    .spacer(15)

    // TEST 7: Stack with absolute positioned child
    .text('TEST 7: Stack with absolute positioned child', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .height(150)
        .text('Normal flow item 1')
        .text('Normal flow item 2')
        .add(stack().absolutePosition(600, 0).text('[Absolute at 600,0]'))
        .text('Normal flow item 3')
    )
    .spacer(15)

    // TEST 8: Multiple rows stacked
    .text('TEST 8: Multiple row stacks stacked vertically', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(10)
        .add(
          stack()
            .direction('row')
            .gap(15)
            .add(stack().width(200).padding(5).text('Row1-A'))
            .add(stack().width(200).padding(5).text('Row1-B'))
            .add(stack().width(200).padding(5).text('Row1-C'))
        )
        .add(
          stack()
            .direction('row')
            .gap(15)
            .add(stack().width(200).padding(5).text('Row2-A'))
            .add(stack().width(200).padding(5).text('Row2-B'))
            .add(stack().width(200).padding(5).text('Row2-C'))
        )
        .add(
          stack()
            .direction('row')
            .gap(15)
            .add(stack().width(200).padding(5).text('Row3-A'))
            .add(stack().width(200).padding(5).text('Row3-B'))
            .add(stack().width(200).padding(5).text('Row3-C'))
        )
    )
    .spacer(15)

    // TEST 9: Complex nesting pattern
    .text('TEST 9: Complex nesting pattern', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(10)
        .add(
          stack()
            .direction('row')
            .gap(20)
            .add(
              stack()
                .width(400)
                .direction('column')
                .gap(5)
                .text('Left Column')
                .text('Item 1')
                .text('Item 2')
            )
            .add(
              stack()
                .width(400)
                .direction('column')
                .gap(5)
                .text('Right Column')
                .add(stack().direction('row').gap(10).text('Nested').text('Row'))
                .text('After nested row')
            )
        )
        .text('After the row container')
    )
    .spacer(15)

    // TEST 10: Same-line text collision check
    .text('TEST 10: Same-line text elements (should not collide)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(0)
        .add(stack().text('AAAA'))
        .add(stack().text('BBBB'))
        .add(stack().text('CCCC'))
        .add(stack().text('DDDD'))
        .add(stack().text('EEEE'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Stack Overlap Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Stack Overlap Test', 'qa-stack-overlap-test');
}

main().catch(console.error);
