/**
 * Tests for Renderer - Vertical Movement
 *
 * These tests target Blackhole #4: Silent ignore of backwards vertical movement.
 * ESC/P printers cannot move paper backwards, so the renderer should:
 * 1. Sort items to prevent backwards movement
 * 2. Warn if backwards movement is requested (safety net)
 */

import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { renderLayout, flattenTree, sortRenderItems, type RenderItem } from '../renderer';
import { YogaAdapter } from '../yoga';
import type { LayoutNode, LayoutResult } from '../nodes';
import { DEFAULT_STYLE } from '../nodes';

let yogaAdapter: YogaAdapter;

beforeAll(async () => {
  yogaAdapter = new YogaAdapter();
  await yogaAdapter.init();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const defaultOptions = {
  availableWidth: 500,
  availableHeight: 500,
  lineSpacing: 24,
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

function createLayout(node: LayoutNode): LayoutResult {
  return yogaAdapter.calculateLayout(node, defaultOptions);
}

describe('Renderer vertical movement', () => {
  describe('Sort order optimization', () => {
    it('should sort by Y then X for optimal print head movement', () => {
      const items: RenderItem[] = [
        {
          type: 'text',
          x: 100,
          y: 50,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'C', orientation: 'horizontal' },
        },
        {
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'A', orientation: 'horizontal' },
        },
        {
          type: 'text',
          x: 50,
          y: 0,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'B', orientation: 'horizontal' },
        },
        {
          type: 'text',
          x: 0,
          y: 50,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'D', orientation: 'horizontal' },
        },
      ];

      const sorted = sortRenderItems(items);

      // Should be sorted by Y first, then by X
      expect(sorted.map((i) => (i.data as { content: string }).content)).toEqual([
        'A',
        'B',
        'D',
        'C',
      ]);
    });

    it('should maintain stable sort for same Y position', () => {
      const items: RenderItem[] = [
        {
          type: 'text',
          x: 200,
          y: 0,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'Third', orientation: 'horizontal' },
        },
        {
          type: 'text',
          x: 0,
          y: 0,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'First', orientation: 'horizontal' },
        },
        {
          type: 'text',
          x: 100,
          y: 0,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'Second', orientation: 'horizontal' },
        },
      ];

      const sorted = sortRenderItems(items);

      // Same Y, should be sorted by X
      expect(sorted.map((i) => (i.data as { content: string }).content)).toEqual([
        'First',
        'Second',
        'Third',
      ]);
    });

    it('should handle empty array', () => {
      const sorted = sortRenderItems([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single item', () => {
      const items: RenderItem[] = [
        {
          type: 'text',
          x: 10,
          y: 20,
          width: 50,
          height: 24,
          style: DEFAULT_STYLE,
          data: { type: 'text', content: 'Only', orientation: 'horizontal' },
        },
      ];

      const sorted = sortRenderItems(items);
      expect(sorted).toHaveLength(1);
      expect((sorted[0].data as { content: string }).content).toBe('Only');
    });
  });

  describe('Downward movement', () => {
    it('should successfully render items moving down the page', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'Line 1' },
          { type: 'spacer', height: 48 },
          { type: 'text', content: 'Line 2' },
        ],
      };
      const layout = createLayout(node);
      const result = renderLayout(layout);

      expect(result.commands).toBeDefined();
      expect(result.finalY).toBeGreaterThan(0);
    });

    it('should render items in correct Y order', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'First' },
          { type: 'text', content: 'Second' },
          { type: 'text', content: 'Third' },
        ],
      };
      const layout = createLayout(node);
      const items = flattenTree(layout);
      const sorted = sortRenderItems(items);

      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].y).toBeGreaterThanOrEqual(sorted[i - 1].y);
      }
    });
  });

  describe('No warnings for properly sorted items', () => {
    it('should not warn for properly sorted stack items', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'Top' },
          { type: 'text', content: 'Middle' },
          { type: 'text', content: 'Bottom' },
        ],
      };
      const layout = createLayout(node);
      renderLayout(layout);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not warn for flex row (same Y position)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const node: LayoutNode = {
        type: 'flex',
        children: [
          { type: 'text', content: 'Left' },
          { type: 'text', content: 'Right' },
        ],
      };
      const layout = createLayout(node);
      renderLayout(layout);

      // Same Y position should not warn
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not warn for complex nested layout', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'Header' },
          { type: 'line', direction: 'horizontal', length: 'fill' },
          {
            type: 'flex',
            children: [
              {
                type: 'stack',
                children: [
                  { type: 'text', content: 'Col1 Row1' },
                  { type: 'text', content: 'Col1 Row2' },
                ],
              },
              {
                type: 'stack',
                children: [
                  { type: 'text', content: 'Col2 Row1' },
                  { type: 'text', content: 'Col2 Row2' },
                ],
              },
            ],
          },
          { type: 'text', content: 'Footer' },
        ],
      };

      const layout = createLayout(node);
      const result = renderLayout(layout);

      expect(result.commands.length).toBeGreaterThan(0);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Flattening tree', () => {
    it('should flatten nested structure to render items', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'A' },
          {
            type: 'flex',
            children: [
              { type: 'text', content: 'B' },
              { type: 'text', content: 'C' },
            ],
          },
        ],
      };
      const layout = createLayout(node);
      const items = flattenTree(layout);

      // Should have 3 text items
      const textItems = items.filter((i) => i.type === 'text');
      expect(textItems).toHaveLength(3);
    });

    it('should preserve position information', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'Top' },
          { type: 'spacer', height: 100 },
          { type: 'text', content: 'Bottom' },
        ],
      };
      const layout = createLayout(node);
      const items = flattenTree(layout);
      const textItems = items.filter((i) => i.type === 'text');

      // Bottom text should have larger Y than top
      expect(textItems[1].y).toBeGreaterThan(textItems[0].y);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty stack', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [],
      };
      const layout = createLayout(node);
      const result = renderLayout(layout);

      expect(result.commands).toBeDefined();
    });

    it('should handle single text node', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const node: LayoutNode = { type: 'text', content: 'Hello' };
      const layout = createLayout(node);
      const result = renderLayout(layout);

      expect(result.commands.length).toBeGreaterThan(0);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle line nodes', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'line', direction: 'horizontal', length: 100 },
          { type: 'line', direction: 'horizontal', length: 100 },
        ],
      };
      const layout = createLayout(node);
      const items = flattenTree(layout);

      expect(items.filter((i) => i.type === 'line')).toHaveLength(2);
    });
  });
});
