/**
 * Tests for percentage width text clipping
 *
 * Bug: Text in containers with percentage widths (e.g. '48%') is not being
 * clipped to the container bounds, causing text from parallel columns to
 * overlap and interleave.
 *
 * Root cause: The shouldClipText flag is only set when hasExplicitWidth is true,
 * but the check only looks for numeric widths and 'fill', not percentage strings.
 *
 * Symptoms:
 * - test-notes-terms.png: "Notes" column text overlaps with "Terms" column
 * - components-06-decorative.png: "automatic heading" corrupted to "automat0utheadr0gos"
 * - components-07-complete-invoice.png: Various label text corruptions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { YogaAdapter } from '../YogaAdapter';
import { flattenTree } from '../../renderer';
import { DEFAULT_STYLE, type LayoutNode, type FlexNode, type StackNode } from '../../nodes';

let yogaAdapter: YogaAdapter;

beforeAll(async () => {
  yogaAdapter = new YogaAdapter();
  await yogaAdapter.init();
});

afterAll(() => {
  yogaAdapter.dispose();
});

// Helper to calculate layout
function calculateLayout(node: LayoutNode, width: number = 2000) {
  return yogaAdapter.calculateLayout(node, {
    availableWidth: width,
    availableHeight: 1000,
    lineSpacing: 60,
    interCharSpace: 0,
    style: DEFAULT_STYLE,
  });
}

// Helper to extract text items with positions
function extractTextItems(node: LayoutNode, width?: number) {
  const result = calculateLayout(node, width);
  const items = flattenTree(result);
  return items
    .filter(item => item.data.type === 'text')
    .sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y)
    .map(item => ({
      content: item.data.type === 'text' ? item.data.content : '',
      x: item.x,
      y: item.y,
      width: item.width,
    }));
}

describe('Percentage width text clipping', () => {
  /**
   * Core bug: Stack with percentage width should clip text
   *
   * When a Stack has width: '48%', text inside it should be clipped
   * to fit within the allocated percentage of the parent container.
   */
  describe('Stack with percentage width should clip text', () => {
    it('should clip long text in Stack with percentage width', () => {
      // Parent container is 2000 dots wide
      // Stack with 48% width = 960 dots
      // At 10 CPI, 960/36 = 26.6 characters max
      const longText = 'This is a very long text that should be clipped to fit within the container';
      // 77 characters = 2772 dots, much larger than 960

      const flex: FlexNode = {
        type: 'flex',
        children: [
          {
            type: 'stack',
            width: '48%',
            children: [{ type: 'text', content: longText }],
          } as StackNode,
        ],
      };

      const items = extractTextItems(flex, 2000);
      expect(items.length).toBe(1);

      const textContent = items[0]!.content;
      // Text should be truncated to fit 960 dots (~26 chars)
      expect(textContent.length).toBeLessThan(longText.length);
      expect(textContent.length).toBeLessThanOrEqual(30); // Allow some margin
    });

    it('should not overlap text in parallel percentage-width columns', () => {
      // Simulate the Notes & Terms layout from the invoice
      const flex: FlexNode = {
        type: 'flex',
        gap: 80,
        children: [
          {
            type: 'stack',
            width: '48%',
            children: [
              { type: 'text', content: 'Thank you for your business!' },
              { type: 'text', content: 'Premium members receive 10% discount.' },
            ],
          } as StackNode,
          {
            type: 'stack',
            width: '48%',
            children: [
              { type: 'text', content: 'Payment due within 15 days.' },
              { type: 'text', content: 'Late payments subject to interest.' },
            ],
          } as StackNode,
        ],
      };

      const items = extractTextItems(flex, 2000);

      // Get items from each column based on Y position
      const row1Items = items.filter(item => item.y === items[0]!.y);
      const row2Items = items.filter(item => item.y !== items[0]!.y);

      // Each row should have 2 items (one from each column)
      expect(row1Items.length).toBe(2);
      expect(row2Items.length).toBe(2);

      // Column 1 items should be at X=0
      // Column 2 items should start AFTER column 1 ends
      // With 2000 width and 48% columns with 80 gap:
      // Col 1: 0 to 960, Col 2: 1040 to 2000

      // Check that column 2 items don't overlap with column 1
      const col1Width = 2000 * 0.48; // 960
      for (const item of row1Items) {
        if (item.x > 0) {
          // This is column 2, should start after column 1 + gap
          expect(item.x).toBeGreaterThanOrEqual(col1Width);
        }
      }
    });

    it('should clip text at percentage boundary, not overflow into next column', () => {
      // Column 1 text that would overflow into column 2 if not clipped
      const longText = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // 51 A's = 1836 dots

      const flex: FlexNode = {
        type: 'flex',
        gap: 80,
        children: [
          {
            type: 'stack',
            width: '48%',
            children: [{ type: 'text', content: longText }],
          } as StackNode,
          {
            type: 'stack',
            width: '48%',
            children: [{ type: 'text', content: 'B' }],
          } as StackNode,
        ],
      };

      const items = extractTextItems(flex, 2000);

      // Find the clipped A's text
      const aText = items.find(item => item.content.startsWith('A'));
      const bText = items.find(item => item.content === 'B');

      expect(aText).toBeDefined();
      expect(bText).toBeDefined();

      // The A's text should be clipped - much shorter than original
      // At 10 CPI with 48% of 2000 = 960 dots, max ~26 chars
      expect(aText!.content.length).toBeLessThan(30);
      expect(aText!.content.length).toBeLessThan(51);

      // B column should start after the A column boundary
      // (960 + 80 gap = 1040)
      expect(bText!.x).toBeGreaterThanOrEqual(960);
    });
  });

  /**
   * Verify that numeric widths still work correctly
   */
  describe('Numeric width clipping (regression)', () => {
    it('should still clip text in Stack with numeric width', () => {
      const longText = 'This text is too long for the container';

      const flex: FlexNode = {
        type: 'flex',
        children: [
          {
            type: 'stack',
            width: 200, // 200 dots = ~5.5 chars at 10 CPI
            children: [{ type: 'text', content: longText }],
          } as StackNode,
        ],
      };

      const items = extractTextItems(flex, 2000);
      expect(items.length).toBe(1);

      // Text should be truncated
      expect(items[0]!.content.length).toBeLessThan(longText.length);
    });
  });

  /**
   * Test the specific pattern from the invoice example
   */
  describe('Invoice-style two-column layout', () => {
    it('should render Notes and Terms columns without overlap', () => {
      const flex: FlexNode = {
        type: 'flex',
        gap: 80,
        children: [
          {
            type: 'stack',
            width: '48%',
            children: [
              { type: 'text', content: '*Thank you for your business!' },
              { type: 'text', content: '*Premium members receive 10% discount.' },
              { type: 'text', content: '*Free shipping on orders over $500.' },
            ],
          } as StackNode,
          {
            type: 'stack',
            width: '48%',
            children: [
              { type: 'text', content: '1.Payment due within 15 days.' },
              { type: 'text', content: '2.Late payments: 1.5% monthly interest.' },
              { type: 'text', content: '3.Refunds within 30 days only.' },
            ],
          } as StackNode,
        ],
      };

      const items = extractTextItems(flex, 2000);

      // Should have 6 text items total
      expect(items.length).toBe(6);

      // Group items by approximate Y position (within 5 dots tolerance)
      const rowGroups: typeof items[] = [];
      for (const item of items) {
        const existingRow = rowGroups.find(row =>
          row.some(r => Math.abs(r.y - item.y) < 5)
        );
        if (existingRow) {
          existingRow.push(item);
        } else {
          rowGroups.push([item]);
        }
      }

      // Should have 3 rows
      expect(rowGroups.length).toBe(3);

      // Each row should have exactly 2 items
      for (const row of rowGroups) {
        expect(row.length).toBe(2);

        // Sort by X position
        row.sort((a, b) => a.x - b.x);

        // First item (Notes column) should start at X=0
        expect(row[0]!.x).toBe(0);

        // Second item (Terms column) should not overlap with first
        // First column is 48% of 2000 = 960, plus 80 gap = 1040
        expect(row[1]!.x).toBeGreaterThanOrEqual(960);
      }
    });
  });
});
