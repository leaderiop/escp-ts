/**
 * Layout Components Example
 *
 * Demonstrates: Stack, Flex, Layout, Spacer, Fragment
 */

import { LayoutEngine } from '../../src';
import { Stack, Flex, Layout, Spacer, Text, Line } from '../../src/jsx';
import { renderPreview, DEFAULT_PAPER, printSection } from '../_helpers';

async function main() {
  printSection('Layout Components');

  const engine = new LayoutEngine({ defaultPaper: DEFAULT_PAPER });
  await engine.initYoga();

  // Layout - Root container
  const doc = Layout({
    style: { width: 576, padding: 20 },
    children: [
      // Stack - Vertical arrangement (default)
      Text({ style: { bold: true }, children: 'Stack (Vertical):' }),
      Stack({
        style: { gap: 5, padding: 10 },
        children: [
          Text({ children: 'Item 1' }),
          Text({ children: 'Item 2' }),
          Text({ children: 'Item 3' }),
        ],
      }),

      Line({ char: '-', length: 'fill' }),

      // Stack - Horizontal arrangement
      Text({ style: { bold: true }, children: 'Stack (Horizontal):' }),
      Stack({
        direction: 'row',
        style: { gap: 20, padding: 10 },
        children: [
          Text({ children: 'Left' }),
          Text({ children: 'Center' }),
          Text({ children: 'Right' }),
        ],
      }),

      Line({ char: '-', length: 'fill' }),

      // Flex - Distribute space evenly
      Text({ style: { bold: true }, children: 'Flex with Spacer:' }),
      Flex({
        style: { padding: 10 },
        children: [
          Text({ children: 'Left aligned' }),
          Spacer({ flex: true }),
          Text({ children: 'Right aligned' }),
        ],
      }),

      Line({ char: '-', length: 'fill' }),

      // Flex with multiple spacers
      Text({ style: { bold: true }, children: 'Flex - Three columns:' }),
      Flex({
        style: { padding: 10 },
        children: [
          Text({ children: 'Col 1' }),
          Spacer({ flex: true }),
          Text({ children: 'Col 2' }),
          Spacer({ flex: true }),
          Text({ children: 'Col 3' }),
        ],
      }),

      Line({ char: '-', length: 'fill' }),

      // Fixed Spacer
      Text({ style: { bold: true }, children: 'Fixed Spacer (50px gap):' }),
      Flex({
        style: { padding: 10 },
        children: [
          Text({ children: 'Before' }),
          Spacer({ style: { width: 50 } }),
          Text({ children: 'After' }),
        ],
      }),

      Line({ char: '-', length: 'fill' }),

      // Nested layouts
      Text({ style: { bold: true }, children: 'Nested Layouts:' }),
      Stack({
        style: { padding: 10, gap: 10 },
        children: [
          Flex({
            children: [
              Stack({
                style: { width: 200 },
                children: [
                  Text({ style: { bold: true }, children: 'Left Column' }),
                  Text({ children: 'Content A' }),
                  Text({ children: 'Content B' }),
                ],
              }),
              Stack({
                style: { width: 200 },
                children: [
                  Text({ style: { bold: true }, children: 'Right Column' }),
                  Text({ children: 'Content X' }),
                  Text({ children: 'Content Y' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  engine.render(doc);
  const output = engine.getOutput();
  await renderPreview(output, 'Layout Components', 'components-01-layout');
}

main().catch(console.error);
