/**
 * QA Test 11: Edge Cases and Boundary Tests
 *
 * Tests edge cases and unusual configurations:
 * - Empty containers
 * - Single item containers
 * - Very large content
 * - Zero dimensions
 * - Maximum nesting depth
 * - Unicode and special characters
 *
 * Run: npx tsx examples/qa-11-edge-cases.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Edge Cases');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('EDGE CASES AND BOUNDARY TESTS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Empty containers
    .text('EMPTY CONTAINERS', { bold: true, underline: true })
    .text('Empty stack (should show nothing):')
    .add(stack())
    .text('Empty flex (should show nothing):')
    .add(flex())
    .text('After empty containers')
    .spacer(15)

    // Single items
    .text('SINGLE ITEM CONTAINERS', { bold: true, underline: true })
    .text('Flex with one item:')
    .add(
      flex()
        .justify('center')
        .add(stack().padding(10).text('[Single Flex Item]'))
    )
    .text('Grid with one cell:')
    .add(
      grid([200])
        .cell('Single Cell')
        .row()
    )
    .spacer(15)

    // Long text
    .text('LONG TEXT CONTENT', { bold: true, underline: true })
    .text('Single line with very long content that might overflow the available width and needs to be handled appropriately by the layout system without causing visual artifacts or breaking the layout structure:')
    .spacer(15)

    // Many items in flex
    .text('MANY ITEMS IN FLEX (10 items)', { bold: true, underline: true })
    .add(
      flex()
        .wrap('wrap')
        .gap(5)
        .rowGap(5)
        .add(stack().padding(3).text('[1]'))
        .add(stack().padding(3).text('[2]'))
        .add(stack().padding(3).text('[3]'))
        .add(stack().padding(3).text('[4]'))
        .add(stack().padding(3).text('[5]'))
        .add(stack().padding(3).text('[6]'))
        .add(stack().padding(3).text('[7]'))
        .add(stack().padding(3).text('[8]'))
        .add(stack().padding(3).text('[9]'))
        .add(stack().padding(3).text('[10]'))
    )
    .spacer(15)

    // Deep nesting (5 levels)
    .text('DEEP NESTING (5 LEVELS)', { bold: true, underline: true })
    .add(
      stack()
        .padding(5)
        .text('Level 1')
        .add(
          stack()
            .padding(5)
            .margin({ left: 20 })
            .text('Level 2')
            .add(
              stack()
                .padding(5)
                .margin({ left: 20 })
                .text('Level 3')
                .add(
                  stack()
                    .padding(5)
                    .margin({ left: 20 })
                    .text('Level 4')
                    .add(
                      stack()
                        .padding(5)
                        .margin({ left: 20 })
                        .text('Level 5 (deepest)')
                    )
                )
            )
        )
    )
    .spacer(15)

    // Width: 0 edge case
    .text('VERY SMALL WIDTHS', { bold: true, underline: true })
    .text('Width: 50')
    .add(stack().width(50).padding(2).text('50'))
    .text('Width: 30')
    .add(stack().width(30).padding(2).text('30'))
    .spacer(15)

    // Very wide content in narrow container
    .text('WIDE CONTENT IN NARROW CONTAINER', { bold: true, underline: true })
    .add(
      stack()
        .width(200)
        .padding(5)
        .text('This text should fit or wrap')
        .text('Testing narrow container behavior')
    )
    .spacer(15)

    // Numbers and special characters
    .text('SPECIAL CHARACTERS', { bold: true, underline: true })
    .text('Numbers: 0123456789')
    .text('Symbols: !@#$%^&*()_+-=[]{}|;:,.<>?')
    .text('Quotes: "double" and \'single\'')
    .text('Math: 2 + 2 = 4, 10 x 5 = 50')
    .text('Currency: $100.00 | EUR 85.50')
    .spacer(15)

    // Grid with many rows
    .text('GRID WITH MANY ROWS (6 rows)', { bold: true, underline: true })
    .add(
      grid([100, 100, 100])
        .columnGap(10)
        .rowGap(3)
        .cell('R1C1').cell('R1C2').cell('R1C3').row()
        .cell('R2C1').cell('R2C2').cell('R2C3').row()
        .cell('R3C1').cell('R3C2').cell('R3C3').row()
        .cell('R4C1').cell('R4C2').cell('R4C3').row()
        .cell('R5C1').cell('R5C2').cell('R5C3').row()
        .cell('R6C1').cell('R6C2').cell('R6C3').row()
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Edge Cases Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Edge Cases', 'qa-11-edge-cases');
}

main().catch(console.error);
