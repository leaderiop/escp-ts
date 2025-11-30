/**
 * Tests for YogaResultExtractor
 *
 * These tests cover the extraction of layout results from computed Yoga nodes
 * and conversion to the escp-ts LayoutResult format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractLayoutResult,
  calculateTotalHeight,
  calculateTotalWidth,
} from '../YogaResultExtractor';
import { DEFAULT_STYLE } from '../../nodes';
import type { NodeMapping, LayoutResult } from '../types';
import type {
  LayoutNode,
  TextNode,
  LineNode,
  SpacerNode,
  StackNode,
  FlexNode,
  ResolvedStyle,
  ResolvedPadding,
  ResolvedMargin,
} from '../../nodes';

// ==================== MOCK YOGA NODE FACTORY ====================

/**
 * Creates a mock Yoga node with specified computed values
 */
function createMockYogaNode(
  computedLeft: number,
  computedTop: number,
  computedWidth: number,
  computedHeight: number
) {
  return {
    getComputedLeft: vi.fn().mockReturnValue(computedLeft),
    getComputedTop: vi.fn().mockReturnValue(computedTop),
    getComputedWidth: vi.fn().mockReturnValue(computedWidth),
    getComputedHeight: vi.fn().mockReturnValue(computedHeight),
  };
}

/**
 * Default padding and margin for mock nodes
 */
const defaultPadding: ResolvedPadding = { top: 0, right: 0, bottom: 0, left: 0 };
const defaultMargin: ResolvedMargin = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Creates a NodeMapping for a text node
 */
function createTextNodeMapping(
  content: string,
  computed: { left: number; top: number; width: number; height: number },
  options: {
    position?: 'static' | 'relative' | 'absolute';
    offsetX?: number;
    offsetY?: number;
    shouldClipText?: boolean;
    style?: ResolvedStyle;
  } = {}
): NodeMapping {
  const textNode: TextNode = {
    type: 'text',
    content,
    position: options.position,
    offsetX: options.offsetX,
    offsetY: options.offsetY,
  };

  return {
    node: textNode,
    yogaNode: createMockYogaNode(
      computed.left,
      computed.top,
      computed.width,
      computed.height
    ) as any,
    children: [],
    resolvedStyle: options.style ?? DEFAULT_STYLE,
    padding: defaultPadding,
    margin: defaultMargin,
    shouldClipText: options.shouldClipText,
  };
}

/**
 * Creates a NodeMapping for a line node
 */
function createLineNodeMapping(
  direction: 'horizontal' | 'vertical',
  computed: { left: number; top: number; width: number; height: number },
  options: { style?: ResolvedStyle } = {}
): NodeMapping {
  const lineNode: LineNode = {
    type: 'line',
    direction,
  };

  return {
    node: lineNode,
    yogaNode: createMockYogaNode(
      computed.left,
      computed.top,
      computed.width,
      computed.height
    ) as any,
    children: [],
    resolvedStyle: options.style ?? DEFAULT_STYLE,
    padding: defaultPadding,
    margin: defaultMargin,
  };
}

/**
 * Creates a NodeMapping for a spacer node
 */
function createSpacerNodeMapping(
  computed: { left: number; top: number; width: number; height: number },
  options: { flex?: boolean; width?: number; height?: number } = {}
): NodeMapping {
  const spacerNode: SpacerNode = {
    type: 'spacer',
    width: options.width,
    height: options.height,
    flex: options.flex,
  };

  return {
    node: spacerNode,
    yogaNode: createMockYogaNode(
      computed.left,
      computed.top,
      computed.width,
      computed.height
    ) as any,
    children: [],
    resolvedStyle: DEFAULT_STYLE,
    padding: defaultPadding,
    margin: defaultMargin,
  };
}

/**
 * Creates a NodeMapping for a stack node
 */
