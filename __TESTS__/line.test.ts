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

  // ==================== LINE NODE LAYOUT ====================

  describe('layoutNode - line', () => {
    it('positions line and fills width', () => {
      const node = line('-', 'fill');
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 400 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 50, y: 100, width: 400, height: 60 });

      expect(result.x).toBe(50);
      expect(result.y).toBe(100);
      expect(result.width).toBe(400); // Fills container width
    });
  });
});
