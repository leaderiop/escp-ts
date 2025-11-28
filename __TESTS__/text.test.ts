import { describe, it, expect } from 'vitest';
import { layoutNode, performLayout, type LayoutContext } from '../src/layout/layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { stack, flex, grid, text, spacer, line, spaceQuery } from '../src/layout/builders';
import { DEFAULT_STYLE } from '../src/layout/nodes';
import { flattenTree } from '../src/layout/renderer';

describe('layout', () => {
  const ctx: LayoutContext = {
    x: 0,
    y: 0,
    width: 1000,
    height: 500,
  };

  // Helper to measure and layout a node
  const measureAndLayout = (node: ReturnType<typeof stack>['prototype'] extends { build(): infer R } ? R : never) => {
    const measured = measureNode(node, {
      ...DEFAULT_MEASURE_CONTEXT,
      availableWidth: ctx.width,
      availableHeight: ctx.height,
    }, DEFAULT_STYLE);
    return layoutNode(measured, ctx);
  };

  // ==================== TEXT NODE LAYOUT ====================

  describe('layoutNode - text', () => {
    it('positions text at context position', () => {
      const node = text('Hello');
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 100, y: 50, width: 500, height: 100 });

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
      expect(result.children).toEqual([]);
    });

    it('aligns text left by default', () => {
      const node = text('Hi');
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      expect(result.x).toBe(0);
    });

    it('aligns text center', () => {
      const node = text('Hi');
      node.align = 'center';
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      // Should be offset to center
      const expectedX = Math.floor((500 - measured.preferredWidth) / 2);
      expect(result.x).toBe(expectedX);
    });

    it('aligns text right', () => {
      const node = text('Hi');
      node.align = 'right';
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      const expectedX = 500 - measured.preferredWidth;
      expect(result.x).toBe(expectedX);
    });

    it('applies margin to text position', () => {
      const node = text('Hi');
      node.margin = { top: 10, right: 20, bottom: 30, left: 40 };
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      // Position should be offset by margin
      expect(result.x).toBe(40); // left margin
      expect(result.y).toBe(10); // top margin
    });
  });
});
