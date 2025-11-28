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

  // ==================== CONDITIONAL CONTENT ====================

  describe('conditional content', () => {
    it('shows node when callback condition returns true', () => {
      const node = stack()
        .when((ctx) => ctx.availableWidth > 500)
        .text('Visible')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      // Node should have content when condition is true
      expect(result.children.length).toBeGreaterThan(0);
    });

    it('hides node when callback condition returns false', () => {
      const node = stack()
        .when((ctx) => ctx.availableWidth > 2000)
        .text('Should not show')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);

      // When condition is false, the measurement should indicate no content
      expect(measured.conditionMet).toBe(false);
    });

    it('shows node when SpaceQuery minWidth is satisfied', () => {
      const node = stack()
        .when(spaceQuery({ minWidth: 500 }))
        .text('Visible')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);

      expect(measured.conditionMet).toBe(true);
    });

    it('hides node when SpaceQuery minWidth not satisfied', () => {
      const node = stack()
        .when(spaceQuery({ minWidth: 2000 }))
        .text('Hidden')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);

      expect(measured.conditionMet).toBe(false);
    });

    it('uses fallback when condition is false', () => {
      const fallbackNode = text('Fallback shown');
      const node = stack()
        .when(spaceQuery({ minWidth: 5000 }))
        .fallback(fallbackNode)
        .text('Main content')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);

      expect(measured.conditionMet).toBe(false);
      expect(measured.fallbackMeasured).toBeDefined();
    });
  });
});
