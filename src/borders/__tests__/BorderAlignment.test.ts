/**
 * TDD Tests for Border Alignment Issues
 *
 * These tests verify that:
 * 1. Vertical border characters (│, |, ║) align with junction characters (┬, ┴, ┼, +)
 * 2. Horizontal line segments fill exactly the space between junctions
 * 3. Content cells align with horizontal line segments
 * 4. Double-line borders render as single characters, not two pipes
 *
 * Root causes being tested:
 * 1. Border characters in content rows vs border rows may have different X positions
 * 2. Line segments with flexGrow may distribute space differently than Stacks with flexGrow
 * 3. The structure of content rows vs border rows may not match
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Table } from '../../jsx/components/data-display/Table';
import { Stack } from '../../jsx/components/layout/Stack';
import { YogaAdapter } from '../../layout/yoga';
import { DEFAULT_STYLE, type LayoutNode } from '../../layout/nodes';
import type { LayoutResult } from '../../layout/yoga';
import {
  wrapCellsWithVerticalBorders,
  createTopBorderRow,
  createRowSeparator,
  createBottomBorderRow,
} from '../TableBorderRenderer';
import { getGridBorderCharSet, UNICODE_BOX } from '../BoxDrawingChars';
import { Text } from '../../jsx/components/content/Text';

const PAGE_WIDTH = 400;

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

/**
 * Find all nodes in a layout tree that have a specific text content
 */
function findNodesWithContent(node: LayoutResult, content: string): LayoutResult[] {
  const found: LayoutResult[] = [];
  const originalNode = (node as unknown as { originalNode?: { content?: string } }).originalNode;
  if (originalNode?.content === content) {
    found.push(node);
  }
  for (const child of node.children) {
    found.push(...findNodesWithContent(child, content));
  }
  return found;
}

/**
 * Get X positions of all border character containers (width=36 Stacks)
 * in a row layout result
 */
function getBorderCharPositions(row: LayoutResult): number[] {
  const positions: number[] = [];
  for (const child of row.children) {
    // Border chars are Stacks with width=36
    if (child.width === 36) {
      positions.push(child.x);
    }
  }
  return positions;
}

