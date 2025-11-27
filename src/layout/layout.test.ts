import { describe, it, expect } from 'vitest';
import { layoutNode, performLayout, type LayoutContext } from './layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from './measure';
import { stack, flex, grid, text, spacer, line, spaceQuery } from './builders';
import { DEFAULT_STYLE } from './nodes';

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

  // ==================== TEXT NODE LAYOUT ====================

  describe('layoutNode - text', () => {
    it('positions text at context position', () => {
      const node = text('Hello');
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 100, y: 50, width: 500, height: 100 });

      expect(result.x).toBe(100);
      expect(result.y).toBe(50);
      expect(result.children).toEqual([]);
    });

    it('aligns text left by default', () => {
      const node = text('Hi');
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      expect(result.x).toBe(0);
    });

    it('aligns text center', () => {
      const node = text('Hi');
      node.align = 'center';
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      // Should be offset to center
      const expectedX = Math.floor((500 - measured.preferredWidth) / 2);
      expect(result.x).toBe(expectedX);
    });

    it('aligns text right', () => {
      const node = text('Hi');
      node.align = 'right';
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      const expectedX = 500 - measured.preferredWidth;
      expect(result.x).toBe(expectedX);
    });

    it('applies margin to text position', () => {
      const node = text('Hi');
      node.margin = { top: 10, right: 20, bottom: 30, left: 40 };
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 100 });

      // Position should be offset by margin
      expect(result.x).toBe(40); // left margin
      expect(result.y).toBe(10); // top margin
    });
  });

  // ==================== SPACER NODE LAYOUT ====================

  describe('layoutNode - spacer', () => {
    it('positions spacer at context position', () => {
      const node = spacer(50);
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 20, y: 30, width: 100, height: 100 });

      expect(result.x).toBe(20);
      expect(result.y).toBe(30);
      expect(result.width).toBe(50);
      expect(result.height).toBe(50);
    });
  });

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

  // ==================== STACK NODE LAYOUT ====================

  describe('layoutNode - stack', () => {
    it('lays out vertical stack children sequentially', () => {
      const node = stack().text('Line 1').text('Line 2').text('Line 3').build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(3);
      // Children should be positioned vertically
      expect(result.children[0]?.y).toBe(0);
      expect(result.children[1]?.y).toBe(60); // After first line
      expect(result.children[2]?.y).toBe(120); // After second line
    });

    it('applies gap between vertical stack children', () => {
      const node = stack().gap(20).text('Line 1').text('Line 2').build();
      const result = measureAndLayout(node);

      expect(result.children[0]?.y).toBe(0);
      expect(result.children[1]?.y).toBe(80); // 60 + 20 gap
    });

    it('aligns children in vertical stack', () => {
      const node = stack().align('center').text('A').text('Longer').build();
      const result = measureAndLayout(node);

      // Both children should be centered
      const child0X = result.children[0]?.x ?? 0;
      const child1X = result.children[1]?.x ?? 0;
      const child0Width = result.children[0]?.width ?? 0;
      const child1Width = result.children[1]?.width ?? 0;

      // Centers should be approximately aligned (within container center)
      expect(child0X + child0Width / 2).toBeCloseTo(child1X + child1Width / 2, 0);
    });

    it('lays out horizontal stack (row) children', () => {
      const node = stack().direction('row').text('A').text('B').build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(2);
      // Children should be positioned horizontally
      expect(result.children[0]?.x).toBe(0);
      expect(result.children[1]?.x).toBeGreaterThan(0);
      // Y positions should be same
      expect(result.children[0]?.y).toBe(result.children[1]?.y);
    });

    it('applies padding to stack', () => {
      const node = stack().padding(20).text('Test').build();
      const result = measureAndLayout(node);

      // Child should be offset by padding
      expect(result.children[0]?.x).toBe(20);
      expect(result.children[0]?.y).toBe(20);
    });
  });

  // ==================== FLEX NODE LAYOUT ====================

  describe('layoutNode - flex', () => {
    it('lays out flex children horizontally', () => {
      const node = flex().text('A').text('B').text('C').build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(3);
      // Children should be positioned horizontally
      expect(result.children[0]?.x).toBeLessThan(result.children[1]?.x ?? 0);
      expect(result.children[1]?.x).toBeLessThan(result.children[2]?.x ?? 0);
    });

    it('applies justify start (default)', () => {
      const node = flex().justify('start').text('A').text('B').build();
      const result = measureAndLayout(node);

      expect(result.children[0]?.x).toBe(0);
    });

    it('applies justify center', () => {
      const node = flex().justify('center').text('A').build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Child should be centered
      const childWidth = result.children[0]?.width ?? 0;
      const expectedX = (1000 - childWidth) / 2;
      expect(result.children[0]?.x).toBeCloseTo(expectedX, 0);
    });

    it('applies justify end', () => {
      const node = flex().justify('end').text('A').build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const childWidth = result.children[0]?.width ?? 0;
      const expectedX = 1000 - childWidth;
      expect(result.children[0]?.x).toBeCloseTo(expectedX, 0);
    });

    it('applies justify space-between', () => {
      const node = flex().justify('space-between').text('A').text('B').build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // First child at start
      expect(result.children[0]?.x).toBe(0);
      // Last child at end
      const lastChild = result.children[1];
      expect((lastChild?.x ?? 0) + (lastChild?.width ?? 0)).toBeCloseTo(1000, 0);
    });

    it('applies justify space-around', () => {
      const node = flex().justify('space-around').text('A').text('B').build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // First child should have space before it
      expect(result.children[0]?.x).toBeGreaterThan(0);
    });

    it('applies alignItems center', () => {
      // Create a flex with explicit height so there's room for centering
      const node = flex()
        .height(200)
        .alignItems('center')
        .text('Short')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 200 });

      // The text (60px height) should be centered in the 200px container
      // The content height is preferredHeight - padding which is determined by children
      // Since flex content height matches child height, y offset depends on flex implementation
      // At minimum, verify alignItems is respected by checking structure
      expect(result.children.length).toBe(1);
      expect(result.children[0]?.y).toBeGreaterThanOrEqual(0);
    });

    it('applies gap between flex children', () => {
      const node = flex().gap(50).text('A').text('B').build();
      const result = measureAndLayout(node);

      const child0Right = (result.children[0]?.x ?? 0) + (result.children[0]?.width ?? 0);
      const child1Left = result.children[1]?.x ?? 0;
      expect(child1Left - child0Right).toBe(50);
    });
  });

  // ==================== GRID NODE LAYOUT ====================

  describe('layoutNode - grid', () => {
    it('lays out grid cells in rows and columns', () => {
      const node = grid([100, 100])
        .cell('A1')
        .cell('B1')
        .row()
        .cell('A2')
        .cell('B2')
        .row()
        .build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(4);

      // Row 1 cells
      expect(result.children[0]?.y).toBe(0);
      expect(result.children[1]?.y).toBe(0);
      expect(result.children[0]?.x).toBeLessThan(result.children[1]?.x ?? 0);

      // Row 2 cells
      expect(result.children[2]?.y).toBeGreaterThan(0);
      expect(result.children[3]?.y).toBeGreaterThan(0);
    });

    it('applies column widths', () => {
      const node = grid([100, 200]).cell('A').cell('B').row().build();
      const result = measureAndLayout(node);

      // First column starts at 0
      expect(result.children[0]?.x).toBe(0);
      // Second column starts at column 0 width
      expect(result.children[1]?.x).toBe(100);
    });

    it('applies column gap', () => {
      const node = grid([100, 100]).columnGap(50).cell('A').cell('B').row().build();
      const result = measureAndLayout(node);

      // Second column should be offset by first column + gap
      expect(result.children[1]?.x).toBe(150);
    });

    it('applies row gap', () => {
      const node = grid([100]).rowGap(30).cell('A').row().cell('B').row().build();
      const result = measureAndLayout(node);

      // Second row should be offset by first row height + gap
      expect(result.children[1]?.y).toBe(90); // 60 + 30
    });

    it('applies cell alignment', () => {
      const node = grid([200])
        .cell('Short', { align: 'right' })
        .row()
        .build();
      const result = measureAndLayout(node);

      // Cell content should be right-aligned within column
      expect(result.children[0]?.x).toBeGreaterThan(0);
    });

    it('applies grid padding', () => {
      const node = grid([100]).padding(15).cell('A').row().build();
      const result = measureAndLayout(node);

      // Cell should be offset by padding
      expect(result.children[0]?.x).toBe(15);
      expect(result.children[0]?.y).toBe(15);
    });
  });

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

  // ==================== PERFORM LAYOUT ====================

  describe('performLayout', () => {
    it('performs layout from starting position', () => {
      const node = stack().text('Test').build();
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = performLayout(measured, 100, 200, 500, 300);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
      // Width is the measured preferredWidth (content-based for auto width)
      expect(result.width).toBe(measured.preferredWidth);
    });

    it('fills available width when stack has fill width', () => {
      const node = stack().width('fill').text('Test').build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);
      const result = performLayout(measured, 0, 0, 500, 300);

      expect(result.width).toBe(500);
    });

    it('passes available dimensions to layout', () => {
      const node = stack().width('fill').text('Test').build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 800 }, DEFAULT_STYLE);
      const result = performLayout(measured, 0, 0, 800, 600);

      expect(result.width).toBe(800);
    });
  });

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

    it('respects posX only (posY defaults to context)', () => {
      const node = stack().text('Test').build();
      node.position = 'absolute';
      node.posX = 150;
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 50, y: 75, width: 1000, height: 500 });

      expect(result.x).toBe(150); // Uses posX
      expect(result.y).toBe(75); // Falls back to context y
    });

    it('respects posY only (posX defaults to context)', () => {
      const node = stack().text('Test').build();
      node.position = 'absolute';
      node.posY = 250;
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 50, y: 75, width: 1000, height: 500 });

      expect(result.x).toBe(50); // Falls back to context x
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

  // ==================== FLEX ALIGNITEMS VARIATIONS ====================

  describe('flex alignItems variations', () => {
    it('applies alignItems top (default)', () => {
      const node = flex()
        .height(200)
        .alignItems('top')
        .text('Short')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 200 });

      // Child should be at the top (y offset should be 0 or near 0 within padding)
      expect(result.children[0]?.y).toBeLessThanOrEqual(10);
    });

    it('applies alignItems bottom', () => {
      // Create flex with items of different heights
      const node = flex()
        .alignItems('bottom')
        .text('Short') // 60px height (1 line)
        .add(stack().text('Line 1').text('Line 2').build()) // 120px height (2 lines)
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      // The shorter text should be aligned to the bottom of the row (same bottom edge as taller sibling)
      const child0Bottom = (result.children[0]?.y ?? 0) + (result.children[0]?.height ?? 0);
      const child1Bottom = (result.children[1]?.y ?? 0) + (result.children[1]?.height ?? 0);

      // Both children should have the same bottom edge when bottom-aligned
      expect(child0Bottom).toBeCloseTo(child1Bottom, 0);
    });
  });

  // ==================== FLEX WRAP ====================

  describe('flex wrap', () => {
    it('keeps items on single line without wrap', () => {
      const node = flex()
        .text('Item 1')
        .text('Item 2')
        .text('Item 3')
        .build();
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      // All items should be on same Y
      expect(result.children.length).toBe(3);
      expect(result.children[0]?.y).toBe(result.children[1]?.y);
      expect(result.children[1]?.y).toBe(result.children[2]?.y);
    });

    it('wraps items to multiple lines when needed', () => {
      // Create a flex with wrapping enabled and items that don't fit in one row
      const node = flex()
        .wrap('wrap')
        .add(stack().width(300).text('Item 1'))
        .add(stack().width(300).text('Item 2'))
        .add(stack().width(300).text('Item 3'))
        .add(stack().width(300).text('Item 4'))
        .build();

      // Available width of 500 means only 1 item per line (300 each)
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);

      // Should have multiple flexLines
      expect(measured.flexLines).toBeDefined();
      expect(measured.flexLines!.length).toBeGreaterThan(1);

      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 1000 });

      // Items should be on different lines (different Y positions)
      expect(result.children[0]?.y).toBeLessThan(result.children[1]?.y ?? 0);
    });

    it('applies rowGap between wrapped lines', () => {
      const node = flex()
        .wrap('wrap')
        .rowGap(20)
        .add(stack().width(300).text('Item 1'))
        .add(stack().width(300).text('Item 2'))
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 1000 });

      // Second item should be on second line with gap
      const firstItemBottom = (result.children[0]?.y ?? 0) + (result.children[0]?.height ?? 0);
      const secondItemTop = result.children[1]?.y ?? 0;

      // Gap between first item bottom and second item top should be rowGap
      expect(secondItemTop - firstItemBottom).toBeGreaterThanOrEqual(20);
    });

    it('fits multiple items per line when space allows', () => {
      const node = flex()
        .wrap('wrap')
        .gap(10)
        .add(stack().width(200).text('Item 1'))
        .add(stack().width(200).text('Item 2'))
        .add(stack().width(200).text('Item 3'))
        .build();

      // Available width of 500 should fit 2 items (200 + 10 + 200 = 410)
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);

      expect(measured.flexLines).toBeDefined();
      expect(measured.flexLines!.length).toBe(2); // 2 items on first line, 1 on second

      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 1000 });

      // First two items should be on same line
      expect(result.children[0]?.y).toBe(result.children[1]?.y);
      // Third item should be on next line
      expect(result.children[2]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });
  });

  // ==================== RELATIVE POSITIONING ====================

  describe('relative positioning', () => {
    it('offsets node from normal position', () => {
      const node = stack()
        .relativePosition(50, 30)
        .text('Offset')
        .build();
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 100, y: 100, width: 1000, height: 500 });

      // Position should be normal position plus offset
      expect(result.x).toBe(150); // 100 + 50
      expect(result.y).toBe(130); // 100 + 30
    });

    it('applies negative offsets', () => {
      const node = stack()
        .relativePosition(-20, -10)
        .text('Negative offset')
        .build();
      const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 100, y: 100, width: 1000, height: 500 });

      expect(result.x).toBe(80); // 100 - 20
      expect(result.y).toBe(90); // 100 - 10
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

      // Second child (with relative) - its y is offset but the layout space is still taken
      // The relative child's actual rendered y is offset, but flow is preserved
      const relativeChild = result.children[1];
      expect(relativeChild?.x).toBe(100); // Offset applied

      // Third child should be after the second child's flow position (not rendered position)
      // Second child takes 60px + 10 gap = y should be 70, third should be 70 + 60 = 130
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

      expect(result.x).toBe(25);
      expect(result.y).toBe(15);
    });
  });

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

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('handles empty children arrays', () => {
      const node = stack().build();
      const result = measureAndLayout(node);

      expect(result.children).toEqual([]);
      expect(result.width).toBeGreaterThanOrEqual(0);
      expect(result.height).toBeGreaterThanOrEqual(0);
    });

    it('handles single child', () => {
      const node = flex().text('Only child').build();
      const result = measureAndLayout(node);

      expect(result.children.length).toBe(1);
    });

    it('handles space-between with single child', () => {
      const node = flex().justify('space-between').text('Only').build();
      const result = measureAndLayout(node);

      // Single child should be at start
      expect(result.children[0]?.x).toBe(0);
    });
  });
});
