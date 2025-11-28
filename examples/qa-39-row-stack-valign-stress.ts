/**
 * QA Test 39: Row Stack Vertical Alignment Stress Test
 *
 * Tests row stack (horizontal) vertical alignment edge cases:
 * - vAlign with different height children
 * - vAlign with nested containers of varying padding
 * - vAlign center with odd vs even height differences
 * - vAlign at container boundaries
 * - Single vs multiple children alignment
 *
 * Run: npx tsx examples/qa-39-row-stack-valign-stress.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Row Stack vAlign Stress');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('ROW STACK VERTICAL ALIGNMENT STRESS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Basic vAlign comparison
    .text('TEST 1: vAlign comparison - same children, different alignment', { bold: true, underline: true })
    .text('TOP alignment:')
    .add(
      stack()
        .direction('row')
        .vAlign('top')
        .gap(20)
        .add(stack().width(200).padding(10).text('Short'))
        .add(stack().width(200).padding(30).text('Medium'))
        .add(stack().width(200).padding(50).text('Tall'))
    )
    .text('CENTER alignment:')
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(20)
        .add(stack().width(200).padding(10).text('Short'))
        .add(stack().width(200).padding(30).text('Medium'))
        .add(stack().width(200).padding(50).text('Tall'))
    )
    .text('BOTTOM alignment:')
    .add(
      stack()
        .direction('row')
        .vAlign('bottom')
        .gap(20)
        .add(stack().width(200).padding(10).text('Short'))
        .add(stack().width(200).padding(30).text('Medium'))
        .add(stack().width(200).padding(50).text('Tall'))
    )
    .spacer(15)

    // Test 2: Multi-line content alignment
    .text('TEST 2: Multi-line content with vAlign:center', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(30)
        .add(
          stack()
            .width(300)
            .padding(10)
            .text('One line')
        )
        .add(
          stack()
            .width(300)
            .padding(10)
            .text('Two lines')
            .text('of text')
        )
        .add(
          stack()
            .width(300)
            .padding(10)
            .text('Four lines')
            .text('of text')
            .text('for testing')
            .text('alignment')
        )
    )
    .spacer(15)

    // Test 3: Extreme height differences
    .text('TEST 3: Extreme height differences', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(30)
        .add(stack().width(200).padding(5).text('Tiny'))
        .add(
          stack()
            .width(200)
            .padding(80)
            .text('Very tall')
            .text('with lots')
            .text('of padding')
        )
        .add(stack().width(200).padding(5).text('Tiny'))
    )
    .spacer(15)

    // Test 4: vAlign with nested stacks
    .text('TEST 4: vAlign with nested column stacks', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(20)
        .add(
          stack()
            .width(350)
            .direction('column')
            .gap(5)
            .text('Nested stack A')
            .text('Line 2')
        )
        .add(
          stack()
            .width(350)
            .direction('column')
            .gap(5)
            .text('Nested stack B')
            .text('Line 2')
            .text('Line 3')
            .text('Line 4')
            .text('Line 5')
        )
        .add(
          stack()
            .width(350)
            .direction('column')
            .gap(5)
            .text('Nested stack C')
        )
    )
    .spacer(15)

    // Test 5: vAlign with explicit heights
    .text('TEST 5: vAlign with explicit heights', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('bottom')
        .gap(20)
        .add(stack().width(200).height(50).padding(5).text('H:50'))
        .add(stack().width(200).height(100).padding(5).text('H:100'))
        .add(stack().width(200).height(75).padding(5).text('H:75'))
    )
    .spacer(15)

    // Test 6: Single child alignment
    .text('TEST 6: Single child in row stack (edge case)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .height(100)
        .add(stack().width(400).padding(10).text('Single child in center of 100px height container'))
    )
    .spacer(15)

    // Test 7: Row stack inside flex
    .text('TEST 7: Row stack inside flex container', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .justify('space-between')
        .add(
          stack()
            .direction('row')
            .vAlign('top')
            .width(600)
            .gap(10)
            .add(stack().width(150).padding(10).text('Top'))
            .add(stack().width(150).padding(30).text('Top'))
            .add(stack().width(150).padding(20).text('Top'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('bottom')
            .width(600)
            .gap(10)
            .add(stack().width(150).padding(10).text('Btm'))
            .add(stack().width(150).padding(30).text('Btm'))
            .add(stack().width(150).padding(20).text('Btm'))
        )
    )
    .spacer(15)

    // Test 8: Mixed content types
    .text('TEST 8: Mixed content - text vs containers', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(20)
        .text('Plain text item')
        .add(
          stack()
            .width(300)
            .padding(20)
            .text('Container')
            .text('with padding')
        )
        .text('Another plain text')
    )
    .spacer(15)

    // Test 9: Zero height child
    .text('TEST 9: Items with minimal content', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(20)
        .add(stack().width(200).padding(5).text('A'))
        .add(stack().width(200).padding(5).text('B'))
        .add(stack().width(200).padding(5).text('C'))
    )
    .spacer(15)

    // Test 10: Row stack chain
    .text('TEST 10: Multiple row stacks stacked vertically', { bold: true, underline: true })
    .add(
      stack()
        .gap(15)
        .add(
          stack()
            .direction('row')
            .vAlign('top')
            .gap(10)
            .add(stack().width(300).padding(5).text('Row1-A'))
            .add(stack().width(300).padding(15).text('Row1-B'))
            .add(stack().width(300).padding(10).text('Row1-C'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('center')
            .gap(10)
            .add(stack().width(300).padding(10).text('Row2-A'))
            .add(stack().width(300).padding(5).text('Row2-B'))
            .add(stack().width(300).padding(15).text('Row2-C'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('bottom')
            .gap(10)
            .add(stack().width(300).padding(15).text('Row3-A'))
            .add(stack().width(300).padding(10).text('Row3-B'))
            .add(stack().width(300).padding(5).text('Row3-C'))
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Row Stack vAlign Stress Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Row Stack vAlign Stress', 'qa-39-row-stack-valign-stress');
}

main().catch(console.error);
