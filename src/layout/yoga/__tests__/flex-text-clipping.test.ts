/**
 * Tests for Flex/Stack text clipping bugs
 *
 * These tests verify that text is NOT clipped when there is sufficient space.
 *
 * Bug symptoms observed in components-01-layout.png:
 * 1. Stack with direction='row': "Left Center Right" rendered as "Lef Cente Righ"
 * 2. Flex with Spacer: "Left aligned Right aligned" rendered as "Left a Right a"
 * 3. Nested layouts: Two columns overlap and merge text
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { YogaAdapter } from '../YogaAdapter';
import { flattenTree } from '../../renderer';
import { DEFAULT_STYLE, type LayoutNode, type FlexNode, type StackNode, type TextNode, type SpacerNode } from '../../nodes';

let yogaAdapter: YogaAdapter;

beforeAll(async () => {
  yogaAdapter = new YogaAdapter();
  await yogaAdapter.init();
});

afterAll(() => {
  yogaAdapter.dispose();
});

// Helper to calculate layout
function calculateLayout(node: LayoutNode, width: number = 576) {
  return yogaAdapter.calculateLayout(node, {
    availableWidth: width,
    availableHeight: 1000,
    lineSpacing: 60,
    interCharSpace: 0,
    style: DEFAULT_STYLE,
  });
}

// Helper to extract text content from render items
function extractTextContent(node: LayoutNode, width?: number): string[] {
  const result = calculateLayout(node, width);
  const items = flattenTree(result);
  return items
    .filter(item => item.data.type === 'text')
    .sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y)
    .map(item => item.data.type === 'text' ? item.data.content : '');
}

describe('Flex/Stack text clipping bugs', () => {
  /**
   * BUG #1: Horizontal Stack clips text
   *
   * Stack with direction='row' should not clip text when there is sufficient space.
   * The horizontal Stack is treating text like Flex row and clipping aggressively.
   */
  describe('Stack with direction="row" should not clip text', () => {
    it('should preserve full text "Left Center Right" in horizontal Stack', () => {
      const stack: StackNode = {
        type: 'stack',
        direction: 'row',
        gap: 20,
        padding: 10,
        children: [
          { type: 'text', content: 'Left' },
          { type: 'text', content: 'Center' },
          { type: 'text', content: 'Right' },
        ],
      };

      const texts = extractTextContent(stack);

      // Text should NOT be clipped
      expect(texts).toContain('Left');
      expect(texts).toContain('Center');
      expect(texts).toContain('Right');

      // Should NOT contain truncated versions
      expect(texts).not.toContain('Lef');
      expect(texts).not.toContain('Cente');
      expect(texts).not.toContain('Righ');
    });

    it('should preserve text when Stack has explicit width', () => {
      const stack: StackNode = {
        type: 'stack',
        direction: 'row',
        width: 400,
        gap: 20,
        children: [
          { type: 'text', content: 'First' },
          { type: 'text', content: 'Second' },
        ],
      };

      const texts = extractTextContent(stack);

      expect(texts).toContain('First');
      expect(texts).toContain('Second');
    });
  });

  /**
   * BUG #2: Flex with Spacer clips text
   *
   * When using Flex with Spacer(flex: true) between two Text nodes,
   * the text should not be clipped when there is sufficient space.
   */
  describe('Flex with Spacer should not clip text', () => {
    it('should preserve full text with flex spacer between', () => {
      const flex: FlexNode = {
        type: 'flex',
        padding: 10,
        children: [
          { type: 'text', content: 'Left aligned' },
          { type: 'spacer', flex: true } as SpacerNode,
          { type: 'text', content: 'Right aligned' },
        ],
      };

      const texts = extractTextContent(flex);

      // Full text should be preserved
      expect(texts).toContain('Left aligned');
      expect(texts).toContain('Right aligned');

      // Should NOT contain truncated versions
      expect(texts).not.toContain('Left a');
      expect(texts).not.toContain('Right a');
    });

    it('should preserve text in three-column flex layout', () => {
      const flex: FlexNode = {
        type: 'flex',
        padding: 10,
        children: [
          { type: 'text', content: 'Col 1' },
          { type: 'spacer', flex: true } as SpacerNode,
          { type: 'text', content: 'Col 2' },
          { type: 'spacer', flex: true } as SpacerNode,
          { type: 'text', content: 'Col 3' },
        ],
      };

      const texts = extractTextContent(flex);

      expect(texts).toContain('Col 1');
      expect(texts).toContain('Col 2');
      expect(texts).toContain('Col 3');
    });
  });

  /**
   * Nested layouts with side-by-side Stacks
   *
   * When two Stack nodes with explicit widths are placed side-by-side
   * inside a Flex container, they should be positioned correctly.
   * Text that exceeds container width will be clipped (correct behavior).
   */
  describe('Nested layouts should position correctly', () => {
    it('should position side-by-side columns correctly', () => {
      // Use short text that fits within 200 dots
      // "L" = 1 char × 36 = 36 dots, "R" = 36 dots
      const flex: FlexNode = {
        type: 'flex',
        children: [
          {
            type: 'stack',
            width: 200,
            children: [
              { type: 'text', content: 'L' },
              { type: 'text', content: 'A' },
            ],
          } as StackNode,
          {
            type: 'stack',
            width: 200,
            children: [
              { type: 'text', content: 'R' },
              { type: 'text', content: 'X' },
            ],
          } as StackNode,
        ],
      };

      const result = calculateLayout(flex, 576);
      const items = flattenTree(result);

      // Get all text items sorted by position
      const textItems = items
        .filter(item => item.data.type === 'text')
        .sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);

      // Extract contents
      const texts = textItems.map(item =>
        item.data.type === 'text' ? item.data.content : ''
      );

      // All text should be present
      expect(texts).toContain('L');
      expect(texts).toContain('R');
      expect(texts).toContain('A');
      expect(texts).toContain('X');

      // Verify X positions don't overlap
      const leftCol = textItems.filter(item =>
        item.data.type === 'text' && (item.data.content === 'L' || item.data.content === 'A')
      );
      const rightCol = textItems.filter(item =>
        item.data.type === 'text' && (item.data.content === 'R' || item.data.content === 'X')
      );

      if (leftCol.length > 0 && rightCol.length > 0) {
        // Right column should start at or after x=200
        expect(rightCol[0].x).toBeGreaterThanOrEqual(200);
      }
    });

    it('should position columns at correct X coordinates', () => {
      // Use short text that fits
      const flex: FlexNode = {
        type: 'flex',
        children: [
          {
            type: 'stack',
            width: 200,
            children: [{ type: 'text', content: 'C1' }],
          } as StackNode,
          {
            type: 'stack',
            width: 200,
            children: [{ type: 'text', content: 'C2' }],
          } as StackNode,
        ],
      };

      const result = calculateLayout(flex, 576);
      const items = flattenTree(result);

      const col1 = items.find(i => i.data.type === 'text' && i.data.content === 'C1');
      const col2 = items.find(i => i.data.type === 'text' && i.data.content === 'C2');

      expect(col1).toBeDefined();
      expect(col2).toBeDefined();

      if (col1 && col2) {
        // Column 1 should start at x=0
        expect(col1.x).toBe(0);
        // Column 2 should start at x=200 (after first column)
        expect(col2.x).toBe(200);
      }
    });

    it('should clip text that exceeds column width', () => {
      // "Long Text" = 9 chars × 36 = 324 dots, exceeds 200 width
      const flex: FlexNode = {
        type: 'flex',
        children: [
          {
            type: 'stack',
            width: 200,
            children: [{ type: 'text', content: 'Long Text' }],
          } as StackNode,
        ],
      };

      const result = calculateLayout(flex, 576);
      const items = flattenTree(result);

      const textItem = items.find(i => i.data.type === 'text');
      expect(textItem).toBeDefined();

      // Text is clipped - content will be truncated
      if (textItem && textItem.data.type === 'text') {
        // The content in the render item should be clipped
        // At 10 CPI, 200 dots / 36 dots per char = 5.5 chars max
        expect(textItem.data.content.length).toBeLessThan(9);
      }
    });
  });

  /**
   * Additional regression tests
   */
  describe('Text measurement in flex context', () => {
    it('text width should be correctly measured at 10 CPI', () => {
      const text: TextNode = {
        type: 'text',
        content: 'Hello World',
      };

      const result = calculateLayout(text);
      const items = flattenTree(result);

      // At 10 CPI, each character is 36 dots wide (360/10)
      // "Hello World" = 11 characters = 396 dots
      const textItem = items.find(i => i.data.type === 'text');
      expect(textItem).toBeDefined();

      // The width should be at least the text width
      expect(textItem!.width).toBeGreaterThanOrEqual(11 * 36);
    });

    it('short text in flex should not be clipped', () => {
      const flex: FlexNode = {
        type: 'flex',
        width: 576,
        children: [
          { type: 'text', content: 'A' },
          { type: 'text', content: 'B' },
          { type: 'text', content: 'C' },
        ],
      };

      const texts = extractTextContent(flex);

      expect(texts).toContain('A');
      expect(texts).toContain('B');
      expect(texts).toContain('C');
    });
  });
});
