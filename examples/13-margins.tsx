/**
 * Example 13: Margins (JSX Version)
 *
 * Demonstrates margin support for layout nodes using JSX:
 * - Uniform margins (single number)
 * - Per-side margins (object with top/right/bottom/left)
 * - Margins on different node types (stack, flex, text)
 * - Difference between padding and margin
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/13-margins.tsx
 */

import { LayoutEngine } from '../src/index';
import { Stack, Flex, Text, Line, Spacer } from '../src/jsx';
import type { LayoutNode } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Margins Demo (JSX)');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = (
    <Stack style={{ gap: 20, padding: 30 }}>
      {/* Title */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">MARGINS DEMO</Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 20 }} />

      {/* Explanation */}
      <Text style={{ italic: true }}>Margins add space OUTSIDE a node (between siblings).</Text>
      <Text style={{ italic: true }}>Padding adds space INSIDE a node (between border and content).</Text>
      <Spacer style={{ height: 20 }} />

      {/* Uniform margin example */}
      <Text style={{ bold: true, underline: true }}>UNIFORM MARGINS</Text>
      <Spacer style={{ height: 10 }} />
      <Text>Items with margin(20) - note extra spacing between them:</Text>
      <Spacer style={{ height: 10 }} />
      <Stack style={{ gap: 0 }}>
        <Stack style={{ margin: 20, padding: 10 }}>
          <Text>Item 1 with 20px margin</Text>
        </Stack>
        <Stack style={{ margin: 20, padding: 10 }}>
          <Text>Item 2 with 20px margin</Text>
        </Stack>
        <Stack style={{ margin: 20, padding: 10 }}>
          <Text>Item 3 with 20px margin</Text>
        </Stack>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Per-side margin example */}
      <Text style={{ bold: true, underline: true }}>PER-SIDE MARGINS</Text>
      <Spacer style={{ height: 10 }} />
      <Text>{'Using margin({ top: 10, right: 50, bottom: 30, left: 100 }):'}</Text>
      <Spacer style={{ height: 10 }} />
      <Stack style={{ margin: { top: 10, right: 50, bottom: 30, left: 100 }, padding: 10 }}>
        <Text>Content with asymmetric margins</Text>
        <Text>Left margin: 100, Right margin: 50</Text>
        <Text>Top margin: 10, Bottom margin: 30</Text>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Margin vs Padding comparison */}
      <Text style={{ bold: true, underline: true }}>MARGIN VS PADDING COMPARISON</Text>
      <Spacer style={{ height: 10 }} />
      <Flex style={{ gap: 30 }}>
        <Stack style={{ width: 300 }}>
          <Text style={{ bold: true }}>Padding (20):</Text>
          <Stack style={{ padding: 20 }}>
            <Text>Content with padding</Text>
            <Text>Space is inside the box</Text>
          </Stack>
        </Stack>
        <Stack style={{ width: 300 }}>
          <Text style={{ bold: true }}>Margin (20):</Text>
          <Stack style={{ margin: 20 }}>
            <Text>Content with margin</Text>
            <Text>Space is outside the box</Text>
          </Stack>
        </Stack>
      </Flex>
      <Spacer style={{ height: 30 }} />

      {/* Margins in flex layout */}
      <Text style={{ bold: true, underline: true }}>MARGINS IN FLEX LAYOUT</Text>
      <Spacer style={{ height: 10 }} />
      <Text>Horizontal margins create space between flex items:</Text>
      <Spacer style={{ height: 10 }} />
      <Flex style={{ gap: 0 }}>
        <Stack style={{ margin: { left: 0, right: 30 } }}>
          <Text>Left item</Text>
        </Stack>
        <Stack style={{ margin: { left: 30, right: 30 } }}>
          <Text>Center item</Text>
        </Stack>
        <Stack style={{ margin: { left: 30, right: 0 } }}>
          <Text>Right item</Text>
        </Stack>
      </Flex>
      <Spacer style={{ height: 30 }} />

      {/* Margins in table */}
      <Text style={{ bold: true, underline: true }}>MARGINS IN TABLE</Text>
      <Spacer style={{ height: 10 }} />
      <Text>Table with margin around the entire structure:</Text>
      <Spacer style={{ height: 10 }} />
      <Stack style={{ margin: { top: 10, right: 20, bottom: 10, left: 20 }, gap: 5 }}>
        <Flex style={{ gap: 10 }}>
          <Stack style={{ width: 150 }}>
            <Text style={{ bold: true }}>Header 1</Text>
          </Stack>
          <Stack style={{ width: 150 }}>
            <Text style={{ bold: true }}>Header 2</Text>
          </Stack>
          <Stack style={{ width: 150 }}>
            <Text style={{ bold: true }}>Header 3</Text>
          </Stack>
        </Flex>
        <Flex style={{ gap: 10 }}>
          <Stack style={{ width: 150 }}>
            <Text>A1</Text>
          </Stack>
          <Stack style={{ width: 150 }}>
            <Text>A2</Text>
          </Stack>
          <Stack style={{ width: 150 }}>
            <Text>A3</Text>
          </Stack>
        </Flex>
        <Flex style={{ gap: 10 }}>
          <Stack style={{ width: 150 }}>
            <Text>B1</Text>
          </Stack>
          <Stack style={{ width: 150 }}>
            <Text>B2</Text>
          </Stack>
          <Stack style={{ width: 150 }}>
            <Text>B3</Text>
          </Stack>
        </Flex>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Combining margin and padding */}
      <Text style={{ bold: true, underline: true }}>COMBINING MARGIN AND PADDING</Text>
      <Spacer style={{ height: 10 }} />
      <Text>Both can be used together for fine control:</Text>
      <Spacer style={{ height: 10 }} />
      <Stack style={{ margin: 30, padding: 20 }}>
        <Text>This node has both margin(30) and padding(20)</Text>
        <Text>Total offset from siblings: 30 + 20 = 50 dots</Text>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Footer */}
      <Line char="-" length="fill" />
      <Text style={{ italic: true }} align="center">End of Margins Demo</Text>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Margins Demo (JSX)', '13-margins-jsx');
}

main().catch(console.error);
