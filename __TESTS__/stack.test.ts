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
});
