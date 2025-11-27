/**
 * QA Test 01: Flex JustifyContent Values
 *
 * Tests all justifyContent values:
 * - start: items at start (left)
 * - center: items centered
 * - end: items at end (right)
 * - space-between: items evenly distributed, first at start, last at end
 * - space-around: items evenly distributed with equal space around each
 *
 * Expected behavior:
 * - Each row should demonstrate the specific justify behavior
 * - Text should be clearly readable and properly spaced
 * - No overlapping elements
 *
 * Run: npx tsx examples/qa-01-flex-justify.ts
 */

import { LayoutEngine, stack, flex } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('QA Test: Flex JustifyContent');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(25)
    .padding(30)

    // Title
    .text('FLEX JUSTIFY CONTENT TEST', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(15)

    // justify: start
    .text('justify: START', { bold: true, underline: true })
    .add(
      flex()
        .justify('start')
        .gap(20)
        .add(stack().padding(8).text('[Item A]'))
        .add(stack().padding(8).text('[Item B]'))
        .add(stack().padding(8).text('[Item C]'))
    )
    .spacer(20)

    // justify: center
    .text('justify: CENTER', { bold: true, underline: true })
    .add(
      flex()
        .justify('center')
        .gap(20)
        .add(stack().padding(8).text('[Item A]'))
        .add(stack().padding(8).text('[Item B]'))
        .add(stack().padding(8).text('[Item C]'))
    )
    .spacer(20)

    // justify: end
    .text('justify: END', { bold: true, underline: true })
    .add(
      flex()
        .justify('end')
        .gap(20)
        .add(stack().padding(8).text('[Item A]'))
        .add(stack().padding(8).text('[Item B]'))
        .add(stack().padding(8).text('[Item C]'))
    )
    .spacer(20)

    // justify: space-between
    .text('justify: SPACE-BETWEEN', { bold: true, underline: true })
    .add(
      flex()
        .justify('space-between')
        .add(stack().padding(8).text('[Item A]'))
        .add(stack().padding(8).text('[Item B]'))
        .add(stack().padding(8).text('[Item C]'))
    )
    .spacer(20)

    // justify: space-around
    .text('justify: SPACE-AROUND', { bold: true, underline: true })
    .add(
      flex()
        .justify('space-around')
        .add(stack().padding(8).text('[Item A]'))
        .add(stack().padding(8).text('[Item B]'))
        .add(stack().padding(8).text('[Item C]'))
    )
    .spacer(20)

    // Single item tests
    .text('SINGLE ITEM EDGE CASES', { bold: true, underline: true })
    .spacer(10)
    .text('space-between with 1 item (should be at start):')
    .add(
      flex()
        .justify('space-between')
        .add(stack().padding(8).text('[Single]'))
    )
    .spacer(10)
    .text('space-around with 1 item (should be centered):')
    .add(
      flex()
        .justify('space-around')
        .add(stack().padding(8).text('[Single]'))
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Justify Test', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'QA: Flex JustifyContent', 'qa-01-flex-justify');
}

main().catch(console.error);
