import { describe, it, expect } from 'vitest';
import { layoutNode, type LayoutContext } from '../src/layout/layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { stack } from '../src/layout/builders';
import { DEFAULT_STYLE } from '../src/layout/nodes';

/**
 * Stack Bug Tests (TDD)
 */

describe('stack bugs', () => {
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

  describe('stack row direction gap', () => {
    // VERIFIED: Stack row direction gap works correctly
    it('stack with direction row should apply gap between items', () => {
      const node = stack()
        .direction('row')
        .gap(30)
        .text('A')
        .text('B')
        .build();
      const result = measureAndLayout(node);

      const child0Right = (result.children[0]?.x ?? 0) + (result.children[0]?.width ?? 0);
      const child1Left = result.children[1]?.x ?? 0;

      // Gap should be exactly 30
      expect(child1Left - child0Right).toBe(30);
    });
  });
});
