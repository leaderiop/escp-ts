import { describe, it, expect } from 'vitest';
import { layoutNode, type LayoutContext } from '../src/layout/layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { flex, stack } from '../src/layout/builders';
import { DEFAULT_STYLE } from '../src/layout/nodes';

/**
 * Flex Bug Tests (TDD)
 */

describe('flex bugs', () => {
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

  describe('flex alignItems order', () => {
    // VERIFIED: Flex alignItems maintains correct order
    it('flex with alignItems center should maintain child order', () => {
      const node = flex()
        .alignItems('center')
        .text('First')
        .text('Second')
        .text('Third')
        .build();
      const result = measureAndLayout(node);

      // First child should have lowest x position
      expect(result.children[0]?.x).toBeLessThan(result.children[1]?.x ?? 0);
      expect(result.children[1]?.x).toBeLessThan(result.children[2]?.x ?? 0);
    });
  });

  describe('flex wrap rowGap', () => {
    // VERIFIED: rowGap creates space between wrapped flex lines
    it('flex wrap rowGap should create vertical space between lines', () => {
      const node = flex()
        .wrap('wrap')
        .rowGap(50)
        .add(stack().width(600).text('Item 1'))
        .add(stack().width(600).text('Item 2'))
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 1000 });

      const firstItemBottom = (result.children[0]?.y ?? 0) + (result.children[0]?.height ?? 0);
      const secondItemTop = result.children[1]?.y ?? 0;

      // Gap should be exactly 50
      expect(secondItemTop - firstItemBottom).toBe(50);
    });
  });
});
