/**
 * Example 09: Absolute Positioning (JSX Version)
 *
 * Demonstrates absolute positioning using JSX:
 * - position: 'absolute' removes element from normal flow
 * - posX: Set absolute X coordinate (in dots)
 * - posY: Set absolute Y coordinate (in dots)
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/09-positioning.tsx
 */

import { LayoutEngine } from '@escp/jsx';
import { Stack, Text, Line, Spacer } from '@escp/jsx';
import type { LayoutNode } from '@escp/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Absolute Positioning Demo (JSX)');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = (
    <Stack style={{ gap: 15, padding: 30 }}>
      {/* Title */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">
        ABSOLUTE POSITIONING DEMO
      </Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 20 }} />

      {/* Explanation */}
      <Text style={{ bold: true, underline: true }}>Normal Flow vs Absolute Positioning</Text>
      <Spacer style={{ height: 10 }} />
      <Text>Elements in normal flow are positioned sequentially.</Text>
      <Text>Absolute positioning places elements at specific coordinates.</Text>
      <Spacer style={{ height: 30 }} />

      {/* Normal flow example */}
      <Text style={{ bold: true }}>NORMAL FLOW:</Text>
      <Stack style={{ gap: 5 }}>
        <Text>Item 1 - flows normally</Text>
        <Text>Item 2 - follows Item 1</Text>
        <Text>Item 3 - follows Item 2</Text>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Absolute positioning explanation */}
      <Text style={{ bold: true }}>ABSOLUTE POSITIONING:</Text>
      <Text style={{ italic: true }}>(See items below - positioned at exact X,Y coordinates)</Text>
      <Spacer style={{ height: 30 }} />

      {/* Practical example: Watermark */}
      <Text style={{ bold: true }}>PRACTICAL USE: Watermark-style positioning</Text>
      <Text style={{ italic: true }}>A watermark can be placed at an absolute position.</Text>
      <Spacer style={{ height: 30 }} />

      {/* More normal content */}
      <Text>Normal content continues here...</Text>
      <Text>The watermark above does not affect the flow.</Text>
      <Spacer style={{ height: 30 }} />

      {/* Footer */}
      <Line char="-" length="fill" />
      <Text style={{ italic: true }} align="center">
        End of Normal Flow Content
      </Text>
      <Spacer style={{ height: 50 }} />

      {/* === ABSOLUTE POSITIONED ITEMS === */}
      {/* These are placed at exact Y coordinates (after all flow content which ends ~Y=1504) */}
      {/* Y=1700+ ensures no overlap with flow content above */}

      {/* Row of items at Y=1700 */}
      <Stack style={{ position: 'absolute', posX: 100, posY: 1700 }}>
        <Text style={{ bold: true }}>Abs (100, 1700)</Text>
      </Stack>
      <Stack style={{ position: 'absolute', posX: 500, posY: 1700 }}>
        <Text style={{ bold: true }}>Abs (500, 1700)</Text>
      </Stack>
      <Stack style={{ position: 'absolute', posX: 900, posY: 1700 }}>
        <Text style={{ bold: true }}>Abs (900, 1700)</Text>
      </Stack>

      {/* Diagonal pattern starting at Y=1800 */}
      <Stack style={{ position: 'absolute', posX: 150, posY: 1800 }}>
        <Text>Diagonal 1</Text>
      </Stack>
      <Stack style={{ position: 'absolute', posX: 400, posY: 1880 }}>
        <Text>Diagonal 2</Text>
      </Stack>
      <Stack style={{ position: 'absolute', posX: 650, posY: 1960 }}>
        <Text>Diagonal 3</Text>
      </Stack>

      {/* Watermark at Y=2100 */}
      <Stack style={{ position: 'absolute', posX: 300, posY: 2100 }}>
        <Text style={{ bold: true, doubleWidth: true, italic: true }}>SAMPLE DOCUMENT</Text>
      </Stack>

      {/* Final marker */}
      <Stack style={{ position: 'absolute', posX: 100, posY: 2200 }}>
        <Text style={{ italic: true }}>--- End of Absolute Positioning Demo ---</Text>
      </Stack>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Absolute Positioning Demo (JSX)', '09-positioning-jsx');
}

main().catch(console.error);
