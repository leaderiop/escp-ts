/**
 * QA Test 20: Stack Row Direction with vAlign
 *
 * Tests stack with direction='row' and various vAlign values:
 * - vAlign: top (default)
 * - vAlign: center
 * - vAlign: bottom
 * - Mixed with children of different heights
 *
 * Run: npx tsx examples/qa-20-stack-row-valign.ts
 */

import { LayoutEngine, stack } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Stack Row vAlign');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('STACK ROW DIRECTION vALIGN TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: vAlign top (default)
    .text('vAlign: TOP (default)', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(20)
        .vAlign('top')
        .add(stack().padding(10).text('Tall').text('Item').text('A'))
        .add(stack().padding(10).text('Short B'))
        .add(stack().padding(10).text('Medium').text('C'))
    )
    .spacer(20)

    // Test 2: vAlign center
    .text('vAlign: CENTER', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(20)
        .vAlign('center')
        .add(stack().padding(10).text('Tall').text('Item').text('A'))
        .add(stack().padding(10).text('Short B'))
        .add(stack().padding(10).text('Medium').text('C'))
    )
    .spacer(20)

    // Test 3: vAlign bottom
    .text('vAlign: BOTTOM', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(20)
        .vAlign('bottom')
        .add(stack().padding(10).text('Tall').text('Item').text('A'))
        .add(stack().padding(10).text('Short B'))
        .add(stack().padding(10).text('Medium').text('C'))
    )
    .spacer(20)

    // Test 4: All three alignments side by side
    .text('COMPARISON: All vAlign Values', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(30)
        .add(
          stack()
            .width(400)
            .gap(5)
            .text('vAlign: top', { bold: true, align: 'center' })
            .add(
              stack()
                .direction('row')
                .gap(10)
                .vAlign('top')
                .add(stack().padding(8).text('Line1').text('Line2').text('Line3'))
                .add(stack().padding(8).text('Short'))
                .add(stack().padding(8).text('L1').text('L2'))
            )
        )
        .add(
          stack()
            .width(400)
            .gap(5)
            .text('vAlign: center', { bold: true, align: 'center' })
            .add(
              stack()
                .direction('row')
                .gap(10)
                .vAlign('center')
                .add(stack().padding(8).text('Line1').text('Line2').text('Line3'))
                .add(stack().padding(8).text('Short'))
                .add(stack().padding(8).text('L1').text('L2'))
            )
        )
        .add(
          stack()
            .width(400)
            .gap(5)
            .text('vAlign: bottom', { bold: true, align: 'center' })
            .add(
              stack()
                .direction('row')
                .gap(10)
                .vAlign('bottom')
                .add(stack().padding(8).text('Line1').text('Line2').text('Line3'))
                .add(stack().padding(8).text('Short'))
                .add(stack().padding(8).text('L1').text('L2'))
            )
        )
    )
    .spacer(20)

    // Test 5: Row with extreme height differences
    .text('EXTREME HEIGHT DIFFERENCES', { bold: true, underline: true })
    .text('Testing vAlign with 1 line vs 5 lines:')
    .add(
      stack()
        .direction('row')
        .gap(30)
        .vAlign('center')
        .add(stack().padding(10).text('Single line'))
        .add(
          stack()
            .padding(10)
            .text('Line 1')
            .text('Line 2')
            .text('Line 3')
            .text('Line 4')
            .text('Line 5')
        )
        .add(stack().padding(10).text('Two').text('Lines'))
    )
    .spacer(20)

    // Test 6: Zero gap with vAlign
    .text('ZERO GAP + vAlign', { bold: true, underline: true })
    .add(
      stack()
        .direction('row')
        .gap(0)
        .vAlign('center')
        .add(stack().padding(5).text('[A]'))
        .add(stack().padding(5).text('[BB]').text('[BB]'))
        .add(stack().padding(5).text('[CCC]').text('[CCC]').text('[CCC]'))
        .add(stack().padding(5).text('[DD]'))
        .add(stack().padding(5).text('[E]'))
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Stack Row vAlign Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Stack Row vAlign', 'qa-20-stack-row-valign');
}

main().catch(console.error);
