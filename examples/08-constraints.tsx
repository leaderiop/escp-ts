/**
 * Example 08: Size Constraints (JSX Version)
 *
 * Demonstrates min/max width and height constraints using JSX:
 * - minWidth: Ensures element is at least this wide
 * - maxWidth: Limits element width
 * - minHeight: Ensures element is at least this tall
 * - maxHeight: Limits element height
 *
 * Run: npx tsx --tsconfig examples/tsconfig.json examples/08-constraints.tsx
 */

import { LayoutEngine } from '../src/index';
import { Stack, Flex, Text, Line, Spacer } from '../src/jsx';
import type { LayoutNode } from '../src/index';
import { renderPreview, DEFAULT_PAPER, printSection } from './_helpers';

async function main() {
  printSection('Size Constraints Demo (JSX)');

  const engine = new LayoutEngine({
    defaultPaper: DEFAULT_PAPER,
  });

  engine.initialize();
  await engine.initYoga();

  const layout = (
    <Stack style={{ gap: 20, padding: 30 }}>
      {/* Title */}
      <Text style={{ bold: true, doubleWidth: true }} align="center">SIZE CONSTRAINTS DEMO</Text>
      <Line char="=" length="fill" />
      <Spacer style={{ height: 20 }} />

      {/* minWidth demonstration */}
      <Text style={{ bold: true, underline: true }}>minWidth CONSTRAINT</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ italic: true }}>Short text without constraint:</Text>
      <Stack style={{ padding: 10 }}>
        <Text>Hi</Text>
      </Stack>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>Same text with minWidth(400):</Text>
      <Stack style={{ minWidth: 400, padding: 10 }}>
        <Text>Hi</Text>
      </Stack>
      <Spacer style={{ height: 20 }} />

      {/* maxWidth demonstration */}
      <Text style={{ bold: true, underline: true }}>maxWidth CONSTRAINT</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ italic: true }}>Long text without constraint:</Text>
      <Stack style={{ padding: 10 }}>
        <Text>This is a very long line of text that would normally extend across the full page width</Text>
      </Stack>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>Same text with maxWidth(600):</Text>
      <Stack style={{ maxWidth: 600, padding: 10 }}>
        <Text>This is a very long line of text that would normally extend across the full page width</Text>
      </Stack>
      <Spacer style={{ height: 20 }} />

      {/* minHeight demonstration */}
      <Text style={{ bold: true, underline: true }}>minHeight CONSTRAINT</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ italic: true }}>Content without minHeight:</Text>
      <Stack style={{ padding: 10 }}>
        <Text>Short content</Text>
      </Stack>
      <Spacer style={{ height: 5 }} />
      <Text style={{ italic: true }}>Same content with minHeight(100):</Text>
      <Stack style={{ minHeight: 100, padding: 10 }}>
        <Text>Short content</Text>
      </Stack>
      <Spacer style={{ height: 20 }} />

      {/* Combined constraints */}
      <Text style={{ bold: true, underline: true }}>COMBINED CONSTRAINTS</Text>
      <Spacer style={{ height: 10 }} />
      <Text style={{ italic: true }}>Box with minWidth(300), maxWidth(500), minHeight(80):</Text>
      <Stack style={{ minWidth: 300, maxWidth: 500, minHeight: 80, padding: 15 }}>
        <Text>Constrained content box</Text>
        <Text>Width: 300-500 dots</Text>
        <Text>Height: min 80 dots</Text>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Practical example */}
      <Text style={{ bold: true, underline: true }}>PRACTICAL EXAMPLE: Form Fields</Text>
      <Spacer style={{ height: 10 }} />
      <Stack style={{ gap: 10 }}>
        <Flex style={{ gap: 20 }}>
          <Text style={{ bold: true }}>Name:</Text>
          <Stack style={{ minWidth: 400 }}>
            <Text>_______________________</Text>
          </Stack>
        </Flex>
        <Flex style={{ gap: 20 }}>
          <Text style={{ bold: true }}>Email:</Text>
          <Stack style={{ minWidth: 400 }}>
            <Text>_______________________</Text>
          </Stack>
        </Flex>
        <Flex style={{ gap: 20 }}>
          <Text style={{ bold: true }}>Phone:</Text>
          <Stack style={{ minWidth: 200, maxWidth: 300 }}>
            <Text>_____________</Text>
          </Stack>
        </Flex>
      </Stack>
      <Spacer style={{ height: 30 }} />

      {/* Footer */}
      <Line char="-" length="fill" />
      <Text style={{ italic: true }} align="center">End of Constraints Demo</Text>
    </Stack>
  ) as LayoutNode;

  engine.render(layout);
  const commands = engine.getOutput();
  await renderPreview(commands, 'Size Constraints Demo (JSX)', '08-constraints-jsx');
}

main().catch(console.error);
