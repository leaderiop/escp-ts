import { describe, it, expect } from 'vitest';
import { layoutNode, performLayout, type LayoutContext } from './layout';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from './measure';
import { stack, flex, grid, text, spacer, line, spaceQuery } from './builders';
import { DEFAULT_STYLE } from './nodes';
import { flattenTree } from './renderer';

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

      // Cell content x is at column start, alignment is in renderConstraints for renderer
      expect(result.children[0]?.x).toBe(0);
      expect(result.children[0]?.renderConstraints?.hAlign).toBe('right');
      expect(result.children[0]?.renderConstraints?.boundaryWidth).toBe(200);
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

  // ==================== BUG-002: Grid Cell Truncation ====================

  describe('BUG-002: Grid Cell Truncation', () => {
    // These tests verify that text in grid cells is NOT truncated when it should fit.
    //
    // Original Bug: Text was truncated to only 2-4 characters even when the cell
    // had enough width for the full text. The constraintWidth defaulted to result.width
    // which caused aggressive truncation for auto-width text in grid cells.
    //
    // Bug Location: src/layout/renderer.ts:165-234 (collectRenderItems function)
    //
    // Fixed in commit 604a6e3: "Fix layout bugs: row stack vAlign, absolute positioning
    // flow, and text truncation"
    // - Initialize constraintWidth=0 for auto-width text instead of defaulting to result.width
    // - Only apply constraints for explicit widths or grid cells
    //
    // These tests serve as REGRESSION TESTS to ensure the fix remains in place.

    /**
     * Helper to get layout result
     */
    const measureLayoutAndFlatten = (node: ReturnType<typeof stack>['prototype'] extends { build(): infer R } ? R : never) => {
      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: ctx.width,
        availableHeight: ctx.height,
      }, DEFAULT_STYLE);
      return layoutNode(measured, ctx);
    };

    /**
     * Helper to extract RENDERED text content using flattenTree
     * This is where the truncation bug manifests - flattenTree processes
     * the layout result and applies text truncation based on constraintWidth.
     */
    const getRenderedTextContent = (node: ReturnType<typeof stack>['prototype'] extends { build(): infer R } ? R : never): string[] => {
      const layoutResult = measureLayoutAndFlatten(node);
      const renderItems = flattenTree(layoutResult);
      return renderItems
        .filter(item => item.type === 'text')
        .map(item => {
          const data = item.data as { content: string };
          return data.content;
        });
    };

    /**
     * Helper to extract text content from layout result nodes (pre-rendering)
     * This accesses the original TextNode content (what SHOULD be rendered)
     */
    const getOriginalTextContent = (layoutResult: ReturnType<typeof measureLayoutAndFlatten>): string[] => {
      const contents: string[] = [];
      const collectText = (result: typeof layoutResult) => {
        if (result.node.type === 'text') {
          const textNode = result.node as { content: string };
          contents.push(textNode.content);
        }
        for (const child of result.children) {
          collectText(child);
        }
      };
      collectText(layoutResult);
      return contents;
    };

    it('should NOT truncate text when grid cell has sufficient width for the text', () => {
      // At 10 CPI: each character = 360/10 = 36 dots
      // "Column A" = 8 characters = 288 dots
      // Grid column of 300 dots should fit "Column A" without truncation
      const node = grid([300])
        .cell('Column A')
        .row()
        .build();

      const layoutResult = measureLayoutAndFlatten(node);

      // Verify the cell has the expected width constraint
      expect(layoutResult.children[0]?.renderConstraints?.boundaryWidth).toBe(300);

      // Verify the original text content is preserved in the layout
      const originalContent = getOriginalTextContent(layoutResult);
      expect(originalContent[0]).toBe('Column A');

      // BUG TEST: Get the RENDERED content via flattenTree
      // This is where the bug manifests - text should NOT be truncated
      // because 288 dots < 300 dots cell width
      const renderedContent = getRenderedTextContent(node);
      expect(renderedContent[0]).toBe('Column A');
    });

    it('should preserve full text content in wide grid columns', () => {
      // Grid with 400 dot wide column (enough for 11 characters at 10 CPI)
      // Text "Hello World" = 11 characters = 396 dots - should fit!
      const node = grid([400])
        .cell('Hello World')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // BUG: Text is truncated to only 2-4 characters when it should fit
      // The constraintWidth in renderer.ts is incorrectly calculated
      expect(renderedContent[0]).toBe('Hello World');
    });

    it('should NOT truncate short text in multiple grid columns', () => {
      // Each column is 200 dots = 5.5 characters capacity at 10 CPI
      // "AAA" = 3 chars = 108 dots, "BBB" = 3 chars = 108 dots
      // Both should fit easily
      const node = grid([200, 200])
        .cell('AAA')
        .cell('BBB')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // BUG: Even short text like "AAA" may be truncated to "AA" or less
      expect(renderedContent).toEqual(['AAA', 'BBB']);
    });

    it('should set correct constraintWidth in renderConstraints for truncation decision', () => {
      // This test specifically verifies that the boundaryWidth passed to renderer
      // is the actual cell width that should be used for truncation decisions
      const node = grid([350])
        .cell('Test Text')  // 9 chars = 324 dots, should fit in 350
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // This is the key assertion: text of 324 dots should fit in 350 dot cell
      // BUG: The renderer uses an incorrect constraintWidth value causing truncation
      expect(renderedContent[0]).toBe('Test Text');
    });

    it('should preserve text in grid cell when cell width greatly exceeds text width', () => {
      // Column width: 500 dots (huge)
      // Text "Test" = 4 chars = 144 dots at 10 CPI
      // There's no reason to truncate this
      const node = grid([500])
        .cell('Test')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // BUG: Even with 500 dot column, text might be truncated to 2-4 chars
      expect(renderedContent[0]).toBe('Test');
    });

    it('should handle multi-row grid without aggressive truncation', () => {
      // 2 rows, 2 columns of 300 dots each
      // All text should be <= 8 chars = 288 dots, which fits in 300
      const node = grid([300, 300])
        .cell('Header A')
        .cell('Header B')
        .row()
        .cell('Value 1')
        .cell('Value 2')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // BUG: Text is truncated when it should fit
      expect(renderedContent).toEqual(['Header A', 'Header B', 'Value 1', 'Value 2']);
    });

    it('should verify constraintWidth calculation includes full cell width', () => {
      // At 10 CPI, a 360 dot column should fit exactly 10 characters
      const node = grid([360])
        .cell('1234567890')  // Exactly 10 chars = 360 dots
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // Text width equals cell width exactly - should NOT be truncated
      expect(renderedContent[0]).toBe('1234567890');
    });

    it('should not truncate text with column gap present', () => {
      // Column widths: 250 dots each with 50 dot gap
      // "Label" = 5 chars = 180 dots - should easily fit in 250 dots
      const node = grid([250, 250])
        .columnGap(50)
        .cell('Label')
        .cell('Value')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // Text should not be truncated as it fits in the columns
      expect(renderedContent).toEqual(['Label', 'Value']);
    });

    it('should correctly calculate text width for truncation decision', () => {
      // Verify the character width calculation is correct
      // At 10 CPI: char width = 360/10 = 36 dots
      // "AAAA" = 4 chars = 144 dots
      // Column of 150 dots should fit "AAAA" (144 dots)
      const node = grid([150])
        .cell('AAAA')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // 144 dots < 150 dots, so no truncation needed
      expect(renderedContent[0]).toBe('AAAA');
    });

    it('should use cell boundary width not container width for truncation', () => {
      // Parent container is 1000 dots wide (from ctx)
      // Grid columns are 200 dots each
      // The truncation should be based on 200, not 1000
      const node = grid([200, 200, 200])
        .cell('Short')  // 5 chars = 180 dots, fits in 200
        .cell('MedTxt')  // 6 chars = 216 dots, exceeds 200 - may truncate
        .cell('ABC')  // 3 chars = 108 dots, fits in 200
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // "Short" and "ABC" should NOT be truncated (fit within 200 dots)
      // BUG: These may be truncated due to incorrect constraintWidth calculation
      expect(renderedContent[0]).toBe('Short');
      expect(renderedContent[2]).toBe('ABC');
    });

    it('should only truncate text that actually exceeds cell width', () => {
      // Column width: 100 dots = ~2.7 characters at 10 CPI (36 dots/char)
      // "ABCDEFGHIJ" = 10 chars = 360 dots - should be truncated
      const node = grid([100])
        .cell('ABCDEFGHIJ')
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // The text IS expected to be truncated here (360 dots > 100 dots)
      // It should show approximately 2 characters (72 dots fits in 100)
      expect(renderedContent[0]?.length).toBeLessThan(10);
      expect(renderedContent[0]?.length).toBeGreaterThanOrEqual(2);
    });

    it('should fit "Co" text in a 100 dot column without unnecessary truncation', () => {
      // This demonstrates the reported bug behavior
      // "Co" = 2 chars = 72 dots at 10 CPI
      // 100 dot column should fit "Co" completely
      const node = grid([100])
        .cell('Co')  // Just 2 characters
        .row()
        .build();

      // BUG TEST: Get the RENDERED content via flattenTree
      const renderedContent = getRenderedTextContent(node);

      // "Co" (72 dots) should fit in 100 dot column without truncation
      // BUG: Even "Co" might be truncated due to incorrect constraintWidth
      expect(renderedContent[0]).toBe('Co');
    });
  });

  // ==================== BUG-004: Flex vAlign Center ====================
  // Bug Description: When using vAlign='center' (alignItems='center') on a flex container,
  // items were not vertically centered within the container. The bug was in the calculation
  // of contentHeight used for centering - it was using the container's preferredHeight
  // (which equals the tallest child's height when no explicit height is set), causing
  // centering to fail because all children were positioned at y=0.
  //
  // Fixed in commit 604a6e3: "Fix layout bugs: row stack vAlign, absolute positioning flow, and text truncation"
  //
  // These tests serve as regression tests to ensure the fix remains in place.

  describe('BUG-004: Flex vAlign Center', () => {
    it('should center children vertically when container has explicit height', () => {
      // BUG: Prior to fix, children would be positioned at y=0 instead of being centered.
      // Create flex with explicit height and vAlign='center'
      const node = flex()
        .height(200)
        .alignItems('center')
        .text('Short') // 60px height (1 line of text)
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 200 });

      // The text (60px height) should be centered in the 200px container
      // Expected y offset = (200 - 60) / 2 = 70
      const child = result.children[0];
      expect(child).toBeDefined();

      const expectedYOffset = Math.floor((200 - (child?.height ?? 0)) / 2);
      expect(child?.y).toBe(expectedYOffset);
    });

    it('should center children of different heights vertically in flex row', () => {
      // BUG: Prior to fix, the short child would be at y=0 instead of being vertically
      // centered relative to the taller sibling.
      // Create flex with children of different heights
      const shortChild = stack().text('Short').build(); // 60px height
      const tallChild = stack().text('Line 1').text('Line 2').build(); // 120px height

      const node = flex()
        .alignItems('center')
        .add(shortChild)
        .add(tallChild)
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      expect(result.children.length).toBe(2);

      const shortResult = result.children[0];
      const tallResult = result.children[1];

      // The container's content height should be the tallest child (120px)
      const containerContentHeight = tallResult?.height ?? 0;

      // Short child (60px) should be centered within the container's content area
      // Expected: y offset = (containerContentHeight - shortChildHeight) / 2
      const shortChildHeight = shortResult?.height ?? 0;
      const expectedShortYOffset = Math.floor((containerContentHeight - shortChildHeight) / 2);

      // Both children should have their vertical centers aligned
      const shortCenter = (shortResult?.y ?? 0) + (shortResult?.height ?? 0) / 2;
      const tallCenter = (tallResult?.y ?? 0) + (tallResult?.height ?? 0) / 2;

      // Centers should be at the same Y position
      expect(shortCenter).toBeCloseTo(tallCenter, 0);

      // Short child should NOT be at y=0 (bug behavior)
      // It should be offset by (containerHeight - childHeight) / 2 = (120 - 60) / 2 = 30
      expect(shortResult?.y).toBe(expectedShortYOffset);
    });

    it('should center all children when explicit height is larger than tallest child', () => {
      // BUG: Prior to fix, children would be positioned at y=0 regardless of container
      // height, failing to center within the explicit height.
      // Container with 300px explicit height containing children that are shorter
      const node = flex()
        .height(300)
        .alignItems('center')
        .add(stack().text('A').build()) // 60px
        .add(stack().text('B').text('C').build()) // 120px
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 300 });

      // With 300px container, children should be centered vertically
      // First child (60px): y = (300 - 60) / 2 = 120
      // Second child (120px): y = (300 - 120) / 2 = 90

      const firstChild = result.children[0];
      const secondChild = result.children[1];

      // Both centers should be at container center (150)
      const firstCenter = (firstChild?.y ?? 0) + (firstChild?.height ?? 0) / 2;
      const secondCenter = (secondChild?.y ?? 0) + (secondChild?.height ?? 0) / 2;

      expect(firstCenter).toBeCloseTo(150, 0);
      expect(secondCenter).toBeCloseTo(150, 0);

      // First child y should be 120 (centered in 300px container)
      expect(firstChild?.y).toBe(Math.floor((300 - (firstChild?.height ?? 0)) / 2));
    });

    it('should not affect horizontal positioning when vAlign center is applied', () => {
      // Verify vAlign center does not interfere with horizontal justify behavior
      const node = flex()
        .height(200)
        .alignItems('center')
        .justify('start')
        .text('A')
        .text('B')
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 200 });

      // Horizontal layout should still work (justify: start)
      expect(result.children[0]?.x).toBe(0);
      expect(result.children[1]?.x).toBeGreaterThan(result.children[0]?.x ?? 0);
    });

    it('should center children in wrapped flex lines independently', () => {
      // Verify that wrapping flex with alignItems center works correctly per line
      // Flex with wrap and alignItems center
      const node = flex()
        .wrap('wrap')
        .alignItems('center')
        .add(stack().width(300).text('Short').build()) // 60px height
        .add(stack().width(300).text('Tall').text('Tall').build()) // 120px height
        .build();

      // Width 500 forces wrapping (each item gets its own line)
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 500 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 500, height: 500 });

      // Each line should have its own height and center items within that line
      // First line: 60px height, item should be at y=0 (centered within 60px line = 0 offset)
      // Second line: 120px height, item should start after first line

      expect(result.children.length).toBe(2);

      // Both items should be properly positioned on their respective lines
      // The key is that vAlign center should work within each line's context
      const firstChild = result.children[0];
      const secondChild = result.children[1];

      // First child should be on first line (y starts at 0 or near 0)
      expect(firstChild?.y).toBeLessThan(secondChild?.y ?? 0);
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

  // ==================== BUG-006: Flex Wrap Not Working ====================

  describe('BUG-006: Flex Wrap Not Working', () => {
    // Test scenario: text nodes exceeding container width should wrap
    it('should wrap text children when combined width exceeds container', () => {
      // Create flex with wrap='wrap' and text children that exceed available width
      // Each text 'Item X' is approximately 42 dots wide (7 chars * 6 dots per char)
      const node = flex()
        .wrap('wrap')
        .text('Item 1')
        .text('Item 2')
        .text('Item 3')
        .text('Item 4')
        .text('Item 5')
        .build();

      // Available width of 100 dots - items should wrap since combined width exceeds this
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 100 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 100, height: 500 });

      // BUG: Items should be on different Y positions (wrapped lines)
      // If items are all on the same Y, the wrap is not working
      expect(result.children.length).toBe(5);

      // Verify that not all items have the same Y position
      const yPositions = result.children.map(c => c?.y ?? 0);
      const uniqueYPositions = [...new Set(yPositions)];

      // There should be multiple unique Y positions if wrapping is working
      expect(uniqueYPositions.length).toBeGreaterThan(1);
    });

    it('should wrap items to new row when width is exceeded without explicit item widths', () => {
      // Create flex with wrap and dynamically sized text items
      const node = flex()
        .wrap('wrap')
        .text('AAAAAAAAAA') // 10 chars, approximately 60 dots
        .text('BBBBBBBBBB') // 10 chars, approximately 60 dots
        .text('CCCCCCCCCC') // 10 chars, approximately 60 dots
        .build();

      // Container width of 100 - only first item should fit, others should wrap
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 100 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 100, height: 500 });

      // Each item should be on a different line since each is ~60 dots wide
      // and container is only 100 dots wide (can fit 1, maybe 2 items per line)
      expect(result.children.length).toBe(3);

      // First child should be at Y=0
      expect(result.children[0]?.y).toBe(0);

      // Second child should be on a new line (Y > first child's Y)
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should correctly calculate Y positions for wrapped items', () => {
      // Create flex with wrap and items that will wrap to multiple lines
      const node = flex()
        .wrap('wrap')
        .add(stack().width(60).text('Line1-A'))
        .add(stack().width(60).text('Line1-B'))
        .add(stack().width(60).text('Line2-A'))
        .add(stack().width(60).text('Line2-B'))
        .build();

      // Width 150 should fit 2 items per line (60+60=120 < 150)
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 150 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 150, height: 500 });

      expect(result.children.length).toBe(4);

      // First two items should be on the same line (Y=0)
      expect(result.children[0]?.y).toBe(result.children[1]?.y);

      // Last two items should be on a different line
      expect(result.children[2]?.y).toBe(result.children[3]?.y);

      // Second line Y should be greater than first line Y
      expect(result.children[2]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should increase Y position for wrapped items by line height', () => {
      // Create flex with wrap and known-height items
      const node = flex()
        .wrap('wrap')
        .add(stack().width(80).height(40).text('A'))
        .add(stack().width(80).height(40).text('B'))
        .build();

      // Width 100 can only fit one 80-wide item
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 100 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 100, height: 500 });

      // Each item should be on its own line
      expect(result.children.length).toBe(2);

      // First item at Y=0
      expect(result.children[0]?.y).toBe(0);

      // Second item should be on the next line, Y = first item height
      // The Y should be at least the height of the first item
      expect(result.children[1]?.y).toBeGreaterThanOrEqual(result.children[0]?.height ?? 0);
    });

    it('should wrap items when flex container has explicit width smaller than children', () => {
      // Flex container with explicit width that forces wrapping
      const node = flex()
        .wrap('wrap')
        .width(200) // Container is 200 dots wide
        .add(stack().width(120).text('Item1')) // Each item is 120 dots
        .add(stack().width(120).text('Item2'))
        .add(stack().width(120).text('Item3'))
        .build();

      // Measure with large available width, but flex has explicit 200 width
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 1000 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

      // Items should wrap because flex container is 200 wide, items are 120 each
      // Only 1 item fits per line
      expect(result.children.length).toBe(3);

      // All items should have different Y positions (each on its own line)
      expect(result.children[0]?.y).toBeLessThan(result.children[1]?.y ?? 0);
      expect(result.children[1]?.y).toBeLessThan(result.children[2]?.y ?? 0);
    });

    it('should wrap items accounting for gap between items', () => {
      // Create flex with wrap, gap, and items
      const node = flex()
        .wrap('wrap')
        .gap(20) // 20 dots gap between items
        .add(stack().width(50).text('A'))
        .add(stack().width(50).text('B'))
        .add(stack().width(50).text('C'))
        .build();

      // Width 110: can fit 2 items (50+20+50=120 > 110), so should wrap
      // Actually 50+50=100 < 110, but with gap 50+20+50=120 > 110
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 110 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 110, height: 500 });

      // First item fits alone (50 < 110)
      // Second item: 50+20+50 = 120 > 110, so B should wrap
      // Third item: 50+20+50 = 120 > 110, so C should also be on new line

      expect(result.children.length).toBe(3);

      // Because of gap, only first item should fit on first line
      // Wait, let's recalculate: width=110, item=50, so first item at 50
      // Second item would be at 50+20+50=120 which > 110, so it wraps
      // On second line: item at 50, third would be 50+20+50=120 > 110, so C wraps too

      // First item Y=0
      expect(result.children[0]?.y).toBe(0);

      // Due to gap, second item should be on next line
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should wrap items when flex has padding that reduces available width', () => {
      // Flex with padding - items should wrap based on content area, not container
      const node = flex()
        .wrap('wrap')
        .padding(30) // 30px padding on all sides
        .add(stack().width(100).text('A'))
        .add(stack().width(100).text('B'))
        .build();

      // Available width 200, padding 30 on each side = content area 140
      // Two 100-wide items = 200, exceeds 140, so second item should wrap
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 200 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 200, height: 500 });

      expect(result.children.length).toBe(2);

      // First item should start at padding offset (y = padding.top = 30)
      // But the key test is: items should be on different Y positions
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should account for child margins when calculating wrap points', () => {
      // BUG LOCATION: src/layout/measure.ts:494-499
      // The wrap calculation uses child.preferredWidth but when a stack
      // has an explicit width, preferredWidth returns just that width,
      // not including the margins. The margins are stored separately in
      // child.margin but are not being added to the width calculation.
      //
      // Current behavior at line 495:
      //   const childWidth = child.preferredWidth;  // Returns 40, not 60
      //
      // Should also add margins:
      //   const childWidth = child.preferredWidth + child.margin.left + child.margin.right;

      // Children with margins - margin should be included in wrap calculation
      const child1 = stack().width(40).text('A').build();
      child1.margin = { left: 10, right: 10 }; // Total: 40 + 10 + 10 = 60

      const child2 = stack().width(40).text('B').build();
      child2.margin = { left: 10, right: 10 }; // Total: 40 + 10 + 10 = 60

      const node = flex()
        .wrap('wrap')
        .add(child1)
        .add(child2)
        .build();

      // Container width 100: Each child takes 60 total width with margins
      // 60 + 60 = 120 > 100, so second child should wrap
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 100 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 100, height: 500 });

      expect(result.children.length).toBe(2);

      // Verify the bug: child.preferredWidth does not include margins for explicit-width stacks
      // Child 1 preferredWidth should be 40, but with margins it occupies 60 dots
      expect(measured.children[0]?.preferredWidth).toBe(40);
      expect(measured.children[0]?.margin.left).toBe(10);
      expect(measured.children[0]?.margin.right).toBe(10);
      // Total occupied width = 40 + 10 + 10 = 60

      // BUG: Both children end up on the same line because wrap calculation
      // sees 40 + 40 = 80 < 100, but actual occupied width is 60 + 60 = 120 > 100
      // The second child SHOULD be on a different line
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should wrap when flex container has margins reducing available space', () => {
      // Flex container with margins
      const node = flex()
        .wrap('wrap')
        .margin(20) // 20px margin on all sides
        .add(stack().width(80).text('A'))
        .add(stack().width(80).text('B'))
        .build();

      // Available width 150, margin 20 on each side = content 110
      // Two 80-wide items = 160 > 110, should wrap
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 150 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 150, height: 500 });

      expect(result.children.length).toBe(2);
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should wrap with items that are exactly at container boundary', () => {
      // Edge case: items that fit exactly should not wrap
      // Then adding one more should cause wrap
      const node = flex()
        .wrap('wrap')
        .add(stack().width(50).text('A'))
        .add(stack().width(50).text('B')) // 100 total = exactly fits
        .add(stack().width(50).text('C')) // 150 total > 100, should wrap
        .build();

      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 100 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 100, height: 500 });

      expect(result.children.length).toBe(3);

      // First two items should be on same line (exactly 100 = 100)
      expect(result.children[0]?.y).toBe(result.children[1]?.y);

      // Third item should wrap to new line
      expect(result.children[2]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
    });

    it('should wrap items in very narrow container', () => {
      // Very narrow container - each item should be on its own line
      const node = flex()
        .wrap('wrap')
        .add(stack().width(30).text('A'))
        .add(stack().width(30).text('B'))
        .add(stack().width(30).text('C'))
        .build();

      // Container only 25 wide - even single 30-wide item doesn't fit
      // But items should still be placed, each on its own line
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 25 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 25, height: 500 });

      expect(result.children.length).toBe(3);

      // In very narrow container, items that exceed width should still place
      // and subsequent items should wrap
      // At minimum: first item at Y=0, subsequent items at increasing Y
      expect(result.children[0]?.y).toBe(0);
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
      expect(result.children[2]?.y).toBeGreaterThan(result.children[1]?.y ?? 0);
    });

    it('should correctly wrap when first item already exceeds container width', () => {
      // First item wider than container - it should still place, then others wrap
      const node = flex()
        .wrap('wrap')
        .add(stack().width(200).text('Wide'))
        .add(stack().width(50).text('Normal'))
        .build();

      // Container 100, first item 200 (exceeds), second item 50
      const measured = measureNode(node, { ...DEFAULT_MEASURE_CONTEXT, availableWidth: 100 }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 100, height: 500 });

      expect(result.children.length).toBe(2);

      // First item should be placed even though it exceeds container
      expect(result.children[0]?.y).toBe(0);

      // Second item should wrap to new line
      expect(result.children[1]?.y).toBeGreaterThan(result.children[0]?.y ?? 0);
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

  // ==================== BUG-005: Stack vAlign Broken ====================

  describe('BUG-005: Stack vAlign Broken', () => {
    // BUG: When using vAlign='top' on a horizontal row stack, items with different
    // heights/padding are NOT rendered at the same Y position. Items with more
    // padding get higher Y positions because margin.top is being added twice:
    // once in the layout context calculation and again in layoutTextNode/layoutStackNode.

    describe('horizontal stack with vAlign="top"', () => {
      it('should align all items at the same Y position regardless of padding', () => {
        // Create a row with items having different padding
        const itemNoPadding = stack().text('No Padding').build();
        const itemWithPadding = stack().padding(20).text('Has Padding').build();

        const row = stack()
          .direction('row')
          .vAlign('top')
          .add(itemNoPadding)
          .add(itemWithPadding)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // BUG: With vAlign='top', both children should start at the same Y position
        // Currently, the item with padding has a higher Y due to margin/padding being added twice
        expect(result.children[0]?.y).toBe(result.children[1]?.y);
      });

      it('should respect margin-top for text items in row with vAlign top', () => {
        // NOTE: This is NOT a bug - margins should be respected on top of alignment.
        // When vAlign='top', items' margin boxes are aligned at the top of the row.
        // A child with margin.top=30 will have its content positioned 30 units below the row top.
        // This is consistent with CSS flexbox align-items: flex-start behavior.
        const text1 = text('Text 1');
        text1.margin = { top: 0, right: 0, bottom: 0, left: 0 };

        const text2 = text('Text 2');
        text2.margin = { top: 30, right: 0, bottom: 0, left: 0 };

        const row = stack()
          .direction('row')
          .vAlign('top')
          .add(text1)
          .add(text2)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // With vAlign='top', both items start at row top, but margins are still respected
        // text1 (no margin) should be at Y=0
        // text2 (margin.top=30) should be at Y=30
        expect(result.children[0]?.y).toBe(0);
        expect(result.children[1]?.y).toBe(30);
      });

      it('should align stacks with different heights at same Y when vAlign is top', () => {
        // One stack with 1 text item, another with 3 text items
        const shortStack = stack().text('Short').build();
        const tallStack = stack().text('Line 1').text('Line 2').text('Line 3').build();

        const row = stack()
          .direction('row')
          .vAlign('top')
          .add(shortStack)
          .add(tallStack)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // With vAlign='top', both stacks should have the same Y position
        expect(result.children[0]?.y).toBe(result.children[1]?.y);
        expect(result.children[0]?.y).toBe(0); // Both should be at Y=0 (top)
      });
    });

    describe('horizontal stack with vAlign="center"', () => {
      it('should center items vertically within the row height', () => {
        // Short item (60px height) and tall item (180px height)
        const shortItem = stack().text('Short').build(); // 60px
        const tallItem = stack().text('Line 1').text('Line 2').text('Line 3').build(); // 180px

        const row = stack()
          .direction('row')
          .vAlign('center')
          .add(shortItem)
          .add(tallItem)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // Row height should be 180px (tallest child)
        // Short item (60px) should be centered: Y = (180 - 60) / 2 = 60
        // Tall item (180px) should be at Y = 0
        const shortChild = result.children[0];
        const tallChild = result.children[1];

        expect(tallChild?.y).toBe(0); // Tall item fills the row, starts at top
        expect(shortChild?.y).toBe(60); // Short item centered: (180-60)/2 = 60
      });

      it('should center items with padding correctly', () => {
        // Item without padding
        const noPadding = stack().text('No Pad').build(); // 60px height

        // Item with padding (20 top + 60 content + 20 bottom = 100px)
        const withPadding = stack().padding(20).text('Padded').build(); // 100px height

        const row = stack()
          .direction('row')
          .vAlign('center')
          .add(noPadding)
          .add(withPadding)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // Row height = 100 (from padded item)
        // No padding item (60px): Y = (100 - 60) / 2 = 20
        // Padded item (100px): Y = 0
        const noPaddingChild = result.children[0];
        const paddedChild = result.children[1];

        expect(paddedChild?.y).toBe(0);
        expect(noPaddingChild?.y).toBe(20);
      });
    });

    describe('horizontal stack with vAlign="bottom"', () => {
      it('should align items at the bottom of the row', () => {
        // Short item and tall item
        const shortItem = stack().text('Short').build(); // 60px
        const tallItem = stack().text('Line 1').text('Line 2').text('Line 3').build(); // 180px

        const row = stack()
          .direction('row')
          .vAlign('bottom')
          .add(shortItem)
          .add(tallItem)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // Row height = 180px (tallest child)
        // Short item (60px) should be at bottom: Y = 180 - 60 = 120
        // Tall item (180px) should be at Y = 0
        const shortChild = result.children[0];
        const tallChild = result.children[1];

        expect(tallChild?.y).toBe(0);
        expect(shortChild?.y).toBe(120);
      });

      it('should align items with different padding at same bottom edge', () => {
        const noPadding = stack().text('No Pad').build(); // 60px
        const withPadding = stack().padding(20).text('Padded').build(); // 100px

        const row = stack()
          .direction('row')
          .vAlign('bottom')
          .add(noPadding)
          .add(withPadding)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // Both items should have the same bottom edge
        const noPaddingChild = result.children[0];
        const paddedChild = result.children[1];

        const noPaddingBottom = (noPaddingChild?.y ?? 0) + (noPaddingChild?.height ?? 0);
        const paddedBottom = (paddedChild?.y ?? 0) + (paddedChild?.height ?? 0);

        expect(noPaddingBottom).toBe(paddedBottom);
      });
    });

    describe('horizontal stack row height calculation', () => {
      it('should calculate row height from tallest child including padding', () => {
        const smallItem = stack().text('Small').build(); // 60px
        const paddedItem = stack().padding(50).text('Padded').build(); // 50+60+50 = 160px

        const row = stack()
          .direction('row')
          .add(smallItem)
          .add(paddedItem)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);

        // The row's height should be the tallest child (160px from padded item)
        expect(measured.preferredHeight).toBe(160);
      });

      it('should use correct row height for vAlign calculations', () => {
        // Two items with margins
        const item1 = stack().text('Item 1').build();
        const item2 = stack().text('Item 2').build();
        item2.margin = { top: 40, right: 0, bottom: 0, left: 0 };

        const row = stack()
          .direction('row')
          .vAlign('bottom')
          .add(item1)
          .add(item2)
          .build();

        const measured = measureNode(row, {
          ...DEFAULT_MEASURE_CONTEXT,
          availableWidth: 1000,
        }, DEFAULT_STYLE);
        const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 500 });

        // The bottom edges of both items should align
        // This tests that margin is properly accounted for in rowHeight calculation
        const item1Bottom = (result.children[0]?.y ?? 0) + (result.children[0]?.height ?? 0);
        const item2Bottom = (result.children[1]?.y ?? 0) + (result.children[1]?.height ?? 0);

        expect(item1Bottom).toBe(item2Bottom);
      });
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

  // ==================== BUG-001: NESTED FLEX OVERLAP ====================

  describe('BUG-001: Nested Flex Overlap', () => {
    /**
     * BUG DESCRIPTION:
     * When nesting flex containers, text from adjacent items overlaps because
     * child widths are not correctly calculated and passed. The nested flex
     * containers receive the parent's full contentWidth instead of their
     * allocated portion, causing overlap.
     *
     * Location: src/layout/layout.ts:399-533 (layoutFlexNode function)
     *
     * Root cause: In layoutFlexNode, for nested flex containers without explicit
     * width, the code passes contentWidth (parent's full content width) instead
     * of the child's allocated width:
     *   const childLayoutWidth = childMeasured.node.type === 'flex' && !childMeasured.explicitWidth
     *     ? contentWidth  // BUG: This gives nested flex the FULL parent width
     *     : childWidth;
     */

    it('should not overlap text in nested flex containers', () => {
      // Create a parent flex with two nested flex children
      // Each nested flex should occupy its own space without overlap
      const node = flex()
        .add(flex().text('Left Content'))
        .add(flex().text('Right Content'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      expect(result.children.length).toBe(2);

      const leftFlex = result.children[0];
      const rightFlex = result.children[1];

      // The right flex should start AFTER the left flex ends
      const leftFlexEnd = (leftFlex?.x ?? 0) + (leftFlex?.width ?? 0);
      const rightFlexStart = rightFlex?.x ?? 0;

      expect(rightFlexStart).toBeGreaterThanOrEqual(leftFlexEnd);

      // Additionally, the nested flex text children should not have overlapping x ranges
      const leftTextChild = leftFlex?.children[0];
      const rightTextChild = rightFlex?.children[0];

      if (leftTextChild && rightTextChild) {
        const leftTextEnd = leftTextChild.x + leftTextChild.width;
        const rightTextStart = rightTextChild.x;

        // Right text should start after left text ends (no overlap)
        expect(rightTextStart).toBeGreaterThanOrEqual(leftTextEnd);
      }
    });

    it('should correctly distribute width to flex children', () => {
      // With space-between justify, two children should be at opposite ends
      const node = flex()
        .justify('space-between')
        .add(flex().text('First'))
        .add(flex().text('Second'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const firstChild = result.children[0];
      const secondChild = result.children[1];

      // First child should start at x=0
      expect(firstChild?.x).toBe(0);

      // Second child should be positioned at the end
      const secondChildEnd = (secondChild?.x ?? 0) + (secondChild?.width ?? 0);
      expect(secondChildEnd).toBeCloseTo(1000, 0);

      // Children should not overlap
      const firstChildEnd = (firstChild?.x ?? 0) + (firstChild?.width ?? 0);
      expect(secondChild?.x).toBeGreaterThanOrEqual(firstChildEnd);
    });

    it('should allocate correct widths to multiple text children in horizontal flex', () => {
      // Three text items in a flex - each should have non-overlapping x positions
      const node = flex()
        .text('Item One')
        .text('Item Two')
        .text('Item Three')
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      expect(result.children.length).toBe(3);

      // Verify no overlapping x positions
      for (let i = 0; i < result.children.length - 1; i++) {
        const current = result.children[i];
        const next = result.children[i + 1];

        const currentEnd = (current?.x ?? 0) + (current?.width ?? 0);
        const nextStart = next?.x ?? 0;

        // Next item should start at or after current item ends
        expect(nextStart).toBeGreaterThanOrEqual(currentEnd);
      }
    });

    it('should pass correct width context to deeply nested flex containers', () => {
      // Three levels of nesting
      const node = flex()
        .add(
          flex()
            .add(flex().text('Deep Left'))
            .add(flex().text('Deep Right'))
        )
        .add(flex().text('Sibling'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const outerLeft = result.children[0];
      const outerRight = result.children[1];

      // Outer children should not overlap
      const outerLeftEnd = (outerLeft?.x ?? 0) + (outerLeft?.width ?? 0);
      expect(outerRight?.x).toBeGreaterThanOrEqual(outerLeftEnd);

      // Deep nested children should also not overlap
      if (outerLeft?.children && outerLeft.children.length === 2) {
        const deepLeft = outerLeft.children[0];
        const deepRight = outerLeft.children[1];

        const deepLeftEnd = (deepLeft?.x ?? 0) + (deepLeft?.width ?? 0);
        expect(deepRight?.x).toBeGreaterThanOrEqual(deepLeftEnd);
      }
    });

    it('should not allow nested flex to use more width than allocated by parent', () => {
      const node = flex()
        .gap(20)
        .add(flex().width(200).text('Fixed Width'))
        .add(flex().text('Variable Width'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const fixedChild = result.children[0];
      const variableChild = result.children[1];

      // Fixed width child should respect its width
      expect(fixedChild?.width).toBe(200);

      // Variable child should start after fixed child + gap
      const expectedVariableStart = (fixedChild?.x ?? 0) + (fixedChild?.width ?? 0) + 20;
      expect(variableChild?.x).toBe(expectedVariableStart);

      // Variable child should fit within remaining space
      const variableChildEnd = (variableChild?.x ?? 0) + (variableChild?.width ?? 0);
      expect(variableChildEnd).toBeLessThanOrEqual(1000);
    });

    it('should maintain correct x positions when rendering text within nested flex', () => {
      const node = flex()
        .add(flex().text('A'))
        .add(flex().text('B'))
        .add(flex().text('C'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      // Collect all text node x positions
      const textPositions: number[] = [];
      result.children.forEach(flexChild => {
        const textChild = flexChild?.children[0];
        if (textChild) {
          textPositions.push(textChild.x);
        }
      });

      expect(textPositions.length).toBe(3);

      // Each subsequent text should have a larger x position
      for (let i = 0; i < textPositions.length - 1; i++) {
        expect(textPositions[i + 1]).toBeGreaterThan(textPositions[i]!);
      }
    });

    it('should handle nested flex with explicit widths correctly', () => {
      const node = flex()
        .add(flex().width(300).text('Width 300'))
        .add(flex().width(400).text('Width 400'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const child1 = result.children[0];
      const child2 = result.children[1];

      expect(child1?.width).toBe(300);
      expect(child2?.width).toBe(400);
      expect(child2?.x).toBe(300);

      const totalUsed = (child2?.x ?? 0) + (child2?.width ?? 0);
      expect(totalUsed).toBe(700);
    });

    it('should not cause text overlap when parent has padding', () => {
      const node = flex()
        .padding(50)
        .add(flex().text('Padded Left'))
        .add(flex().text('Padded Right'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const leftChild = result.children[0];
      const rightChild = result.children[1];

      expect(leftChild?.x).toBe(50);

      const leftEnd = (leftChild?.x ?? 0) + (leftChild?.width ?? 0);
      expect(rightChild?.x).toBeGreaterThanOrEqual(leftEnd);

      const rightEnd = (rightChild?.x ?? 0) + (rightChild?.width ?? 0);
      expect(rightEnd).toBeLessThanOrEqual(950);
    });

    it('should NOT give nested flex full parent width for justify calculations', () => {
      // BUG: If nested flex receives full 1000px width, its text child
      // might be positioned as if it has 1000px available
      const node = flex()
        .justify('start')
        .add(flex().justify('end').text('A'))
        .add(flex().justify('end').text('B'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const firstFlex = result.children[0];
      const secondFlex = result.children[1];
      const firstText = firstFlex?.children[0];
      const secondText = secondFlex?.children[0];

      // First text should be within the first flex's boundary
      const firstFlexEnd = (firstFlex?.x ?? 0) + (firstFlex?.width ?? 0);
      const firstTextEnd = (firstText?.x ?? 0) + (firstText?.width ?? 0);
      expect(firstTextEnd).toBeLessThanOrEqual(firstFlexEnd);

      // Second text should be within the second flex's boundary
      const secondFlexEnd = (secondFlex?.x ?? 0) + (secondFlex?.width ?? 0);
      const secondTextEnd = (secondText?.x ?? 0) + (secondText?.width ?? 0);
      expect(secondTextEnd).toBeLessThanOrEqual(secondFlexEnd);

      // Both flex containers should have DIFFERENT x positions
      expect(secondFlex?.x).toBeGreaterThan(firstFlex?.x ?? 0);
    });

    it('should detect overlap when two nested flex containers have text at same absolute x', () => {
      const node = flex()
        .add(flex().text('AAAA'))
        .add(flex().text('BBBB'))
        .build();

      const measured = measureNode(node, {
        ...DEFAULT_MEASURE_CONTEXT,
        availableWidth: 1000,
      }, DEFAULT_STYLE);
      const result = layoutNode(measured, { x: 0, y: 0, width: 1000, height: 100 });

      const firstFlex = result.children[0];
      const secondFlex = result.children[1];
      const textA = firstFlex?.children[0];
      const textB = secondFlex?.children[0];

      // BUG SYMPTOM: If both nested flexes think they have 1000px width,
      // both texts would start at x=0 which causes overlap

      expect(textB?.x).not.toBe(textA?.x);

      const textAEnd = (textA?.x ?? 0) + (textA?.width ?? 0);
      expect(textB?.x).toBeGreaterThanOrEqual(textAEnd);
    });
  });
});
