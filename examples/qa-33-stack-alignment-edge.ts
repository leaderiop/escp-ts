/**
 * QA Test 33: Stack Alignment Edge Cases
 *
 * Tests stack alignment in both column and row directions to verify:
 * - Horizontal alignment (left, center, right) in column stacks
 * - Vertical alignment (top, center, bottom) in row stacks
 * - Alignment with variable child sizes
 * - No black holes or misaligned elements
 *
 * Run: npx tsx examples/qa-33-stack-alignment-edge.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Stack Alignment Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('STACK ALIGNMENT EDGE CASES', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(10)

    // Test 1: Column stack with left align
    .text('TEST 1: Column stack - align: LEFT', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('left')
        .gap(5)
        .add(stack().width(400).padding(5).text('[400px element]'))
        .add(stack().width(600).padding(5).text('[600px element]'))
        .add(stack().width(300).padding(5).text('[300px element]'))
    )
    .spacer(15)

    // Test 2: Column stack with center align
    .text('TEST 2: Column stack - align: CENTER', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('center')
        .gap(5)
        .add(stack().width(400).padding(5).text('[400px centered]'))
        .add(stack().width(600).padding(5).text('[600px centered]'))
        .add(stack().width(300).padding(5).text('[300px centered]'))
    )
    .spacer(15)

    // Test 3: Column stack with right align
    .text('TEST 3: Column stack - align: RIGHT', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('right')
        .gap(5)
        .add(stack().width(400).padding(5).text('[400px right]'))
        .add(stack().width(600).padding(5).text('[600px right]'))
        .add(stack().width(300).padding(5).text('[300px right]'))
    )
    .spacer(15)

    // Test 4: Row stack with top align
    .text('TEST 4: Row stack - vAlign: TOP', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('top')
        .gap(20)
        .add(stack().width(300).padding(10).text('Short'))
        .add(stack().width(300).padding(20).text('Medium height with more padding'))
        .add(stack().width(300).padding(30).text('Tall element with lots of padding making it taller'))
    )
    .spacer(15)

    // Test 5: Row stack with center align
    .text('TEST 5: Row stack - vAlign: CENTER', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(20)
        .add(stack().width(300).padding(10).text('Short'))
        .add(stack().width(300).padding(20).text('Medium height with more padding'))
        .add(stack().width(300).padding(30).text('Tall element with lots of padding making it taller'))
    )
    .spacer(15)

    // Test 6: Row stack with bottom align
    .text('TEST 6: Row stack - vAlign: BOTTOM', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('bottom')
        .gap(20)
        .add(stack().width(300).padding(10).text('Short'))
        .add(stack().width(300).padding(20).text('Medium height with more padding'))
        .add(stack().width(300).padding(30).text('Tall element with lots of padding making it taller'))
    )
    .spacer(15)

    // Test 7: Nested stacks with mixed alignment
    .text('TEST 7: Nested stacks with different alignments', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('center')
        .gap(15)
        .add(
          stack()
            .direction('row')
            .vAlign('center')
            .width(1000)
            .gap(10)
            .add(stack().width(200).padding(10).text('[Left]'))
            .add(stack().width(200).padding(20).text('[Taller]'))
            .add(stack().width(200).padding(10).text('[Right]'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('top')
            .width(800)
            .gap(10)
            .add(stack().width(200).padding(10).text('[Top aligned]'))
            .add(stack().width(200).padding(20).text('[Items]'))
        )
    )
    .spacer(15)

    // Test 8: Single child alignment
    .text('TEST 8: Single child alignment (edge case)', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('center')
        .add(stack().width(500).padding(10).text('Single centered child'))
    )
    .add(
      stack()
        .direction('column')
        .align('right')
        .add(stack().width(500).padding(10).text('Single right-aligned child'))
    )
    .spacer(15)

    // Test 9: Zero width children (edge case)
    .text('TEST 9: Auto-width children in aligned stack', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .align('center')
        .gap(5)
        .text('Short text')
        .text('A much longer piece of text that takes more space')
        .text('Medium text here')
    )
    .spacer(15)

    // Test 10: Row stack with auto-height children
    .text('TEST 10: Row stack with variable heights', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .vAlign('center')
        .gap(30)
        .add(
          stack()
            .width(400)
            .gap(5)
            .text('Multi-line')
            .text('content')
            .text('here')
        )
        .add(stack().width(400).text('Single line'))
        .add(
          stack()
            .width(400)
            .gap(5)
            .text('Another')
            .text('multi-line')
            .text('block')
            .text('of text')
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Stack Alignment Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Stack Alignment Edge Cases', 'qa-33-stack-alignment-edge');
}

main().catch(console.error);
