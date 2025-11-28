/**
 * QA Test 03: Stack Direction
 *
 * Tests stack direction (column vs row):
 * - column (default): items stacked vertically
 * - row: items arranged horizontally
 *
 * Also tests:
 * - align property in column mode (horizontal alignment)
 * - vAlign property in row mode (vertical alignment)
 * - gap spacing in both directions
 *
 * Run: npx tsx examples/qa-03-stack-direction.ts
 */

import { LayoutEngine, stack } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Stack Direction');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('STACK DIRECTION TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // direction: column (default)
    .text('direction: COLUMN (default)', { bold: true, underline: true })
    .add(
      stack()
        .direction('column')
        .gap(5)
        .padding(10)
        .text('Item 1 (top)')
        .text('Item 2 (middle)')
        .text('Item 3 (bottom)')
    )
    .spacer(20)

    // direction: row
    .text('direction: ROW', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(30)
        .padding(10)
        .text('Item 1')
        .text('Item 2')
        .text('Item 3')
    )
    .spacer(20)

    // Column with horizontal alignment
    .text('COLUMN with align: left/center/right', { bold: true, underline: true })
    .add(
      stack()
        .gap(15)
        .add(
          stack()
            .direction('column')
            .align('left')
            .width('fill')
            .gap(3)
            .text('align: left')
            .text('[Content A]')
        )
        .add(
          stack()
            .direction('column')
            .align('center')
            .width('fill')
            .gap(3)
            .text('align: center')
            .text('[Content B]')
        )
        .add(
          stack()
            .direction('column')
            .align('right')
            .width('fill')
            .gap(3)
            .text('align: right')
            .text('[Content C]')
        )
    )
    .spacer(20)

    // Row with vertical alignment
    .text('ROW with vAlign: top/center/bottom', { bold: true, underline: true })
    .add(
      stack()
        .gap(20)
        .add(
          stack()
            .direction('row')
            .vAlign('top')
            .gap(20)
            .height(100)
            .text('vAlign: top')
            .add(stack().text('Short'))
            .add(stack().text('Tall').text('Item'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('center')
            .gap(20)
            .height(100)
            .text('vAlign: center')
            .add(stack().text('Short'))
            .add(stack().text('Tall').text('Item'))
        )
        .add(
          stack()
            .direction('row')
            .vAlign('bottom')
            .gap(20)
            .height(100)
            .text('vAlign: bottom')
            .add(stack().text('Short'))
            .add(stack().text('Tall').text('Item'))
        )
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Stack Direction Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Stack Direction', 'qa-03-stack-direction');
}

main().catch(console.error);
