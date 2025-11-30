/**
 * QA Test 08: Margin and Padding Combinations
 *
 * Tests various margin and padding combinations:
 * - Margin only
 * - Padding only
 * - Both margin and padding
 * - Different sides (top, right, bottom, left)
 * - Nested elements with margins
 * - Auto margin centering
 *
 * Run: npx tsx examples/qa-08-margin-padding-combo.ts
 */

import { LayoutEngine, stack, flex } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../../_helpers';

async function main() {
  printSection('QA Test: Margin and Padding Combinations');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text('MARGIN + PADDING COMBINATIONS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Uniform margin
    .text('UNIFORM MARGIN (30)', { bold: true, underline: true })
    .text('Reference line')
    .add(stack().margin(30).text('>>> Content with margin(30) <<<'))
    .text('Reference line')
    .spacer(10)

    // Uniform padding
    .text('UNIFORM PADDING (30)', { bold: true, underline: true })
    .text('Reference line')
    .add(stack().padding(30).text('>>> Content with padding(30) <<<'))
    .text('Reference line')
    .spacer(10)

    // Both margin and padding
    .text('MARGIN (20) + PADDING (20)', { bold: true, underline: true })
    .text('Reference line')
    .add(
      stack().margin(20).padding(20).text('>>> Content with both <<<').text('Total offset: 40 dots')
    )
    .text('Reference line')
    .spacer(10)

    // Per-side margins
    .text('PER-SIDE MARGINS', { bold: true, underline: true })
    .text('margin({ top: 5, right: 100, bottom: 20, left: 50 }):')
    .add(
      stack()
        .margin({ top: 5, right: 100, bottom: 20, left: 50 })
        .text('Asymmetric margins')
        .text('Left=50, Right=100')
    )
    .text('After element')
    .spacer(10)

    // Per-side padding
    .text('PER-SIDE PADDING', { bold: true, underline: true })
    .text('padding({ top: 5, right: 50, bottom: 30, left: 100 }):')
    .add(
      stack()
        .padding({ top: 5, right: 50, bottom: 30, left: 100 })
        .text('Asymmetric padding')
        .text('Left=100, Right=50')
    )
    .text('After element')
    .spacer(10)

    // Nested margins
    .text('NESTED ELEMENTS WITH MARGINS', { bold: true, underline: true })
    .add(
      stack()
        .margin(20)
        .padding(10)
        .text('Outer (margin: 20, padding: 10)')
        .add(
          stack()
            .margin(15)
            .padding(5)
            .text('Inner (margin: 15, padding: 5)')
            .add(stack().margin(10).text('Innermost (margin: 10)'))
        )
    )
    .spacer(10)

    // Auto margin centering
    .text('AUTO MARGIN CENTERING', { bold: true, underline: true })
    .add(
      stack()
        .margin('auto')
        .width(400)
        .padding(15)
        .text('Centered with margin: auto', { align: 'center' })
        .text('Width: 400', { align: 'center' })
    )
    .spacer(10)

    // Auto margin with fixed width comparison
    .text('AUTO MARGIN WIDTH COMPARISON', { bold: true, underline: true })
    .add(
      stack()
        .margin('auto')
        .width(600)
        .padding(10)
        .text('Width: 600 (centered)', { align: 'center' })
    )
    .add(
      stack()
        .margin('auto')
        .width(400)
        .padding(10)
        .text('Width: 400 (centered)', { align: 'center' })
    )
    .add(stack().margin('auto').width(200).padding(10).text('Width: 200', { align: 'center' }))
    .spacer(10)

    // Mixed margin on left only
    .text('LEFT/RIGHT MARGIN ONLY', { bold: true, underline: true })
    .text('margin({ left: 200 }):')
    .add(stack().margin({ left: 200 }).text('Indented 200 from left'))
    .text('margin({ right: 200 }) - pushes from right:')
    .add(stack().margin({ right: 200 }).text('200 margin on right'))
    .spacer(10)

    // Footer
    .line('-', 'fill')
    .text('End of Margin/Padding Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Margin/Padding', 'qa-08-margin-padding-combo');
}

main().catch(console.error);
