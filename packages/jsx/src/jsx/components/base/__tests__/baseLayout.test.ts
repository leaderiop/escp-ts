/**
 * Tests for baseLayout utility function
 *
 * The baseLayout function implements the layout stack model:
 *   margin layout (outermost) → border layout → padding layout → content layout (innermost)
 *
 * Key behavior being tested:
 * - When a component has both border and margin, the border should be drawn
 *   within the margin area (border width = total width - margin)
 * - The total component size should equal the specified width, not overflow
 *
 * Layout model:
 * ┌─────────────────────────────────────────────┐
 * │            MARGIN LAYOUT (500px)            │  ← Component's specified width
 * │  ┌───────────────────────────────────────┐  │
 * │  │         BORDER LAYOUT (460px)         │  │  ← Should be: 500 - margin(20+20)
 * │  │  ┌─────────────────────────────────┐  │  │
 * │  │  │     PADDING LAYOUT              │  │  │  ← Border - borderThickness
 * │  │  │  ┌───────────────────────────┐  │  │  │
 * │  │  │  │   CONTENT LAYOUT          │  │  │  │  ← Padding - padding
 * │  │  │  └───────────────────────────┘  │  │  │
 * │  │  └─────────────────────────────────┘  │  │
 * │  └───────────────────────────────────────┘  │
 * └─────────────────────────────────────────────┘
 *
 * Structure when margin + border:
 * - Outer Stack (width constraint): has width/height, NO margin
 *   - Margin Stack: has margin + flexGrow: 1
 *     - BorderedContainer: has flexGrow: 1, fills remaining space
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { loadYoga } from 'yoga-layout/load';
import type { Yoga } from 'yoga-layout/load';
import { baseLayout } from '../baseLayout';
import { Text } from '../../content/Text';
import { buildYogaTree, freeYogaTree } from '../../../../layout/yoga/YogaNodeBuilder';
import { DEFAULT_STYLE } from '../../../../layout/nodes';
import type { YogaLayoutContext } from '../../../../layout/yoga/types';
import type { LayoutNode, StackNode } from '../../../../layout/nodes';

let Yoga: Yoga;

beforeAll(async () => {
  Yoga = await loadYoga();
});

const ctx: YogaLayoutContext = {
  availableWidth: 1000,
  availableHeight: 1000,
  lineSpacing: 60,
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

// Border thickness at 10 CPI: left = 36, right = 36 (total horizontal = 72)
const BORDER_THICKNESS_HORIZONTAL = 72;

describe('baseLayout', () => {
  describe('without any layout properties', () => {
    it('should return content directly when single child and no options', () => {
      const content = Text({ children: 'Hello' });
      const result = baseLayout({}, content);

      // Single child with no options returns the child directly
      expect(result).toBe(content);
    });

    it('should wrap multiple children in Stack when no options', () => {
      const child1 = Text({ children: 'Hello' });
      const child2 = Text({ children: 'World' });
      const result = baseLayout({}, [child1, child2]);

      expect(result.type).toBe('stack');
      expect((result as StackNode).children).toHaveLength(2);
    });
  });

  describe('with border only (no margin)', () => {
    it('should return BorderedContainer with specified width', () => {
      const result = baseLayout(
        {
          border: 'single',
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      // Should be a Stack (outer container of BorderedContainer)
      expect(result.type).toBe('stack');
      expect((result as StackNode).width).toBe(500);
    });

    it('should have total computed width equal to specified width', () => {
      const result = baseLayout(
        {
          border: 'single',
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      expect(mapping.yogaNode.getComputedWidth()).toBe(500);

      freeYogaTree(mapping);
    });
  });

  describe('with margin only (no border)', () => {
    it('should return Stack with margin applied', () => {
      const result = baseLayout(
        {
          margin: 20,
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      expect(result.type).toBe('stack');
      const stack = result as StackNode;
      // Margin is stored as-is (number), not resolved to object
      expect(stack.margin).toBe(20);
      expect(stack.width).toBe(500);
    });
  });

  describe('with both border and margin - layout stack model', () => {
    it('should create 3-layer structure: outer Stack → margin Stack → BorderedContainer', () => {
      const result = baseLayout(
        {
          border: 'single',
          margin: 20,
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      // Layer 1: Outer Stack (size constraint)
      expect(result.type).toBe('stack');
      const outerStack = result as StackNode;
      expect(outerStack.width).toBe(500);
      expect(outerStack.margin).toBeUndefined(); // NO margin on outer
      expect(outerStack.children).toHaveLength(1);

      // Layer 2: Margin Stack
      const marginStack = outerStack.children[0] as StackNode;
      expect(marginStack.type).toBe('stack');
      expect(marginStack.margin).toBe(20);
      expect(marginStack.flexGrow).toBe(1);
      expect(marginStack.children).toHaveLength(1);

      // Layer 3: BorderedContainer
      const borderedContainer = marginStack.children[0] as StackNode;
      expect(borderedContainer.type).toBe('stack');
      expect(borderedContainer.flexGrow).toBe(1);
      expect(borderedContainer.width).toBeUndefined();
    });

    it('should compute total width equal to specified width (not overflow)', () => {
      const result = baseLayout(
        {
          border: 'single',
          margin: 20,
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Total width should be exactly 500 (not 500 + margins)
      expect(mapping.yogaNode.getComputedWidth()).toBe(500);

      freeYogaTree(mapping);
    });

    it('should compute border width as (total width - horizontal margins)', () => {
      const margin = 20;
      const totalWidth = 500;
      const expectedBorderWidth = totalWidth - margin * 2; // 500 - 40 = 460

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Margin container (child 0) should have width 460
      const marginContainer = mapping.children[0];
      expect(marginContainer.yogaNode.getComputedWidth()).toBe(expectedBorderWidth);

      // BorderedContainer (child 0 of margin container) should also have width 460
      const borderedContainer = marginContainer.children[0];
      expect(borderedContainer.yogaNode.getComputedWidth()).toBe(expectedBorderWidth);

      freeYogaTree(mapping);
    });

    it('should work with asymmetric margins', () => {
      const margin = { top: 10, right: 30, bottom: 10, left: 20 };
      const totalWidth = 500;
      const expectedBorderWidth = totalWidth - margin.left - margin.right; // 500 - 50 = 450

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Total width should still be 500
      expect(mapping.yogaNode.getComputedWidth()).toBe(totalWidth);

      // BorderedContainer width should be 450
      const marginContainer = mapping.children[0];
      const borderedContainer = marginContainer.children[0];
      expect(borderedContainer.yogaNode.getComputedWidth()).toBe(expectedBorderWidth);

      freeYogaTree(mapping);
    });

    it('should position margin container correctly with margin offset', () => {
      const margin = 20;
      const totalWidth = 500;

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Margin container should be positioned at left margin (20)
      const marginContainer = mapping.children[0];
      expect(marginContainer.yogaNode.getComputedLeft()).toBe(margin);
      expect(marginContainer.yogaNode.getComputedTop()).toBe(margin);

      freeYogaTree(mapping);
    });

    it('should handle height with margin correctly', () => {
      const margin = 20;
      const totalHeight = 300;
      const expectedBorderHeight = totalHeight - margin * 2; // 300 - 40 = 260

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: 500, height: totalHeight },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, 1000);

      // Total height should be exactly 300
      expect(mapping.yogaNode.getComputedHeight()).toBe(totalHeight);

      // BorderedContainer height should be 260
      const marginContainer = mapping.children[0];
      const borderedContainer = marginContainer.children[0];
      expect(borderedContainer.yogaNode.getComputedHeight()).toBe(expectedBorderHeight);

      freeYogaTree(mapping);
    });
  });

  describe('border alignment with margin', () => {
    it('should have right border end within border container width', () => {
      const margin = 20;
      const totalWidth = 500;
      const expectedBorderWidth = totalWidth - margin * 2; // 460

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Get the bordered container
      const marginContainer = mapping.children[0];
      const borderedContainer = marginContainer.children[0];

      // Get the content row (middle child of BorderedContainer)
      const contentRow = borderedContainer.children[1];

      // Get the right border (last child of content row)
      const rightBorder = contentRow.children[2];

      // Right border end position (relative to content row)
      const rightBorderEnd =
        rightBorder.yogaNode.getComputedLeft() + rightBorder.yogaNode.getComputedWidth();

      // Should end at the BorderedContainer's width (460)
      expect(rightBorderEnd).toBe(expectedBorderWidth);

      freeYogaTree(mapping);
    });

    it('should have corners aligned with vertical borders', () => {
      const margin = 20;
      const totalWidth = 500;

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      const marginContainer = mapping.children[0];
      const borderedContainer = marginContainer.children[0];
      const topRow = borderedContainer.children[0];
      const contentRow = borderedContainer.children[1];
      const bottomRow = borderedContainer.children[2];

      // Right corners/borders should all be at same X position
      const topRightX = topRow.children[2].yogaNode.getComputedLeft();
      const contentRightX = contentRow.children[2].yogaNode.getComputedLeft();
      const bottomRightX = bottomRow.children[2].yogaNode.getComputedLeft();

      expect(topRightX).toBe(contentRightX);
      expect(contentRightX).toBe(bottomRightX);

      // Left corners/borders should all be at position 0
      const topLeftX = topRow.children[0].yogaNode.getComputedLeft();
      const contentLeftX = contentRow.children[0].yogaNode.getComputedLeft();
      const bottomLeftX = bottomRow.children[0].yogaNode.getComputedLeft();

      expect(topLeftX).toBe(0);
      expect(contentLeftX).toBe(0);
      expect(bottomLeftX).toBe(0);

      freeYogaTree(mapping);
    });
  });

  describe('with padding', () => {
    it('should pass padding to BorderedContainer', () => {
      const result = baseLayout(
        {
          border: 'single',
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Total width should be 500
      expect(mapping.yogaNode.getComputedWidth()).toBe(500);

      // Get content stack inside BorderedContainer (no margin, so BorderedContainer is direct child)
      const borderedContainer = mapping;
      const contentRow = borderedContainer.children[1];
      const contentStack = contentRow.children[1];

      // Content stack should have padding applied
      // Width = 500 - borders(72) = 428
      expect(contentStack.yogaNode.getComputedWidth()).toBe(428);

      freeYogaTree(mapping);
    });

    it('should apply padding inside border when both margin and padding specified', () => {
      const margin = 20;
      const padding = { top: 10, right: 20, bottom: 10, left: 20 };
      const totalWidth = 500;

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          padding: padding,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Total width should be 500
      expect(mapping.yogaNode.getComputedWidth()).toBe(totalWidth);

      // Border width = 500 - 40 (margins) = 460
      const marginContainer = mapping.children[0];
      const borderedContainer = marginContainer.children[0];
      expect(borderedContainer.yogaNode.getComputedWidth()).toBe(460);

      // Content stack width = 460 - 72 (border thickness) = 388
      const contentRow = borderedContainer.children[1];
      const contentStack = contentRow.children[1];
      expect(contentStack.yogaNode.getComputedWidth()).toBe(388);

      freeYogaTree(mapping);
    });
  });

  describe('style passthrough', () => {
    it('should pass non-layout styles to BorderedContainer', () => {
      const result = baseLayout(
        {
          border: 'single',
          margin: 20,
          style: { width: 500, cpi: 12, bold: true },
        },
        Text({ children: 'Content' })
      );

      // Outer Stack should have width but no margin
      const outerStack = result as StackNode;
      expect(outerStack.width).toBe(500);
      expect(outerStack.margin).toBeUndefined();

      // Margin Stack (child 0)
      const marginStack = outerStack.children[0] as StackNode;
      expect(marginStack.margin).toBe(20);

      // BorderedContainer (child 0 of margin stack) should have the style properties
      const borderedContainer = marginStack.children[0] as StackNode;
      expect(borderedContainer.cpi).toBe(12);
      expect(borderedContainer.bold).toBe(true);
    });
  });

  describe('percentage widths with margin', () => {
    it('should handle percentage width with margin', () => {
      const result = baseLayout(
        {
          border: 'single',
          margin: 20,
          style: { width: '50%' },
        },
        Text({ children: 'Content' })
      );

      // Outer Stack should have percentage width
      const outerStack = result as StackNode;
      expect(outerStack.width).toBe('50%');
      expect(outerStack.margin).toBeUndefined();

      // Margin stack should have the margin
      const marginStack = outerStack.children[0] as StackNode;
      expect(marginStack.margin).toBe(20);
    });
  });

  describe('without width (auto-sizing)', () => {
    it('should work with margin but no explicit width', () => {
      const result = baseLayout(
        {
          border: 'single',
          margin: 20,
        },
        Text({ children: 'Content' })
      );

      // Should still create proper 3-layer structure
      expect(result.type).toBe('stack');
      const outerStack = result as StackNode;
      expect(outerStack.width).toBeUndefined();
      expect(outerStack.margin).toBeUndefined();

      // Margin Stack should have margin
      const marginStack = outerStack.children[0] as StackNode;
      expect(marginStack.margin).toBe(20);
      expect(marginStack.flexGrow).toBe(1);

      // BorderedContainer should have flexGrow to fill
      const borderedContainer = marginStack.children[0] as StackNode;
      expect(borderedContainer.flexGrow).toBe(1);
    });

    it('should size to content when no width specified and no margin', () => {
      const result = baseLayout(
        {
          border: 'single',
        },
        Text({ children: 'Test' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(undefined, undefined);

      // Should size to content + border
      const computedWidth = mapping.yogaNode.getComputedWidth();
      expect(computedWidth).toBeGreaterThan(BORDER_THICKNESS_HORIZONTAL);

      freeYogaTree(mapping);
    });
  });

  describe('edge cases', () => {
    it('should handle zero margin', () => {
      const result = baseLayout(
        {
          border: 'single',
          margin: 0,
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      // With zero margin, should still create 3-layer structure (margin is truthy check is 0)
      // Actually 0 is falsy, so this should behave like no margin
      expect(result.type).toBe('stack');
      const outerStack = result as StackNode;
      expect(outerStack.width).toBe(500);
    });

    it('should handle border: false with margin', () => {
      const result = baseLayout(
        {
          border: false,
          margin: 20,
          style: { width: 500 },
        },
        Text({ children: 'Content' })
      );

      // Should be a simple Stack with margin (no border)
      expect(result.type).toBe('stack');
      const stack = result as StackNode;
      expect(stack.margin).toBe(20);
      expect(stack.width).toBe(500);
    });

    it('should handle different border variants with margin', () => {
      const variants: Array<'single' | 'double' | 'ascii'> = ['single', 'double', 'ascii'];
      const margin = 20;
      const totalWidth = 500;
      const expectedBorderWidth = totalWidth - margin * 2; // 460

      for (const variant of variants) {
        const result = baseLayout(
          {
            border: variant,
            margin: margin,
            style: { width: totalWidth },
          },
          Text({ children: 'Content' })
        );

        const mapping = buildYogaTree(Yoga, result, ctx);
        mapping.yogaNode.calculateLayout(1000, undefined);

        // All variants should have same layout behavior
        expect(mapping.yogaNode.getComputedWidth()).toBe(totalWidth);

        const marginContainer = mapping.children[0];
        const borderedContainer = marginContainer.children[0];
        expect(borderedContainer.yogaNode.getComputedWidth()).toBe(expectedBorderWidth);

        freeYogaTree(mapping);
      }
    });
  });

  describe('regression tests', () => {
    it('should NOT overflow when border and margin are both specified', () => {
      // This is the key regression test for the bug:
      // Before the fix, border was drawn at full width, then margin added outside
      // causing total width to be (width + margins) instead of just width

      const margin = 20;
      const totalWidth = 500;

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // CRITICAL: Total width must be exactly 500, not 540 (500 + 20 + 20)
      const computedWidth = mapping.yogaNode.getComputedWidth();
      expect(computedWidth).toBe(totalWidth);
      expect(computedWidth).not.toBe(totalWidth + margin * 2);

      freeYogaTree(mapping);
    });

    it('should have border inside margin area, not at full width', () => {
      const margin = 20;
      const totalWidth = 500;
      const expectedBorderWidth = totalWidth - margin * 2; // 460

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: totalWidth },
        },
        Text({ children: 'Content' })
      );

      const mapping = buildYogaTree(Yoga, result, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      const marginContainer = mapping.children[0];
      const borderedContainer = marginContainer.children[0];
      const borderWidth = borderedContainer.yogaNode.getComputedWidth();

      // Border width should be 460, not 500
      expect(borderWidth).toBe(expectedBorderWidth);
      expect(borderWidth).not.toBe(totalWidth);

      freeYogaTree(mapping);
    });

    it('should maintain correct layout when placed in constrained parent', () => {
      // Simulate real-world usage: component placed in a layout
      const margin = 20;
      const componentWidth = 300;

      const result = baseLayout(
        {
          border: 'single',
          margin: margin,
          style: { width: componentWidth },
        },
        Text({ children: 'Content' })
      );

      // Wrap in a parent container (simulating Layout component)
      const parentLayout: LayoutNode = {
        type: 'stack',
        width: 1000,
        children: [result],
      };

      const mapping = buildYogaTree(Yoga, parentLayout, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);

      // Component should be 300 wide
      const component = mapping.children[0];
      expect(component.yogaNode.getComputedWidth()).toBe(componentWidth);

      // Border should be 260 wide (300 - 40)
      const marginContainer = component.children[0];
      const borderedContainer = marginContainer.children[0];
      expect(borderedContainer.yogaNode.getComputedWidth()).toBe(componentWidth - margin * 2);

      freeYogaTree(mapping);
    });
  });
});
