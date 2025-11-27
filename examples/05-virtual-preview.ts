/**
 * Example 05: Virtual Preview
 *
 * Demonstrates using the VirtualRenderer to preview output without a printer.
 *
 * Run: npx tsx examples/05-virtual-preview.ts
 */

import { LayoutEngine, stack, flex, line } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Virtual Preview Demo');

  // Create a simple document
  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });
  engine.initialize();

  const document = stack()
    .gap(15)
    .padding(36)
    .text('Virtual Preview Demo', { bold: true, doubleWidth: true })
    .add(line('-', 'fill'))
    .text('This document is rendered to a virtual page buffer')
    .text('instead of a physical printer.')
    .add(
      flex()
        .gap(20)
        .justify('space-between')
        .text('Left aligned')
        .text('Right aligned')
    )
    .spacer(20)
    .text('You can use this for:')
    .text('  - Print preview functionality')
    .text('  - Testing without a printer')
    .text('  - Generating PNG images')
    .spacer(20)
    .add(line('-', 'fill'))
    .text('The VirtualRenderer parses ESC/P2 commands and renders', { italic: true })
    .text('them to a bitmap that can be saved as PNG.', { italic: true })
    .build();

  engine.render(document);

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Virtual Preview Demo', '05-virtual-preview');
}

main().catch(console.error);
