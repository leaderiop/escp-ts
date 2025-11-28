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

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('handles empty children arrays', () => {
      const node = stack().build();
      const result = measureAndLayout(node);

      expect(result.children).toEqual([]);
      expect(result.width).toBeGreaterThanOrEqual(0);
      expect(result.height).toBeGreaterThanOrEqual(0);
    });

    it('handles single child', () => {
      const node = flex().text('Only child').build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(1);
    });

    it('handles space-between with single child', () => {
      const node = flex().justify('space-between').text('Only').build();
      const result = measureAndLayout(node);

      // Single child should be at start
      expect(result.children[0]?.x).toBe(0);
    });
  });
});
