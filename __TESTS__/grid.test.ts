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
});
