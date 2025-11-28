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

  // ==================== RELATIVE POSITIONING ====================

  describe('relative positioning', () => {
    it('stores offset in relativeOffset (applied at render time)', () => {
      const node = stack()
        .relativePosition(50, 30)
        .text('Offset')
        .build();
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 100, y: 100, width: 1000, height: 500 });

      // Position stays at flow position (offset applied at render time)
      expect(result.x).toBe(100); // Flow position
      expect(result.y).toBe(100); // Flow position
      // Offset stored for render-time application
      expect(result.relativeOffset?.x).toBe(50);
      expect(result.relativeOffset?.y).toBe(30);
    });

    it('stores negative offsets in relativeOffset', () => {
      const node = stack()
        .relativePosition(-20, -10)
        .text('Negative offset')
        .build();
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 100, y: 100, width: 1000, height: 500 });

      expect(result.x).toBe(100); // Flow position preserved
      expect(result.y).toBe(100); // Flow position preserved
      expect(result.relativeOffset?.x).toBe(-20);
      expect(result.relativeOffset?.y).toBe(-10);
    });

    it('does not affect sibling positioning (stays in flow)', () => {
      const node = stack()
        .gap(10)
        .text('Before')
        .add(stack().relativePosition(100, 0).text('Relative'))
        .text('After')
        .build();
      const result = measureAndLayout(node);

      // The "After" sibling should be positioned as if "Relative" was in normal flow
      // Without relative offset affecting siblings
      expect(result.children.length).toBe(3);

      // First child at y=0
      expect(result.children[0]?.y).toBe(0);

      // Second child (with relative) - flow position preserved, offset in relativeOffset
      const relativeChild = result.children[1];
      expect(relativeChild?.x).toBe(0); // Flow position (offset in relativeOffset)
      expect(relativeChild?.relativeOffset?.x).toBe(100); // Offset stored

      // Third child should be after the second child's flow position (not rendered position)
      const afterY = result.children[2]?.y ?? 0;
      expect(afterY).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('works with text nodes using manual positioning', () => {
      const node = text('Offset Text');
      node.position = 'relative';
      node.offsetX = 25;
      node.offsetY = 15;
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      expect(result.x).toBe(0); // Flow position
      expect(result.y).toBe(0); // Flow position
      expect(result.relativeOffset?.x).toBe(25);
      expect(result.relativeOffset?.y).toBe(15);
    });
  });
});
