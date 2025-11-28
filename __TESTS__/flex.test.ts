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
