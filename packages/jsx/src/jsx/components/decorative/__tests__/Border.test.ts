/**
 * Border component tests
 * TDD: Testing that CP437 presets use correct Unicode box-drawing characters
 * and border alignment (corners connect properly with horizontal/vertical lines)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { loadYoga } from 'yoga-layout/load';
import type { Yoga } from 'yoga-layout/load';
import { BORDER_PRESETS, Border } from '../Border';
import { UNICODE_BOX } from '@escp/core';
import type { LayoutNode } from '../../../../layout/nodes';
import { Text } from '../../content/Text';
import { Stack } from '../../layout/Stack';
import { buildYogaTree, freeYogaTree } from '../../../../layout/yoga/YogaNodeBuilder';
import { extractLayoutResult } from '../../../../layout/yoga/YogaResultExtractor';
import type { LayoutResult, YogaLayoutContext } from '../../../../layout/yoga/types';
import { resolveStyle } from '../../../../layout/nodes';

let Yoga: Yoga;

beforeAll(async () => {
  Yoga = await loadYoga();
});

/**
 * Find all layout results of a specific type by recursively searching the tree
 */
function findByType(result: LayoutResult, type: string): LayoutResult[] {
  const found: LayoutResult[] = [];
  if (result.node.type === type) {
    found.push(result);
  }
  for (const child of result.children) {
    found.push(...findByType(child, type));
  }
  return found;
}

/**
 * Find text nodes containing specific content
 */
function findTextByContent(result: LayoutResult, content: string): LayoutResult[] {
  const found: LayoutResult[] = [];
  if (result.node.type === 'text' && 'content' in result.node && result.node.content === content) {
    found.push(result);
  }
  for (const child of result.children) {
    found.push(...findTextByContent(child, content));
  }
  return found;
}

