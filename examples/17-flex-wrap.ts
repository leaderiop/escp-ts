/**
 * Example 17: Flex Wrap
 *
 * Demonstrates flex wrapping which allows flex items to wrap
 * onto multiple lines when they don't fit in a single row.
 *
 * Key features:
 * - wrap('wrap'): Enable wrapping
 * - rowGap(): Space between wrapped lines
 * - Works with justify and alignItems
 *
 * Run: npx tsx examples/17-flex-wrap.ts
 */

import { LayoutEngine, stack, flex, text, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Flex Wrap Demo');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();

  const layout = stack()
    .gap(20)
    .padding(30)

    // Title
    .text('FLEX WRAP DEMO', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Explanation
    .text('Flex wrap allows items to flow onto multiple lines when they exceed', { italic: true })
    .text('the available width.', { italic: true })
    .spacer(20)

    // Without wrap (default)
    .text('WITHOUT WRAP (NOWRAP - DEFAULT)', { bold: true, underline: true })
    .spacer(10)
    .text('Items overflow on a single line:')
    .spacer(10)
    .add(
      flex()
        .gap(10)
        .add(stack().width(150).padding(10).text('Item 1', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 2', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 3', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 4', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 5', { align: 'center' }))
    )
    .spacer(30)

    // With wrap enabled
    .text('WITH WRAP ENABLED', { bold: true, underline: true })
    .spacer(10)
    .text('Items wrap to multiple lines:')
    .spacer(10)
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(10)
        .add(stack().width(150).padding(10).text('Item 1', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 2', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 3', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 4', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 5', { align: 'center' }))
    )
    .spacer(30)

    // With row gap
    .text('WITH ROW GAP', { bold: true, underline: true })
    .spacer(10)
    .text('rowGap(20) adds space between wrapped lines:')
    .spacer(10)
    .add(
      flex()
        .wrap('wrap')
        .gap(10)
        .rowGap(20)
        .add(stack().width(200).padding(10).text('Wide 1', { align: 'center' }))
        .add(stack().width(200).padding(10).text('Wide 2', { align: 'center' }))
        .add(stack().width(200).padding(10).text('Wide 3', { align: 'center' }))
        .add(stack().width(200).padding(10).text('Wide 4', { align: 'center' }))
    )
    .spacer(30)

    // Wrap with justify
    .text('WRAP WITH JUSTIFY CENTER', { bold: true, underline: true })
    .spacer(10)
    .text('Each line is centered independently:')
    .spacer(10)
    .add(
      flex()
        .wrap('wrap')
        .justify('center')
        .gap(10)
        .rowGap(10)
        .add(stack().width(150).padding(10).text('Item 1', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 2', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 3', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 4', { align: 'center' }))
        .add(stack().width(150).padding(10).text('Item 5', { align: 'center' }))
    )
    .spacer(30)

    // Practical use case: Tag cloud
    .text('USE CASE: TAG CLOUD', { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .wrap('wrap')
        .gap(8)
        .rowGap(8)
        .add(stack().padding(5).text('[typescript]'))
        .add(stack().padding(5).text('[javascript]'))
        .add(stack().padding(5).text('[node.js]'))
        .add(stack().padding(5).text('[react]'))
        .add(stack().padding(5).text('[vue]'))
        .add(stack().padding(5).text('[angular]'))
        .add(stack().padding(5).text('[svelte]'))
        .add(stack().padding(5).text('[css]'))
        .add(stack().padding(5).text('[html]'))
        .add(stack().padding(5).text('[docker]'))
        .add(stack().padding(5).text('[kubernetes]'))
        .add(stack().padding(5).text('[aws]'))
    )
    .spacer(30)

    // Practical use case: Image gallery grid
    .text('USE CASE: GALLERY GRID', { bold: true, underline: true })
    .spacer(10)
    .add(
      flex()
        .wrap('wrap')
        .gap(15)
        .rowGap(15)
        .justify('start')
        .add(
          stack()
            .width(180)
            .padding(10)
            .text('+--------+', { align: 'center' })
            .text('| IMG 1  |', { align: 'center' })
            .text('+--------+', { align: 'center' })
            .text('Photo 1', { align: 'center', italic: true })
        )
        .add(
          stack()
            .width(180)
            .padding(10)
            .text('+--------+', { align: 'center' })
            .text('| IMG 2  |', { align: 'center' })
            .text('+--------+', { align: 'center' })
            .text('Photo 2', { align: 'center', italic: true })
        )
        .add(
          stack()
            .width(180)
            .padding(10)
            .text('+--------+', { align: 'center' })
            .text('| IMG 3  |', { align: 'center' })
            .text('+--------+', { align: 'center' })
            .text('Photo 3', { align: 'center', italic: true })
        )
        .add(
          stack()
            .width(180)
            .padding(10)
            .text('+--------+', { align: 'center' })
            .text('| IMG 4  |', { align: 'center' })
            .text('+--------+', { align: 'center' })
            .text('Photo 4', { align: 'center', italic: true })
        )
        .add(
          stack()
            .width(180)
            .padding(10)
            .text('+--------+', { align: 'center' })
            .text('| IMG 5  |', { align: 'center' })
            .text('+--------+', { align: 'center' })
            .text('Photo 5', { align: 'center', italic: true })
        )
    )
    .spacer(30)

    // Footer
    .line('-', 'fill')
    .text('End of Flex Wrap Demo', { align: 'center', italic: true })
    .build();

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Flex Wrap Demo', '17-flex-wrap');
}

main().catch(console.error);
