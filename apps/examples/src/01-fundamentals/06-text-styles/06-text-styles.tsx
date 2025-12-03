/**
 * Example 06: Text Styles Showcase (JSX Version)
 *
 * Demonstrates all available text styling options using JSX:
 * - Bold, Italic, Underline
 * - DoubleStrike, DoubleWidth, DoubleHeight
 * - Condensed
 * - CPI variations (10, 12, 15)
 * - Style combinations
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/06-text-styles.tsx
 */

import { LayoutEngine } from '@escp/jsx';
import { Stack, Text, Line, Spacer } from '@escp/jsx';
import type { LayoutNode } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER } from '../../_helpers';

async function main() {
  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = (
    <Stack style={{ gap: 15, padding: 30 }}>
      {/* Title */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">
        TEXT STYLES SHOWCASE
      </Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 20 }} />

      {/* Basic Styles Section */}
      <Text style={{ bold: true, underline: true }}>BASIC STYLES</Text>
      <Spacer style={{ height: 10 }} />
      <Text>Normal text - The quick brown fox jumps over the lazy dog</Text>
      <Text style={{ bold: true }}>Bold text - The quick brown fox jumps over the lazy dog</Text>
      <Text style={{ italic: true }}>
        Italic text - The quick brown fox jumps over the lazy dog
      </Text>
      <Text style={{ underline: true }}>
        Underlined text - The quick brown fox jumps over the lazy dog
      </Text>
      <Text style={{ doubleStrike: true }}>Double-strike text - Darker appearance</Text>
      <Spacer style={{ height: 20 }} />

      {/* Size Styles Section */}
      <Text style={{ bold: true, underline: true }}>SIZE STYLES</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ doubleWidth: true }}>Double-width text</Text>
      <Text style={{ doubleHeight: true }}>Double-height text</Text>
      <Text style={{ doubleWidth: true, doubleHeight: true }}>LARGE (both)</Text>
      <Text style={{ condensed: true }}>Condensed text - More characters per line, narrower</Text>
      <Spacer style={{ height: 20 }} />

      {/* CPI Section */}
      <Text style={{ bold: true, underline: true }}>CPI VARIATIONS</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ cpi: 10 }}>10 CPI (Pica) - Default, standard width</Text>
      <Text style={{ cpi: 12 }}>12 CPI (Elite) - Slightly narrower characters</Text>
      <Text style={{ cpi: 15 }}>15 CPI (Micron) - Compact characters for more content</Text>
      <Spacer style={{ height: 20 }} />

      {/* Style Combinations Section */}
      <Text style={{ bold: true, underline: true }}>STYLE COMBINATIONS</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ bold: true, italic: true }}>Bold + Italic</Text>
      <Text style={{ bold: true, underline: true }}>Bold + Underline</Text>
      <Text style={{ italic: true, underline: true }}>Italic + Underline</Text>
      <Text style={{ bold: true, italic: true, underline: true }}>
        Bold + Italic + Underline (all three)
      </Text>
      <Text style={{ doubleWidth: true, bold: true }}>Double Width + Bold</Text>
      <Text style={{ condensed: true, italic: true }}>Condensed + Italic</Text>
      <Spacer style={{ height: 20 }} />

      {/* Style Inheritance Section */}
      <Text style={{ bold: true, underline: true }}>STYLE INHERITANCE</Text>
      <Spacer style={{ height: 10 }} />
      <Stack style={{ bold: true }}>
        <Text>Parent sets bold - this inherits it</Text>
        <Text style={{ bold: false, italic: true }}>Child can override</Text>
        <Text>Another child still inherits bold</Text>
      </Stack>
      <Spacer style={{ height: 20 }} />

      {/* Footer */}
      <Line char="-" length="fill" />
      <Text style={{ italic: true }} align="center">
        End of Text Styles Demo
      </Text>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);

  const commands = engine.getOutput();
  await renderPreview(commands, 'Text Styles Demo (JSX)', '06-text-styles-jsx');
}

main().catch(console.error);
