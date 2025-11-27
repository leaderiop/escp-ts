/**
 * QA Test 23: Relative Positioning Comprehensive
 *
 * Tests relative positioning offsets:
 * - Positive and negative offsets
 * - Combined X and Y offsets
 * - Relative positioning within flex/grid
 * - Multiple relative elements in sequence
 * - Relative should not affect siblings
 *
 * Run: npx tsx examples/qa-23-relative-positioning.ts
 */

import { LayoutEngine, stack, flex, grid } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Relative Positioning');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('RELATIVE POSITIONING TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Basic positive offsets
    .text('TEST 1: Positive Offsets', { bold: true, underline: true })
    .text('Normal position reference:')
    .add(
      stack()
        .gap(5)
        .text('[Normal Text]')
        .add(
          stack()
            .relativePosition(50, 0)
            .text('[+50, 0] Offset right')
        )
        .add(
          stack()
            .relativePosition(0, 20)
            .text('[0, +20] Offset down')
        )
        .add(
          stack()
            .relativePosition(100, 30)
            .text('[+100, +30] Both offsets')
        )
    )
    .spacer(40)

    // Test 2: Negative offsets
    .text('TEST 2: Negative Offsets', { bold: true, underline: true })
    .text('Reference line (items offset from normal position):')
    .add(
      stack()
        .margin({ left: 200 })
        .gap(10)
        .text('[Base Position]')
        .add(
          stack()
            .relativePosition(-50, 0)
            .text('[-50, 0] Left')
        )
        .add(
          stack()
            .relativePosition(-100, 0)
            .text('[-100, 0] More Left')
        )
    )
    .spacer(30)

    // Test 3: Relative in flex
    .text('TEST 3: Relative Positioning in Flex', { bold: true, underline: true })
    .add(
      flex()
        .gap(50)
        .justify('start')
        .text('[A - Normal]')
        .add(
          stack()
            .relativePosition(0, -15)
            .text('[B - Up 15]')
        )
        .text('[C - Normal]')
        .add(
          stack()
            .relativePosition(0, 15)
            .text('[D - Down 15]')
        )
        .text('[E - Normal]')
    )
    .spacer(30)

    // Test 4: Relative in grid cells
    .text('TEST 4: Relative Positioning in Grid', { bold: true, underline: true })
    .add(
      grid([300, 300, 300])
        .columnGap(20)
        .rowGap(15)
        .cell('Normal Cell')
        .cell(
          stack()
            .relativePosition(30, 0)
            .text('Shifted Right')
        )
        .cell(
          stack()
            .relativePosition(-20, 0)
            .text('Shifted Left')
        )
        .row()
        .cell(
          stack()
            .relativePosition(0, 10)
            .text('Shifted Down')
        )
        .cell('Normal Cell')
        .cell(
          stack()
            .relativePosition(20, -5)
            .text('Both Shifted')
        )
        .row()
    )
    .spacer(30)

    // Test 5: Siblings unaffected
    .text('TEST 5: Relative Does Not Affect Siblings', { bold: true, underline: true })
    .text('Each line should maintain normal vertical spacing:')
    .add(
      stack()
        .gap(10)
        .text('Line 1 - Normal')
        .add(
          stack()
            .relativePosition(200, 0)
            .text('<< Line 2 - Relative offset right')
        )
        .text('Line 3 - Should be at normal position')
        .text('Line 4 - Should be at normal position')
    )
    .spacer(30)

    // Test 6: Combined with margin
    .text('TEST 6: Relative + Margin', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .text('Reference start')
        .add(
          stack()
            .margin({ left: 100 })
            .relativePosition(50, 0)
            .text('margin-left:100 + relative(50,0)')
        )
        .text('After element')
    )
    .spacer(30)

    // Test 7: Stacked relative elements
    .text('TEST 7: Multiple Relative Elements in Sequence', { bold: true, underline: true })
    .add(
      stack()
        .gap(5)
        .add(stack().relativePosition(0, 0).text('[0,0]'))
        .add(stack().relativePosition(50, 0).text('[50,0]'))
        .add(stack().relativePosition(100, 0).text('[100,0]'))
        .add(stack().relativePosition(150, 0).text('[150,0]'))
        .add(stack().relativePosition(200, 0).text('[200,0]'))
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Relative Positioning Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Relative Positioning', 'qa-23-relative-positioning');
}

main().catch(console.error);
