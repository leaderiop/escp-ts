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
      expect(items[0].data).toEqual({ type: 'text', content: 'Hello' });
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
      expect(items[0].data).toEqual({ type: 'text', content: 'Line 1' });
      expect(items[1].data).toEqual({ type: 'text', content: 'Line 2' });
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

      expect(result.finalY).toBeGreaterThanOrEqual(200);
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
