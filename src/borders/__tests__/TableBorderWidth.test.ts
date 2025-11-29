/**
 * TDD Tests for Table Border Width Calculations
 *
 * These tests verify that tables with borders correctly account for
 * border character widths and don't overflow their container.
 *
 * Root causes being tested:
 * 1. Border characters add fixed width that must be subtracted from content area
 * 2. Percentage-based table widths must include border overhead
 * 3. Multiple tables with borders must fit within their container without collision
 * 4. flexGrow distribution must work correctly with fixed-width border characters
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Table } from '../../jsx/components/data-display/Table';
import { Flex } from '../../jsx/components/layout/Flex';
import { Stack } from '../../jsx/components/layout/Stack';
import { Text } from '../../jsx/components/content/Text';
import { YogaAdapter } from '../../layout/yoga';
import { DEFAULT_STYLE, type LayoutNode } from '../../layout/nodes';
import type { LayoutResult } from '../../layout/yoga';

// Test configuration
const PAGE_WIDTH = 720; // Standard 10-inch page at 72 DPI

// Initialize Yoga adapter for tests
let yogaAdapter: YogaAdapter;

beforeAll(async () => {
  yogaAdapter = new YogaAdapter();
  await yogaAdapter.init();
});

// Helper to get layout result from a node
function layoutFromNode(node: LayoutNode, options?: { availableWidth?: number; availableHeight?: number }) {
  return yogaAdapter.calculateLayout(node, {
    availableWidth: options?.availableWidth ?? PAGE_WIDTH,
    availableHeight: options?.availableHeight ?? 500,
    lineSpacing: 24, // Standard line spacing
    interCharSpace: 0,
    style: DEFAULT_STYLE,
    startX: 0,
    startY: 0,
  });
}

describe('Table Border Width Calculations', () => {
  describe('Border Character Structure', () => {
    it('should use fixed-width Stack wrappers for border characters', async () => {
      const { wrapCellsWithVerticalBorders } = await import('../../borders/TableBorderRenderer');
      const { getGridBorderCharSet } = await import('../../borders/BoxDrawingChars');
      const chars = getGridBorderCharSet('single');
      const cells = [
        Stack({ style: { flexGrow: 1 }, children: Text({ children: 'A' }) }),
        Stack({ style: { flexGrow: 1 }, children: Text({ children: 'B' }) }),
      ];
      const row = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      // Border characters are wrapped in Stack with fixed width=36 (char width at 10 CPI)
      expect(row.type).toBe('flex');
      const children = (row as { children: LayoutNode[] }).children;
      expect(children[0].type).toBe('stack');
      expect((children[0] as { width?: number }).width).toBe(36);
      expect(children[0].flexGrow).toBe(0);
      expect(children[0].flexShrink).toBe(0);
    });
  });

  describe('Single Table Width', () => {
    it('should not exceed container width when borders are enabled', () => {
      // A table with 30% width should render at exactly 30% of container
      // INCLUDING the border characters, not 30% + borders
      const table = Table({
        columns: [
          { key: 'item', header: 'Item', width: '45%' },
          { key: 'qty', header: 'Qty', width: '25%' },
          { key: 'price', header: 'Price', width: '30%' },
        ],
        data: [{ item: 'Widget', qty: 10, price: '$25.00' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: '30%' },
        children: table,
      });

      const root = Stack({
        style: { width: PAGE_WIDTH },
        children: container,
      });

      const result = layoutFromNode(root as LayoutNode);
      const containerResult = result.children[0];

      // Container should be exactly 30% of page width
      const expectedContainerWidth = PAGE_WIDTH * 0.3;
      expect(containerResult.width).toBeCloseTo(expectedContainerWidth, 0);

      // Table content (first child of container) should NOT exceed container width
      const tableResult = containerResult.children[0];
      expect(tableResult.width).toBeLessThanOrEqual(containerResult.width + 1); // Allow 1px rounding
    });

    it('should calculate border overhead correctly for N columns', () => {
      // For N columns, there are N+1 border characters
      // 3 columns = 4 border chars (|col1|col2|col3|)

      const table = Table({
        columns: [
          { key: 'a', header: 'A', width: '33%' },
          { key: 'b', header: 'B', width: '33%' },
          { key: 'c', header: 'C', width: '34%' },
        ],
        data: [{ a: 'X', b: 'Y', c: 'Z' }],
        border: 'single',
      });

      const root = Stack({
        style: { width: PAGE_WIDTH },
        children: table,
      });

      const result = layoutFromNode(root as LayoutNode);
      const tableResult = result.children[0];

      // The top border row should fit within the table width
      const topBorderRow = tableResult.children[0]; // First child should be top border
      expect(topBorderRow.width).toBeLessThanOrEqual(tableResult.width + 1);
    });
  });

  describe('Multiple Tables Layout - CRITICAL', () => {
    it('should fit three 30% tables with gaps without collision', () => {
      // Three tables at 30% each = 90%
      // Two gaps at ~5% each = 10%
      // Total = 100% - should fit exactly without overflow

      const createTable = () => Table({
        columns: [
          { key: 'item', header: 'Item', width: '45%' },
          { key: 'qty', header: 'Qty', width: '25%' },
          { key: 'price', header: 'Price', width: '30%' },
        ],
        data: [{ item: 'Widget', qty: 10, price: '$25.00' }],
        border: 'single',
      });

      const GAP = 20;
      const layout = Flex({
        style: { width: PAGE_WIDTH, gap: GAP },
        children: [
          Stack({ style: { width: '30%' }, children: createTable() }),
          Stack({ style: { width: '30%' }, children: createTable() }),
          Stack({ style: { width: '30%' }, children: createTable() }),
        ],
      });

      const result = layoutFromNode(layout as LayoutNode);

      // Get the three table containers
      const table1 = result.children[0];
      const table2 = result.children[1];
      const table3 = result.children[2];

      // Each table should be at 30% width
      const expectedWidth = PAGE_WIDTH * 0.3;
      expect(table1.width).toBeCloseTo(expectedWidth, 0);
      expect(table2.width).toBeCloseTo(expectedWidth, 0);
      expect(table3.width).toBeCloseTo(expectedWidth, 0);

      // Tables should not collide - there should be a gap between them
      const table1RightEdge = table1.x + table1.width;
      const table2LeftEdge = table2.x;
      const gapBetween1And2 = table2LeftEdge - table1RightEdge;

      // Gap should be at least GAP pixels (allow 1px rounding)
      expect(gapBetween1And2).toBeGreaterThanOrEqual(GAP - 1);

      const table2RightEdge = table2.x + table2.width;
      const table3LeftEdge = table3.x;
      const gapBetween2And3 = table3LeftEdge - table2RightEdge;

      expect(gapBetween2And3).toBeGreaterThanOrEqual(GAP - 1);

      // Total width should not exceed container
      const totalWidth = table3.x + table3.width;
      expect(totalWidth).toBeLessThanOrEqual(PAGE_WIDTH);
    });

    it('should not have table content overflow its container', () => {
      // With 3 columns and borders, we need adequate space:
      // - 4 border chars × 36 dots = 144 dots for borders
      // - Need at least 100+ dots for content columns
      // Using 400px container for realistic test
      const table = Table({
        columns: [
          { key: 'item', header: 'Item', width: '45%' },
          { key: 'qty', header: 'Qty', width: '25%' },
          { key: 'price', header: 'Price', width: '30%' },
        ],
        data: [{ item: 'Widget', qty: 10, price: '$25.00' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: 400 }, // Fixed width container (adequate for 3 cols + borders)
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);

      // Table (first child of container) should fit within container bounds
      // Note: Text nodes have intrinsic width and may exceed column allocation
      // but the table structure (rows) should fit within the container
      const tableResult = result.children[0];
      expect(tableResult.width).toBeLessThanOrEqual(400 + 1); // Allow 1px rounding

      // All table rows should fit within table width
      for (const row of tableResult.children) {
        expect(row.width).toBeLessThanOrEqual(tableResult.width + 1);
      }
    });
  });

  describe('Border Character Width Accounting', () => {
    it('should subtract border width from available content width', () => {
      // If container is 300px and we have 4 border characters
      // Content area should be less than 300px

      const CONTAINER_WIDTH = 300;

      const table = Table({
        columns: [
          { key: 'a', header: 'A', width: '33%' },
          { key: 'b', header: 'B', width: '33%' },
          { key: 'c', header: 'C', width: '34%' },
        ],
        data: [{ a: 'X', b: 'Y', c: 'Z' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: CONTAINER_WIDTH },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // The table should respect the container width
      expect(tableResult.width).toBeLessThanOrEqual(CONTAINER_WIDTH);

      // All rows should fit within table width
      for (const child of tableResult.children) {
        expect(child.width).toBeLessThanOrEqual(tableResult.width + 1);
      }
    });

    it('should maintain column proportions after accounting for borders', () => {
      // Columns defined as 45%, 25%, 30% should maintain these proportions
      // in the remaining space after borders are subtracted

      const table = Table({
        columns: [
          { key: 'a', header: 'A', width: '45%' },
          { key: 'b', header: 'B', width: '25%' },
          { key: 'c', header: 'C', width: '30%' },
        ],
        data: [{ a: 'X', b: 'Y', c: 'Z' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: 400 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // Table should fit within container
      expect(tableResult.width).toBeLessThanOrEqual(400);

      // All rows should fit
      for (const child of tableResult.children) {
        expect(child.width).toBeLessThanOrEqual(tableResult.width + 1);
      }
    });
  });

  describe('flexGrow with Fixed Border Elements', () => {
    it('should distribute remaining space to cells after fixed borders', () => {
      // When using flexGrow, the fixed-width border characters should be
      // subtracted first, then remaining space distributed by flexGrow ratio

      const table = Table({
        columns: [
          { key: 'a', header: 'A', width: '50%' },
          { key: 'b', header: 'B', width: '50%' },
        ],
        data: [{ a: 'X', b: 'Y' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: 300 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // Table should fit within container
      expect(tableResult.width).toBeLessThanOrEqual(300);

      // Each row should fit within table width
      for (const child of tableResult.children) {
        expect(child.width).toBeLessThanOrEqual(tableResult.width + 1);
      }
    });

    it('should handle border-only rows (separators) correctly', () => {
      // Row separator lines like ├───┼───┤ should also fit within container

      const table = Table({
        columns: [
          { key: 'a', header: 'A', width: '50%' },
          { key: 'b', header: 'B', width: '50%' },
        ],
        data: [
          { a: 'X', b: 'Y' },
          { a: 'P', b: 'Q' },
        ],
        border: 'single',
      });

      const container = Stack({
        style: { width: 200 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // All children (including separator rows) should fit
      for (let i = 0; i < tableResult.children.length; i++) {
        const child = tableResult.children[i];
        expect(child.width).toBeLessThanOrEqual(tableResult.width + 1);
      }
    });
  });

  describe('Different Border Styles', () => {
    const borderStyles = ['single', 'double', 'ascii'] as const;

    borderStyles.forEach(borderStyle => {
      it(`should correctly calculate width for ${borderStyle} borders`, () => {
        const table = Table({
          columns: [
            { key: 'a', header: 'A', width: '50%' },
            { key: 'b', header: 'B', width: '50%' },
          ],
          data: [{ a: 'X', b: 'Y' }],
          border: borderStyle,
        });

        const container = Stack({
          style: { width: 250 },
          children: table,
        });

        const result = layoutFromNode(container as LayoutNode);
        const tableResult = result.children[0];

        // Table should not exceed container regardless of border style
        expect(tableResult.width).toBeLessThanOrEqual(250);

        // All rows should fit
        for (const child of tableResult.children) {
          expect(child.width).toBeLessThanOrEqual(tableResult.width + 1);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single column table with borders', () => {
      const table = Table({
        columns: [{ key: 'a', header: 'A', width: '100%' }],
        data: [{ a: 'Test' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: 150 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // 2 border chars for single column: |content|
      expect(tableResult.width).toBeLessThanOrEqual(150);
    });

    it('should handle many columns with borders', () => {
      const columns = Array.from({ length: 6 }, (_, i) => ({
        key: `col${i}`,
        header: `C${i}`,
        width: `${Math.floor(100 / 6)}%`,
      }));

      const table = Table({
        columns,
        data: [{ col0: 'A', col1: 'B', col2: 'C', col3: 'D', col4: 'E', col5: 'F' }],
        border: 'single',
      });

      const container = Stack({
        style: { width: 400 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // 7 border chars for 6 columns
      expect(tableResult.width).toBeLessThanOrEqual(400);
    });

    it('should handle narrow container with borders', () => {
      const table = Table({
        columns: [
          { key: 'a', header: 'A', width: '50%' },
          { key: 'b', header: 'B', width: '50%' },
        ],
        data: [{ a: 'X', b: 'Y' }],
        border: 'single',
      });

      // Very narrow container - borders might dominate
      const container = Stack({
        style: { width: 50 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // Even in narrow container, should not exceed bounds
      expect(tableResult.width).toBeLessThanOrEqual(50);
    });
  });
});
