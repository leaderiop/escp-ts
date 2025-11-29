/**
 * Tests for Layout Components (Stack, Flex, Spacer, Layout)
 *
 * These tests verify that layout components correctly produce LayoutNode structures
 * with proper style properties applied. They target the critical defects identified:
 * - Flex layout failure: Spacer with flex: true not expanding
 * - Text overlap: Flex children rendering at same X position
 * - Width constraints ignored: Fixed widths on Flex children not honored
 */

import { describe, it, expect } from 'vitest';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Spacer } from '../layout/Spacer';
import { Layout } from '../layout/Layout';
import { Text } from '../content/Text';
import type { StackNode, FlexNode, SpacerNode, TextNode } from '../../../layout/nodes';

describe('Layout Components', () => {
  // ==================== STACK COMPONENT ====================

  describe('Stack', () => {
    describe('basic structure', () => {
      it('should return a stack node with type "stack"', () => {
        const node = Stack({ children: [] });
        expect(node.type).toBe('stack');
      });

      it('should default to column direction when not specified', () => {
        const node = Stack({ children: [] }) as StackNode;
        expect(node.direction).toBe('column');
      });

      it('should accept row direction', () => {
        const node = Stack({ direction: 'row', children: [] }) as StackNode;
        expect(node.direction).toBe('row');
      });

      it('should accept column direction explicitly', () => {
        const node = Stack({ direction: 'column', children: [] }) as StackNode;
        expect(node.direction).toBe('column');
      });
    });

    describe('children handling', () => {
      it('should include children in the node', () => {
        const textNode = Text({ children: 'Hello' });
        const node = Stack({ children: textNode }) as StackNode;
        expect(node.children).toHaveLength(1);
        expect((node.children[0] as TextNode).content).toBe('Hello');
      });

      it('should handle array of children', () => {
        const child1 = Text({ children: 'First' });
        const child2 = Text({ children: 'Second' });
        const node = Stack({ children: [child1, child2] }) as StackNode;
        expect(node.children).toHaveLength(2);
      });

      it('should handle empty children array', () => {
        const node = Stack({ children: [] }) as StackNode;
        expect(node.children).toHaveLength(0);
      });

      it('should handle undefined children gracefully', () => {
        // @ts-expect-error - Testing undefined children
        const node = Stack({}) as StackNode;
        expect(node.children).toHaveLength(0);
      });
    });

    describe('style properties', () => {
      it('should apply gap from style', () => {
        const node = Stack({
          style: { gap: 10 },
          children: [],
        }) as StackNode;
        expect(node.gap).toBe(10);
      });

      it('should apply width from style', () => {
        const node = Stack({
          style: { width: 200 },
          children: [],
        }) as StackNode;
        expect(node.width).toBe(200);
      });

      it('should apply height from style', () => {
        const node = Stack({
          style: { height: 100 },
          children: [],
        }) as StackNode;
        expect(node.height).toBe(100);
      });

      it('should apply percentage width', () => {
        const node = Stack({
          style: { width: '50%' },
          children: [],
        }) as StackNode;
        expect(node.width).toBe('50%');
      });

      it('should apply fill width', () => {
        const node = Stack({
          style: { width: 'fill' },
          children: [],
        }) as StackNode;
        expect(node.width).toBe('fill');
      });

      it('should apply padding from style', () => {
        const node = Stack({
          style: { padding: 10 },
          children: [],
        }) as StackNode;
        expect(node.padding).toBe(10);
      });

      it('should apply margin from style', () => {
        const node = Stack({
          style: { margin: { top: 5, bottom: 5 } },
          children: [],
        }) as StackNode;
        expect(node.margin).toEqual({ top: 5, bottom: 5 });
      });
    });

    describe('alignment', () => {
      it('should apply horizontal alignment', () => {
        const node = Stack({
          align: 'center',
          children: [],
        }) as StackNode;
        expect(node.align).toBe('center');
      });

      it('should apply vertical alignment', () => {
        const node = Stack({
          vAlign: 'center',
          children: [],
        }) as StackNode;
        expect(node.vAlign).toBe('center');
      });

      it('should apply both alignments', () => {
        const node = Stack({
          align: 'right',
          vAlign: 'bottom',
          children: [],
        }) as StackNode;
        expect(node.align).toBe('right');
        expect(node.vAlign).toBe('bottom');
      });
    });

    describe('text style inheritance', () => {
      it('should apply bold style', () => {
        const node = Stack({
          style: { bold: true },
          children: [],
        }) as StackNode;
        expect(node.bold).toBe(true);
      });

      it('should apply italic style', () => {
        const node = Stack({
          style: { italic: true },
          children: [],
        }) as StackNode;
        expect(node.italic).toBe(true);
      });

      it('should apply cpi', () => {
        const node = Stack({
          style: { cpi: 12 },
          children: [],
        }) as StackNode;
        expect(node.cpi).toBe(12);
      });
    });
  });

  // ==================== FLEX COMPONENT ====================

  describe('Flex', () => {
    describe('basic structure', () => {
      it('should return a flex node with type "flex"', () => {
        const node = Flex({ children: [] });
        expect(node.type).toBe('flex');
      });

      it('should have children array', () => {
        const node = Flex({ children: [] }) as FlexNode;
        expect(Array.isArray(node.children)).toBe(true);
      });
    });

    describe('children handling', () => {
      it('should include all children', () => {
        const child1 = Text({ children: 'Left' });
        const child2 = Text({ children: 'Right' });
        const node = Flex({ children: [child1, child2] }) as FlexNode;
        expect(node.children).toHaveLength(2);
      });

      it('should preserve child order', () => {
        const child1 = Text({ children: 'First' });
        const child2 = Text({ children: 'Second' });
        const child3 = Text({ children: 'Third' });
        const node = Flex({ children: [child1, child2, child3] }) as FlexNode;
        expect((node.children[0] as TextNode).content).toBe('First');
        expect((node.children[1] as TextNode).content).toBe('Second');
        expect((node.children[2] as TextNode).content).toBe('Third');
      });

      it('should handle single child', () => {
        const child = Text({ children: 'Only' });
        const node = Flex({ children: child }) as FlexNode;
        expect(node.children).toHaveLength(1);
      });

      it('should handle empty children', () => {
        const node = Flex({ children: [] }) as FlexNode;
        expect(node.children).toHaveLength(0);
      });
    });

    describe('style properties', () => {
      it('should apply gap from style', () => {
        const node = Flex({
          style: { gap: 20 },
          children: [],
        }) as FlexNode;
        expect(node.gap).toBe(20);
      });

      it('should apply justifyContent from style', () => {
        const node = Flex({
          style: { justifyContent: 'space-between' },
          children: [],
        }) as FlexNode;
        expect(node.justify).toBe('space-between');
      });

      it('should apply alignItems from style', () => {
        const node = Flex({
          style: { alignItems: 'center' },
          children: [],
        }) as FlexNode;
        expect(node.alignItems).toBe('center');
      });

      it('should apply width from style', () => {
        const node = Flex({
          style: { width: 500 },
          children: [],
        }) as FlexNode;
        expect(node.width).toBe(500);
      });

      it('should apply fill width', () => {
        const node = Flex({
          style: { width: 'fill' },
          children: [],
        }) as FlexNode;
        expect(node.width).toBe('fill');
      });
    });

    describe('flex distribution - Critical Bug Area', () => {
      /**
       * BUG #2: Text Overlap - Flex children rendering at same X position
       * These tests verify that Flex children should be distributed horizontally.
       * The actual X position calculation happens in the layout engine, but
       * the node structure must be correct for proper distribution.
       */

      it('should create proper structure for horizontal distribution', () => {
        const child1 = Text({ children: 'Left' });
        const child2 = Text({ children: 'Right' });
        const node = Flex({ children: [child1, child2] }) as FlexNode;

        // Flex node should have children that can be distributed
        expect(node.type).toBe('flex');
        expect(node.children).toHaveLength(2);
        // Each child should be a separate node
        expect(node.children[0]).not.toBe(node.children[1]);
      });

      it('should support space-between justify for distribution', () => {
        const node = Flex({
          style: { justifyContent: 'space-between' },
          children: [
            Text({ children: 'A' }),
            Text({ children: 'B' }),
            Text({ children: 'C' }),
          ],
        }) as FlexNode;

        expect(node.justify).toBe('space-between');
        expect(node.children).toHaveLength(3);
      });

      it('should support space-around justify for distribution', () => {
        const node = Flex({
          style: { justifyContent: 'space-around' },
          children: [Text({ children: 'X' }), Text({ children: 'Y' })],
        }) as FlexNode;

        expect(node.justify).toBe('space-around');
      });

      it('should support space-evenly justify for distribution', () => {
        const node = Flex({
          style: { justifyContent: 'space-evenly' },
          children: [Text({ children: 'X' }), Text({ children: 'Y' })],
        }) as FlexNode;

        expect(node.justify).toBe('space-evenly');
      });
    });

    describe('children with fixed widths - Critical Bug Area', () => {
      /**
       * BUG #4: Width Constraints Ignored - Fixed widths on Flex children not honored
       * These tests verify that children with fixed widths are properly structured.
       */

      it('should preserve child width when specified', () => {
        const child = Stack({
          style: { width: 100 },
          children: Text({ children: 'Fixed width' }),
        }) as StackNode;

        const node = Flex({ children: [child] }) as FlexNode;
        const flexChild = node.children[0] as StackNode;

        expect(flexChild.width).toBe(100);
      });

      it('should preserve multiple children with different widths', () => {
        const child1 = Stack({
          style: { width: 100 },
          children: Text({ children: 'First' }),
        });
        const child2 = Stack({
          style: { width: 200 },
          children: Text({ children: 'Second' }),
        });
        const child3 = Stack({
          style: { width: 150 },
          children: Text({ children: 'Third' }),
        });

        const node = Flex({ children: [child1, child2, child3] }) as FlexNode;

        expect((node.children[0] as StackNode).width).toBe(100);
        expect((node.children[1] as StackNode).width).toBe(200);
        expect((node.children[2] as StackNode).width).toBe(150);
      });

      it('should support percentage widths on children', () => {
        const child = Stack({
          style: { width: '33%' },
          children: Text({ children: 'Third' }),
        }) as StackNode;

        const node = Flex({ children: [child] }) as FlexNode;
        expect((node.children[0] as StackNode).width).toBe('33%');
      });
    });
  });

  // ==================== SPACER COMPONENT ====================

  describe('Spacer', () => {
    describe('basic structure', () => {
      it('should return a spacer node with type "spacer"', () => {
        const node = Spacer({});
        expect(node.type).toBe('spacer');
      });
    });

    describe('flex behavior - Critical Bug Area', () => {
      /**
       * BUG #1: Flex Layout Failure - Spacer with flex: true not expanding
       * These tests verify that the Spacer correctly sets flex: true
       * which should cause it to expand and fill available space.
       */

      it('should set flex: true when flex prop is true', () => {
        const node = Spacer({ flex: true }) as SpacerNode;
        expect(node.flex).toBe(true);
      });

      it('should default to flex: true when no width or height specified', () => {
        const node = Spacer({}) as SpacerNode;
        expect(node.flex).toBe(true);
      });

      it('should set flex: false when flex prop is explicitly false', () => {
        const node = Spacer({ flex: false }) as SpacerNode;
        expect(node.flex).toBe(false);
      });

      it('should set flex: false when width is specified', () => {
        const node = Spacer({ style: { width: 50 } }) as SpacerNode;
        // When width is specified, flex defaults to false
        expect(node.flex).toBe(false);
      });

      it('should set flex: false when height is specified', () => {
        const node = Spacer({ style: { height: 50 } }) as SpacerNode;
        // When height is specified, flex defaults to false
        expect(node.flex).toBe(false);
      });

      it('should allow flex: true even with width specified via explicit prop', () => {
        const node = Spacer({ flex: true, style: { width: 50 } }) as SpacerNode;
        // Explicit flex: true should override the default
        expect(node.flex).toBe(true);
        expect(node.width).toBe(50);
      });
    });

    describe('fixed dimensions', () => {
      it('should apply width from style', () => {
        const node = Spacer({ style: { width: 100 } }) as SpacerNode;
        expect(node.width).toBe(100);
      });

      it('should apply height from style', () => {
        const node = Spacer({ style: { height: 50 } }) as SpacerNode;
        expect(node.height).toBe(50);
      });

      it('should apply both width and height', () => {
        const node = Spacer({ style: { width: 100, height: 50 } }) as SpacerNode;
        expect(node.width).toBe(100);
        expect(node.height).toBe(50);
      });
    });

    describe('integration with Flex', () => {
      it('should be usable as flexible space between items', () => {
        const left = Text({ children: 'Left' });
        const right = Text({ children: 'Right' });
        const spacer = Spacer({ flex: true });

        const node = Flex({ children: [left, spacer, right] }) as FlexNode;

        expect(node.children).toHaveLength(3);
        expect((node.children[1] as SpacerNode).type).toBe('spacer');
        expect((node.children[1] as SpacerNode).flex).toBe(true);
      });

      it('should be usable as fixed space between items', () => {
        const left = Text({ children: 'Left' });
        const right = Text({ children: 'Right' });
        const spacer = Spacer({ style: { width: 50 } });

        const node = Flex({ children: [left, spacer, right] }) as FlexNode;

        expect((node.children[1] as SpacerNode).width).toBe(50);
        expect((node.children[1] as SpacerNode).flex).toBe(false);
      });
    });
  });

  // ==================== LAYOUT COMPONENT ====================

  describe('Layout', () => {
    describe('basic structure', () => {
      it('should return a stack node (Layout wraps content in stack)', () => {
        const node = Layout({ children: [] });
        expect(node.type).toBe('stack');
      });

      it('should use column direction by default', () => {
        const node = Layout({ children: [] }) as StackNode;
        expect(node.direction).toBe('column');
      });
    });

    describe('children handling', () => {
      it('should include children', () => {
        const child = Text({ children: 'Content' });
        const node = Layout({ children: child }) as StackNode;
        expect(node.children).toHaveLength(1);
      });

      it('should handle array of children', () => {
        const children = [
          Text({ children: 'First' }),
          Text({ children: 'Second' }),
        ];
        const node = Layout({ children }) as StackNode;
        expect(node.children).toHaveLength(2);
      });

      it('should handle nested layouts', () => {
        const inner = Layout({
          children: Text({ children: 'Inner' }),
        });
        const outer = Layout({ children: inner }) as StackNode;

        expect(outer.children).toHaveLength(1);
        expect((outer.children[0] as StackNode).type).toBe('stack');
      });
    });

    describe('style properties', () => {
      it('should apply width from style', () => {
        const node = Layout({
          style: { width: 1000 },
          children: [],
        }) as StackNode;
        expect(node.width).toBe(1000);
      });

      it('should apply height from style', () => {
        const node = Layout({
          style: { height: 500 },
          children: [],
        }) as StackNode;
        expect(node.height).toBe(500);
      });

      it('should apply padding from style', () => {
        const node = Layout({
          style: { padding: { top: 10, right: 10, bottom: 10, left: 10 } },
          children: [],
        }) as StackNode;
        expect(node.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
      });
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Layout Integration', () => {
    it('should compose Stack with Flex correctly', () => {
      const flex = Flex({
        children: [
          Text({ children: 'A' }),
          Text({ children: 'B' }),
        ],
      });
      const stack = Stack({ children: flex }) as StackNode;

      expect(stack.type).toBe('stack');
      expect(stack.children).toHaveLength(1);
      expect((stack.children[0] as FlexNode).type).toBe('flex');
      expect((stack.children[0] as FlexNode).children).toHaveLength(2);
    });

    it('should support deeply nested layouts', () => {
      const deepLayout = Layout({
        children: Stack({
          children: [
            Flex({
              children: [
                Stack({ children: Text({ children: 'Deep' }) }),
              ],
            }),
          ],
        }),
      }) as StackNode;

      expect(deepLayout.type).toBe('stack');
      const stack = deepLayout.children[0] as StackNode;
      expect(stack.type).toBe('stack');
      const flex = stack.children[0] as FlexNode;
      expect(flex.type).toBe('flex');
    });

    it('should maintain style inheritance structure', () => {
      const layout = Stack({
        style: { bold: true, cpi: 12 },
        children: [
          Text({ children: 'Inherit bold' }),
          Stack({
            style: { italic: true },
            children: Text({ children: 'Bold and italic' }),
          }),
        ],
      }) as StackNode;

      expect(layout.bold).toBe(true);
      expect(layout.cpi).toBe(12);
      expect((layout.children[1] as StackNode).italic).toBe(true);
    });
  });
});
