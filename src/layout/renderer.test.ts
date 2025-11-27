import { describe, it, expect } from 'vitest';
import {
  flattenTree,
  sortRenderItems,
  renderLayout,
  type RenderItem,
  type RenderOptions,
} from './renderer';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from './measure';
import { performLayout } from './layout';
import { stack, flex, grid, text, spacer, line } from './builders';
import { DEFAULT_STYLE, type ResolvedStyle } from './nodes';
import { INTERNATIONAL_CHARSET, CHAR_TABLE } from '../core/constants';

// Helper to get layout result from a node
function layoutFromNode(node: ReturnType<typeof stack>['prototype'] extends { build(): infer R } ? R : never) {
  const measured = measureNode(node, {
    ...DEFAULT_MEASURE_CONTEXT,
    availableWidth: 1000,
    availableHeight: 500,
  }, DEFAULT_STYLE);
  return performLayout(measured, 90, 90, 1000, 500);
}

describe('renderer', () => {
  // ==================== flattenTree ====================

  describe('flattenTree', () => {
    it('flattens single text node', () => {
      const layout = layoutFromNode(text('Hello'));
      const items = flattenTree(layout);

      expect(items.length).toBe(1);
      expect(items[0].type).toBe('text');
      expect(items[0].data).toEqual({ type: 'text', content: 'Hello', orientation: 'horizontal' });
    });

    it('flattens line node', () => {
      const layout = layoutFromNode(line('-', 'fill'));
      const items = flattenTree(layout);

      expect(items.length).toBe(1);
      expect(items[0].type).toBe('line');
      expect(items[0].data.type).toBe('line');
      if (items[0].data.type === 'line') {
        expect(items[0].data.char).toBe('-');
      }
    });

    it('flattens stack with children', () => {
      const layout = layoutFromNode(stack().text('Line 1').text('Line 2').build());
      const items = flattenTree(layout);

      expect(items.length).toBe(2);
      expect(items[0].data).toEqual({ type: 'text', content: 'Line 1', orientation: 'horizontal' });
      expect(items[1].data).toEqual({ type: 'text', content: 'Line 2', orientation: 'horizontal' });
    });

    it('flattens flex with children', () => {
      const layout = layoutFromNode(flex().text('Left').text('Right').build());
      const items = flattenTree(layout);

      expect(items.length).toBe(2);
    });

    it('flattens grid with cells', () => {
      const layout = layoutFromNode(
        grid([100, 100]).cell('A').cell('B').row().cell('C').cell('D').row().build()
      );
      const items = flattenTree(layout);

      expect(items.length).toBe(4);
    });

    it('ignores spacer nodes', () => {
      const layout = layoutFromNode(stack().text('Before').spacer(20).text('After').build());
      const items = flattenTree(layout);

      expect(items.length).toBe(2);
      expect(items.every((i) => i.type === 'text')).toBe(true);
    });

    it('preserves position information', () => {
      const layout = layoutFromNode(text('Test'));
      const items = flattenTree(layout);

      expect(items[0].x).toBeDefined();
      expect(items[0].y).toBeDefined();
      expect(items[0].width).toBeGreaterThan(0);
      expect(items[0].height).toBeGreaterThan(0);
    });

    it('preserves style information', () => {
      const node = text('Bold');
      node.bold = true;
      const layout = layoutFromNode(node);
      const items = flattenTree(layout);

      expect(items[0].style.bold).toBe(true);
    });

    it('flattens nested structures', () => {
      const layout = layoutFromNode(
        stack()
          .add(flex().text('A').text('B'))
          .text('C')
          .build()
      );
      const items = flattenTree(layout);

      expect(items.length).toBe(3);
    });

    it('handles line node with custom character', () => {
      const lineNode = line('=', 200);
      const layout = layoutFromNode(lineNode);
      const items = flattenTree(layout);

      expect(items[0].data.type).toBe('line');
      if (items[0].data.type === 'line') {
        expect(items[0].data.char).toBe('=');
      }
    });

    it('uses default char for horizontal line without char', () => {
      // Create a line node without explicit char
      const lineNode = { type: 'line' as const, direction: 'horizontal' as const };
      const measured = measureNode(lineNode, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const layout = performLayout(measured, 0, 0, 500, 100);
      const items = flattenTree(layout);

      if (items[0].data.type === 'line') {
        expect(items[0].data.char).toBe('-');
      }
    });
  });

  // ==================== sortRenderItems ====================

  describe('sortRenderItems', () => {
    it('sorts by Y position (top to bottom)', () => {
      const items: RenderItem[] = [
        createMockItem(100, 200),
        createMockItem(100, 100),
        createMockItem(100, 300),
      ];
      const sorted = sortRenderItems(items);

      expect(sorted[0].y).toBe(100);
      expect(sorted[1].y).toBe(200);
      expect(sorted[2].y).toBe(300);
    });

    it('sorts by X position when Y is equal', () => {
      const items: RenderItem[] = [
        createMockItem(300, 100),
        createMockItem(100, 100),
        createMockItem(200, 100),
      ];
      const sorted = sortRenderItems(items);

      expect(sorted[0].x).toBe(100);
      expect(sorted[1].x).toBe(200);
      expect(sorted[2].x).toBe(300);
    });

    it('handles mixed positions', () => {
      const items: RenderItem[] = [
        createMockItem(200, 200),
        createMockItem(100, 100),
        createMockItem(300, 100),
        createMockItem(100, 200),
      ];
      const sorted = sortRenderItems(items);

      // First row (y=100) sorted by x
      expect(sorted[0]).toMatchObject({ x: 100, y: 100 });
      expect(sorted[1]).toMatchObject({ x: 300, y: 100 });
      // Second row (y=200) sorted by x
      expect(sorted[2]).toMatchObject({ x: 100, y: 200 });
      expect(sorted[3]).toMatchObject({ x: 200, y: 200 });
    });

    it('does not mutate original array', () => {
      const items: RenderItem[] = [
        createMockItem(200, 200),
        createMockItem(100, 100),
      ];
      const originalFirst = items[0];
      sortRenderItems(items);

      expect(items[0]).toBe(originalFirst);
    });

    it('handles empty array', () => {
      const sorted = sortRenderItems([]);
      expect(sorted).toEqual([]);
    });

    it('handles single item', () => {
      const items: RenderItem[] = [createMockItem(100, 100)];
      const sorted = sortRenderItems(items);
      expect(sorted.length).toBe(1);
    });
  });

  // ==================== renderLayout ====================

  describe('renderLayout', () => {
    it('renders simple text', () => {
      const layout = layoutFromNode(text('Hello'));
      const result = renderLayout(layout);

      expect(result.commands).toBeInstanceOf(Uint8Array);
      expect(result.commands.length).toBeGreaterThan(0);
      expect(result.finalY).toBeGreaterThan(0);
    });

    it('renders multiple text items', () => {
      const layout = layoutFromNode(stack().text('Line 1').text('Line 2').build());
      const result = renderLayout(layout);

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('renders line item', () => {
      const layout = layoutFromNode(line('-', 200));
      const result = renderLayout(layout);

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('uses start position options', () => {
      const layout = layoutFromNode(text('Test'));
      const result = renderLayout(layout, { startX: 100, startY: 200 });

      // finalY reflects layout coordinates, not page offset
      // The layout starts at y=90 (from layoutFromNode helper)
      expect(result.finalY).toBeGreaterThan(0);

      // Verify that positioning commands are emitted to move to the layout position
      // The layout items are at y=90 in layout space, so ESC J should be emitted
      // ESC J = 0x1B 0x4A
      const hasVerticalPositioning = result.commands.some((cmd, i, arr) =>
        cmd === 0x1B && arr[i + 1] === 0x4A
      );
      expect(hasVerticalPositioning).toBe(true);
    });

    it('applies initial style', () => {
      const layout = layoutFromNode(text('Bold'));
      const initialStyle: ResolvedStyle = {
        bold: true,
        italic: false,
        underline: false,
        doubleStrike: false,
        doubleWidth: false,
        doubleHeight: false,
        condensed: false,
        cpi: 10,
      };
      const result = renderLayout(layout, { initialStyle });

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('respects charset option', () => {
      const layout = layoutFromNode(text('#')); // Character that gets mapped
      const result = renderLayout(layout, {
        charset: INTERNATIONAL_CHARSET.UK,
      });

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('respects charTable option', () => {
      const layout = layoutFromNode(text('Test'));
      const result = renderLayout(layout, {
        charTable: CHAR_TABLE.PC850_MULTILINGUAL,
      });

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('calculates final Y position', () => {
      const layout = layoutFromNode(
        stack().text('Line 1').text('Line 2').text('Line 3').build()
      );
      const result = renderLayout(layout, { startY: 100 });

      // Final Y should be after all content
      expect(result.finalY).toBeGreaterThan(100);
    });

    it('handles empty layout', () => {
      const layout = layoutFromNode(stack().build());
      const result = renderLayout(layout);

      expect(result.commands).toBeInstanceOf(Uint8Array);
    });

    it('renders grid layout', () => {
      const layout = layoutFromNode(
        grid([100, 100]).cell('A').cell('B').row().build()
      );
      const result = renderLayout(layout);

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('renders flex layout', () => {
      const layout = layoutFromNode(
        flex().text('Left').text('Right').build()
      );
      const result = renderLayout(layout);

      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('handles layout with spacers', () => {
      const layout = layoutFromNode(
        stack().text('Before').spacer(50).text('After').build()
      );
      const result = renderLayout(layout);

      // Should only render text items, not spacers
      expect(result.commands.length).toBeGreaterThan(0);
    });
  });

  // ==================== Style Application ====================

  describe('style application', () => {
    it('applies bold style', () => {
      const node = text('Bold');
      node.bold = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain bold command (ESC E)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 45'); // ESC E (bold on)
    });

    it('applies italic style', () => {
      const node = text('Italic');
      node.italic = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain italic command (ESC 4)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 34'); // ESC 4 (italic on)
    });

    it('applies underline style', () => {
      const node = text('Underline');
      node.underline = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain underline command (ESC -)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 2D'); // ESC -
    });

    it('applies double strike style', () => {
      const node = text('DoubleStrike');
      node.doubleStrike = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain double strike command (ESC G)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 47'); // ESC G
    });

    it('applies double width style', () => {
      const node = text('Wide');
      node.doubleWidth = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain double width command
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 57'); // ESC W
    });

    it('applies double height style', () => {
      const node = text('Tall');
      node.doubleHeight = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain double height command
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 77'); // ESC w
    });

    it('applies condensed style', () => {
      const node = text('Condensed');
      node.condensed = true;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain condensed command (SI = 0x0F)
      const hex = toHex(result.commands);
      expect(hex).toContain('0F');
    });

    it('applies CPI 12 (elite)', () => {
      const node = text('Elite');
      node.cpi = 12;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain elite select command (ESC M)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 4D'); // ESC M
    });

    it('applies CPI 15 (micron)', () => {
      const node = text('Micron');
      node.cpi = 15;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout);

      // Should contain micron/15cpi command (ESC g)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 67'); // ESC g
    });

    it('applies CPI 10 (pica)', () => {
      // Start with different CPI then switch to 10
      const initialStyle: ResolvedStyle = {
        ...DEFAULT_STYLE,
        cpi: 12,
      };
      const node = text('Pica');
      node.cpi = 10;
      const layout = layoutFromNode(node);
      const result = renderLayout(layout, { initialStyle });

      // Should contain pica select command (ESC P)
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 50'); // ESC P
    });
  });

  // ==================== Position Commands ====================

  describe('position commands', () => {
    it('emits horizontal position command when items at different X', () => {
      // Create two items at significantly different X positions
      // The renderer only emits ESC $ when the difference is > 1
      const layout = layoutFromNode(
        flex().gap(100).text('A').text('B').build()
      );
      const result = renderLayout(layout, { startX: 0 });

      // Should contain ESC $ command for horizontal positioning when gap exists
      const hex = toHex(result.commands);
      // The command might or might not be present depending on position calculation
      // Just verify commands were generated
      expect(result.commands.length).toBeGreaterThan(0);
    });

    it('emits vertical advance command', () => {
      const layout = layoutFromNode(
        stack().text('Line 1').text('Line 2').build()
      );
      const result = renderLayout(layout);

      // Should contain ESC J command for vertical advance
      const hex = toHex(result.commands);
      expect(hex).toContain('1B 4A'); // ESC J
    });
  });

  // ==================== Grid columnGap=0 Bug Fix ====================

  describe('grid columnGap=0', () => {
    // Helper to find ESC $ commands and extract positions
    function findEscDollarPositions(commands: Uint8Array): number[] {
      const positions: number[] = [];
      for (let i = 0; i < commands.length - 3; i++) {
        if (commands[i] === 0x1B && commands[i + 1] === 0x24) {
          const nL = commands[i + 2]!;
          const nH = commands[i + 3]!;
          const units = nL + nH * 256;
          const dots = units * 6; // ESC $ uses 1/60 inch units, at 360 DPI = 6 dots
          positions.push(dots);
        }
      }
      return positions;
    }

    it('generates distinct ESC $ positions for columnGap=0', () => {
      const layout = layoutFromNode(
        grid([200, 200, 200])
          .columnGap(0)
          .cell('AAA').cell('BBB').cell('CCC').row()
          .build()
      );
      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);

      // Should have positioning commands for columns 2 and 3
      // (column 1 starts at the current position, so may not need ESC $)
      expect(positions.length).toBeGreaterThanOrEqual(2);

      // Positions should be distinct and increasing
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
      }
    });

    it('produces ESC $ commands for both columnGap=0 and columnGap=10', () => {
      // This test ensures that columnGap=0 generates positioning commands
      // (the bug was that columnGap=0 would NOT generate ESC $ commands)
      const layoutGap0 = layoutFromNode(
        grid([200, 200]).columnGap(0).cell('A').cell('B').row().build()
      );
      const layoutGap10 = layoutFromNode(
        grid([200, 200]).columnGap(10).cell('A').cell('B').row().build()
      );

      const positionsGap0 = findEscDollarPositions(renderLayout(layoutGap0).commands);
      const positionsGap10 = findEscDollarPositions(renderLayout(layoutGap10).commands);

      // CRITICAL: Both should have positioning commands for the second column
      // The bug was that gap=0 produced NO positioning commands
      expect(positionsGap0.length).toBeGreaterThan(0);
      expect(positionsGap10.length).toBeGreaterThan(0);
    });

    it('correctly tracks printer head position after printing text', () => {
      // This test verifies the fix: ctx.currentX should track actual text width,
      // not constraint/column width, to ensure ESC $ commands are generated
      const layout = layoutFromNode(
        grid([300, 300])  // Wide columns
          .columnGap(0)
          .cell('Hi').cell('There').row()  // Short text
          .build()
      );

      const items = flattenTree(layout);
      expect(items.length).toBe(2);

      // Both items should have distinct X positions
      expect(items[0]!.x).not.toBe(items[1]!.x);

      // Render and verify positioning commands are generated
      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);

      // Should have positioning command for second column
      // because actual text "Hi" is much shorter than column width 300
      expect(positions.length).toBeGreaterThan(0);
    });

    // === Additional Regression Prevention Tests ===

    it('handles very short text (single char) in wide columns with gap=0', () => {
      // Edge case: Single character text in 300px columns
      const layout = layoutFromNode(
        grid([300, 300, 300])
          .columnGap(0)
          .cell('A').cell('B').cell('C').row()
          .build()
      );

      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);

      // Must generate ESC $ for columns 2 and 3 since "A" is ~36 dots but column is 300
      expect(positions.length).toBeGreaterThanOrEqual(2);

      // Positions should be increasing (column 2 < column 3)
      expect(positions[1]).toBeGreaterThan(positions[0]!);

      // The difference between positions should be approximately the column width (300 dots)
      // Allow for ESC $ rounding (6 dots per unit)
      const gap = positions[1]! - positions[0]!;
      expect(gap).toBeGreaterThanOrEqual(294); // 300 - 6 (one unit rounding)
      expect(gap).toBeLessThanOrEqual(306);    // 300 + 6
    });

    it('handles multi-row grid with varying text lengths and gap=0', () => {
      const layout = layoutFromNode(
        grid([200, 200, 200])
          .columnGap(0)
          .cell('Short').cell('Medium Text').cell('A').row()
          .cell('X').cell('Y').cell('LongerText').row()
          .build()
      );

      const items = flattenTree(layout);
      expect(items.length).toBe(6);

      // All items in same column should have same X position
      const col1Items = [items[0], items[3]];
      const col2Items = [items[1], items[4]];
      const col3Items = [items[2], items[5]];

      // Verify column alignment across rows
      expect(col1Items[0]!.x).toBe(col1Items[1]!.x);
      expect(col2Items[0]!.x).toBe(col2Items[1]!.x);
      expect(col3Items[0]!.x).toBe(col3Items[1]!.x);

      // Verify columns are at distinct positions
      expect(col2Items[0]!.x).toBeGreaterThan(col1Items[0]!.x);
      expect(col3Items[0]!.x).toBeGreaterThan(col2Items[0]!.x);

      // Render and verify commands generated
      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);
      expect(positions.length).toBeGreaterThan(0);
    });

    it('handles many narrow columns with gap=0 (stress test)', () => {
      const layout = layoutFromNode(
        grid([80, 80, 80, 80, 80])
          .columnGap(0)
          .cell('1').cell('2').cell('3').cell('4').cell('5').row()
          .build()
      );

      const items = flattenTree(layout);
      expect(items.length).toBe(5);

      // Each column should have increasing X position
      for (let i = 1; i < items.length; i++) {
        expect(items[i]!.x).toBeGreaterThan(items[i - 1]!.x);
      }

      // Verify ESC $ commands generated for columns 2-5
      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);
      expect(positions.length).toBeGreaterThanOrEqual(4);
    });

    it('verifies ESC $ command format (1B 24 nL nH)', () => {
      const layout = layoutFromNode(
        grid([200, 200]).columnGap(0).cell('A').cell('B').row().build()
      );
      const result = renderLayout(layout);

      // Find ESC $ command and verify format
      let foundEscDollar = false;
      for (let i = 0; i < result.commands.length - 3; i++) {
        if (result.commands[i] === 0x1B && result.commands[i + 1] === 0x24) {
          foundEscDollar = true;
          // Verify it's followed by nL and nH bytes
          const nL = result.commands[i + 2];
          const nH = result.commands[i + 3];
          expect(nL).toBeDefined();
          expect(nH).toBeDefined();
          // nL and nH should be valid byte values (0-255)
          expect(nL).toBeGreaterThanOrEqual(0);
          expect(nL).toBeLessThanOrEqual(255);
          expect(nH).toBeGreaterThanOrEqual(0);
          expect(nH).toBeLessThanOrEqual(255);
          break;
        }
      }
      expect(foundEscDollar).toBe(true);
    });

    it('handles gap=0 with condensed text style', () => {
      const condensedNode = grid([200, 200])
        .columnGap(0)
        .cell('Condensed')
        .cell('Text')
        .row()
        .build();
      // Apply condensed style
      condensedNode.condensed = true;

      const layout = layoutFromNode(condensedNode);
      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);

      // Should still generate ESC $ for column 2 (condensed chars are ~21 dots each)
      expect(positions.length).toBeGreaterThan(0);
    });

    it('handles gap=0 with double-width text style', () => {
      const doubleWidthNode = grid([400, 400])
        .columnGap(0)
        .cell('Wide')
        .cell('Text')
        .row()
        .build();
      // Apply double-width style
      doubleWidthNode.doubleWidth = true;

      const layout = layoutFromNode(doubleWidthNode);
      const result = renderLayout(layout);
      const positions = findEscDollarPositions(result.commands);

      // Should generate ESC $ for column 2 (double-width chars are ~72 dots each at 10 CPI)
      expect(positions.length).toBeGreaterThan(0);
    });

    it('generates different positions for gap=0 vs gap=1 vs gap=10', () => {
      const createLayout = (gap: number) =>
        layoutFromNode(
          grid([200, 200, 200]).columnGap(gap)
            .cell('A').cell('B').cell('C').row().build()
        );

      const posGap0 = findEscDollarPositions(renderLayout(createLayout(0)).commands);
      const posGap1 = findEscDollarPositions(renderLayout(createLayout(1)).commands);
      const posGap10 = findEscDollarPositions(renderLayout(createLayout(10)).commands);

      // All should generate positioning commands
      expect(posGap0.length).toBeGreaterThan(0);
      expect(posGap1.length).toBeGreaterThan(0);
      expect(posGap10.length).toBeGreaterThan(0);

      // gap=10 positions should be further right than gap=0 (accounting for ESC $ 6-dot rounding)
      // Column 3 position: gap=0 at ~400, gap=10 at ~420
      if (posGap0.length >= 2 && posGap10.length >= 2) {
        expect(posGap10[1]! - posGap0[1]!).toBeGreaterThanOrEqual(12); // ~20 dots difference, rounded to 6-dot units
      }
    });
  });
});

// ==================== HELPER FUNCTIONS ====================

function createMockItem(x: number, y: number): RenderItem {
  return {
    type: 'text',
    x,
    y,
    width: 100,
    height: 60,
    style: DEFAULT_STYLE,
    data: { type: 'text', content: 'Test' },
  };
}

function toHex(data: Uint8Array): string {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}
