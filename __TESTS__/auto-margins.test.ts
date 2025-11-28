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

  // ==================== AUTO MARGINS ====================

  describe('auto margins', () => {
    it('centers text node with margin auto', () => {
      const node = text('Centered');
      node.margin = 'auto';
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Text should be centered horizontally
      const expectedX = Math.floor((1000 - result.width) / 2);
      expect(result.x).toBe(expectedX);
    });

    it('centers text node with left/right auto margins', () => {
      const node = text('Centered');
      node.margin = { left: 'auto', right: 'auto', top: 20, bottom: 10 };
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Text should be centered horizontally
      const expectedX = Math.floor((1000 - result.width) / 2);
      expect(result.x).toBe(expectedX);
      // Top margin should still be applied
      expect(result.y).toBe(20);
    });

    it('centers child in vertical stack with auto margins', () => {
      const child = stack().width(200).text('Centered Child').build();
      child.margin = 'auto';
      const node = stack().add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      // Child should be centered within the 1000px container
      const childResult = result.children[0];
      expect(childResult).toBeDefined();
      // Child's center should be at container center
      const childCenter = (childResult?.x ?? 0) + (childResult?.width ?? 0) / 2;
      expect(childCenter).toBeCloseTo(500, 0);
    });

    it('does not center when only one side is auto', () => {
      const node = text('Not Centered');
      node.margin = { left: 'auto', right: 50 };
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Should not be centered since only left is auto (not both)
      expect(result.x).toBe(0); // left is 0 when auto but not centering
    });
  });

  // ==================== BUG FIX: AUTO MARGINS WITH EXPLICIT WIDTH ====================

  describe('auto margins with explicit width', () => {
    it('centers text node with explicit width and margin auto', () => {
      const node = text('Short');
      node.width = 400;
      node.margin = 'auto';

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // With explicit width 400 in 1000 container: x = (1000-400)/2 = 300
      expect(result.x).toBe(300);
      expect(result.width).toBe(400);
    });

    it('centers stack with explicit width and auto margins', () => {
      const child = stack().width(500).margin('auto').text('Content').build();
      const parent = stack().width('fill').add(child).build();

      const measured = measureNode(parent, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      const childResult = result.children[0];
      expect(childResult?.width).toBe(500);
      expect(childResult?.x).toBe(250); // (1000-500)/2
    });

    it('centers text node with percentage width and margin auto', () => {
      const node = text('Centered');
      node.width = '50%';
      node.margin = 'auto';

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // 50% of 1000 = 500, centered: x = (1000-500)/2 = 250
      expect(result.width).toBe(500);
      expect(result.x).toBe(250);
    });

    it('does not truncate text in auto-margin box with explicit width', () => {
      const longText = 'This is a longer piece of text that should fit';
      const node = text(longText);
      node.width = 600;
      node.margin = 'auto';

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Width should be the explicit width (600), not truncated to text width
      expect(result.width).toBe(600);
      // Centered: x = (1000-600)/2 = 200
      expect(result.x).toBe(200);
    });

    it('uses content width for centering when no explicit width', () => {
      const node = text('Short');
      node.margin = 'auto';
      // No explicit width set

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Should center based on content width (existing behavior)
      const expectedX = Math.floor((1000 - result.width) / 2);
      expect(result.x).toBe(expectedX);
    });

    it('handles explicit width smaller than content with margin auto', () => {
      const node = text('This is a very long text that exceeds width');
      node.width = 200;
      node.margin = 'auto';
      node.overflow = 'ellipsis';

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Should be centered based on explicit width (200), not content
      expect(result.x).toBe(400); // (1000-200)/2
      expect(result.width).toBe(200);
    });
  });

  // ==================== BUG-007: Large Margins Ineffective ====================

  describe('BUG-007: Large Margins Ineffective', () => {
    // Bug Description: When applying large margin values, they don't have the
    // expected effect on positioning. The margins are tracked for spacing between
    // siblings but the child's actual position doesn't include its own margin offset.
    // See src/layout/layout.ts:354-356

    describe('large marginLeft on stack children', () => {
      it('should offset first child x position by marginLeft value', () => {
        // Create a stack with a child that has large left margin
        const child = stack().text('Content').build();
        child.margin = { left: 100 };

        const parent = stack().add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];
        // BUG: Child x position should be offset by marginLeft (100)
        // Currently the margin is only used for sibling spacing, not initial positioning
        expect(childResult?.x).toBe(100);
      });

      it('should offset x by large marginLeft (200) for element in vertical stack', () => {
        const child = stack().text('Indented content').build();
        child.margin = { left: 200, right: 0, top: 0, bottom: 0 };

        const parent = stack().add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // The child should be positioned 200 dots from the left edge
        expect(result.children[0]?.x).toBe(200);
      });
    });

    describe('large marginTop on stack children', () => {
      it('should offset first child y position by marginTop value', () => {
        // Create a stack with a child that has large top margin
        const child = stack().text('Content').build();
        child.margin = { top: 100 };

        const parent = stack().add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];
        // BUG: Child y position should be offset by marginTop (100)
        // Currently the first child starts at y=0 regardless of marginTop
        expect(childResult?.y).toBe(100);
      });

      it('should offset y by large marginTop (150) for element in vertical stack', () => {
        const child = stack().text('Content with top spacing').build();
        child.margin = { top: 150, bottom: 0, left: 0, right: 0 };

        const parent = stack().add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // The child should be positioned 150 dots from the top edge
        expect(result.children[0]?.y).toBe(150);
      });
    });

    describe('large margins on row stack children', () => {
      it('should offset first child x by marginLeft in horizontal stack', () => {
        const child = stack().text('Item').build();
        child.margin = { left: 100 };

        const parent = stack().direction('row').add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // First child in row should start at x=100 due to marginLeft
        expect(result.children[0]?.x).toBe(100);
      });

      it('should offset first child y by marginTop in horizontal stack', () => {
        const child = stack().text('Item').build();
        child.margin = { top: 50 };

        const parent = stack().direction('row').add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // Child in row should have y offset by marginTop
        expect(result.children[0]?.y).toBe(50);
      });
    });

    describe('margins in nested containers', () => {
      it('should correctly position nested child with large marginLeft', () => {
        // Inner container has a large left margin
        const inner = stack().text('Nested content').build();
        inner.margin = { left: 150 };

        const outer = stack().add(inner).build();
        const root = stack().add(outer).build();

        const measured = measureNode(root, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // Navigate to the innermost container and verify its position
        const outerResult = result.children[0];
        const innerResult = outerResult?.children[0];

        // The inner container should be offset by its marginLeft (150)
        expect(innerResult?.x).toBe(150);
      });

      it('should accumulate margins correctly in nested stacks', () => {
        // Outer has padding, inner has margin
        const inner = stack().text('Content').build();
        inner.margin = { left: 100, top: 50 };

        const outer = stack().padding(20).add(inner).build();

        const measured = measureNode(outer, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const innerResult = result.children[0];
        // Inner should be at: padding (20) + margin (100) = 120 for x
        // and: padding (20) + margin (50) = 70 for y
        expect(innerResult?.x).toBe(120);
        expect(innerResult?.y).toBe(70);
      });

      it('should respect large margins when parent has alignment', () => {
        const child = stack().width(200).text('Aligned and margined').build();
        child.margin = { left: 50, top: 30 };

        // Parent aligns children to center, but child also has left margin
        const parent = stack().align('left').add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];
        // With left alignment, child starts at left edge + margin
        expect(childResult?.x).toBe(50);
        expect(childResult?.y).toBe(30);
      });
    });

    describe('combined large margins', () => {
      it('should apply both large marginLeft and marginTop together', () => {
        const child = stack().text('Offset content').build();
        child.margin = { left: 100, top: 80, right: 0, bottom: 0 };

        const parent = stack().add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];
        expect(childResult?.x).toBe(100);
        expect(childResult?.y).toBe(80);
      });

      it('should apply very large margins (500+) correctly', () => {
        const child = stack().text('Far right content').build();
        child.margin = { left: 500, top: 200, right: 0, bottom: 0 };

        const parent = stack().add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];
        // Even very large margins should be respected
        expect(childResult?.x).toBe(500);
        expect(childResult?.y).toBe(200);
      });
    });

    describe('margin effects on subsequent siblings', () => {
      it('should position second child accounting for first child margin', () => {
        // First child has large bottom margin
        const child1 = stack().text('First').build();
        child1.margin = { bottom: 100 };

        const child2 = stack().text('Second').build();

        const parent = stack().add(child1).add(child2).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const child1Result = result.children[0];
        const child2Result = result.children[1];

        // Second child should be after first child height + first child bottom margin
        const expectedY = (child1Result?.height ?? 0) + 100;
        expect(child2Result?.y).toBe(expectedY);
      });

      it('should position second child accounting for its own top margin', () => {
        const child1 = stack().text('First').build();

        // Second child has large top margin
        const child2 = stack().text('Second').build();
        child2.margin = { top: 100 };

        const parent = stack().add(child1).add(child2).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const child1Result = result.children[0];
        const child2Result = result.children[1];

        // Second child should be at: first child height + second child top margin
        const expectedY = (child1Result?.height ?? 0) + 100;
        expect(child2Result?.y).toBe(expectedY);
      });
    });

    describe('margins with alignment', () => {
      it('should correctly position child with marginLeft when parent has center alignment', () => {
        // This tests for double-counting of margins when combining alignment with margins
        const child = stack().width(200).text('Centered with margin').build();
        child.margin = { left: 50 };

        // Parent centers children
        const parent = stack().align('center').add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];
        // Child is 200px wide with 50px left margin
        // Total outer width = 250px (including margin)
        // Centering should place outer box at (1000-250)/2 = 375
        // Child's x should be at centering position + left margin
        // But the child's layout function adds margin again...
        // BUG: If margins are double-counted, x will be wrong
        // Expected: child should be centered considering its margins
        // The child's left edge should be at the centered position accounting for margin once, not twice

        // With center alignment and 200px content + 50px left margin:
        // The center point should be at (1000/2) = 500
        // Child content should be centered, so its center would be at 500
        // Therefore child x = 500 - 100 (half of 200) = 400
        // But with left margin of 50, the question is: should margin shift the center or be part of the box?
        // In CSS box model, margin is outside - so centered element with margin would have margin applied after centering
        // So: center content (x = 400), no additional margin shift expected for centering
        // If the layout is applying margin correctly once, childResult.x should be 400 + 50 = 450
        // (centered at 400 based on content, then shifted by margin 50)
        // Actually for block-level centering with margins, the element is centered including its margins
        // So the outer box (250px = 200 + 50 margin) is centered: (1000-250)/2 = 375 for left edge of margin box
        // Then content starts at 375 + 50 = 425

        // Let's verify the child x is at the correct position
        // If margins are double-counted, x would be 475 (425 + 50 = 475)
        // The correct position is 425 (margin box centered, content starts at marginBox.x + margin.left)
        expect(childResult?.x).toBe(425);
      });

      it('should not double-count marginLeft when centering in vertical stack', () => {
        // Explicit test for margin not being counted twice
        const child = stack().width(100).text('Content').build();
        child.margin = { left: 100, right: 100 };

        // Parent centers children
        const parent = stack().align('center').add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];

        // Child is 100px wide with 100px left margin and 100px right margin
        // Total box width including margins = 300px
        // If centering is done correctly: (1000-300)/2 = 350 for margin box start
        // Child content should start at 350 + 100 (left margin) = 450
        // If margins are double-counted, x would be 450 + 100 = 550 (wrong)
        expect(childResult?.x).toBe(450);
      });

      it('should handle large margins with right alignment', () => {
        const child = stack().width(100).text('Right aligned').build();
        child.margin = { left: 200 };

        // Parent right-aligns children
        const parent = stack().align('right').add(child).build();

        const measured = measureNode(parent, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        const childResult = result.children[0];

        // Child is 100px wide with 200px left margin
        // Total box width = 300px
        // Right alignment: box starts at 1000 - 300 = 700
        // Content x = 700 + 200 (left margin) = 900
        expect(childResult?.x).toBe(900);
      });
    });
  });

  // ==================== BUG-008: Auto Margins Not Centering ====================

  describe('BUG-008: Auto Margins Not Centering', () => {
    // This describe block tests the bug where elements with marginLeft='auto' and
    // marginRight='auto' are not horizontally centered - they appear right-aligned instead.
    // Bug Location: src/layout/layout.ts:228-243

    it('should center element with marginLeft and marginRight auto in flex container', () => {
      // Create a child with explicit width and auto margins inside a flex container
      const child = stack().width(200).text('Centered').build();
      child.margin = { left: 'auto', right: 'auto' };

      const node = flex().width('fill').add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const childResult = result.children[0];
      expect(childResult).toBeDefined();

      // Child should be centered: x = (1000 - 200) / 2 = 400
      const expectedX = Math.floor((1000 - (childResult?.width ?? 0)) / 2);
      expect(childResult?.x).toBe(expectedX);
      expect(childResult?.width).toBe(200);
    });

    it('should center element with margin auto in row stack', () => {
      // Create a child with explicit width and margin='auto' inside a row stack
      const child = stack().width(300).text('Centered Item').build();
      child.margin = 'auto';

      const node = stack().direction('row').width('fill').add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const childResult = result.children[0];
      expect(childResult).toBeDefined();

      // Child should be centered: x = (1000 - 300) / 2 = 350
      const expectedX = Math.floor((1000 - (childResult?.width ?? 0)) / 2);
      expect(childResult?.x).toBe(expectedX);
      expect(childResult?.width).toBe(300);
    });

    it('should calculate correct x position as (containerWidth - elementWidth) / 2', () => {
      // Test the exact centering formula with specific dimensions
      const containerWidth = 800;
      const elementWidth = 200;

      const child = stack().width(elementWidth).text('Test').build();
      child.margin = { left: 'auto', right: 'auto' };

      const node = stack().width('fill').add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: containerWidth }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: containerWidth, height: 100 });

      const childResult = result.children[0];
      expect(childResult).toBeDefined();

      // Verify the exact centering formula
      const expectedX = Math.floor((containerWidth - elementWidth) / 2);
      expect(expectedX).toBe(300); // (800 - 200) / 2 = 300
      expect(childResult?.x).toBe(expectedX);
    });

    it('should center element with auto margins in flex container with multiple children', () => {
      // Test auto margins when there are multiple children in flex
      // NOTE: Current implementation centers auto-margin child in full container width,
      // not in the remaining space between siblings. This differs from CSS flexbox behavior
      // but provides consistent centering for the primary use case.
      const child1 = stack().width(100).text('Left').build();
      const child2 = stack().width(200).text('Center').build();
      child2.margin = { left: 'auto', right: 'auto' };
      const child3 = stack().width(100).text('Right').build();

      const node = flex().width('fill').add(child1).add(child2).add(child3).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // The middle child with auto margins is centered in the full container width
      const middleChild = result.children[1];
      expect(middleChild).toBeDefined();
      expect(middleChild?.width).toBe(200);

      // Child should be centered in full container: x = (1000 - 200) / 2 = 400
      // Center point = 400 + 100 = 500
      const expectedX = Math.floor((1000 - 200) / 2);
      expect(middleChild?.x).toBe(expectedX);
      expect(expectedX).toBe(400);
    });

    it('should center text node with marginLeft and marginRight auto', () => {
      // Direct text node with auto margins
      const node = text('Center Me');
      node.width = 150;
      node.margin = { left: 'auto', right: 'auto' };

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 60 });

      // Text should be centered: x = (500 - 150) / 2 = 175
      expect(result.width).toBe(150);
      expect(result.x).toBe(175);
    });

    it('should center nested stack with auto margins inside flex', () => {
      // Nested container with auto margins
      const innerStack = stack().width(400).text('Line 1').text('Line 2').build();
      innerStack.margin = 'auto';

      const outerFlex = flex().width('fill').add(innerStack).build();

      const measured = measureNode(outerFlex, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 200 });

      const innerResult = result.children[0];
      expect(innerResult).toBeDefined();
      expect(innerResult?.width).toBe(400);

      // Inner stack should be centered: x = (1000 - 400) / 2 = 300
      expect(innerResult?.x).toBe(300);
    });

    it('should not right-align elements when both margins are auto', () => {
      // This test specifically checks that auto margins don't cause right-alignment
      const child = stack().width(200).text('Should Not Right Align').build();
      child.margin = { left: 'auto', right: 'auto' };

      const node = stack().width('fill').add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 600 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 600, height: 100 });

      const childResult = result.children[0];
      expect(childResult).toBeDefined();

      // If the bug exists, x would be at the right side (600 - 200 = 400)
      // Correct centered position should be (600 - 200) / 2 = 200
      const rightAlignedX = 600 - (childResult?.width ?? 0);
      const centeredX = Math.floor((600 - (childResult?.width ?? 0)) / 2);

      expect(centeredX).toBe(200);
      expect(rightAlignedX).toBe(400);

      // The element should be centered, not right-aligned
      expect(childResult?.x).toBe(centeredX);
      expect(childResult?.x).not.toBe(rightAlignedX);
    });

    it('should center element with auto margins in grid cell', () => {
      // Test auto margins in a grid cell context
      // Grid cells use the .cell() method which accepts nodes or strings
      const cellContent = stack().width(50).text('C').build();
      cellContent.margin = { left: 'auto', right: 'auto' };

      const node = grid([200])
        .cell(cellContent)
        .row()
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      const cellResult = result.children[0];
      expect(cellResult).toBeDefined();

      // Cell content should be centered within the 200px column
      // x = (200 - 50) / 2 = 75
      const expectedX = Math.floor((200 - (cellResult?.width ?? 0)) / 2);
      expect(cellResult?.x).toBe(expectedX);
    });

    it('should center percentage-width element with auto margins', () => {
      // Test with percentage width and auto margins
      const child = stack().width('50%').text('Half Width Centered').build();
      child.margin = { left: 'auto', right: 'auto' };

      const node = stack().width('fill').add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const childResult = result.children[0];
      expect(childResult).toBeDefined();

      // 50% of 1000 = 500, centered: x = (1000 - 500) / 2 = 250
      expect(childResult?.width).toBe(500);
      expect(childResult?.x).toBe(250);
    });

    it('should center element when parent has padding and child has auto margins', () => {
      // Test that padding is accounted for correctly with auto margins
      const child = stack().width(200).text('Padded Parent').build();
      child.margin = { left: 'auto', right: 'auto' };

      const node = stack().width('fill').padding(50).add(child).build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 200 });

      const childResult = result.children[0];
      expect(childResult).toBeDefined();

      // Content area: 1000 - 50 - 50 = 900 (after padding)
      // Child should be centered in content area: x = 50 + (900 - 200) / 2 = 50 + 350 = 400
      const contentWidth = 1000 - 50 - 50;
      const expectedX = 50 + Math.floor((contentWidth - (childResult?.width ?? 0)) / 2);
      expect(childResult?.x).toBe(expectedX);
    });
  });
});
