import { describe, it, expect } from 'vitest';
import { layoutNode, type LayoutContext } from '../src/layout/layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { flex, stack } from '../src/layout/builders';
import { DEFAULT_STYLE } from '../src/layout/nodes';

/**
 * Alignment Bug Tests (TDD)
 */

describe('alignment bugs', () => {
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

  describe('alignVertical negative Y fix', () => {
    // BUG FIX: alignVertical was producing negative Y when content > container
    // This caused rendering issues as ESC/P printers can't render at negative Y
    it('should not produce negative Y positions when content is taller than container', () => {
      const node = flex()
        .alignItems('center')
        .height(100)  // Container is 100px
        .add(stack().text('Line 1').text('Line 2').text('Line 3'))  // Content is 180px (3 lines)
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Child should be at y=0 (clamped), not negative
      expect(result.children[0]?.y).toBeGreaterThanOrEqual(0);
    });

    it('bottom alignment should not produce negative Y when content is taller', () => {
      const node = flex()
        .alignItems('bottom')
        .height(100)
        .add(stack().text('Line 1').text('Line 2').text('Line 3'))
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Child should be at y=0 (clamped), not negative
      expect(result.children[0]?.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('margin vs padding positioning', () => {
    // VERIFIED: Margin and padding produce different positioning
    it('margin should affect position, padding should not', () => {
      // Element with margin(20) should have x = 20
      const marginNode = stack().margin(20).text('With margin').build();
      const marginResult = measureAndLayout(marginNode);

      // Element with padding(20) should have x = 0 (padding is inside)
      const paddingNode = stack().padding(20).text('With padding').build();
      const paddingResult = measureAndLayout(paddingNode);

      // Margin affects outer position
      expect(marginResult.x).toBe(20);
      // Padding does NOT affect outer position
      expect(paddingResult.x).toBe(0);
    });
  });
});
