/**
 * QA Test 04: Nested Layouts
 *
 * Tests complex nested layout scenarios:
 * - Flex inside Stack
 * - Stack inside Flex
 * - Grid inside Stack
 * - Multiple levels of nesting
 * - Mixed container types
 *
 * Expected: All nested elements should render without overlap
 * or positioning errors.
 *
 * Run: npx tsx examples/qa-04-nested-layouts.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Nested Layouts');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('NESTED LAYOUTS TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Flex inside Stack
    .text('FLEX INSIDE STACK', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .padding(15)
        .text('Outer Stack Container')
        .add(
          flex()
            .justify('space-between')
            .add(stack().padding(5).text('[Flex Child 1]'))
            .add(stack().padding(5).text('[Flex Child 2]'))
            .add(stack().padding(5).text('[Flex Child 3]'))
        )
        .text('After Flex Row')
    )
    .spacer(20)

    // Stack inside Flex
    .text('STACK INSIDE FLEX', { bold: true, underline: true })
    .add(
      flex()
        .justify('space-between')
        .gap(20)
        .add(
          stack()
            .gap(3)
            .padding(10)
            .text('Stack 1', { bold: true })
            .text('Line A')
            .text('Line B')
        )
        .add(
          stack()
            .gap(3)
            .padding(10)
            .text('Stack 2', { bold: true })
            .text('Line A')
            .text('Line B')
            .text('Line C')
        )
        .add(
          stack()
            .gap(3)
            .padding(10)
            .text('Stack 3', { bold: true })
            .text('Line A')
        )
    )
    .spacer(20)

    // Grid inside Stack
    .text('GRID INSIDE STACK', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .padding(15)
        .text('Outer Stack with Grid:')
        .add(
          grid([150, 150, 150])
            .columnGap(10)
            .rowGap(5)
            .cell('A1', { bold: true })
            .cell('A2', { bold: true })
            .cell('A3', { bold: true })
            .headerRow()
            .cell('B1')
            .cell('B2')
            .cell('B3')
            .row()
        )
        .text('After Grid')
    )
    .spacer(20)

    // 3-level nesting
    .text('THREE LEVELS OF NESTING', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .padding(15)
        .text('Level 1: Stack')
        .add(
          flex()
            .gap(20)
            .add(
              stack()
                .gap(5)
                .text('Level 2: Flex')
                .add(
                  stack()
                    .direction('row')
                    .gap(10)
                    .text('Level 3:')
                    .text('Row Stack')
                )
            )
            .add(
              stack()
                .text('Level 2: Sibling')
                .add(
                  flex()
                    .gap(10)
                    .text('L3: Nested')
                    .text('L3: Flex')
                )
            )
        )
    )
    .spacer(20)

    // Complex real-world example
    .text('REAL-WORLD: Invoice Line', { bold: true, underline: true })
    .add(
      flex()
        .justify('space-between')
        .padding(10)
        .add(
          stack()
            .gap(2)
            .text('Product Name', { bold: true })
            .text('SKU: ABC-123')
        )
        .add(
          stack()
            .gap(2)
            .text('Qty: 5', { align: 'right' })
        )
        .add(
          stack()
            .gap(2)
            .text('$10.00', { align: 'right' })
            .text('each', { italic: true, align: 'right' })
        )
        .add(
          stack()
            .text('$50.00', { bold: true, align: 'right' })
        )
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Nested Layouts Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Nested Layouts', 'qa-04-nested-layouts');
}

main().catch(console.error);
