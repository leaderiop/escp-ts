/**
 * Example 14: Percentage-Based Sizing
 *
 * Demonstrates percentage-based width and height specifications:
 * - '50%': Takes 50% of available width/height
 * - Works with stack, flex, and grid containers
 * - Useful for responsive layouts
 *
 * Run: npx tsx examples/14-percentages.ts
 */

import { LayoutEngine, stack, flex, grid, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Percentage Sizing Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('PERCENTAGE SIZING DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Percentage sizing calculates dimensions relative to available space.', { italic: true })
    .spacer(20)

    // Basic percentage width
    .text('PERCENTAGE WIDTH', { bold: true, underline: true })
    .spacer(10)
    .text('Elements with 50%, 30%, and 20% width:')
    .spacer(10)
    .add(
      stack()
        .gap(5)
        .add(
          stack()
            .width('50%')
            .padding(10)
            .text('50% width')
        )
        .add(
          stack()
            .width('30%')
            .padding(10)
            .text('30% width')
        )
        .add(
          stack()
            .width('20%')
            .padding(10)
            .text('20% width')
        )
    )
    .spacer(30)

    // Percentage height
    .text('PERCENTAGE HEIGHT', { bold: true, underline: true })
    .spacer(10)
    .text('A container with 10% height of available space:')
    .spacer(10)
    .add(
      stack()
        .width('fill')
        .height('10%')
        .padding(10)
        .text('This container is 10% of available height')
        .text('(Useful for consistent proportions across pages)')
    )
    .spacer(30)

    // Flex with percentage widths
    .text('FLEX WITH PERCENTAGES', { bold: true, underline: true })
    .spacer(10)
    .text('Flex items with percentage widths (25% + 50% + 25%):')
    .spacer(10)
    .add(
      flex()
        .gap(10)
        .add(
          stack()
            .width('25%')
            .padding(10)
            .text('25%', { align: 'center' })
        )
        .add(
          stack()
            .width('50%')
            .padding(10)
            .text('50%', { align: 'center' })
        )
        .add(
          stack()
            .width('25%')
            .padding(10)
            .text('25%', { align: 'center' })
        )
    )
    .spacer(30)

    // Grid with percentage columns
    .text('GRID WITH PERCENTAGE COLUMNS', { bold: true, underline: true })
    .spacer(10)
    .text('Grid columns: 20%, 50%, 30%:')
    .spacer(10)
    .add(
      grid(['20%', '50%', '30%'])
        .columnGap(10)
        .rowGap(5)
        .cell('20%', { bold: true, align: 'center' })
        .cell('50%', { bold: true, align: 'center' })
        .cell('30%', { bold: true, align: 'center' })
        .headerRow()
        .cell('Col A')
        .cell('Column B (wider)')
        .cell('Col C')
        .row()
        .cell('Data')
        .cell('More data in the middle')
        .cell('End')
        .row()
    )
    .spacer(30)

    // Combining percentages with fixed sizes
    .text('MIXED SIZING', { bold: true, underline: true })
    .spacer(10)
    .text('Grid with fixed (100px) + percentage (50%) + fill:')
    .spacer(10)
    .add(
      grid([100, '50%', 'fill'])
        .columnGap(10)
        .rowGap(5)
        .cell('100px', { bold: true })
        .cell('50%', { bold: true })
        .cell('Fill', { bold: true })
        .headerRow()
        .cell('Fixed')
        .cell('Half of available')
        .cell('Remaining space')
        .row()
    )
    .spacer(30)

    // Responsive two-column layout
    .text('TWO-COLUMN LAYOUT', { bold: true, underline: true })
    .spacer(10)
    .text('A common layout: 30% sidebar + 70% content:')
    .spacer(10)
    .add(
      flex()
        .gap(20)
        .add(
          stack()
            .width('30%')
            .padding(15)
            .text('SIDEBAR', { bold: true })
            .spacer(10)
            .text('Navigation')
            .text('Links')
            .text('Info')
        )
        .add(
          stack()
            .width('70%')
            .padding(15)
            .text('MAIN CONTENT', { bold: true })
            .spacer(10)
            .text('This area takes up 70% of the available width.')
            .text('Perfect for document layouts with sidebars.')
        )
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Percentage Sizing Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Percentage Sizing Demo', '14-percentages');
}

main().catch(console.error);
