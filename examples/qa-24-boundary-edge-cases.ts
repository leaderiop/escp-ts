/**
 * QA Test 24: Boundary and Edge Cases
 *
 * Tests extreme boundary conditions:
 * - Zero dimensions
 * - Empty containers
 * - Single character text
 * - Very long text without wrapping
 * - Maximum nesting depth
 * - Zero gap with many items
 *
 * Run: npx tsx examples/qa-24-boundary-edge-cases.ts
 */

import { LayoutEngine, stack, flex, grid, spacer } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Boundary Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('BOUNDARY EDGE CASES TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Empty containers
    .text('TEST 1: Empty Containers', { bold: true, underline: true })
    .text('Before empty stack')
    .add(stack())
    .text('After empty stack')
    .text('Before empty flex')
    .add(flex())
    .text('After empty flex')
    .spacer(15)

    // Test 2: Single character
    .text('TEST 2: Single Character Elements', { bold: true, underline: true })
    .add(
      flex()
        .gap(5)
        .text('A')
        .text('B')
        .text('C')
        .text('D')
        .text('E')
    )
    .add(
      grid([50, 50, 50, 50, 50])
        .columnGap(5)
        .cell('1').cell('2').cell('3').cell('4').cell('5').row()
    )
    .spacer(15)

    // Test 3: Zero width/height spacers
    .text('TEST 3: Zero-Size Spacers', { bold: true, underline: true })
    .text('Text before zero spacer')
    .add(spacer(0))
    .text('Text after zero spacer - should be adjacent')
    .spacer(15)

    // Test 4: Zero gap with many items
    .text('TEST 4: Zero Gap, Many Items', { bold: true, underline: true })
    .add(
      flex()
        .gap(0)
        .text('[1]')
        .text('[2]')
        .text('[3]')
        .text('[4]')
        .text('[5]')
        .text('[6]')
        .text('[7]')
        .text('[8]')
        .text('[9]')
        .text('[10]')
    )
    .spacer(15)

    // Test 5: Very long single-line text
    .text('TEST 5: Long Single-Line Text', { bold: true, underline: true })
    .text('This is an extremely long line of text that is designed to test how the layout engine handles text that extends well beyond the normal printable area and should demonstrate any clipping or overflow behavior that might occur when content is too wide for the available space.')
    .spacer(15)

    // Test 6: Minimal margin/padding values
    .text('TEST 6: Minimal Values (1 dot)', { bold: true, underline: true })
    .add(
      stack()
        .margin(1)
        .padding(1)
        .gap(1)
        .text('margin:1, padding:1, gap:1')
        .text('Second line')
        .text('Third line')
    )
    .spacer(15)

    // Test 7: Grid with single cell
    .text('TEST 7: Single Cell Grid', { bold: true, underline: true })
    .add(
      grid([500])
        .cell('Single cell grid')
        .row()
    )
    .spacer(15)

    // Test 8: Flex with single item
    .text('TEST 8: Single Item Flex', { bold: true, underline: true })
    .text('justify: start')
    .add(flex().justify('start').text('[Single]'))
    .text('justify: center')
    .add(flex().justify('center').text('[Single]'))
    .text('justify: end')
    .add(flex().justify('end').text('[Single]'))
    .text('justify: space-between (should be at start)')
    .add(flex().justify('space-between').text('[Single]'))
    .spacer(15)

    // Test 9: Deeply nested single items
    .text('TEST 9: Deep Single-Item Nesting', { bold: true, underline: true })
    .add(
      stack()
        .add(
          flex()
            .add(
              stack()
                .add(
                  flex()
                    .add(
                      stack()
                        .text('5 levels deep')
                    )
                )
            )
        )
    )
    .spacer(15)

    // Test 10: Grid with all fill columns
    .text('TEST 10: All Fill Columns (5x)', { bold: true, underline: true })
    .add(
      grid(['fill', 'fill', 'fill', 'fill', 'fill'])
        .columnGap(5)
        .cell('F1').cell('F2').cell('F3').cell('F4').cell('F5').row()
        .cell('A').cell('B').cell('C').cell('D').cell('E').row()
    )
    .spacer(15)

    // Test 11: Mixed width types stress
    .text('TEST 11: Mixed Width Types', { bold: true, underline: true })
    .add(
      grid([50, '10%', 'auto', 'fill', 100, '20%'])
        .columnGap(5)
        .cell('50')
        .cell('10%')
        .cell('auto')
        .cell('fill')
        .cell('100')
        .cell('20%')
        .row()
    )
    .spacer(15)

    // Test 12: Percentage width stack
    .text('TEST 12: Percentage Width Elements', { bold: true, underline: true })
    .add(
      stack()
        .width('50%')
        .padding(10)
        .text('Stack at 50% width')
        .text('Should be half the container')
    )
    .add(
      stack()
        .width('100%')
        .padding(10)
        .text('Stack at 100% width')
    )
    .spacer(10)

    // Footer
    .line('-', 'fill')
    .text('End of Boundary Edge Cases Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Boundary Edge Cases', 'qa-24-boundary-edge-cases');
}

main().catch(console.error);
