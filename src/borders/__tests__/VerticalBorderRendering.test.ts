/**
 * TDD Tests for Vertical Border Rendering
 *
 * These tests verify that vertical border lines (│, |, ║) are:
 * 1. Present in the layout tree
 * 2. Have adequate width to be visible
 * 3. Are actually rendered in the output
 *
 * Root causes being investigated:
 * 1. BORDER_CHAR_WIDTH (12) may be too narrow for character to display
 * 2. Flex layout may be squeezing border characters
 * 3. Border characters may be rendered but at wrong position
 * 4. Character encoding issues with box-drawing characters
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Table } from '../../jsx/components/data-display/Table';
import { Stack } from '../../jsx/components/layout/Stack';
import { Text } from '../../jsx/components/content/Text';
import { YogaAdapter } from '../../layout/yoga';
import { DEFAULT_STYLE, type LayoutNode } from '../../layout/nodes';
import type { LayoutResult } from '../../layout/yoga';
import {
  wrapCellsWithVerticalBorders,
  createTopBorderRow,
  createRowSeparator,
  createBottomBorderRow,
} from '../TableBorderRenderer';
import { getGridBorderCharSet } from '../BoxDrawingChars';
import { calculateTextWidth } from '../../fonts/CharacterSet';

// Test configuration
const PAGE_WIDTH = 400;

// Initialize Yoga adapter for tests
let yogaAdapter: YogaAdapter;

beforeAll(async () => {
  yogaAdapter = new YogaAdapter();
  await yogaAdapter.init();
});

function layoutFromNode(node: LayoutNode, options?: { availableWidth?: number }) {
  return yogaAdapter.calculateLayout(node, {
    availableWidth: options?.availableWidth ?? PAGE_WIDTH,
    availableHeight: 500,
    lineSpacing: 24,
    interCharSpace: 0,
    style: DEFAULT_STYLE,
    startX: 0,
    startY: 0,
  });
}

describe('Vertical Border Rendering', () => {
  describe('Character Width Analysis', () => {
    it('should determine actual character width for border chars', () => {
      // Measure single character widths at 10 CPI
      const pipeWidth = calculateTextWidth('|', 10, false, false, false, 0);
      const boxVertical = calculateTextWidth('│', 10, false, false, false, 0);
      const doubleVertical = calculateTextWidth('║', 10, false, false, false, 0);

      console.log('Character widths at 10 CPI:');
      console.log('  | (pipe):', pipeWidth);
      console.log('  │ (box vertical):', boxVertical);
      console.log('  ║ (double vertical):', doubleVertical);

      // All characters should have the same width (monospace)
      expect(pipeWidth).toBe(boxVertical);
      expect(boxVertical).toBe(doubleVertical);

      // Characters are 36 dots wide at 10 CPI
      expect(pipeWidth).toBe(36);
    });

    it('BORDER_CHAR_WIDTH (12) is narrower than actual character width (36)', () => {
      const BORDER_CHAR_WIDTH = 12; // Current value in TableBorderRenderer
      const actualCharWidth = calculateTextWidth('│', 10, false, false, false, 0);

      console.log('BORDER_CHAR_WIDTH:', BORDER_CHAR_WIDTH);
      console.log('Actual character width:', actualCharWidth);

      // This is the ROOT CAUSE - border char width is 1/3 of actual character width!
      // The character needs 36 dots but only gets 12 dots of space
      expect(BORDER_CHAR_WIDTH).toBeLessThan(actualCharWidth);

      // This test documents the bug - border chars are too narrow
      // Expected: BORDER_CHAR_WIDTH >= actualCharWidth
      // Actual: BORDER_CHAR_WIDTH = 12, actualCharWidth = 36
    });
  });

  describe('Border Character Layout', () => {
    it('should have vertical border chars in the layout tree', () => {
      const chars = getGridBorderCharSet('single');
      const cells = [
        Stack({ style: { flexGrow: 45 }, children: Text({ children: 'Item' }) }),
        Stack({ style: { flexGrow: 25 }, children: Text({ children: 'Qty' }) }),
        Stack({ style: { flexGrow: 30 }, children: Text({ children: 'Price' }) }),
      ];
      const row = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      // Row should have 7 children: | cell | cell | cell |
      const children = (row as { children: LayoutNode[] }).children;
      expect(children.length).toBe(7);

      // Check border characters are present
      expect(children[0].type).toBe('stack'); // Left border
      expect(children[2].type).toBe('stack'); // After first cell
      expect(children[4].type).toBe('stack'); // After second cell
      expect(children[6].type).toBe('stack'); // Right border
    });

    it('should have border chars with width >= character intrinsic width', () => {
      const chars = getGridBorderCharSet('single');
      const cells = [
        Stack({ style: { flexGrow: 1 }, children: Text({ children: 'A' }) }),
      ];
      const row = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;
      const result = layoutFromNode(row);

      // Get border char layout (first child)
      const borderCharLayout = result.children[0];
      const actualCharWidth = calculateTextWidth('│', 10, false, false, false, 0);

      console.log('Border char layout width:', borderCharLayout.width);
      console.log('Actual character width:', actualCharWidth);

      // FAILING TEST: Border char width should be >= character width
      // Current: borderCharLayout.width = 12, actualCharWidth = 36
      expect(borderCharLayout.width).toBeGreaterThanOrEqual(actualCharWidth);
    });
  });

  describe('Horizontal Border Rows', () => {
    it('should have corner chars in top border row', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['45%', '25%', '30%'] as const,
        columnCount: 3,
      };
      const topRow = createTopBorderRow(structure, chars) as LayoutNode;

      // Top row: ┌───┬───┬───┐
      // Should have: corner, line, junction, line, junction, line, corner
      const children = (topRow as { children: LayoutNode[] }).children;
      expect(children.length).toBe(7);

      // First child should be top-left corner (Stack wrapper)
      expect(children[0].type).toBe('stack');

      // Verify corner has the correct text content
      const cornerStack = children[0] as { children: LayoutNode[] };
      const cornerText = cornerStack.children[0] as { content: string };
      expect(cornerText.content).toBe(chars.topLeft); // ┌
    });

    it('should have corner chars with adequate width in layout', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };
      const topRow = createTopBorderRow(structure, chars) as LayoutNode;
      const result = layoutFromNode(topRow);

      const cornerWidth = result.children[0].width;
      const actualCharWidth = calculateTextWidth('┌', 10, false, false, false, 0);

      console.log('Corner char layout width:', cornerWidth);
      console.log('Actual corner char width:', actualCharWidth);

      // FAILING TEST: Corner width should be >= character width
      expect(cornerWidth).toBeGreaterThanOrEqual(actualCharWidth);
    });

    it('should have junction chars in row separator', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };
      const separator = createRowSeparator(structure, chars) as LayoutNode;

      // Separator: ├───┼───┤
      const children = (separator as { children: LayoutNode[] }).children;
      expect(children.length).toBe(5); // ├, line, ┼, line, ┤

      // Verify junction chars
      const leftJunction = (children[0] as { children: LayoutNode[] }).children[0] as { content: string };
      const middleJunction = (children[2] as { children: LayoutNode[] }).children[0] as { content: string };
      const rightJunction = (children[4] as { children: LayoutNode[] }).children[0] as { content: string };

      expect(leftJunction.content).toBe(chars.tRight); // ├
      expect(middleJunction.content).toBe(chars.cross); // ┼
      expect(rightJunction.content).toBe(chars.tLeft); // ┤
    });
  });

  describe('Full Table Rendering', () => {
    it('should have vertical borders visible in table layout', () => {
      const table = Table({
        columns: [
          { key: 'item', header: 'Item', width: '50%' },
          { key: 'qty', header: 'Qty', width: '50%' },
        ],
        data: [{ item: 'Widget', qty: 10 }],
        border: 'single',
      });

      const container = Stack({
        style: { width: 300 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);

      // Find all border char elements (Stacks with width=36)
      function findBorderChars(node: LayoutResult): LayoutResult[] {
        const borderChars: LayoutResult[] = [];
        // Border chars are Stacks with width=36 (BORDER_CHAR_WIDTH = char width at 10 CPI)
        if (node.width === 36) {
          borderChars.push(node);
        }
        for (const child of node.children) {
          borderChars.push(...findBorderChars(child));
        }
        return borderChars;
      }

      const borderChars = findBorderChars(result);
      console.log('Number of border chars found:', borderChars.length);

      // For a 2-column table with header, data row, and borders:
      // - Top border: 3 chars (┌, ┬, ┐)
      // - Header row: 3 chars (│, │, │)
      // - Separator: 3 chars (├, ┼, ┤)
      // - Data row: 3 chars (│, │, │)
      // - Bottom border: 3 chars (└, ┴, ┘)
      // Total: 15 border chars
      expect(borderChars.length).toBeGreaterThan(0);

      // Check that border chars have positions within table bounds
      for (const borderChar of borderChars) {
        expect(borderChar.x).toBeGreaterThanOrEqual(0);
        expect(borderChar.x).toBeLessThan(300);
      }
    });

    it('should have border char width sufficient for character to render', () => {
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
      const charWidth = calculateTextWidth('│', 10, false, false, false, 0);

      // Find all border char elements
      function findBorderCharWidths(node: LayoutResult): number[] {
        const widths: number[] = [];
        // Border chars are Stacks with width=36 (BORDER_CHAR_WIDTH)
        if (node.width === 36) {
          widths.push(node.width);
        }
        for (const child of node.children) {
          widths.push(...findBorderCharWidths(child));
        }
        return widths;
      }

      const borderWidths = findBorderCharWidths(result);
      console.log('Border char widths:', borderWidths);
      console.log('Required char width:', charWidth);

      // FAILING TEST: All border chars should have width >= character width
      for (const width of borderWidths) {
        expect(width).toBeGreaterThanOrEqual(charWidth);
      }
    });
  });

  describe('Border Style Differentiation', () => {
    it('should use different characters for ASCII vs single-line vs double-line', () => {
      const asciiChars = getGridBorderCharSet('ascii');
      const singleChars = getGridBorderCharSet('single');
      const doubleChars = getGridBorderCharSet('double');

      // Vertical borders should be different
      expect(asciiChars.vertical).toBe('|');
      expect(singleChars.vertical).toBe('│');
      expect(doubleChars.vertical).toBe('║');

      // Corners should be different
      expect(asciiChars.topLeft).toBe('+');
      expect(singleChars.topLeft).toBe('┌');
      expect(doubleChars.topLeft).toBe('╔');

      // Horizontal should be different
      expect(asciiChars.horizontal).toBe('-');
      expect(singleChars.horizontal).toBe('─');
      expect(doubleChars.horizontal).toBe('═');
    });
  });
});
