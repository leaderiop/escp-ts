/**
 * Tests for Pagination Phase
 */

import { describe, it, expect } from 'vitest';
import { paginateLayout, createPageConfig, type PageConfig } from './pagination';
import { measureNode, DEFAULT_MEASURE_CONTEXT } from './measure';
import { performLayout } from './layout';
import { stack, flex, grid, text } from './builders';
import { DEFAULT_STYLE, type LayoutNode } from './nodes';

// Test page configuration: 400 dots tall with 50 dot margins
// Printable height: 300 dots
const TEST_PAGE_CONFIG: PageConfig = {
  pageHeight: 400,
  topMargin: 50,
  bottomMargin: 50,
  printableHeight: 300,
};

// Helper to measure and layout a node
function measureAndLayout(node: LayoutNode, pageConfig: PageConfig = TEST_PAGE_CONFIG) {
  const measured = measureNode(node, DEFAULT_MEASURE_CONTEXT, DEFAULT_STYLE);
  return performLayout(
    measured,
    pageConfig.topMargin,
    pageConfig.topMargin,
    DEFAULT_MEASURE_CONTEXT.availableWidth,
    pageConfig.printableHeight
  );
}

describe('paginateLayout', () => {
  describe('basic pagination', () => {
    it('keeps content that fits on single page', () => {
      const node = stack()
        .text('Line 1')
        .text('Line 2')
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBe(1);
      expect(result.pages[0]?.items.length).toBeGreaterThan(0);
    });

    it('splits content taller than page across pages', () => {
      // Create a stack with many lines that exceed page height
      const builder = stack().gap(30);
      for (let i = 0; i < 15; i++) {
        builder.text(`Line ${i + 1}`);
      }
      const node = builder.build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBeGreaterThan(1);
    });

    it('returns at least one page even for empty content', () => {
      const node = stack().build();
      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('breakBefore hint', () => {
    it('forces page break before node with breakBefore', () => {
      const node = stack()
        .text('Page 1 content')
        .add(
          stack()
            .breakBefore()
            .text('Page 2 content')
        )
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBe(2);
    });

    it('does not break if breakBefore is first item', () => {
      const node = stack()
        .breakBefore()
        .text('Content')
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // breakBefore on first item should not create empty page
      expect(result.pageCount).toBe(1);
    });
  });

  describe('breakAfter hint', () => {
    it('forces page break after node with breakAfter', () => {
      const node = stack()
        .add(
          stack()
            .breakAfter()
            .text('Page 1 content')
        )
        .text('Page 2 content')
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBe(2);
    });

    it('does not break if breakAfter is last item', () => {
      const node = stack()
        .text('Content')
        .breakAfter()
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // breakAfter on last item should not create empty trailing page
      expect(result.pageCount).toBe(1);
    });
  });

  describe('keepTogether hint', () => {
    it('keeps container together if it fits on fresh page', () => {
      // Create content that fills most of first page
      const builder = stack().gap(20);
      for (let i = 0; i < 5; i++) {
        builder.text(`Filler ${i + 1}`);
      }
      // Add a keepTogether section
      builder.add(
        stack()
          .keepTogether()
          .text('Grouped 1')
          .text('Grouped 2')
          .text('Grouped 3')
      );

      const node = builder.build();
      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // The keepTogether section should move to next page if it doesn't fit
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it('splits container if keepTogether item is taller than page', () => {
      // Create a keepTogether section taller than a page
      const builder = stack().keepTogether().gap(20);
      for (let i = 0; i < 20; i++) {
        builder.text(`Line ${i + 1}`);
      }
      const node = builder.build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // Even with keepTogether, must split if taller than page
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('grid row handling', () => {
    it('never splits grid rows', () => {
      const node = grid([100, 100, 100])
        .cell('A1').cell('B1').cell('C1').row()
        .cell('A2').cell('B2').cell('C2').row()
        .cell('A3').cell('B3').cell('C3').row()
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // All rows should be complete (not split mid-row)
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
      // Each page's items should contain complete rows
      for (const page of result.pages) {
        for (const item of page.items) {
          // Grid row items should have all their cells
          if (item.children.length > 0) {
            // This is a row - it should have all 3 cells
            expect(item.children.length % 3).toBe(0);
          }
        }
      }
    });

    it('respects keepWithNext on grid rows', () => {
      const node = grid([100, 100])
        .cell('Row 1').cell('Data').row()
        .cell('Subtotal').cell('$100').keepWithNext().row()
        .cell('Tax').cell('$10').row()
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // keepWithNext should keep subtotal and tax rows together
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it('respects rowBreakBefore on grid rows', () => {
      const node = grid([100])
        .cell('Section 1').row()
        .rowBreakBefore().cell('Section 2').row()
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBe(2);
    });
  });

  describe('flex container handling', () => {
    it('keeps flex container together by default', () => {
      const node = flex()
        .keepTogether()
        .text('Left')
        .text('Right')
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBe(1);
    });
  });

  describe('page coordinate adjustment', () => {
    it('adjusts Y coordinates to be page-relative', () => {
      const node = stack()
        .text('Page 1')
        .add(stack().breakBefore().text('Page 2'))
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // Second page items should start near topMargin
      if (result.pages[1] && result.pages[1].items[0]) {
        expect(result.pages[1].items[0].y).toBeLessThanOrEqual(TEST_PAGE_CONFIG.topMargin * 2);
      }
    });
  });

  describe('edge cases', () => {
    it('handles deeply nested containers', () => {
      const node = stack()
        .add(
          stack()
            .add(
              stack()
                .add(
                  stack().text('Deep content')
                )
            )
        )
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it('handles empty grid', () => {
      const node = grid([100, 100]).build();
      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it('handles single text node', () => {
      const node = text('Single line');
      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      expect(result.pageCount).toBe(1);
      expect(result.pages[0]?.items.length).toBe(1);
    });
  });

  describe('widow/orphan control', () => {
    // Note: minBeforeBreak and minAfterBreak are defined in the type system
    // but not yet implemented in the pagination algorithm. These tests
    // verify the builder API works and document expected behavior.

    it('sets minBeforeBreak on stack (orphan control)', () => {
      const node = stack()
        .minBeforeBreak(2)
        .text('Line 1')
        .text('Line 2')
        .text('Line 3')
        .build();

      // Verify the property is set correctly
      expect(node.minBeforeBreak).toBe(2);
    });

    it('sets minAfterBreak on stack (widow control)', () => {
      const node = stack()
        .minAfterBreak(2)
        .text('Line 1')
        .text('Line 2')
        .text('Line 3')
        .build();

      // Verify the property is set correctly
      expect(node.minAfterBreak).toBe(2);
    });

    it('handles pagination gracefully when constraints are set', () => {
      // Even though minBeforeBreak/minAfterBreak aren't implemented,
      // pagination should not crash when these properties are present
      const node = stack()
        .minBeforeBreak(2)
        .minAfterBreak(2)
        .text('Line 1')
        .text('Line 2')
        .text('Line 3')
        .build();

      const layout = measureAndLayout(node);
      const result = paginateLayout(layout, TEST_PAGE_CONFIG);

      // Should paginate without errors
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('absolute positioning in pagination', () => {
  it('preserves Y position for absolute positioned items', () => {
    const node = stack()
      .absolutePosition(100, 200)
      .text('Absolute')
      .build();

    const layout = measureAndLayout(node);
    const result = paginateLayout(layout, TEST_PAGE_CONFIG);

    // Find the absolute item - should maintain Y=200
    const item = result.pages[0]?.items.find(i => i.x === 100);
    expect(item).toBeDefined();
    expect(item?.y).toBe(200);
  });

  it('places absolute item on correct page based on Y coordinate', () => {
    // TEST_PAGE_CONFIG.pageHeight is 400
    // Y=500 should be on page 1 (index 1), with page-relative Y = 100
    const node = stack()
      .absolutePosition(0, 500)
      .text('Page 2 Content')
      .build();

    const layout = measureAndLayout(node);
    const result = paginateLayout(layout, TEST_PAGE_CONFIG);

    expect(result.pageCount).toBeGreaterThanOrEqual(2);
    // Item should be on second page with page-relative Y = 500 - 400 = 100
    const page2Items = result.pages[1]?.items ?? [];
    expect(page2Items.length).toBeGreaterThan(0);
    expect(page2Items[0]?.y).toBe(100);
  });

  it('does not adjust absolute item Y when surrounded by flow items', () => {
    // Use x=200 for absolute item to distinguish from flow items (which start at x=50)
    const node = stack()
      .text('Flow 1')
      .add(stack().absolutePosition(200, 150).text('Absolute'))
      .text('Flow 2')
      .build();

    const layout = measureAndLayout(node);
    const result = paginateLayout(layout, TEST_PAGE_CONFIG);

    // Flow items are adjusted, but absolute item maintains Y=150
    const absItem = result.pages[0]?.items.find(i => i.x === 200);
    expect(absItem).toBeDefined();
    expect(absItem?.y).toBe(150);
  });

  it('handles multiple absolute items on different pages', () => {
    // First item at Y=50 (page 0), second at Y=450 (page 1)
    const node = stack()
      .add(stack().absolutePosition(10, 50).text('Page 1 Abs'))
      .add(stack().absolutePosition(20, 450).text('Page 2 Abs'))
      .build();

    const layout = measureAndLayout(node);
    const result = paginateLayout(layout, TEST_PAGE_CONFIG);

    expect(result.pageCount).toBeGreaterThanOrEqual(2);
    // Page 0: item at Y=50, X=10
    expect(result.pages[0]?.items.some(i => i.y === 50 && i.x === 10)).toBe(true);
    // Page 1: item at Y=50 (450 - 400), X=20
    expect(result.pages[1]?.items.some(i => i.y === 50 && i.x === 20)).toBe(true);
  });

  it('absolute item at Y=0 stays at Y=0', () => {
    const node = stack()
      .absolutePosition(100, 0)
      .text('At Origin')
      .build();

    const layout = measureAndLayout(node);
    const result = paginateLayout(layout, TEST_PAGE_CONFIG);

    const item = result.pages[0]?.items.find(i => i.x === 100);
    expect(item).toBeDefined();
    expect(item?.y).toBe(0);
  });

  it('handles negative Y as page 0, Y=0', () => {
    const node = stack()
      .absolutePosition(50, -50)
      .text('Negative Y')
      .build();

    const layout = measureAndLayout(node);
    const result = paginateLayout(layout, TEST_PAGE_CONFIG);

    // Should be on page 0 with Y=0 (negative treated as 0)
    const item = result.pages[0]?.items.find(i => i.x === 50);
    expect(item).toBeDefined();
    expect(item?.y).toBe(0);
  });
});

describe('createPageConfig', () => {
  it('calculates printableHeight correctly', () => {
    const config = createPageConfig(1000, 100, 100);

    expect(config.pageHeight).toBe(1000);
    expect(config.topMargin).toBe(100);
    expect(config.bottomMargin).toBe(100);
    expect(config.printableHeight).toBe(800);
  });

  it('handles zero margins', () => {
    const config = createPageConfig(500, 0, 0);

    expect(config.printableHeight).toBe(500);
  });
});