function createStackNodeMapping(
  computed: { left: number; top: number; width: number; height: number },
  childMappings: NodeMapping[],
  options: {
    direction?: 'column' | 'row';
    position?: 'static' | 'relative' | 'absolute';
    offsetX?: number;
    offsetY?: number;
    style?: ResolvedStyle;
  } = {}
): NodeMapping {
  const stackNode: StackNode = {
    type: 'stack',
    direction: options.direction ?? 'column',
    children: childMappings.map((m) => m.node),
    position: options.position,
    offsetX: options.offsetX,
    offsetY: options.offsetY,
  };

  return {
    node: stackNode,
    yogaNode: createMockYogaNode(
      computed.left,
      computed.top,
      computed.width,
      computed.height
    ) as any,
    children: childMappings,
    resolvedStyle: options.style ?? DEFAULT_STYLE,
    padding: defaultPadding,
    margin: defaultMargin,
  };
}

/**
 * Creates a NodeMapping for a flex node
 */
function createFlexNodeMapping(
  computed: { left: number; top: number; width: number; height: number },
  childMappings: NodeMapping[],
  options: {
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'top' | 'center' | 'bottom';
    position?: 'static' | 'relative' | 'absolute';
    offsetX?: number;
    offsetY?: number;
    style?: ResolvedStyle;
  } = {}
): NodeMapping {
  const flexNode: FlexNode = {
    type: 'flex',
    justify: options.justify,
    alignItems: options.alignItems,
    children: childMappings.map((m) => m.node),
    position: options.position,
    offsetX: options.offsetX,
    offsetY: options.offsetY,
  };

  return {
    node: flexNode,
    yogaNode: createMockYogaNode(
      computed.left,
      computed.top,
      computed.width,
      computed.height
    ) as any,
    children: childMappings,
    resolvedStyle: options.style ?? DEFAULT_STYLE,
    padding: defaultPadding,
    margin: defaultMargin,
  };
}

// ==================== TESTS ====================

