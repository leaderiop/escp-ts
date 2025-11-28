/**
 * QA Test 31: Absolute and Relative Positioning Edge Cases
 *
 * Tests positioning modes to verify:
 * - Absolute positioning places elements at exact coordinates
 * - Relative positioning offsets from normal flow position
 * - Overlapping elements render correctly
 * - No black holes at position boundaries
 *
 * Run: npx tsx examples/qa-31-absolute-relative-positioning.ts
 */

import { LayoutEngine, stack, flex, text } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Absolute/Relative Positioning');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('ABSOLUTE/RELATIVE POSITIONING TESTS', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // Test 1: Basic absolute positioning
    .text('TEST 1: Basic absolute positioning', { bold: true, underline: true })
    .text('Elements placed at specific X,Y coordinates')
    .add(
      stack()
        .height(150)
        .add(
          stack()
            .absolutePosition(300, 100)
            .text('[Pos: 300,100]')
        )
        .add(
          stack()
            .absolutePosition(800, 120)
            .text('[Pos: 800,120]')
        )
        .add(
          stack()
            .absolutePosition(1500, 140)
            .text('[Pos: 1500,140]')
        )
    )
    .spacer(15)

    // Test 2: Relative positioning offset
    .text('TEST 2: Relative positioning (offset from flow)', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(stack().text('[Normal position]'))
        .add(
          stack()
            .relativePosition(100, 0)
            .text('[Offset X: +100]')
        )
        .add(
          stack()
            .relativePosition(200, 0)
            .text('[Offset X: +200]')
        )
        .add(
          stack()
            .relativePosition(0, -20)
            .text('[Offset Y: -20]')
        )
    )
    .spacer(15)

    // Test 3: Absolute within flex
    .text('TEST 3: Absolute positioned element in flex container', { bold: true, underline: true })
    .add(
      flex()
        .gap(20)
        .add(stack().width(200).text('[Flow Item 1]'))
        .add(
          stack()
            .absolutePosition(1000, 450)
            .text('[Absolute at 1000,450]')
        )
        .add(stack().width(200).text('[Flow Item 2]'))
        .add(stack().width(200).text('[Flow Item 3]'))
    )
    .spacer(15)

    // Test 4: Multiple absolute elements (potential overlap)
    .text('TEST 4: Multiple absolute elements (overlap test)', { bold: true, underline: true })
    .text('Later elements should render on top of earlier ones')
    .add(
      stack()
        .height(120)
        .add(
          stack()
            .absolutePosition(400, 580)
            .text('[First: 400,580]', { bold: true })
        )
        .add(
          stack()
            .absolutePosition(420, 600)
            .text('[Second: 420,600]')
        )
        .add(
          stack()
            .absolutePosition(440, 620)
            .text('[Third: 440,620]', { italic: true })
        )
    )
    .spacer(15)

    // Test 5: Relative with negative offsets
    .text('TEST 5: Relative positioning with negative offsets', { bold: true, underline: true })
    .add(
      stack()
        .gap(30)
        .add(stack().text('[Base position - no offset]'))
        .add(
          stack()
            .relativePosition(-50, 0)
            .text('[Shifted left by 50]')
        )
        .add(
          stack()
            .relativePosition(50, 0)
            .text('[Shifted right by 50]')
        )
    )
    .spacer(15)

    // Test 6: Absolute positioned container with children
    .text('TEST 6: Absolute container with children', { bold: true, underline: true })
    .add(
      stack()
        .height(150)
        .add(
          stack()
            .absolutePosition(600, 850)
            .padding(10)
            .gap(5)
            .text('[Container at 600,850]', { bold: true })
            .text('Child 1 in absolute container')
            .text('Child 2 in absolute container')
        )
    )
    .spacer(15)

    // Test 7: Edge position (near container boundaries)
    .text('TEST 7: Positioning near boundaries', { bold: true, underline: true })
    .add(
      stack()
        .height(100)
        .add(
          stack()
            .absolutePosition(250, 1000)
            .text('[Near left edge: 250]')
        )
        .add(
          stack()
            .absolutePosition(4000, 1020)
            .text('[Far right: 4000]')
        )
    )
    .spacer(15)

    // Test 8: Mixed static, relative, and absolute
    .text('TEST 8: Mixed positioning modes in one container', { bold: true, underline: true })
    .add(
      stack()
        .gap(10)
        .add(stack().text('[Static - normal flow]'))
        .add(
          stack()
            .relativePosition(30, 0)
            .text('[Relative +30x]')
        )
        .add(stack().text('[Static - normal flow]'))
        .add(
          stack()
            .absolutePosition(1800, 1150)
            .text('[Absolute 1800,1150]')
        )
        .add(stack().text('[Static - normal flow]'))
    )
    .spacer(15)

    // Test 9: Absolute with explicit width
    .text('TEST 9: Absolute positioned with explicit width', { bold: true, underline: true })
    .add(
      stack()
        .height(80)
        .add(
          stack()
            .absolutePosition(400, 1250)
            .width(500)
            .padding(10)
            .text('Absolute element with width: 500')
            .text('Should constrain content width')
        )
    )
    .spacer(15)

    // Test 10: Zero position edge case
    .text('TEST 10: Zero position edge case', { bold: true, underline: true })
    .add(
      stack()
        .height(60)
        .add(
          stack()
            .absolutePosition(0, 1350)
            .text('[Absolute at 0,Y]')
        )
    )
    .spacer(15)

    // Footer
    .line('-', 'fill')
    .text('End of Positioning Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Absolute/Relative Positioning', 'qa-31-absolute-relative-positioning');
}

main().catch(console.error);
