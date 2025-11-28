import { describe, it, expect } from 'vitest';
import { layoutNode, type LayoutContext } from '../src/layout/layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from '../src/layout/measure';
import { stack } from '../src/layout/builders';
import { DEFAULT_STYLE } from '../src/layout/nodes';
import { flattenTree } from '../src/layout/renderer';

/**
 * Positioning Bug Tests (TDD)
 *
 * Tests for absolute positioning behavior with flow content.
 */

describe('positioning bugs', () => {
  const ctx: LayoutContext = {
    x: 0,
    y: 0,
    width: 1000,
    height: 500,
  };

  describe('absolute positioning Y coordinates', () => {
    // BUG: Absolute positioned items should be sorted by Y with flow items
    // and render items should have sufficient Y spacing (>= line height) to avoid overlap

    it.fails('absolute items should not visually overlap with flow content when Y values are close', () => {
      // This test documents that absolute Y=200 will overlap with flow items near Y=170-230
      // Line height is 60 dots, so items need 60+ dots spacing to avoid visual overlap
      const LINE_HEIGHT = 60;

      const node = stack()
        .gap(15)
        .padding(30)
        .text('Flow Item 1')  // Will be around Y=30
        .text('Flow Item 2')  // Will be around Y=105
        .text('Flow Item 3')  // Will be around Y=180
        .add(stack().absolutePosition(100, 200).text('Absolute Y=200'))  // Y=200
        .text('Flow Item 4')  // Will be around Y=255
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });
      const renderItems = flattenTree(result).filter(item => item.data.type === 'text');

      // Sort by Y (as renderer does)
      renderItems.sort((a, b) => a.y - b.y);

      // Check that all adjacent items have sufficient Y spacing
      for (let i = 0; i < renderItems.length - 1; i++) {
        const current = renderItems[i]!;
        const next = renderItems[i + 1]!;
        const yGap = next.y - current.y;

        // All items should have at least LINE_HEIGHT spacing to avoid visual overlap
        // This test FAILS because absolute Y=200 is only ~20 dots from Flow Item 3 at ~Y=180
        expect(yGap).toBeGreaterThanOrEqual(LINE_HEIGHT);
      }
    });

    it('absolute items should be placed at exact Y coordinates', () => {
      const node = stack()
        .padding(30)
        .text('Flow content')
        .add(stack().absolutePosition(100, 500).text('Absolute at Y=500'))
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 1000 });

      // Find the absolute positioned child
      const absoluteChild = result.children.find(c => (c.node as any).position === 'absolute');

      // Absolute item should be at exactly Y=500
      expect(absoluteChild?.y).toBe(500);
    });

    it('render items should be sorted by Y regardless of absolute/flow position', () => {
      const node = stack()
        .padding(30)
        .text('Flow at start')  // Y = 30 (padding)
        .add(stack().absolutePosition(100, 100).text('Absolute Y=100'))
        .add(stack().absolutePosition(100, 300).text('Absolute Y=300'))
        .text('Flow at end')  // Y = 30 + 60 (line height) = 90
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });
      const renderItems = flattenTree(result).filter(item => item.data.type === 'text');

      // Sort by Y (as renderer does)
      renderItems.sort((a, b) => a.y - b.y);

      // Verify sorted order: Flow start (~30), Flow end (~90), Absolute Y=100, Absolute Y=300
      // Flow items are positioned sequentially, so "Flow at end" is at Y=90 (30 + 60)
      expect(renderItems[0]?.y).toBeLessThan(90);   // Flow at start (~30)
      expect(renderItems[1]?.y).toBeLessThan(100);  // Flow at end (~90)
      expect(renderItems[2]?.y).toBe(100);          // Absolute Y=100
      expect(renderItems[3]?.y).toBe(300);          // Absolute Y=300
    });
  });
});