describe('YogaResultExtractor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractLayoutResult', () => {
    describe('Text nodes', () => {
      it('should extract position and dimensions for text node', () => {
        const mapping = createTextNodeMapping('Hello World', {
          left: 10,
          top: 20,
          width: 100,
          height: 24,
        });

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(10);
        expect(result.y).toBe(20);
        expect(result.width).toBe(100);
        expect(result.height).toBe(24);
        expect(result.node).toBe(mapping.node);
        expect(result.children).toEqual([]);
      });

      it('should apply parent offset to text node position', () => {
        const mapping = createTextNodeMapping('Offset Text', {
          left: 5,
          top: 10,
          width: 80,
          height: 24,
        });

        const result = extractLayoutResult(mapping, 100, 50);

        expect(result.x).toBe(105); // 100 + 5
        expect(result.y).toBe(60); // 50 + 10
      });

      it('should include resolved style in result', () => {
        const customStyle: ResolvedStyle = {
          ...DEFAULT_STYLE,
          bold: true,
          italic: true,
          cpi: 12,
        };

        const mapping = createTextNodeMapping(
          'Styled Text',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          { style: customStyle }
        );

        const result = extractLayoutResult(mapping);

        expect(result.style).toBe(customStyle);
        expect(result.style.bold).toBe(true);
        expect(result.style.italic).toBe(true);
        expect(result.style.cpi).toBe(12);
      });

      it('should set isWidthConstrained when shouldClipText is true', () => {
        const mapping = createTextNodeMapping(
          'Clipped Text',
          {
            left: 0,
            top: 0,
            width: 50,
            height: 24,
          },
          { shouldClipText: true }
        );

        const result = extractLayoutResult(mapping);

        expect(result.isWidthConstrained).toBe(true);
      });

      it('should set isWidthConstrained to false when shouldClipText is false', () => {
        const mapping = createTextNodeMapping(
          'Unclipped Text',
          {
            left: 0,
            top: 0,
            width: 50,
            height: 24,
          },
          { shouldClipText: false }
        );

        const result = extractLayoutResult(mapping);

        expect(result.isWidthConstrained).toBe(false);
      });

      it('should not set isWidthConstrained when shouldClipText is undefined', () => {
        const mapping = createTextNodeMapping('Default Text', {
          left: 0,
          top: 0,
          width: 50,
          height: 24,
        });

        const result = extractLayoutResult(mapping);

        expect(result.isWidthConstrained).toBeUndefined();
      });
    });

    describe('Line nodes', () => {
      it('should extract horizontal line dimensions', () => {
        const mapping = createLineNodeMapping('horizontal', {
          left: 0,
          top: 50,
          width: 200,
          height: 1,
        });

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(0);
        expect(result.y).toBe(50);
        expect(result.width).toBe(200);
        expect(result.height).toBe(1);
        expect((result.node as LineNode).direction).toBe('horizontal');
      });

      it('should extract vertical line dimensions', () => {
        const mapping = createLineNodeMapping('vertical', {
          left: 100,
          top: 0,
          width: 1,
          height: 150,
        });

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(100);
        expect(result.y).toBe(0);
        expect(result.width).toBe(1);
        expect(result.height).toBe(150);
        expect((result.node as LineNode).direction).toBe('vertical');
      });
    });

    describe('Spacer nodes', () => {
      it('should extract spacer with fixed dimensions', () => {
        const mapping = createSpacerNodeMapping(
          {
            left: 0,
            top: 0,
            width: 20,
            height: 10,
          },
          { width: 20, height: 10 }
        );

        const result = extractLayoutResult(mapping);

        expect(result.width).toBe(20);
        expect(result.height).toBe(10);
        expect((result.node as SpacerNode).type).toBe('spacer');
      });

      it('should extract flex spacer dimensions', () => {
        const mapping = createSpacerNodeMapping(
          {
            left: 50,
            top: 0,
            width: 100,
            height: 24,
          },
          { flex: true }
        );

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(50);
        expect(result.width).toBe(100);
        expect((result.node as SpacerNode).flex).toBe(true);
      });
    });

    describe('Container nodes - Stack', () => {
      it('should extract stack with children', () => {
        const child1 = createTextNodeMapping('First', {
          left: 0,
          top: 0,
          width: 100,
          height: 24,
        });
        const child2 = createTextNodeMapping('Second', {
          left: 0,
          top: 24,
          width: 100,
          height: 24,
        });

        const mapping = createStackNodeMapping({ left: 10, top: 10, width: 100, height: 48 }, [
          child1,
          child2,
        ]);

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(10);
        expect(result.y).toBe(10);
        expect(result.width).toBe(100);
        expect(result.height).toBe(48);
        expect(result.children).toHaveLength(2);
      });

      it('should calculate absolute positions for children', () => {
        const child1 = createTextNodeMapping('First', {
          left: 5,
          top: 5,
          width: 90,
          height: 24,
        });
        const child2 = createTextNodeMapping('Second', {
          left: 5,
          top: 34,
          width: 90,
          height: 24,
        });

        const mapping = createStackNodeMapping({ left: 20, top: 30, width: 100, height: 63 }, [
          child1,
          child2,
        ]);

        const result = extractLayoutResult(mapping);

        // Children should have absolute positions (parent + child offset)
        expect(result.children[0].x).toBe(25); // 20 + 5
        expect(result.children[0].y).toBe(35); // 30 + 5
        expect(result.children[1].x).toBe(25); // 20 + 5
        expect(result.children[1].y).toBe(64); // 30 + 34
      });

      it('should handle row direction stack', () => {
        const child1 = createTextNodeMapping('Left', {
          left: 0,
          top: 0,
          width: 50,
          height: 24,
        });
        const child2 = createTextNodeMapping('Right', {
          left: 50,
          top: 0,
          width: 50,
          height: 24,
        });

        const mapping = createStackNodeMapping(
          { left: 0, top: 0, width: 100, height: 24 },
          [child1, child2],
          { direction: 'row' }
        );

        const result = extractLayoutResult(mapping);

        expect((result.node as StackNode).direction).toBe('row');
        expect(result.children[0].x).toBe(0);
        expect(result.children[1].x).toBe(50);
      });

      it('should handle empty children array', () => {
        const mapping = createStackNodeMapping({ left: 0, top: 0, width: 100, height: 0 }, []);

        const result = extractLayoutResult(mapping);

        expect(result.children).toEqual([]);
        expect(result.height).toBe(0);
      });
    });

    describe('Container nodes - Flex', () => {
      it('should extract flex with children', () => {
        const child1 = createTextNodeMapping('Left', {
          left: 0,
          top: 0,
          width: 50,
          height: 24,
        });
        const spacer = createSpacerNodeMapping(
          {
            left: 50,
            top: 0,
            width: 100,
            height: 24,
          },
          { flex: true }
        );
        const child2 = createTextNodeMapping('Right', {
          left: 150,
          top: 0,
          width: 50,
          height: 24,
        });

        const mapping = createFlexNodeMapping(
          { left: 0, top: 0, width: 200, height: 24 },
          [child1, spacer, child2],
          { justify: 'space-between' }
        );

        const result = extractLayoutResult(mapping);

        expect(result.width).toBe(200);
        expect(result.children).toHaveLength(3);
        expect(result.children[0].x).toBe(0);
        expect(result.children[1].x).toBe(50);
        expect(result.children[2].x).toBe(150);
      });

      it('should handle empty flex children', () => {
        const mapping = createFlexNodeMapping({ left: 0, top: 0, width: 200, height: 0 }, []);

        const result = extractLayoutResult(mapping);

        expect(result.children).toEqual([]);
      });
    });

    describe('Nested containers', () => {
      it('should handle stack inside flex', () => {
        const innerChild1 = createTextNodeMapping('Inner 1', {
          left: 0,
          top: 0,
          width: 80,
          height: 24,
        });
        const innerChild2 = createTextNodeMapping('Inner 2', {
          left: 0,
          top: 24,
          width: 80,
          height: 24,
        });

        const innerStack = createStackNodeMapping({ left: 0, top: 0, width: 80, height: 48 }, [
          innerChild1,
          innerChild2,
        ]);

        const otherChild = createTextNodeMapping('Other', {
          left: 100,
          top: 0,
          width: 100,
          height: 24,
        });

        const outerFlex = createFlexNodeMapping({ left: 10, top: 10, width: 200, height: 48 }, [
          innerStack,
          otherChild,
        ]);

        const result = extractLayoutResult(outerFlex);

        expect(result.children).toHaveLength(2);
        expect(result.children[0].children).toHaveLength(2);

        // Inner stack children should have correct absolute positions
        expect(result.children[0].children[0].x).toBe(10); // 10 + 0 + 0
        expect(result.children[0].children[0].y).toBe(10); // 10 + 0 + 0
        expect(result.children[0].children[1].x).toBe(10); // 10 + 0 + 0
        expect(result.children[0].children[1].y).toBe(34); // 10 + 0 + 24
      });

      it('should handle flex inside stack', () => {
        const flexChild1 = createTextNodeMapping('Flex 1', {
          left: 0,
          top: 0,
          width: 50,
          height: 24,
        });
        const flexChild2 = createTextNodeMapping('Flex 2', {
          left: 50,
          top: 0,
          width: 50,
          height: 24,
        });

        const innerFlex = createFlexNodeMapping({ left: 0, top: 0, width: 100, height: 24 }, [
          flexChild1,
          flexChild2,
        ]);

        const textChild = createTextNodeMapping('Below', {
          left: 0,
          top: 30,
          width: 100,
          height: 24,
        });

        const outerStack = createStackNodeMapping({ left: 20, top: 20, width: 100, height: 54 }, [
          innerFlex,
          textChild,
        ]);

        const result = extractLayoutResult(outerStack);

        expect(result.children).toHaveLength(2);
        expect(result.children[0].children).toHaveLength(2);

        // Flex children should have correct absolute positions
        expect(result.children[0].children[0].x).toBe(20); // 20 + 0 + 0
        expect(result.children[0].children[1].x).toBe(70); // 20 + 0 + 50
      });

      it('should handle deeply nested structures (3+ levels)', () => {
        // Level 3: text node
        const deepText = createTextNodeMapping('Deep', {
          left: 5,
          top: 5,
          width: 40,
          height: 24,
        });

        // Level 2: inner flex containing text
        const innerFlex = createFlexNodeMapping({ left: 10, top: 10, width: 50, height: 34 }, [
          deepText,
        ]);

        // Level 1: middle stack containing flex
        const middleStack = createStackNodeMapping({ left: 15, top: 15, width: 75, height: 59 }, [
          innerFlex,
        ]);

        // Level 0: outer flex containing stack
        const outerFlex = createFlexNodeMapping({ left: 20, top: 20, width: 110, height: 94 }, [
          middleStack,
        ]);

        const result = extractLayoutResult(outerFlex);

        // Navigate to deepest text node
        const level0 = result;
        const level1 = level0.children[0];
        const level2 = level1.children[0];
        const level3 = level2.children[0];

        expect(level0.x).toBe(20);
        expect(level0.y).toBe(20);
        expect(level1.x).toBe(35); // 20 + 15
        expect(level1.y).toBe(35); // 20 + 15
        expect(level2.x).toBe(45); // 35 + 10
        expect(level2.y).toBe(45); // 35 + 10
        expect(level3.x).toBe(50); // 45 + 5
        expect(level3.y).toBe(50); // 45 + 5
      });
    });

    describe('Relative positioning', () => {
      it('should add relativeOffset for relative positioned text node', () => {
        const mapping = createTextNodeMapping(
          'Offset Text',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          {
            position: 'relative',
            offsetX: 10,
            offsetY: 5,
          }
        );

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset).toBeDefined();
        expect(result.relativeOffset?.x).toBe(10);
        expect(result.relativeOffset?.y).toBe(5);
      });

      it('should use zero offset when offsetX/offsetY not specified', () => {
        const mapping = createTextNodeMapping(
          'Relative No Offset',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          { position: 'relative' }
        );

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset).toBeDefined();
        expect(result.relativeOffset?.x).toBe(0);
        expect(result.relativeOffset?.y).toBe(0);
      });

      it('should not add relativeOffset for static positioned node', () => {
        const mapping = createTextNodeMapping(
          'Static Text',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          { position: 'static' }
        );

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset).toBeUndefined();
      });

      it('should not add relativeOffset for absolute positioned node', () => {
        const mapping = createTextNodeMapping(
          'Absolute Text',
          {
            left: 50,
            top: 50,
            width: 100,
            height: 24,
          },
          { position: 'absolute' }
        );

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset).toBeUndefined();
      });

      it('should not add relativeOffset when position is undefined (defaults to static)', () => {
        const mapping = createTextNodeMapping('Default Position', {
          left: 0,
          top: 0,
          width: 100,
          height: 24,
        });

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset).toBeUndefined();
      });

      it('should handle relative positioned container with children', () => {
        const child = createTextNodeMapping('Child', {
          left: 0,
          top: 0,
          width: 80,
          height: 24,
        });

        const mapping = createStackNodeMapping(
          { left: 10, top: 10, width: 100, height: 24 },
          [child],
          {
            position: 'relative',
            offsetX: 15,
            offsetY: -5,
          }
        );

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset).toBeDefined();
        expect(result.relativeOffset?.x).toBe(15);
        expect(result.relativeOffset?.y).toBe(-5);
        // Children positions are based on computed layout, not relative offset
        expect(result.children[0].x).toBe(10); // Parent's computed x + child's offset
        expect(result.children[0].y).toBe(10);
      });

      it('should handle negative relative offsets', () => {
        const mapping = createTextNodeMapping(
          'Negative Offset',
          {
            left: 50,
            top: 50,
            width: 100,
            height: 24,
          },
          {
            position: 'relative',
            offsetX: -20,
            offsetY: -10,
          }
        );

        const result = extractLayoutResult(mapping);

        expect(result.relativeOffset?.x).toBe(-20);
        expect(result.relativeOffset?.y).toBe(-10);
      });
    });

    describe('Style extraction', () => {
      it('should preserve all style properties', () => {
        const fullStyle: ResolvedStyle = {
          bold: true,
          italic: true,
          underline: true,
          doubleStrike: true,
          doubleWidth: true,
          doubleHeight: true,
          condensed: true,
          cpi: 15,
          typeface: 2,
          printQuality: 0,
        };

        const mapping = createTextNodeMapping(
          'Fully Styled',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          { style: fullStyle }
        );

        const result = extractLayoutResult(mapping);

        expect(result.style).toEqual(fullStyle);
      });

      it('should include style for container nodes', () => {
        const containerStyle: ResolvedStyle = {
          ...DEFAULT_STYLE,
          bold: true,
        };

        const child = createTextNodeMapping('Child', {
          left: 0,
          top: 0,
          width: 50,
          height: 24,
        });

        const mapping = createStackNodeMapping(
          { left: 0, top: 0, width: 100, height: 24 },
          [child],
          { style: containerStyle }
        );

        const result = extractLayoutResult(mapping);

        expect(result.style.bold).toBe(true);
      });
    });

    describe('Width constraint detection', () => {
      it('should propagate shouldClipText as isWidthConstrained', () => {
        const mapping = createTextNodeMapping(
          'Constrained',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          { shouldClipText: true }
        );

        const result = extractLayoutResult(mapping);

        expect(result.isWidthConstrained).toBe(true);
      });

      it('should handle children with different width constraints', () => {
        const constrainedChild = createTextNodeMapping(
          'Constrained',
          {
            left: 0,
            top: 0,
            width: 50,
            height: 24,
          },
          { shouldClipText: true }
        );

        const unconstrainedChild = createTextNodeMapping(
          'Unconstrained',
          {
            left: 50,
            top: 0,
            width: 50,
            height: 24,
          },
          { shouldClipText: false }
        );

        const mapping = createFlexNodeMapping({ left: 0, top: 0, width: 100, height: 24 }, [
          constrainedChild,
          unconstrainedChild,
        ]);

        const result = extractLayoutResult(mapping);

        expect(result.children[0].isWidthConstrained).toBe(true);
        expect(result.children[1].isWidthConstrained).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle zero dimensions', () => {
        const mapping = createTextNodeMapping('', {
          left: 0,
          top: 0,
          width: 0,
          height: 0,
        });

        const result = extractLayoutResult(mapping);

        expect(result.width).toBe(0);
        expect(result.height).toBe(0);
      });

      it('should handle large offset values', () => {
        const mapping = createTextNodeMapping('Far Away', {
          left: 10000,
          top: 5000,
          width: 100,
          height: 24,
        });

        const result = extractLayoutResult(mapping, 50000, 25000);

        expect(result.x).toBe(60000);
        expect(result.y).toBe(30000);
      });

      it('should handle fractional computed values', () => {
        const mapping = createTextNodeMapping('Fractional', {
          left: 10.5,
          top: 20.25,
          width: 100.75,
          height: 24.5,
        });

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(10.5);
        expect(result.y).toBe(20.25);
        expect(result.width).toBe(100.75);
        expect(result.height).toBe(24.5);
      });

      it('should handle single child container', () => {
        const child = createTextNodeMapping('Only Child', {
          left: 0,
          top: 0,
          width: 100,
          height: 24,
        });

        const mapping = createStackNodeMapping({ left: 0, top: 0, width: 100, height: 24 }, [
          child,
        ]);

        const result = extractLayoutResult(mapping);

        expect(result.children).toHaveLength(1);
        expect(result.children[0].node).toBe(child.node);
      });

      it('should handle container with many children', () => {
        const children: NodeMapping[] = [];
        for (let i = 0; i < 50; i++) {
          children.push(
            createTextNodeMapping(`Item ${i}`, {
              left: 0,
              top: i * 24,
              width: 100,
              height: 24,
            })
          );
        }

        const mapping = createStackNodeMapping(
          { left: 0, top: 0, width: 100, height: 1200 },
          children
        );

        const result = extractLayoutResult(mapping);

        expect(result.children).toHaveLength(50);
        expect(result.children[49].y).toBe(49 * 24);
      });
    });

    describe('All positioning modes', () => {
      it('should handle static position (default)', () => {
        const mapping = createTextNodeMapping(
          'Static',
          {
            left: 10,
            top: 20,
            width: 100,
            height: 24,
          },
          { position: 'static' }
        );

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(10);
        expect(result.y).toBe(20);
        expect(result.relativeOffset).toBeUndefined();
      });

      it('should handle relative position with offsets', () => {
        const mapping = createTextNodeMapping(
          'Relative',
          {
            left: 10,
            top: 20,
            width: 100,
            height: 24,
          },
          {
            position: 'relative',
            offsetX: 5,
            offsetY: 10,
          }
        );

        const result = extractLayoutResult(mapping);

        // Layout position is from Yoga computation
        expect(result.x).toBe(10);
        expect(result.y).toBe(20);
        // Relative offset is stored separately for render-time application
        expect(result.relativeOffset).toEqual({ x: 5, y: 10 });
      });

      it('should handle absolute position', () => {
        const mapping = createTextNodeMapping(
          'Absolute',
          {
            left: 50,
            top: 100,
            width: 100,
            height: 24,
          },
          { position: 'absolute' }
        );

        const result = extractLayoutResult(mapping);

        expect(result.x).toBe(50);
        expect(result.y).toBe(100);
        expect(result.relativeOffset).toBeUndefined();
      });

      it('should handle mixed positioning in container', () => {
        const staticChild = createTextNodeMapping(
          'Static',
          {
            left: 0,
            top: 0,
            width: 100,
            height: 24,
          },
          { position: 'static' }
        );

        const relativeChild = createTextNodeMapping(
          'Relative',
          {
            left: 0,
            top: 24,
            width: 100,
            height: 24,
          },
          {
            position: 'relative',
            offsetX: 10,
            offsetY: 5,
          }
        );

        const absoluteChild = createTextNodeMapping(
          'Absolute',
          {
            left: 200,
            top: 0,
            width: 50,
            height: 24,
          },
          { position: 'absolute' }
        );

        const mapping = createStackNodeMapping({ left: 0, top: 0, width: 300, height: 48 }, [
          staticChild,
          relativeChild,
          absoluteChild,
        ]);

        const result = extractLayoutResult(mapping);

        expect(result.children[0].relativeOffset).toBeUndefined();
        expect(result.children[1].relativeOffset).toEqual({ x: 10, y: 5 });
        expect(result.children[2].relativeOffset).toBeUndefined();
      });
    });
  });

  describe('calculateTotalHeight', () => {
    it('should return height for single node', () => {
      const result: LayoutResult = {
        node: { type: 'text', content: 'Test' },
        x: 0,
        y: 0,
        width: 100,
        height: 24,
        children: [],
        style: DEFAULT_STYLE,
      };

      expect(calculateTotalHeight(result)).toBe(24);
    });

    it('should calculate total height including children', () => {
      const result: LayoutResult = {
        node: { type: 'stack', children: [] },
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        children: [
          {
            node: { type: 'text', content: 'Child 1' },
            x: 0,
            y: 0,
            width: 100,
            height: 24,
            children: [],
            style: DEFAULT_STYLE,
          },
          {
            node: { type: 'text', content: 'Child 2' },
            x: 0,
            y: 50,
            width: 100,
            height: 24,
            children: [],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Max of: parent (0 + 100 = 100), child1 (0 + 24 = 24), child2 (50 + 24 = 74)
      expect(calculateTotalHeight(result)).toBe(100);
    });

    it('should handle children extending beyond parent', () => {
      const result: LayoutResult = {
        node: { type: 'stack', children: [] },
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        children: [
          {
            node: { type: 'text', content: 'Overflow' },
            x: 0,
            y: 40,
            width: 100,
            height: 30,
            children: [],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Child extends to 40 + 30 = 70, which is greater than parent's 50
      expect(calculateTotalHeight(result)).toBe(70);
    });

    it('should calculate height for deeply nested structure', () => {
      const result: LayoutResult = {
        node: { type: 'stack', children: [] },
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        children: [
          {
            node: { type: 'flex', children: [] },
            x: 0,
            y: 0,
            width: 100,
            height: 40,
            children: [
              {
                node: { type: 'text', content: 'Deep' },
                x: 0,
                y: 100, // Deep child at y=100
                width: 50,
                height: 30,
                children: [],
                style: DEFAULT_STYLE,
              },
            ],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Deepest child: 100 + 30 = 130
      expect(calculateTotalHeight(result)).toBe(130);
    });

    it('should handle empty children array', () => {
      const result: LayoutResult = {
        node: { type: 'stack', children: [] },
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        children: [],
        style: DEFAULT_STYLE,
      };

      expect(calculateTotalHeight(result)).toBe(50);
    });

    it('should handle node with y offset', () => {
      const result: LayoutResult = {
        node: { type: 'text', content: 'Offset' },
        x: 0,
        y: 100,
        width: 50,
        height: 24,
        children: [],
        style: DEFAULT_STYLE,
      };

      expect(calculateTotalHeight(result)).toBe(124);
    });
  });

  describe('calculateTotalWidth', () => {
    it('should return width for single node', () => {
      const result: LayoutResult = {
        node: { type: 'text', content: 'Test' },
        x: 0,
        y: 0,
        width: 100,
        height: 24,
        children: [],
        style: DEFAULT_STYLE,
      };

      expect(calculateTotalWidth(result)).toBe(100);
    });

    it('should calculate total width including children', () => {
      const result: LayoutResult = {
        node: { type: 'flex', children: [] },
        x: 0,
        y: 0,
        width: 200,
        height: 24,
        children: [
          {
            node: { type: 'text', content: 'Child 1' },
            x: 0,
            y: 0,
            width: 80,
            height: 24,
            children: [],
            style: DEFAULT_STYLE,
          },
          {
            node: { type: 'text', content: 'Child 2' },
            x: 100,
            y: 0,
            width: 80,
            height: 24,
            children: [],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Max of: parent (0 + 200 = 200), child1 (0 + 80 = 80), child2 (100 + 80 = 180)
      expect(calculateTotalWidth(result)).toBe(200);
    });

    it('should handle children extending beyond parent', () => {
      const result: LayoutResult = {
        node: { type: 'flex', children: [] },
        x: 0,
        y: 0,
        width: 100,
        height: 24,
        children: [
          {
            node: { type: 'text', content: 'Overflow' },
            x: 80,
            y: 0,
            width: 50,
            height: 24,
            children: [],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Child extends to 80 + 50 = 130, which is greater than parent's 100
      expect(calculateTotalWidth(result)).toBe(130);
    });

    it('should calculate width for deeply nested structure', () => {
      const result: LayoutResult = {
        node: { type: 'stack', children: [] },
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        children: [
          {
            node: { type: 'flex', children: [] },
            x: 0,
            y: 0,
            width: 100,
            height: 24,
            children: [
              {
                node: { type: 'text', content: 'Deep' },
                x: 200, // Deep child at x=200
                y: 0,
                width: 100,
                height: 24,
                children: [],
                style: DEFAULT_STYLE,
              },
            ],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Deepest child: 200 + 100 = 300
      expect(calculateTotalWidth(result)).toBe(300);
    });

    it('should handle empty children array', () => {
      const result: LayoutResult = {
        node: { type: 'flex', children: [] },
        x: 0,
        y: 0,
        width: 150,
        height: 24,
        children: [],
        style: DEFAULT_STYLE,
      };

      expect(calculateTotalWidth(result)).toBe(150);
    });

    it('should handle node with x offset', () => {
      const result: LayoutResult = {
        node: { type: 'text', content: 'Offset' },
        x: 50,
        y: 0,
        width: 100,
        height: 24,
        children: [],
        style: DEFAULT_STYLE,
      };

      expect(calculateTotalWidth(result)).toBe(150);
    });

    it('should handle multiple levels with various widths', () => {
      const result: LayoutResult = {
        node: { type: 'stack', children: [] },
        x: 10,
        y: 0,
        width: 200,
        height: 100,
        children: [
          {
            node: { type: 'flex', children: [] },
            x: 20,
            y: 0,
            width: 150,
            height: 50,
            children: [
              {
                node: { type: 'text', content: 'Narrow' },
                x: 30,
                y: 0,
                width: 50,
                height: 24,
                children: [],
                style: DEFAULT_STYLE,
              },
              {
                node: { type: 'text', content: 'Wide' },
                x: 100,
                y: 0,
                width: 200,
                height: 24,
                children: [],
                style: DEFAULT_STYLE,
              },
            ],
            style: DEFAULT_STYLE,
          },
        ],
        style: DEFAULT_STYLE,
      };

      // Max is "Wide" child: 100 + 200 = 300
      expect(calculateTotalWidth(result)).toBe(300);
    });
  });
});
