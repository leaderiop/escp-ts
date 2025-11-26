import { describe, it, expect } from 'vitest';
import { measureNode, DEFAULT_MEASURE_CONTEXT, type MeasureContext } from './measure';
import { stack, flex, grid, text, spacer, line } from './builders';
import { DEFAULT_STYLE, type ResolvedStyle } from './nodes';

describe('measure', () => {
  const ctx: MeasureContext = {
    ...DEFAULT_MEASURE_CONTEXT,
    availableWidth: 1000,
    availableHeight: 500,
    lineSpacing: 60,
    interCharSpace: 0,
  };

  // ==================== TEXT NODE MEASUREMENT ====================

  describe('measureNode - text', () => {
    it('measures simple text', () => {
      const node = text('Hello');
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.node).toBe(node);
      expect(measured.minContentWidth).toBeGreaterThan(0);
      expect(measured.minContentHeight).toBe(60); // lineSpacing
      expect(measured.children).toEqual([]);
    });

    it('measures text with padding', () => {
      const node = text('Hi');
      node.padding = 10;
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      const baseWidth = measureNode(text('Hi'), ctx, DEFAULT_STYLE).minContentWidth;
      expect(measured.preferredWidth).toBe(baseWidth + 20); // padding on both sides
      expect(measured.preferredHeight).toBe(60 + 20); // height + top + bottom
    });

    it('measures text with double height', () => {
      const node = text('Test');
      node.doubleHeight = true;
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.minContentHeight).toBe(120); // double lineSpacing
    });

    it('inherits style from parent', () => {
      const parentStyle: ResolvedStyle = {
        ...DEFAULT_STYLE,
        bold: true,
        cpi: 12,
      };
      const node = text('Test');
      const measured = measureNode(node, ctx, parentStyle);

      expect(measured.style.bold).toBe(true);
      expect(measured.style.cpi).toBe(12);
    });

    it('overrides parent style with node style', () => {
      const parentStyle: ResolvedStyle = {
        ...DEFAULT_STYLE,
        bold: true,
      };
      const node = text('Test');
      node.bold = false;
      node.italic = true;
      const measured = measureNode(node, ctx, parentStyle);

      expect(measured.style.bold).toBe(false);
      expect(measured.style.italic).toBe(true);
    });
  });

  // ==================== SPACER NODE MEASUREMENT ====================

  describe('measureNode - spacer', () => {
    it('measures flexible spacer', () => {
      const node = spacer();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.minContentWidth).toBe(0); // flex spacer has 0 min width
      expect(measured.minContentHeight).toBe(60); // default to lineSpacing
    });

    it('measures fixed size spacer', () => {
      const node = spacer(50);
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredWidth).toBe(50);
      expect(measured.preferredHeight).toBe(50);
    });
  });

  // ==================== LINE NODE MEASUREMENT ====================

  describe('measureNode - line', () => {
    it('measures horizontal fill line', () => {
      const node = line('-', 'fill');
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredWidth).toBe(ctx.availableWidth);
      expect(measured.minContentHeight).toBe(60);
    });

    it('measures fixed length line', () => {
      const node = line('=', 200);
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredWidth).toBe(200);
    });
  });

  // ==================== STACK NODE MEASUREMENT ====================

  describe('measureNode - stack', () => {
    it('measures empty stack', () => {
      const node = stack().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.minContentWidth).toBe(0);
      expect(measured.minContentHeight).toBe(0);
      expect(measured.children).toEqual([]);
    });

    it('measures vertical stack (column)', () => {
      const node = stack().text('Line 1').text('Line 2').text('Line 3').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children.length).toBe(3);
      // Height should be sum of children
      expect(measured.minContentHeight).toBe(60 * 3); // 3 lines
    });

    it('measures vertical stack with gap', () => {
      const node = stack().gap(10).text('Line 1').text('Line 2').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      // 2 lines of 60 + 1 gap of 10
      expect(measured.minContentHeight).toBe(130);
    });

    it('measures horizontal stack (row)', () => {
      const node = stack().direction('row').text('A').text('B').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children.length).toBe(2);
      // Width should be sum of children
      const child1Width = measured.children[0]?.preferredWidth ?? 0;
      const child2Width = measured.children[1]?.preferredWidth ?? 0;
      expect(measured.minContentWidth).toBe(child1Width + child2Width);
      // Height should be max of children
      expect(measured.minContentHeight).toBe(60);
    });

    it('measures stack with padding', () => {
      const node = stack().padding(20).text('Test').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.padding).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
      expect(measured.preferredHeight).toBe(60 + 40); // content + top/bottom padding
    });

    it('measures stack with fill width', () => {
      const node = stack().width('fill').text('Test').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredWidth).toBe(ctx.availableWidth);
    });

    it('measures stack with fixed width', () => {
      const node = stack().width(300).text('Test').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredWidth).toBe(300);
    });

    it('propagates style to children', () => {
      const node = stack().bold().cpi(12).text('Test').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.style.bold).toBe(true);
      expect(measured.style.cpi).toBe(12);
      expect(measured.children[0]?.style.bold).toBe(true);
      expect(measured.children[0]?.style.cpi).toBe(12);
    });
  });

  // ==================== FLEX NODE MEASUREMENT ====================

  describe('measureNode - flex', () => {
    it('measures empty flex', () => {
      const node = flex().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.minContentWidth).toBe(0);
      expect(measured.minContentHeight).toBe(0);
    });

    it('measures flex with children (horizontal layout)', () => {
      const node = flex().text('Left').text('Right').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children.length).toBe(2);
      // Width is sum of children
      const totalChildWidth =
        measured.children.reduce((sum, c) => sum + c.preferredWidth, 0);
      expect(measured.minContentWidth).toBe(totalChildWidth);
      // Height is max of children
      expect(measured.minContentHeight).toBe(60);
    });

    it('measures flex with gap', () => {
      const node = flex().gap(20).text('A').text('B').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      const child1 = measured.children[0]?.preferredWidth ?? 0;
      const child2 = measured.children[1]?.preferredWidth ?? 0;
      // Width includes gap
      expect(measured.minContentWidth).toBe(child1 + child2 + 20);
    });

    it('measures flex with fill width', () => {
      const node = flex().width('fill').text('Test').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredWidth).toBe(ctx.availableWidth);
    });

    it('measures flex with padding', () => {
      const node = flex().padding({ top: 10, bottom: 10 }).text('Test').build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.preferredHeight).toBe(60 + 20);
    });
  });

  // ==================== GRID NODE MEASUREMENT ====================

  describe('measureNode - grid', () => {
    it('measures empty grid', () => {
      const node = grid([100, 200]).build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children).toEqual([]);
      expect(measured.rowHeights).toEqual([]);
    });

    it('measures grid with cells', () => {
      const node = grid([100, 200]).cell('A').cell('B').row().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children.length).toBe(2);
      expect(measured.rowHeights?.length).toBe(1);
      expect(measured.columnWidths?.length).toBe(2);
    });

    it('measures grid with fixed column widths', () => {
      const node = grid([100, 200, 150]).cell('A').cell('B').cell('C').row().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.columnWidths).toEqual([100, 200, 150]);
    });

    it('measures grid with fill columns', () => {
      const narrowCtx = { ...ctx, availableWidth: 500 };
      const node = grid([100, 'fill', 100])
        .cell('A')
        .cell('B')
        .cell('C')
        .row()
        .build();
      const measured = measureNode(node, narrowCtx, DEFAULT_STYLE);

      // Fill column should take remaining space (500 - 100 - 100 = 300)
      expect(measured.columnWidths?.[0]).toBe(100);
      expect(measured.columnWidths?.[1]).toBe(300);
      expect(measured.columnWidths?.[2]).toBe(100);
    });

    it('measures grid with auto columns', () => {
      const node = grid(['auto', 'auto']).cell('Short').cell('Longer text').row().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      // Auto columns should size to content
      const col0Width = measured.columnWidths?.[0] ?? 0;
      const col1Width = measured.columnWidths?.[1] ?? 0;
      expect(col1Width).toBeGreaterThan(col0Width);
    });

    it('measures grid with multiple rows', () => {
      const node = grid([100, 100])
        .cell('A1')
        .cell('B1')
        .row()
        .cell('A2')
        .cell('B2')
        .row()
        .build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.rowHeights?.length).toBe(2);
      expect(measured.children.length).toBe(4);
    });

    it('measures grid with row gaps', () => {
      const node = grid([100]).rowGap(10).cell('A').row().cell('B').row().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      // 2 rows of 60 each + 1 gap of 10
      expect(measured.minContentHeight).toBe(130);
    });

    it('measures grid with column gaps', () => {
      const node = grid([100, 100]).columnGap(20).cell('A').cell('B').row().build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      // 2 columns of 100 + 1 gap of 20
      expect(measured.minContentWidth).toBe(220);
    });

    it('respects explicit row heights', () => {
      const node = grid([100]).cell('A').row(100).build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.rowHeights?.[0]).toBe(100);
    });
  });

  // ==================== NESTED LAYOUT MEASUREMENT ====================

  describe('measureNode - nested layouts', () => {
    it('measures nested stacks', () => {
      const node = stack()
        .text('Outer')
        .add(stack().text('Inner 1').text('Inner 2'))
        .build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children.length).toBe(2);
      expect(measured.children[1]?.children.length).toBe(2);
    });

    it('measures flex inside stack', () => {
      const node = stack()
        .add(flex().text('Left').text('Right'))
        .text('Below')
        .build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children.length).toBe(2);
      expect(measured.children[0]?.children.length).toBe(2);
    });

    it('measures grid inside stack', () => {
      const node = stack()
        .add(grid([100, 100]).cell('A').cell('B').row())
        .build();
      const measured = measureNode(node, ctx, DEFAULT_STYLE);

      expect(measured.children[0]?.columnWidths?.length).toBe(2);
    });
  });

  // ==================== DEFAULT MEASURE CONTEXT ====================

  describe('DEFAULT_MEASURE_CONTEXT', () => {
    it('has reasonable defaults', () => {
      expect(DEFAULT_MEASURE_CONTEXT.availableWidth).toBe(2880);
      expect(DEFAULT_MEASURE_CONTEXT.availableHeight).toBe(3600);
      expect(DEFAULT_MEASURE_CONTEXT.lineSpacing).toBe(60);
      expect(DEFAULT_MEASURE_CONTEXT.interCharSpace).toBe(0);
      expect(DEFAULT_MEASURE_CONTEXT.style).toEqual(DEFAULT_STYLE);
    });
  });
});