describe('Border component', () => {
  describe('BORDER_PRESETS', () => {
    describe('cp437-single preset', () => {
      it('should use correct Unicode single-line top-left corner (┌)', () => {
        expect(BORDER_PRESETS['cp437-single'].topLeft).toBe(UNICODE_BOX.SINGLE_TOP_LEFT);
        expect(BORDER_PRESETS['cp437-single'].topLeft).toBe('\u250C');
      });

      it('should use correct Unicode single-line top-right corner (┐)', () => {
        expect(BORDER_PRESETS['cp437-single'].topRight).toBe(UNICODE_BOX.SINGLE_TOP_RIGHT);
        expect(BORDER_PRESETS['cp437-single'].topRight).toBe('\u2510');
      });

      it('should use correct Unicode single-line bottom-left corner (└)', () => {
        expect(BORDER_PRESETS['cp437-single'].bottomLeft).toBe(UNICODE_BOX.SINGLE_BOTTOM_LEFT);
        expect(BORDER_PRESETS['cp437-single'].bottomLeft).toBe('\u2514');
      });

      it('should use correct Unicode single-line bottom-right corner (┘)', () => {
        expect(BORDER_PRESETS['cp437-single'].bottomRight).toBe(UNICODE_BOX.SINGLE_BOTTOM_RIGHT);
        expect(BORDER_PRESETS['cp437-single'].bottomRight).toBe('\u2518');
      });

      it('should use correct Unicode single-line horizontal (─)', () => {
        expect(BORDER_PRESETS['cp437-single'].horizontal).toBe(UNICODE_BOX.SINGLE_HORIZONTAL);
        expect(BORDER_PRESETS['cp437-single'].horizontal).toBe('\u2500');
      });

      it('should use correct Unicode single-line vertical (│)', () => {
        expect(BORDER_PRESETS['cp437-single'].vertical).toBe(UNICODE_BOX.SINGLE_VERTICAL);
        expect(BORDER_PRESETS['cp437-single'].vertical).toBe('\u2502');
      });
    });

    describe('cp437-double preset', () => {
      it('should use correct Unicode double-line top-left corner (╔)', () => {
        expect(BORDER_PRESETS['cp437-double'].topLeft).toBe(UNICODE_BOX.DOUBLE_TOP_LEFT);
        expect(BORDER_PRESETS['cp437-double'].topLeft).toBe('\u2554');
      });

      it('should use correct Unicode double-line top-right corner (╗)', () => {
        expect(BORDER_PRESETS['cp437-double'].topRight).toBe(UNICODE_BOX.DOUBLE_TOP_RIGHT);
        expect(BORDER_PRESETS['cp437-double'].topRight).toBe('\u2557');
      });

      it('should use correct Unicode double-line bottom-left corner (╚)', () => {
        expect(BORDER_PRESETS['cp437-double'].bottomLeft).toBe(UNICODE_BOX.DOUBLE_BOTTOM_LEFT);
        expect(BORDER_PRESETS['cp437-double'].bottomLeft).toBe('\u255A');
      });

      it('should use correct Unicode double-line bottom-right corner (╝)', () => {
        expect(BORDER_PRESETS['cp437-double'].bottomRight).toBe(UNICODE_BOX.DOUBLE_BOTTOM_RIGHT);
        expect(BORDER_PRESETS['cp437-double'].bottomRight).toBe('\u255D');
      });

      it('should use correct Unicode double-line horizontal (═)', () => {
        expect(BORDER_PRESETS['cp437-double'].horizontal).toBe(UNICODE_BOX.DOUBLE_HORIZONTAL);
        expect(BORDER_PRESETS['cp437-double'].horizontal).toBe('\u2550');
      });

      it('should use correct Unicode double-line vertical (║)', () => {
        expect(BORDER_PRESETS['cp437-double'].vertical).toBe(UNICODE_BOX.DOUBLE_VERTICAL);
        expect(BORDER_PRESETS['cp437-double'].vertical).toBe('\u2551');
      });
    });

    describe('character encoding bug detection', () => {
      it('should NOT produce accented characters from String.fromCharCode(CP437 bytes)', () => {
        // CP437_BOX.SINGLE_TOP_LEFT = 0xDA (218)
        // String.fromCharCode(218) = "Ú" (U with acute) - WRONG!
        // The correct character is "\u250C" (┌)
        const wrongChar = String.fromCharCode(0xda);
        expect(BORDER_PRESETS['cp437-single'].topLeft).not.toBe(wrongChar);
        expect(BORDER_PRESETS['cp437-single'].topLeft).not.toBe('Ú');
      });

      it('should produce visible box-drawing characters, not control characters', () => {
        // All box-drawing characters should be in the U+2500-U+257F range
        const singleChars = Object.values(BORDER_PRESETS['cp437-single']);
        for (const char of singleChars) {
          const code = char.charCodeAt(0);
          expect(code).toBeGreaterThanOrEqual(0x2500);
          expect(code).toBeLessThanOrEqual(0x257f);
        }
      });
    });
  });

  describe('Border layout structure', () => {
    // Helper to get children from a layout node
    function getChildren(node: LayoutNode): LayoutNode[] {
      return (node.children as LayoutNode[]) || [];
    }

    // Helper to find text content in a node
    function getTextContent(node: LayoutNode): string | undefined {
      if (node.type === 'text') {
        return node.content;
      }
      return undefined;
    }

    it('should create a valid border structure with 3 rows', () => {
      const border = Border({ variant: 'cp437-single', children: [] });

      expect(border.type).toBe('stack');
      const rows = getChildren(border);
      expect(rows.length).toBe(3); // top, middle, bottom
    });

    describe('corner elements should have flexShrink: 0 to prevent being squeezed', () => {
      it('top-left corner should not shrink', () => {
        const border = Border({ variant: 'cp437-single', children: [] });
        const rows = getChildren(border);
        const topRow = rows[0]!;

        expect(topRow.type).toBe('flex');
        const topRowChildren = getChildren(topRow);

        // First child should be the top-left corner text
        const topLeftCorner = topRowChildren[0]!;
        expect(topLeftCorner.type).toBe('text');
        expect(getTextContent(topLeftCorner)).toBe(UNICODE_BOX.SINGLE_TOP_LEFT);
        // flexShrink is a node-level property, not inside style
        expect((topLeftCorner as { flexShrink?: number }).flexShrink).toBe(0);
      });

      it('top-right corner should not shrink', () => {
        const border = Border({ variant: 'cp437-single', children: [] });
        const rows = getChildren(border);
        const topRow = rows[0]!;
        const topRowChildren = getChildren(topRow);

        // Last child should be the top-right corner text
        const topRightCorner = topRowChildren[topRowChildren.length - 1]!;
        expect(topRightCorner.type).toBe('text');
        expect(getTextContent(topRightCorner)).toBe(UNICODE_BOX.SINGLE_TOP_RIGHT);
        expect((topRightCorner as { flexShrink?: number }).flexShrink).toBe(0);
      });

      it('bottom-left corner should not shrink', () => {
        const border = Border({ variant: 'cp437-single', children: [] });
        const rows = getChildren(border);
        const bottomRow = rows[2]!;

        expect(bottomRow.type).toBe('flex');
        const bottomRowChildren = getChildren(bottomRow);

        // First child should be the bottom-left corner text
        const bottomLeftCorner = bottomRowChildren[0]!;
        expect(bottomLeftCorner.type).toBe('text');
        expect(getTextContent(bottomLeftCorner)).toBe(UNICODE_BOX.SINGLE_BOTTOM_LEFT);
        expect((bottomLeftCorner as { flexShrink?: number }).flexShrink).toBe(0);
      });

      it('bottom-right corner should not shrink', () => {
        const border = Border({ variant: 'cp437-single', children: [] });
        const rows = getChildren(border);
        const bottomRow = rows[2]!;
        const bottomRowChildren = getChildren(bottomRow);

        // Last child should be the bottom-right corner text
        const bottomRightCorner = bottomRowChildren[bottomRowChildren.length - 1]!;
        expect(bottomRightCorner.type).toBe('text');
        expect(getTextContent(bottomRightCorner)).toBe(UNICODE_BOX.SINGLE_BOTTOM_RIGHT);
        expect((bottomRightCorner as { flexShrink?: number }).flexShrink).toBe(0);
      });
    });

    describe('horizontal lines fill space in border rows', () => {
      it('top row should have Line directly in Flex (fills remaining space)', () => {
        const border = Border({ variant: 'cp437-single', children: [] });
        const rows = getChildren(border);
        const topRow = rows[0]!;
        const topRowChildren = getChildren(topRow);

        // Structure: [corner, line, corner]
        expect(topRowChildren.length).toBe(3);

        // Middle element should be a Line directly (not wrapped)
        const middleElement = topRowChildren[1]!;
        expect(middleElement.type).toBe('line');
      });

      it('bottom row should have Line directly in Flex (fills remaining space)', () => {
        const border = Border({ variant: 'cp437-single', children: [] });
        const rows = getChildren(border);
        const bottomRow = rows[2]!;
        const bottomRowChildren = getChildren(bottomRow);

        // Structure: [corner, line, corner]
        expect(bottomRowChildren.length).toBe(3);

        // Middle element should be a Line directly (not wrapped)
        const middleElement = bottomRowChildren[1]!;
        expect(middleElement.type).toBe('line');
      });
    });
  });

  describe('Border alignment (Yoga layout)', () => {
    it('should align corners with horizontal lines in fixed-width container', () => {
      // Create a border with simple content in a fixed-width container
      const content = Stack({
        children: [Text({ children: 'Test content' })],
      });

      const layout = Stack({
        width: 300,
        children: [Border({ variant: 'cp437-single', children: content })],
      });

      const ctx: YogaLayoutContext = {
        availableWidth: 300,
        lineSpacing: 60,
        style: resolveStyle({}, {}),
      };

      const mapping = buildYogaTree(Yoga, layout, ctx);
      mapping.yogaNode.calculateLayout(300, undefined);
      const result = extractLayoutResult(mapping);

      // Find corner characters - ┌ (0x250c) and ┐ (0x2510)
      const topLeftCorners = findTextByContent(result, '┌');
      const topRightCorners = findTextByContent(result, '┐');

      expect(topLeftCorners.length).toBeGreaterThan(0);
      expect(topRightCorners.length).toBeGreaterThan(0);

      const topLeft = topLeftCorners[0]!;
      const topRight = topRightCorners[0]!;

      // Find horizontal lines
      const lines = findByType(result, 'line');
      expect(lines.length).toBeGreaterThan(0);

      const horizontalLine = lines[0]!;

      // The top-right corner should be positioned immediately after the horizontal line
      // Expected: topLeft.x + topLeft.width + horizontalLine.width = topRight.x
      const cornerWidth = topLeft.width;
      const expectedRightX = topLeft.x + cornerWidth + horizontalLine.width;

      // Allow small tolerance for rounding
      expect(Math.abs(topRight.x - expectedRightX)).toBeLessThan(5);

      freeYogaTree(mapping);
    });

    it('should have consistent border width across top, content, and bottom rows', () => {
      const content = Stack({
        children: [Text({ children: 'Test content' })],
      });

      const layout = Stack({
        width: 400,
        children: [Border({ variant: 'cp437-single', children: content })],
      });

      const ctx: YogaLayoutContext = {
        availableWidth: 400,
        lineSpacing: 60,
        style: resolveStyle({}, {}),
      };

      const mapping = buildYogaTree(Yoga, layout, ctx);
      mapping.yogaNode.calculateLayout(400, undefined);
      const result = extractLayoutResult(mapping);

      // Find all corners
      const topLeftCorners = findTextByContent(result, '┌');
      const topRightCorners = findTextByContent(result, '┐');
      const bottomLeftCorners = findTextByContent(result, '└');
      const bottomRightCorners = findTextByContent(result, '┘');

      expect(topLeftCorners.length).toBeGreaterThan(0);
      expect(topRightCorners.length).toBeGreaterThan(0);
      expect(bottomLeftCorners.length).toBeGreaterThan(0);
      expect(bottomRightCorners.length).toBeGreaterThan(0);

      const topLeft = topLeftCorners[0]!;
      const topRight = topRightCorners[0]!;
      const bottomLeft = bottomLeftCorners[0]!;
      const bottomRight = bottomRightCorners[0]!;

      // All left corners should have the same X position
      expect(topLeft.x).toBe(bottomLeft.x);

      // All right corners should have the same X position
      expect(topRight.x).toBe(bottomRight.x);

      // The border width should be consistent
      const topBorderWidth = topRight.x + topRight.width - topLeft.x;
      const bottomBorderWidth = bottomRight.x + bottomRight.width - bottomLeft.x;

      expect(topBorderWidth).toBe(bottomBorderWidth);

      freeYogaTree(mapping);
    });

    it('should align borders correctly without explicit width constraint', () => {
      // After fix: borders should align even without explicit width constraint
      const content = Stack({
        children: [Text({ children: 'Test content' })],
      });

      // No explicit width - should still align properly
      const layout = Border({ variant: 'cp437-single', children: content });

      const ctx: YogaLayoutContext = {
        availableWidth: 1000, // Simulating page width
        lineSpacing: 60,
        style: resolveStyle({}, {}),
      };

      const mapping = buildYogaTree(Yoga, layout, ctx);
      mapping.yogaNode.calculateLayout(1000, undefined);
      const result = extractLayoutResult(mapping);

      // Find corners
      const topLeftCorners = findTextByContent(result, '┌');
      const topRightCorners = findTextByContent(result, '┐');

      expect(topLeftCorners.length).toBeGreaterThan(0);
      expect(topRightCorners.length).toBeGreaterThan(0);

      const topLeft = topLeftCorners[0]!;
      const topRight = topRightCorners[0]!;

      // Find the horizontal line
      const lines = findByType(result, 'line');
      expect(lines.length).toBeGreaterThan(0);

      const horizontalLine = lines[0]!;

      // Calculate where the right corner SHOULD be
      const cornerWidth = topLeft.width;
      const expectedRightX = topLeft.x + cornerWidth + horizontalLine.width;

      // Calculate the actual gap between expected and actual position
      const actualGap = Math.abs(topRight.x - expectedRightX);

      // After fix: gap should be essentially 0 (allow small tolerance for rounding)
      expect(actualGap).toBeLessThan(5);

      freeYogaTree(mapping);
    });
  });

  describe('Border with multi-line content (continuous vertical borders)', () => {
    it('should have vertical lines spanning the full content height', () => {
      // Create content with multiple lines (simulating multi-line card content)
      const content = Stack({
        children: [
          Text({ children: 'Line 1' }),
          Text({ children: 'Line 2' }),
          Text({ children: 'Line 3' }),
        ],
      });

      const layout = Stack({
        width: 400,
        children: [Border({ variant: 'cp437-single', children: content })],
      });

      const ctx: YogaLayoutContext = {
        availableWidth: 400,
        lineSpacing: 60, // 60 dots per line
        style: resolveStyle({}, {}),
      };

      const mapping = buildYogaTree(Yoga, layout, ctx);
      mapping.yogaNode.calculateLayout(400, undefined);
      const result = extractLayoutResult(mapping);

      // Find vertical lines in the layout
      const allLines = findByType(result, 'line');
      const verticalLines = allLines.filter((l) => {
        const node = l.node as import('../../../../layout/nodes').LineNode;
        return node.direction === 'vertical';
      });

      // There should be vertical lines for the left and right borders
      // Currently failing: the Border component uses single Text characters, not Line components
      expect(verticalLines.length).toBeGreaterThanOrEqual(2);

      // Each vertical line should span the full height of the content area
      // Content height = 3 lines * lineSpacing = 180 dots
      const expectedMinHeight = 3 * 60; // 180 dots

      for (const vLine of verticalLines) {
        expect(vLine.height).toBeGreaterThanOrEqual(expectedMinHeight);
      }

      freeYogaTree(mapping);
    });

    it('should have left vertical border aligned with left corners', () => {
      const content = Stack({
        children: [Text({ children: 'Line 1' }), Text({ children: 'Line 2' })],
      });

      const layout = Stack({
        width: 300,
        children: [Border({ variant: 'cp437-single', children: content })],
      });

      const ctx: YogaLayoutContext = {
        availableWidth: 300,
        lineSpacing: 60,
        style: resolveStyle({}, {}),
      };

      const mapping = buildYogaTree(Yoga, layout, ctx);
      mapping.yogaNode.calculateLayout(300, undefined);
      const result = extractLayoutResult(mapping);

      // Find corners and vertical lines
      const topLeftCorners = findTextByContent(result, '┌');
      const bottomLeftCorners = findTextByContent(result, '└');

      expect(topLeftCorners.length).toBeGreaterThan(0);
      expect(bottomLeftCorners.length).toBeGreaterThan(0);

      const topLeft = topLeftCorners[0]!;
      const bottomLeft = bottomLeftCorners[0]!;

      // Find left vertical line
      const allLines = findByType(result, 'line');
      const verticalLines = allLines.filter((l) => {
        const node = l.node as import('../../../../layout/nodes').LineNode;
        return node.direction === 'vertical';
      });

      // Should have at least one vertical line on the left
      const leftVertical = verticalLines.find((l) => Math.abs(l.x - topLeft.x) < 5);
      expect(leftVertical).toBeDefined();

      // The vertical line should:
      // 1. Start after the top-left corner (y position)
      // 2. End before the bottom-left corner (y position)
      // 3. Have same X position as the corners
      if (leftVertical) {
        expect(Math.abs(leftVertical.x - topLeft.x)).toBeLessThan(5);
        expect(leftVertical.y).toBeGreaterThanOrEqual(topLeft.y + topLeft.height);
        expect(leftVertical.y + leftVertical.height).toBeLessThanOrEqual(bottomLeft.y + 5);
      }

      freeYogaTree(mapping);
    });

    it('should have right vertical border aligned with right corners', () => {
      const content = Stack({
        children: [Text({ children: 'Line 1' }), Text({ children: 'Line 2' })],
      });

      const layout = Stack({
        width: 300,
        children: [Border({ variant: 'cp437-single', children: content })],
      });

      const ctx: YogaLayoutContext = {
        availableWidth: 300,
        lineSpacing: 60,
        style: resolveStyle({}, {}),
      };

      const mapping = buildYogaTree(Yoga, layout, ctx);
      mapping.yogaNode.calculateLayout(300, undefined);
      const result = extractLayoutResult(mapping);

      // Find corners
      const topRightCorners = findTextByContent(result, '┐');
      const bottomRightCorners = findTextByContent(result, '┘');

      expect(topRightCorners.length).toBeGreaterThan(0);
      expect(bottomRightCorners.length).toBeGreaterThan(0);

      const topRight = topRightCorners[0]!;

      // Find right vertical line
      const allLines = findByType(result, 'line');
      const verticalLines = allLines.filter((l) => {
        const node = l.node as import('../../../../layout/nodes').LineNode;
        return node.direction === 'vertical';
      });

      // The right vertical line should be positioned on the right side
      // It should be at the same X as the right corner (both start at the right edge)
      // Note: Since the vertical line has width (lineSpacing), we look for lines
      // that are near the right edge of the container
      const containerWidth = 300;
      const lineWidth = ctx.lineSpacing; // 60 dots

      // Find the rightmost vertical line
      const sortedByX = [...verticalLines].sort((a, b) => b.x - a.x);
      expect(sortedByX.length).toBeGreaterThanOrEqual(2); // Should have left and right borders

      // Right vertical should be near the right side
      const rightVertical = sortedByX[0];
      expect(rightVertical).toBeDefined();

      // The right vertical line's X position should be aligned with the right corner's X
      // Both should be at the same horizontal position
      // Note: The line width equals lineSpacing (60), so we allow up to that tolerance
      if (rightVertical) {
        expect(Math.abs(rightVertical.x - topRight.x)).toBeLessThanOrEqual(lineWidth);
      }

      freeYogaTree(mapping);
    });

    it('content row should use vertical Line components, not single Text characters', () => {
      const border = Border({ variant: 'cp437-single', children: [] });

      // Get the middle row (content row)
      const rows = (border as { children: LayoutNode[] }).children;
      expect(rows.length).toBe(3);

      const contentRow = rows[1]!;
      expect(contentRow.type).toBe('flex');

      const contentRowChildren = (contentRow as { children: LayoutNode[] }).children;

      // The first and last elements should be vertical Lines, not Text
      // This is the key change: using Line with direction='vertical' instead of single Text chars
      const leftBorder = contentRowChildren[0]!;
      const rightBorder = contentRowChildren[contentRowChildren.length - 1]!;

      // Currently failing: Border uses Text({ children: chars.vertical }) instead of Line
      expect(leftBorder.type).toBe('line');
      expect(rightBorder.type).toBe('line');

      // Verify they are vertical lines
      if (leftBorder.type === 'line') {
        expect((leftBorder as { direction: string }).direction).toBe('vertical');
      }
      if (rightBorder.type === 'line') {
        expect((rightBorder as { direction: string }).direction).toBe('vertical');
      }
    });
  });
});
