/**
 * Example 06: Text Styles Showcase
 *
 * Demonstrates all available text styling options:
 * - Bold, Italic, Underline
 * - DoubleStrike, DoubleWidth, DoubleHeight
 * - Condensed
 * - CPI variations (10, 12, 15)
 * - Style combinations
 *
 * Run: npx tsx examples/06-text-styles.ts
 */

import { LayoutEngine, stack, flex, text, line } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER } from './_helpers';

async function main() {
  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  // Build the layout demonstrating all text styles
  const layout = stack()
    .gap(15)
    .padding(30)

    // Title
    .text('TEXT STYLES SHOWCASE', { bold: true, doubleWidth: true, align: 'center' })
    .line('=', 'fill')
    .spacer(20)

    // Basic Styles Section
    .text('BASIC STYLES', { bold: true, underline: true })
    .spacer(10)
    .text('Normal text - The quick brown fox jumps over the lazy dog')
    .text('Bold text - The quick brown fox jumps over the lazy dog', { bold: true })
    .text('Italic text - The quick brown fox jumps over the lazy dog', { italic: true })
    .text('Underlined text - The quick brown fox jumps over the lazy dog', { underline: true })
    .text('Double-strike text - Darker appearance', { doubleStrike: true })
    .spacer(20)

    // Size Styles Section
    .text('SIZE STYLES', { bold: true, underline: true })
    .spacer(10)
    .text('Double-width text', { doubleWidth: true })
    .text('Double-height text', { doubleHeight: true })
    .text('LARGE (both)', { doubleWidth: true, doubleHeight: true })
    .text('Condensed text - More characters per line, narrower', { condensed: true })
    .spacer(20)

    // CPI (Characters Per Inch) Section
    .text('CPI VARIATIONS', { bold: true, underline: true })
    .spacer(10)
    .text('10 CPI (Pica) - Default, standard width', { cpi: 10 })
    .text('12 CPI (Elite) - Slightly narrower characters', { cpi: 12 })
    .text('15 CPI (Micron) - Compact characters for more content', { cpi: 15 })
    .spacer(20)

    // Style Combinations Section
    .text('STYLE COMBINATIONS', { bold: true, underline: true })
    .spacer(10)
    .text('Bold + Italic', { bold: true, italic: true })
    .text('Bold + Underline', { bold: true, underline: true })
    .text('Italic + Underline', { italic: true, underline: true })
    .text('Bold + Italic + Underline (all three)', { bold: true, italic: true, underline: true })
    .text('Double Width + Bold', { doubleWidth: true, bold: true })
    .text('Condensed + Italic', { condensed: true, italic: true })
    .spacer(20)

    // Inherited Styles Section
    .text('STYLE INHERITANCE', { bold: true, underline: true })
    .spacer(10)
    .add(
      stack()
        .bold() // Parent is bold
        .text('Parent sets bold - this inherits it')
        .text('Child can override', { bold: false, italic: true })
        .text('Another child still inherits bold')
    )
    .spacer(20)

    // Footer
    .line('-', 'fill')
    .text('End of Text Styles Demo', { align: 'center', italic: true })
    .build();

  // Render the layout
  engine.render(layout);

  // Get output and show preview
  const commands = engine.getOutput();
  await renderPreview(commands, 'Text Styles Demo', '06-text-styles');
}

main().catch(console.error);
