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

  // ==================== NESTED LAYOUT ====================

  describe('nested layouts', () => {
    it('lays out nested stacks', () => {
      const node = stack()
        .text('Outer')
        .add(stack().text('Inner 1').text('Inner 2'))
        .build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(2);
      expect(result.children[1]?.children.length).toBe(2);
      // Inner children should have correct positions
      expect(result.children[1]?.children[0]?.y).toBeLessThan(
        result.children[1]?.children[1]?.y ?? 0
      );
    });

    it('lays out flex inside stack', () => {
      const node = stack()
        .add(flex().text('Left').text('Right'))
        .build();
      const result = measureAndLayout(node);

      const flexResult = result.children[0];
      expect(flexResult?.children.length).toBe(2);
      expect(flexResult?.children[0]?.x).toBeLessThan(flexResult?.children[1]?.x ?? 0);
    });

    it('lays out grid inside flex', () => {
      const node = flex()
        .add(grid([50, 50]).cell('A').cell('B').row())
        .text('After')
        .build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(2);
      const gridResult = result.children[0];
      expect(gridResult?.children.length).toBe(2);
    });
  });
});
