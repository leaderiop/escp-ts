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

  // ==================== ABSOLUTE POSITIONING ====================

  describe('absolute positioning', () => {
    it('positions node at explicit X,Y coordinates', () => {
      const node = stack()
        .absolutePosition(100, 200)
        .text('Absolute')
        .build();
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    it('respects posX only (posY defaults to 0)', () => {
      const node = stack().text('Test').build();
      node.position = 'absolute';
      node.posX = 150;
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 50, y: 75, width: 1000, height: 500 });

      expect(result.x).toBe(150); // Uses posX
      expect(result.y).toBe(0); // Defaults to 0 (page origin), not context
    });

    it('respects posY only (posX defaults to 0)', () => {
      const node = stack().text('Test').build();
      node.position = 'absolute';
      node.posY = 250;
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 50, y: 75, width: 1000, height: 500 });

      expect(result.x).toBe(0); // Defaults to 0 (page origin), not context
      expect(result.y).toBe(250); // Uses posY
    });

    it('absolute child does not affect sibling positioning', () => {
      const node = stack()
        .text('Normal 1')
        .add(stack().absolutePosition(500, 500).text('Absolute'))
        .text('Normal 2')
        .build();
      const result = measureAndLayout(node);

      // Normal children should flow sequentially
      const normal1Y = result.children[0]?.y ?? 0;
      const normal2Y = result.children[2]?.y ?? 0;

      // Normal 2 should be after Normal 1 (not affected by absolute sibling)
      expect(normal2Y).toBeGreaterThan(normal1Y);
    });
  });

  // ==================== BUG-003: Absolute Positioning Overlays ====================

  describe('BUG-003: Absolute Positioning Overlays', () => {
    it('should not corrupt adjacent content when absolute element is positioned nearby', () => {
      // BUG: Absolute positioned elements may corrupt or overlay adjacent content
      // Create a layout where absolute element is near but not overlapping normal content
      const node = stack()
        .text('Normal content at start')
        .add(stack().absolutePosition(0, 120).text('Absolute at y=120'))
        .text('This should be at y=60, not corrupted')
        .build();

      const result = measureAndLayout(node);

      // Verify layout structure
      expect(result.children.length).toBe(3);

      // First text should be at y=0
      expect(result.children[0]?.y).toBe(0);

      // Absolute element should be at its specified position (y=120)
      const absoluteChild = result.children[1];
      expect(absoluteChild?.y).toBe(120);
      expect(absoluteChild?.x).toBe(0);

      // Third text (normal flow) should be at y=60 (after first text, not affected by absolute)
      // This is where the bug manifests: the third child's position may be corrupted
      const thirdChild = result.children[2];
      expect(thirdChild?.y).toBe(60);
      expect(thirdChild?.x).toBe(0);

      // The absolute element's coordinates should not affect the third child
      // Bug: third child might have incorrect y position due to absolute element interference
    });

    it('should correctly position absolute element at specific x,y without affecting container bounds', () => {
      // BUG: Absolute positioned element might affect the parent container's calculated bounds
      const absoluteChild = stack()
        .absolutePosition(500, 300)
        .text('Far away absolute')
        .build();

      const node = stack()
        .width(200)
        .text('Normal')
        .add(absoluteChild)
        .build();

      const result = measureAndLayout(node);

      // The absolute child should be at (500, 300)
      const absResult = result.children[1];
      expect(absResult?.x).toBe(500);
      expect(absResult?.y).toBe(300);

      // The container's width should NOT be affected by the absolute element's position
      // Container was specified as 200px width, should stay 200
      // Bug: Container bounds might be incorrectly expanded to include absolute element
      expect(result.width).toBeLessThanOrEqual(200);

      // The container's height should only reflect normal flow content
      // Bug: Container height might incorrectly include absolute element
      expect(result.height).toBe(60); // Only the "Normal" text height
    });

    it('should handle mixing multiple absolute and relative positioned elements', () => {
      // BUG: Multiple absolute elements might interfere with each other or with normal flow
      const abs1 = stack().absolutePosition(100, 100).text('Abs1').build();
      const abs2 = stack().absolutePosition(200, 50).text('Abs2').build();

      const node = stack()
        .text('Flow 1') // y=0
        .add(abs1) // absolute at (100, 100)
        .text('Flow 2') // should be y=60
        .add(abs2) // absolute at (200, 50)
        .text('Flow 3') // should be y=120
        .build();

      const result = measureAndLayout(node);

      expect(result.children.length).toBe(5);

      // Flow elements should maintain their sequential positions
      expect(result.children[0]?.y).toBe(0); // Flow 1
      expect(result.children[2]?.y).toBe(60); // Flow 2
      expect(result.children[4]?.y).toBe(120); // Flow 3

      // Absolute elements should be at their specified positions
      expect(result.children[1]?.x).toBe(100);
      expect(result.children[1]?.y).toBe(100);
      expect(result.children[3]?.x).toBe(200);
      expect(result.children[3]?.y).toBe(50);

      // Bug: Flow elements might have incorrect positions due to absolute elements
      // Bug: Absolute elements might have their positions corrupted
    });

    it('should not overlap absolute element content with normal flow content at same coordinates', () => {
      // BUG: When absolute and flow elements end up at same visual position, corruption may occur
      // Create scenario where absolute element is at same Y as normal content
      const node = stack()
        .text('First line') // at y=0
        .add(stack().absolutePosition(0, 0).text('OVERLAY')) // also at y=0
        .build();

      const result = measureAndLayout(node);

      // Both elements should have their correct positions in the layout tree
      // The normal flow element
      expect(result.children[0]?.y).toBe(0);
      expect(result.children[0]?.x).toBe(0);

      // The absolute element
      expect(result.children[1]?.y).toBe(0);
      expect(result.children[1]?.x).toBe(0);

      // Bug verification: Both should exist as separate children with their own data
      // The renderer is responsible for handling overlapping content
      // But the layout phase should not corrupt either element's data
      expect(result.children.length).toBe(2);

      // Verify the node types are preserved (not corrupted)
      expect(result.children[0]?.node.type).toBe('text');
      expect(result.children[1]?.node.type).toBe('stack');
    });

    it('should preserve absolute positioning through nested containers', () => {
      // BUG: Absolute positioning might be relative to wrong origin in nested structures
      const innerAbsolute = stack()
        .absolutePosition(150, 250)
        .text('Deep absolute')
        .build();

      const node = stack()
        .padding(20) // adds offset
        .add(
          stack()
            .padding(10) // more offset
            .add(innerAbsolute)
            .build()
        )
        .build();

      const result = measureAndLayout(node);

      // Navigate to the absolute element
      const outerStack = result.children[0];
      const absoluteResult = outerStack?.children[0];

      // Absolute position should be relative to page origin (0,0), not container
      // Bug: Position might be offset by container padding, making it (150+20+10, 250+20+10)
      expect(absoluteResult?.x).toBe(150);
      expect(absoluteResult?.y).toBe(250);
    });

    it('should not have absolute element affect gap calculations between siblings', () => {
      // BUG: Gap might be incorrectly applied around absolute elements
      const node = stack()
        .gap(20)
        .text('Item 1') // y=0
        .add(stack().absolutePosition(500, 500).text('Absolute')) // should not affect gap
        .text('Item 2') // should be y=60+20=80 (item1 height + gap)
        .text('Item 3') // should be y=80+60+20=160
        .build();

      const result = measureAndLayout(node);

      // Verify gap is correctly applied only between flow elements
      expect(result.children[0]?.y).toBe(0); // Item 1
      expect(result.children[2]?.y).toBe(80); // Item 2: 60 (item1 height) + 20 (gap)
      expect(result.children[3]?.y).toBe(160); // Item 3: 80 + 60 + 20

      // Absolute element should be at its position
      expect(result.children[1]?.y).toBe(500);

      // Bug: Gap might be added for absolute element, causing Item 2 to be at y=100 instead of y=80
    });

    it('should handle absolute positioning in horizontal (row) stack correctly', () => {
      // BUG: Absolute positioning in row direction might corrupt X positions
      const node = stack()
        .direction('row')
        .gap(10)
        .text('Left') // x=0
        .add(stack().absolutePosition(400, 0).text('Abs'))
        .text('Right') // should be after Left + gap, not affected by absolute
        .build();

      const result = measureAndLayout(node);

      expect(result.children.length).toBe(3);

      // Left text at x=0
      expect(result.children[0]?.x).toBe(0);
      const leftWidth = result.children[0]?.width ?? 0;

      // Absolute at specified position
      expect(result.children[1]?.x).toBe(400);
      expect(result.children[1]?.y).toBe(0);

      // Right text should follow Left text with gap, not affected by absolute
      // Bug: Right might be positioned after absolute element's X position
      expect(result.children[2]?.x).toBe(leftWidth + 10);
    });
  });
});
