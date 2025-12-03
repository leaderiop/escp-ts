/**
 * Tests for BorderedContainer component
 *
 * Bug fix: Content stack in BorderedContainer was not shrinking properly when
 * the Card fills a constrained parent without explicit width. This caused the
 * right border to be positioned outside the card container.
 *
 * The fix adds flexShrink: 1 and minWidth: 0 to the content stack to allow
 * proper shrinking in flex contexts.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { loadYoga } from 'yoga-layout/load';
import type { Yoga } from 'yoga-layout/load';
import { BorderedContainer } from '../BorderedContainer';
import { buildYogaTree, freeYogaTree } from '../../../../layout/yoga/YogaNodeBuilder';
import { DEFAULT_STYLE } from '../../../../layout/nodes';
import type { YogaLayoutContext } from '../../../../layout/yoga/types';
import type { LayoutNode, StackNode } from '../../../../layout/nodes';
import { Text } from '../../content/Text';

let Yoga: Yoga;

beforeAll(async () => {
  Yoga = await loadYoga();
});

const ctx: YogaLayoutContext = {
  availableWidth: 500,
  availableHeight: 500,
  lineSpacing: 60,
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

describe('BorderedContainer content stack flex properties', () => {
  it('should have flexShrink: 1 on content stack to allow shrinking', () => {
    const container = BorderedContainer({
      border: { variant: 'cp437-single' },
      children: [Text({ children: 'Test content' })],
    });

    // BorderedContainer returns a Stack with 3 children (top, content row, bottom)
    const outerStack = container as StackNode;
    expect(outerStack.type).toBe('stack');
    expect(outerStack.children).toHaveLength(3);

    // Content row is the middle child (index 1) - it's a Flex
    const contentRow = outerStack.children[1] as StackNode;
    expect(contentRow.type).toBe('flex');

    // Content stack is the middle child of the content row (index 1)
    const contentStack = contentRow.children[1] as StackNode;
    expect(contentStack.type).toBe('stack');
    expect(contentStack.flexShrink).toBe(1);
  });

  it('should have minWidth: 0 on content stack to allow shrinking below content size', () => {
    const container = BorderedContainer({
      border: { variant: 'cp437-single' },
      children: [Text({ children: 'Test content' })],
    });

    const outerStack = container as StackNode;
    const contentRow = outerStack.children[1] as StackNode;
    const contentStack = contentRow.children[1] as StackNode;

    expect(contentStack.minWidth).toBe(0);
  });

  it('should have flexGrow: 1 on content stack to fill available space', () => {
    const container = BorderedContainer({
      border: { variant: 'cp437-single' },
      children: [Text({ children: 'Test content' })],
    });

    const outerStack = container as StackNode;
    const contentRow = outerStack.children[1] as StackNode;
    const contentStack = contentRow.children[1] as StackNode;

    expect(contentStack.flexGrow).toBe(1);
  });

  it('should constrain content within parent width when Card fills constrained parent', () => {
    // This simulates the test case:
    // <Stack style={{ width: 300 }}>
    //   <Card border="single">
    //     <CardContent><Text>Long content text</Text></CardContent>
    //   </Card>
    // </Stack>

    const container = BorderedContainer({
      border: { variant: 'cp437-single' },
      padding: { top: 5, right: 10, bottom: 5, left: 10 },
      children: [Text({ children: 'This is a very long content that should be constrained' })],
    });

    // Wrap in a parent Stack with fixed width (simulating the test case)
    const parentStack: LayoutNode = {
      type: 'stack',
      width: 300,
      children: [container],
    };

    const mapping = buildYogaTree(Yoga, parentStack, ctx);
    mapping.yogaNode.calculateLayout(300, undefined);

    // The parent should be 300 wide
    expect(mapping.yogaNode.getComputedWidth()).toBe(300);

    // The BorderedContainer (child 0) should also be 300 wide
    const borderedContainer = mapping.children[0];
    expect(borderedContainer.yogaNode.getComputedWidth()).toBe(300);

    // The content row (child 1 of bordered container) should fit within
    const contentRow = borderedContainer.children[1];
    expect(contentRow.yogaNode.getComputedWidth()).toBe(300);

    // The content stack (child 1 of content row) should be constrained
    // Total width 300 - left border (36) - right border (36) = 228
    const leftBorder = contentRow.children[0];
    const contentStack = contentRow.children[1];
    const rightBorder = contentRow.children[2];

    expect(leftBorder.yogaNode.getComputedWidth()).toBe(36);
    expect(rightBorder.yogaNode.getComputedWidth()).toBe(36);
    expect(contentStack.yogaNode.getComputedWidth()).toBe(228);

    freeYogaTree(mapping);
  });

  it('should keep right border inside container even when content overflows', () => {
    // This is the key regression test for the bug:
    // Before the fix, wide content would push the right border outside the container

    const container = BorderedContainer({
      border: { variant: 'cp437-single' },
      padding: { top: 5, right: 10, bottom: 5, left: 10 },
      children: [
        Text({
          children:
            'This is an extremely long text that would definitely overflow a 300 dot container if not properly constrained',
        }),
      ],
    });

    const parentStack: LayoutNode = {
      type: 'stack',
      width: 300,
      children: [container],
    };

    const mapping = buildYogaTree(Yoga, parentStack, ctx);
    mapping.yogaNode.calculateLayout(300, undefined);

    const borderedContainer = mapping.children[0];
    const contentRow = borderedContainer.children[1];

    // Get the computed positions
    const leftBorder = contentRow.children[0];
    const rightBorder = contentRow.children[2];

    const leftBorderX = leftBorder.yogaNode.getComputedLeft();
    const rightBorderX = rightBorder.yogaNode.getComputedLeft();
    const rightBorderWidth = rightBorder.yogaNode.getComputedWidth();

    // Right border should end at or before the container width (300)
    const rightBorderEnd = rightBorderX + rightBorderWidth;
    expect(rightBorderEnd).toBeLessThanOrEqual(300);

    // Right border should be at position: 300 - 36 = 264
    expect(rightBorderX).toBe(264);

    freeYogaTree(mapping);
  });

  it('should maintain consistent border positions between top/bottom rows and content row', () => {
    const container = BorderedContainer({
      border: { variant: 'cp437-single' },
      children: [Text({ children: 'Content' })],
    });

    const parentStack: LayoutNode = {
      type: 'stack',
      width: 300,
      children: [container],
    };

    const mapping = buildYogaTree(Yoga, parentStack, ctx);
    mapping.yogaNode.calculateLayout(300, undefined);

    const borderedContainer = mapping.children[0];
    const topRow = borderedContainer.children[0];
    const contentRow = borderedContainer.children[1];
    const bottomRow = borderedContainer.children[2];

    // Get right corner/border positions from each row
    const topRightCorner = topRow.children[2];
    const contentRightBorder = contentRow.children[2];
    const bottomRightCorner = bottomRow.children[2];

    const topRightX = topRightCorner.yogaNode.getComputedLeft();
    const contentRightX = contentRightBorder.yogaNode.getComputedLeft();
    const bottomRightX = bottomRightCorner.yogaNode.getComputedLeft();

    // All right borders should be at the same X position
    expect(contentRightX).toBe(topRightX);
    expect(contentRightX).toBe(bottomRightX);

    freeYogaTree(mapping);
  });
});

describe('BorderedContainer with explicit width', () => {
  it('should respect explicit width on BorderedContainer', () => {
    const container = BorderedContainer({
      width: 200,
      border: { variant: 'cp437-single' },
      children: [Text({ children: 'Content' })],
    });

    const mapping = buildYogaTree(Yoga, container as LayoutNode, ctx);
    mapping.yogaNode.calculateLayout(500, undefined);

    expect(mapping.yogaNode.getComputedWidth()).toBe(200);

    freeYogaTree(mapping);
  });

  it('should calculate content width correctly when explicit width is provided', () => {
    const container = BorderedContainer({
      width: 200,
      border: { variant: 'cp437-single' },
      padding: { top: 5, right: 10, bottom: 5, left: 10 },
      children: [Text({ children: 'Content' })],
    });

    const mapping = buildYogaTree(Yoga, container as LayoutNode, ctx);
    mapping.yogaNode.calculateLayout(500, undefined);

    const contentRow = mapping.children[1];
    const contentStack = contentRow.children[1];

    // Content width = 200 - 36 (left border) - 36 (right border) = 128
    expect(contentStack.yogaNode.getComputedWidth()).toBe(128);

    freeYogaTree(mapping);
  });
});
