/**
 * Layout Components Example
 *
 * Demonstrates: Stack, Flex, Layout, Spacer, Fragment
 * Layout: Uses full page width with percentage-based columns
 */

import { LayoutEngine } from '../../src';
import { Stack, Flex, Layout, Spacer, Text, Line } from '../../src/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

async function main() {
  printSection('Layout Components');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  const doc = Layout({
    style: { padding: 10 },
    children: [
      // Title
      Text({ style: { bold: true, doubleWidth: true }, children: 'Layout Components' }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 20 } }),

      // Row 1: Stack examples (3 columns using percentage widths)
      Flex({
        style: { gap: 60 },
        children: [
          // Column 1: Stack Vertical
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Stack (Vertical)' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                style: { gap: 5, padding: { left: 10, top: 5 } },
                children: [
                  Text({ children: 'Item 1' }),
                  Text({ children: 'Item 2' }),
                  Text({ children: 'Item 3' }),
                ],
              }),
            ],
          }),

          // Column 2: Stack Horizontal
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Stack (Horizontal)' }),
              Line({ char: '-', length: 'fill' }),
              Stack({
                direction: 'row',
                style: { gap: 20, padding: { top: 5 } },
                children: [
                  Text({ children: 'Left' }),
                  Text({ children: 'Center' }),
                  Text({ children: 'Right' }),
                ],
              }),
            ],
          }),

          // Column 3: Nested Layouts
          Stack({
            style: { width: '32%' },
            children: [
              Text({ style: { bold: true }, children: 'Nested Layouts' }),
              Line({ char: '-', length: 'fill' }),
              Flex({
                style: { padding: { top: 5 }, gap: 20 },
                children: [
                  Stack({
                    children: [
                      Text({ style: { bold: true }, children: 'Col A' }),
                      Text({ children: 'A1' }),
                      Text({ children: 'A2' }),
                    ],
                  }),
                  Stack({
                    children: [
                      Text({ style: { bold: true }, children: 'Col B' }),
                      Text({ children: 'B1' }),
                      Text({ children: 'B2' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      Spacer({ style: { height: 20 } }),
      Line({ char: '=', length: 'fill' }),
      Spacer({ style: { height: 10 } }),

      // Row 2: Flex and Spacer examples (full width)
      Text({ style: { bold: true }, children: 'Flex with Spacer' }),
      Line({ char: '-', length: 'fill' }),
      Spacer({ style: { height: 5 } }),

      // Flex with spacer - left/right alignment
      Text({ children: 'Left/Right alignment:' }),
      Flex({
        style: { padding: { left: 20 } },
        children: [
          Text({ children: 'Left aligned' }),
          Spacer({ flex: true }),
          Text({ children: 'Right aligned' }),
        ],
      }),

      Spacer({ style: { height: 10 } }),

      // Three columns with spacers
      Text({ children: 'Three columns with spacers:' }),
      Flex({
        style: { padding: { left: 20 } },
        children: [
          Text({ children: 'Column 1' }),
          Spacer({ flex: true }),
          Text({ children: 'Column 2' }),
          Spacer({ flex: true }),
          Text({ children: 'Column 3' }),
        ],
      }),

      Spacer({ style: { height: 10 } }),

      // Fixed spacer
      Text({ children: 'Fixed spacer (200 dots gap):' }),
      Flex({
        style: { padding: { left: 20 } },
        children: [
          Text({ children: 'Before' }),
          Spacer({ style: { width: 200 } }),
          Text({ children: 'After' }),
        ],
      }),

      Spacer({ style: { height: 10 } }),
      Line({ char: '=', length: 'fill' }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, 'Layout Components', 'components-01-layout');
}

main().catch(console.error);