describe('Border Alignment', () => {
  describe('Vertical Border Alignment with Junctions', () => {
    it('should have vertical borders at same X position as top junction characters', () => {
      // Create a simple table structure
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };

      // Create top border row: ┌───┬───┐
      const topBorder = createTopBorderRow(structure, chars) as LayoutNode;

      // Create content row: │ content │ content │
      const cells = [
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'A' }) }),
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'B' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      // Layout both rows in same container width
      const container = Stack({
        style: { width: 300 },
        children: [topBorder, contentRow],
      });
      const result = layoutFromNode(container);

      // Get the two rows
      const topBorderLayout = result.children[0];
      const contentRowLayout = result.children[1];

      // Get border character X positions for both rows
      const topBorderPositions = getBorderCharPositions(topBorderLayout);
      const contentRowPositions = getBorderCharPositions(contentRowLayout);

      console.log('Top border positions (corners/junctions):', topBorderPositions);
      console.log('Content row positions (verticals):', contentRowPositions);

      // CRITICAL: The vertical bars in content row must align with junctions in border row
      // For 2 columns: 3 border chars each (left, middle, right)
      expect(topBorderPositions.length).toBe(3);
      expect(contentRowPositions.length).toBe(3);

      // Each position should match (allowing 1px tolerance for rounding)
      for (let i = 0; i < topBorderPositions.length; i++) {
        expect(contentRowPositions[i]).toBeCloseTo(topBorderPositions[i], 0);
      }
    });

    it('should have row separator junctions at same X position as vertical borders', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['33%', '33%', '34%'] as const,
        columnCount: 3,
      };

      // Create content row: │ content │ content │ content │
      // Use flexBasis: 0 to match actual Table component behavior
      const cells = [
        Stack({ style: { flexGrow: 33, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'A' }) }),
        Stack({ style: { flexGrow: 33, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'B' }) }),
        Stack({ style: { flexGrow: 34, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'C' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      // Create row separator: ├───┼───┼───┤
      const separator = createRowSeparator(structure, chars) as LayoutNode;

      // Layout both in same container
      const container = Stack({
        style: { width: 300 },
        children: [contentRow, separator],
      });
      const result = layoutFromNode(container);

      const contentRowLayout = result.children[0];
      const separatorLayout = result.children[1];

      const contentPositions = getBorderCharPositions(contentRowLayout);
      const separatorPositions = getBorderCharPositions(separatorLayout);

      console.log('Content row border positions:', contentPositions);
      console.log('Separator junction positions:', separatorPositions);

      // 4 border chars for 3 columns
      expect(contentPositions.length).toBe(4);
      expect(separatorPositions.length).toBe(4);

      // Each should align
      for (let i = 0; i < contentPositions.length; i++) {
        expect(separatorPositions[i]).toBeCloseTo(contentPositions[i], 0);
      }
    });

    it('should have bottom border corners at same X position as vertical borders', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };

      const cells = [
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'X' }) }),
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'Y' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;
      const bottomBorder = createBottomBorderRow(structure, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: [contentRow, bottomBorder],
      });
      const result = layoutFromNode(container);

      const contentPositions = getBorderCharPositions(result.children[0]);
      const bottomPositions = getBorderCharPositions(result.children[1]);

      console.log('Content row positions:', contentPositions);
      console.log('Bottom border positions:', bottomPositions);

      expect(contentPositions.length).toBe(3);
      expect(bottomPositions.length).toBe(3);

      for (let i = 0; i < contentPositions.length; i++) {
        expect(bottomPositions[i]).toBeCloseTo(contentPositions[i], 0);
      }
    });
  });

  describe('Horizontal Line Segment Width', () => {
    it('should have horizontal lines fill exactly between junction characters', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };

      const topBorder = createTopBorderRow(structure, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: topBorder,
      });
      const result = layoutFromNode(container);

      // Top border should have: corner, line, junction, line, corner
      // That's 5 children
      const borderRow = result.children[0];
      expect(borderRow.children.length).toBe(5);

      // Get positions and widths
      const children = borderRow.children;

      // First corner (┌) starts at x=0, width=36
      const leftCorner = children[0];
      expect(leftCorner.width).toBe(36);

      // First line segment should start at corner's right edge
      const firstLine = children[1];
      const expectedLineStart = leftCorner.x + leftCorner.width;
      expect(firstLine.x).toBeCloseTo(expectedLineStart, 0);

      // Junction (┬) should start at first line's right edge
      const junction = children[2];
      const expectedJunctionStart = firstLine.x + firstLine.width;
      expect(junction.x).toBeCloseTo(expectedJunctionStart, 0);

      // Line segment widths should equal cell content widths
      // With 2 x 50% columns and 3 border chars (3 x 36 = 108px)
      // Available for content = 300 - 108 = 192px
      // Each line should be ~96px
      const availableForContent = 300 - 3 * 36;
      const expectedLineWidth = availableForContent / 2;

      console.log('Available for content:', availableForContent);
      console.log('Expected line width:', expectedLineWidth);
      console.log('Actual first line width:', firstLine.width);

      expect(firstLine.width).toBeCloseTo(expectedLineWidth, 0);
    });

    it('should have cell content widths match horizontal line widths', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };

      const topBorder = createTopBorderRow(structure, chars) as LayoutNode;
      const cells = [
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'Test' }) }),
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'Data' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: [topBorder, contentRow],
      });
      const result = layoutFromNode(container);

      const borderRowChildren = result.children[0].children;
      const contentRowChildren = result.children[1].children;

      // Border row: corner(36), line(~96), junction(36), line(~96), corner(36)
      // Content row: border(36), cell(~96), border(36), cell(~96), border(36)

      // First line width should match first cell width
      const firstLineWidth = borderRowChildren[1].width;
      const firstCellWidth = contentRowChildren[1].width;

      console.log('First line width:', firstLineWidth);
      console.log('First cell width:', firstCellWidth);

      // CRITICAL: Line and cell widths must match for alignment
      expect(firstCellWidth).toBeCloseTo(firstLineWidth, 0);

      // Second line/cell should also match
      const secondLineWidth = borderRowChildren[3].width;
      const secondCellWidth = contentRowChildren[3].width;

      expect(secondCellWidth).toBeCloseTo(secondLineWidth, 0);
    });
  });

  describe('Double-Line Character Rendering', () => {
    it('should use single double-vertical character (║) not two pipes (||)', () => {
      const doubleChars = getGridBorderCharSet('double');

      // Verify the character set uses proper Unicode
      expect(doubleChars.vertical).toBe(UNICODE_BOX.DOUBLE_VERTICAL);
      expect(doubleChars.vertical).toBe('║');
      expect(doubleChars.vertical.length).toBe(1); // Single character, not two

      // Verify it's NOT two pipe characters
      expect(doubleChars.vertical).not.toBe('||');
    });

    it('should render double-vertical as single character in content rows', () => {
      const chars = getGridBorderCharSet('double');
      const cells = [
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'A' }) }),
        Stack({ style: { flexGrow: 50, flexShrink: 1 }, children: Text({ children: 'B' }) }),
      ];
      const row = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      // The row should have: borderChar, cell, borderChar, cell, borderChar
      const children = (row as { children: LayoutNode[] }).children;
      expect(children.length).toBe(5);

      // Check the first border character (should be a Stack containing Text with ║)
      const borderStack = children[0] as { children: LayoutNode[] };
      const textNode = borderStack.children[0] as { content: string };

      console.log('Border char content:', textNode.content);
      console.log('Border char content length:', textNode.content.length);

      // Content should be single character ║
      expect(textNode.content).toBe('║');
      expect(textNode.content.length).toBe(1);
    });
  });

  describe('flexBasis: 0 Fix Verification', () => {
    it('should distribute space equally with flexBasis: 0 regardless of content length', () => {
      const chars = getGridBorderCharSet('single');

      // Cell with short content - using flexBasis: 0
      const shortCell = Stack({
        style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
        children: Text({ children: 'A' }), // 1 char = 36 dots
      });

      // Cell with long content - using flexBasis: 0
      const longCell = Stack({
        style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
        children: Text({ children: 'ABCDEF' }), // 6 chars = 216 dots
      });

      const row = wrapCellsWithVerticalBorders([shortCell, longCell], chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: row,
      });

      const result = layoutFromNode(container);
      const rowChildren = result.children[0].children;

      // Get cell widths (children 1 and 3 are cells, 0/2/4 are borders)
      const firstCellWidth = rowChildren[1].width;
      const secondCellWidth = rowChildren[3].width;

      console.log('Short content cell width (with flexBasis:0):', firstCellWidth);
      console.log('Long content cell width (with flexBasis:0):', secondCellWidth);

      // With flexBasis: 0, cells should have equal width regardless of content
      // Available space for cells = 300 - 3*36 = 192, each should be 96
      const expectedEqualWidth = 96;
      console.log('Expected equal width:', expectedEqualWidth);

      expect(firstCellWidth).toBeCloseTo(expectedEqualWidth, 0);
      expect(secondCellWidth).toBeCloseTo(expectedEqualWidth, 0);
    });

    it('should align header and data cells with flexBasis: 0', () => {
      const chars = getGridBorderCharSet('single');

      // Header cells with flexBasis: 0
      const headerCells = [
        Stack({
          style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
          children: Text({ style: { bold: true }, children: 'Col A' }),
        }),
        Stack({
          style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
          children: Text({ style: { bold: true }, children: 'Col B' }),
        }),
      ];
      const headerRow = wrapCellsWithVerticalBorders(headerCells, chars) as LayoutNode;

      // Data cells with flexBasis: 0 (different content lengths)
      const dataCells = [
        Stack({
          style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
          children: Text({ children: 'Row 1' }),
        }),
        Stack({
          style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
          children: Text({ children: 'Data 1' }), // 6 chars vs 5 chars
        }),
      ];
      const dataRow = wrapCellsWithVerticalBorders(dataCells, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: [headerRow, dataRow],
      });

      const result = layoutFromNode(container);
      const headerRowLayout = result.children[0];
      const dataRowLayout = result.children[1];

      // Get cell widths
      const headerCell1Width = headerRowLayout.children[1].width;
      const headerCell2Width = headerRowLayout.children[3].width;
      const dataCell1Width = dataRowLayout.children[1].width;
      const dataCell2Width = dataRowLayout.children[3].width;

      console.log('Header cell 1 width:', headerCell1Width);
      console.log('Header cell 2 width:', headerCell2Width);
      console.log('Data cell 1 width:', dataCell1Width);
      console.log('Data cell 2 width:', dataCell2Width);

      // With flexBasis: 0, header and data cells should have matching widths
      expect(dataCell1Width).toBeCloseTo(headerCell1Width, 0);
      expect(dataCell2Width).toBeCloseTo(headerCell2Width, 0);
    });

    it('should work with various content lengths when using flexBasis: 0', () => {
      const chars = getGridBorderCharSet('single');

      // Both cells have flexGrow: 50 and flexBasis: 0, but very different content lengths
      const cells = [
        Stack({
          style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
          children: Text({ children: 'Short' }), // 5 chars = 180 dots
        }),
        Stack({
          style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 },
          children: Text({ children: 'LongerText' }), // 10 chars = 360 dots
        }),
      ];

      const row = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: row,
      });

      const result = layoutFromNode(container);

      // Available for cells: 300 - 3*36 = 192px
      // With flexBasis: 0, each should be 96px regardless of content
      const cell1Width = result.children[0].children[1].width;
      const cell2Width = result.children[0].children[3].width;

      console.log('Cell 1 width (5 chars, flexBasis:0):', cell1Width);
      console.log('Cell 2 width (10 chars, flexBasis:0):', cell2Width);

      // Both cells should have equal width
      expect(cell1Width).toBeCloseTo(96, 0);
      expect(cell2Width).toBeCloseTo(96, 0);
    });
  });

  describe('Border Character TEXT Position Within Container', () => {
    it('should have Text node at same relative X within border containers', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };

      // Create top border row (uses corners/junctions)
      const topBorder = createTopBorderRow(structure, chars) as LayoutNode;

      // Create content row (uses vertical bars)
      const cells = [
        Stack({ style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'A' }) }),
        Stack({ style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'B' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: [topBorder, contentRow],
      });

      const result = layoutFromNode(container);

      // Get first border char from each row (should be at same container X)
      const topBorderRow = result.children[0];
      const contentRowResult = result.children[1];

      // First child is the border char container
      const topLeftCornerContainer = topBorderRow.children[0];
      const leftVerticalContainer = contentRowResult.children[0];

      console.log('Top-left corner container:', { x: topLeftCornerContainer.x, width: topLeftCornerContainer.width });
      console.log('Left vertical container:', { x: leftVerticalContainer.x, width: leftVerticalContainer.width });

      // Container positions should match
      expect(leftVerticalContainer.x).toBe(topLeftCornerContainer.x);

      // Now check the TEXT node inside each container
      // The text node should be at the same relative position within its container
      const cornerTextNode = topLeftCornerContainer.children[0];
      const verticalTextNode = leftVerticalContainer.children[0];

      console.log('Corner text node:', { x: cornerTextNode.x, width: cornerTextNode.width });
      console.log('Vertical text node:', { x: verticalTextNode.x, width: verticalTextNode.width });

      // The text X position is relative to container, should be the same
      expect(verticalTextNode.x).toBe(cornerTextNode.x);
    });

    it('should have junction and vertical text at same X in middle border position', () => {
      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['50%', '50%'] as const,
        columnCount: 2,
      };

      const topBorder = createTopBorderRow(structure, chars) as LayoutNode;
      const cells = [
        Stack({ style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'Col1' }) }),
        Stack({ style: { flexGrow: 50, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'Col2' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      const container = Stack({
        style: { width: 300 },
        children: [topBorder, contentRow],
      });

      const result = layoutFromNode(container);

      // Get the MIDDLE border char (index 2 in both rows)
      // Top border: corner(0), line(1), junction(2), line(3), corner(4)
      // Content row: vertical(0), cell(1), vertical(2), cell(3), vertical(4)
      const middleJunctionContainer = result.children[0].children[2];
      const middleVerticalContainer = result.children[1].children[2];

      console.log('Middle junction (┬) container:', { x: middleJunctionContainer.x, width: middleJunctionContainer.width });
      console.log('Middle vertical (│) container:', { x: middleVerticalContainer.x, width: middleVerticalContainer.width });

      // CRITICAL: Container X positions must match
      expect(middleVerticalContainer.x).toBeCloseTo(middleJunctionContainer.x, 0);

      // Check text node positions within containers
      const junctionText = middleJunctionContainer.children[0];
      const verticalText = middleVerticalContainer.children[0];

      console.log('Junction text node:', { x: junctionText.x, width: junctionText.width });
      console.log('Vertical text node:', { x: verticalText.x, width: verticalText.width });

      // Absolute positions (container.x + text.x) should be identical
      const junctionAbsoluteX = middleJunctionContainer.x + junctionText.x;
      const verticalAbsoluteX = middleVerticalContainer.x + verticalText.x;

      console.log('Junction absolute X:', junctionAbsoluteX);
      console.log('Vertical absolute X:', verticalAbsoluteX);

      expect(verticalAbsoluteX).toBeCloseTo(junctionAbsoluteX, 0);
    });

    it('should verify Line vs Stack+Text have matching border character positions', () => {
      // The top border uses Line components for horizontal segments
      // The content row uses Stack+Text for cells
      // Both should position their adjacent border characters identically

      const chars = getGridBorderCharSet('single');
      const structure = {
        columnWidths: ['33%', '33%', '34%'] as const,
        columnCount: 3,
      };

      const topBorder = createTopBorderRow(structure, chars) as LayoutNode;
      const separator = createRowSeparator(structure, chars) as LayoutNode;
      const cells = [
        Stack({ style: { flexGrow: 33, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'A' }) }),
        Stack({ style: { flexGrow: 33, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'B' }) }),
        Stack({ style: { flexGrow: 34, flexShrink: 1, flexBasis: 0 }, children: Text({ children: 'C' }) }),
      ];
      const contentRow = wrapCellsWithVerticalBorders(cells, chars) as LayoutNode;

      const container = Stack({
        style: { width: 400 },
        children: [topBorder, contentRow, separator],
      });

      const result = layoutFromNode(container);

      // Collect border char absolute X positions for each row
      const getAbsoluteTextPositions = (row: LayoutResult): number[] => {
        const positions: number[] = [];
        for (const child of row.children) {
          // Border chars are width=36 containers
          if (child.width === 36 && child.children.length > 0) {
            const textX = child.children[0].x;
            positions.push(child.x + textX);
          }
        }
        return positions;
      };

      const topBorderPositions = getAbsoluteTextPositions(result.children[0]);
      const contentRowPositions = getAbsoluteTextPositions(result.children[1]);
      const separatorPositions = getAbsoluteTextPositions(result.children[2]);

      console.log('Top border text positions:', topBorderPositions);
      console.log('Content row text positions:', contentRowPositions);
      console.log('Separator text positions:', separatorPositions);

      // All border char TEXT positions should match across rows
      expect(topBorderPositions.length).toBe(4); // 4 border chars for 3 columns
      expect(contentRowPositions.length).toBe(4);
      expect(separatorPositions.length).toBe(4);

      for (let i = 0; i < topBorderPositions.length; i++) {
        expect(contentRowPositions[i]).toBeCloseTo(topBorderPositions[i], 0);
        expect(separatorPositions[i]).toBeCloseTo(topBorderPositions[i], 0);
      }
    });
  });

  describe('Full Table Alignment', () => {
    it('should have consistent vertical alignment across all table rows', () => {
      const table = Table({
        columns: [
          { key: 'a', header: 'Col A', width: '50%' },
          { key: 'b', header: 'Col B', width: '50%' },
        ],
        data: [
          { a: 'Row 1', b: 'Data 1' },
          { a: 'Row 2', b: 'Data 2' },
        ],
        border: 'single',
      });

      const container = Stack({
        style: { width: 300 },
        children: table,
      });

      const result = layoutFromNode(container as LayoutNode);
      const tableResult = result.children[0];

      // Table structure:
      // 0: Top border (┌───┬───┐)
      // 1: Header row (│Col A│Col B│)
      // 2: Separator (├───┼───┤)
      // 3: Data row 1 (│Row 1│Data 1│)
      // 4: Separator (├───┼───┤)
      // 5: Data row 2 (│Row 2│Data 2│)
      // 6: Bottom border (└───┴───┘)

      // Collect border char X positions for each row
      const allRowPositions: number[][] = [];
      for (const row of tableResult.children) {
        allRowPositions.push(getBorderCharPositions(row));
      }

      console.log('All row border positions:', allRowPositions);

      // All rows should have 3 border chars (for 2 columns)
      for (const positions of allRowPositions) {
        expect(positions.length).toBe(3);
      }

      // The X positions should be identical across all rows
      const referencePositions = allRowPositions[0];
      for (let i = 1; i < allRowPositions.length; i++) {
        for (let j = 0; j < referencePositions.length; j++) {
          expect(allRowPositions[i][j]).toBeCloseTo(referencePositions[j], 0);
        }
      }
    });

    it('should align vertical borders for ASCII, single, and double border styles', () => {
      const styles = ['ascii', 'single', 'double'] as const;

      for (const borderStyle of styles) {
        const table = Table({
          columns: [
            { key: 'a', header: 'A', width: '50%' },
            { key: 'b', header: 'B', width: '50%' },
          ],
          data: [{ a: 'X', b: 'Y' }],
          border: borderStyle,
        });

        const container = Stack({
          style: { width: 300 },
          children: table,
        });

        const result = layoutFromNode(container as LayoutNode);
        const tableResult = result.children[0];

        const rowPositions: number[][] = [];
        for (const row of tableResult.children) {
          rowPositions.push(getBorderCharPositions(row));
        }

        console.log(`${borderStyle} style positions:`, rowPositions);

        // All rows should align
        const reference = rowPositions[0];
        for (let i = 1; i < rowPositions.length; i++) {
          for (let j = 0; j < reference.length; j++) {
            expect(rowPositions[i][j]).toBeCloseTo(
              reference[j],
              0,
              `${borderStyle}: Row ${i} position ${j} should match row 0`
            );
          }
        }
      }
    });
  });
});
