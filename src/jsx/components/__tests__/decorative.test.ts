/**
 * Tests for Decorative Components (Divider, Border, Panel, Section)
 *
 * These tests verify that decorative components correctly produce LayoutNode
 * structures for visual enhancement and semantic grouping.
 */

import { describe, it, expect } from 'vitest';
import { Divider } from '../decorative/Divider';
import { Border } from '../decorative/Border';
import { Panel } from '../decorative/Panel';
import { Section } from '../decorative/Section';
import { Text } from '../content/Text';
import type {
  StackNode,
  FlexNode,
  TextNode,
  LineNode,
  SpacerNode,
} from '../../../layout/nodes';

describe('Decorative Components', () => {
  // ==================== DIVIDER COMPONENT ====================

  describe('Divider', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = Divider({});
        expect(node.type).toBe('stack');
      });

      it('should contain a line node', () => {
        const node = Divider({}) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.type).toBe('line');
      });

      it('should have fill length', () => {
        const node = Divider({}) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.length).toBe('fill');
      });
    });

    describe('variants', () => {
      it('should use - for single variant (default)', () => {
        const node = Divider({ variant: 'single' }) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.char).toBe('-');
      });

      it('should default to single variant', () => {
        const node = Divider({}) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.char).toBe('-');
      });

      it('should use = for double variant', () => {
        const node = Divider({ variant: 'double' }) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.char).toBe('=');
      });

      it('should use # for thick variant', () => {
        const node = Divider({ variant: 'thick' }) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.char).toBe('#');
      });

      it('should use . for dashed variant', () => {
        const node = Divider({ variant: 'dashed' }) as StackNode;
        const line = node.children[0] as LineNode;
        expect(line.char).toBe('.');
      });
    });

    describe('spacing', () => {
      it('should have default spacing of 5', () => {
        const node = Divider({}) as StackNode;
        expect(node.margin).toEqual({ top: 5, bottom: 5 });
      });

      it('should apply custom spacing', () => {
        const node = Divider({ spacing: 10 }) as StackNode;
        expect(node.margin).toEqual({ top: 10, bottom: 10 });
      });

      it('should allow zero spacing', () => {
        const node = Divider({ spacing: 0 }) as StackNode;
        expect(node.margin).toEqual({ top: 0, bottom: 0 });
      });
    });

    describe('style override', () => {
      it('should allow additional styles', () => {
        const node = Divider({ style: { width: 500 } }) as StackNode;
        expect(node.width).toBe(500);
      });

      it('should allow margin override', () => {
        const node = Divider({
          style: { margin: { top: 20, bottom: 20 } },
        }) as StackNode;

        expect(node.margin).toEqual({ top: 20, bottom: 20 });
      });
    });
  });

  // ==================== BORDER COMPONENT ====================

  describe('Border', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = Border({ children: Text({ children: 'Content' }) });
        expect(node.type).toBe('stack');
      });

      it('should have three rows (top, content, bottom)', () => {
        const node = Border({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect(node.children).toHaveLength(3);
      });

      it('should have flex rows for top and bottom borders', () => {
        const node = Border({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect((node.children[0] as FlexNode).type).toBe('flex');
        expect((node.children[2] as FlexNode).type).toBe('flex');
      });

      it('should have flex row for content area', () => {
        const node = Border({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect((node.children[1] as FlexNode).type).toBe('flex');
      });
    });

    describe('single variant (default)', () => {
      it('should use + for corners', () => {
        const node = Border({
          variant: 'single',
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        const bottomRow = node.children[2] as FlexNode;

        // Top corners
        expect((topRow.children[0] as TextNode).content).toBe('+');
        expect((topRow.children[2] as TextNode).content).toBe('+');

        // Bottom corners
        expect((bottomRow.children[0] as TextNode).content).toBe('+');
        expect((bottomRow.children[2] as TextNode).content).toBe('+');
      });

      it('should use - for horizontal lines', () => {
        const node = Border({
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        const line = topRow.children[1] as LineNode;
        expect(line.char).toBe('-');
      });

      it('should use | for vertical lines', () => {
        const node = Border({
          children: Text({ children: 'X' }),
        }) as StackNode;

        const contentRow = node.children[1] as FlexNode;
        expect((contentRow.children[0] as TextNode).content).toBe('|');
        expect((contentRow.children[2] as TextNode).content).toBe('|');
      });
    });

    describe('double variant', () => {
      it('should use # for corners', () => {
        const node = Border({
          variant: 'double',
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        expect((topRow.children[0] as TextNode).content).toBe('#');
        expect((topRow.children[2] as TextNode).content).toBe('#');
      });

      it('should use = for horizontal lines', () => {
        const node = Border({
          variant: 'double',
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        const line = topRow.children[1] as LineNode;
        expect(line.char).toBe('=');
      });
    });

    describe('rounded variant', () => {
      it('should use / and \\ for corners', () => {
        const node = Border({
          variant: 'rounded',
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        const bottomRow = node.children[2] as FlexNode;

        // Top corners: / and \
        expect((topRow.children[0] as TextNode).content).toBe('/');
        expect((topRow.children[2] as TextNode).content).toBe('\\');

        // Bottom corners: \ and /
        expect((bottomRow.children[0] as TextNode).content).toBe('\\');
        expect((bottomRow.children[2] as TextNode).content).toBe('/');
      });
    });

    describe('custom characters', () => {
      it('should allow custom corner characters', () => {
        const node = Border({
          chars: {
            topLeft: '[',
            topRight: ']',
            bottomLeft: '[',
            bottomRight: ']',
          },
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        const bottomRow = node.children[2] as FlexNode;

        expect((topRow.children[0] as TextNode).content).toBe('[');
        expect((topRow.children[2] as TextNode).content).toBe(']');
        expect((bottomRow.children[0] as TextNode).content).toBe('[');
        expect((bottomRow.children[2] as TextNode).content).toBe(']');
      });

      it('should allow custom horizontal character', () => {
        const node = Border({
          chars: { horizontal: '*' },
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        const line = topRow.children[1] as LineNode;
        expect(line.char).toBe('*');
      });

      it('should allow custom vertical character', () => {
        const node = Border({
          chars: { vertical: ':' },
          children: Text({ children: 'X' }),
        }) as StackNode;

        const contentRow = node.children[1] as FlexNode;
        expect((contentRow.children[0] as TextNode).content).toBe(':');
        expect((contentRow.children[2] as TextNode).content).toBe(':');
      });

      it('should merge custom chars with preset', () => {
        const node = Border({
          variant: 'double',
          chars: { topLeft: '@' },
          children: Text({ children: 'X' }),
        }) as StackNode;

        const topRow = node.children[0] as FlexNode;
        // Custom topLeft
        expect((topRow.children[0] as TextNode).content).toBe('@');
        // Preset topRight (from double)
        expect((topRow.children[2] as TextNode).content).toBe('#');
      });
    });

    describe('content area', () => {
      it('should wrap content with fill width', () => {
        const node = Border({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const contentRow = node.children[1] as FlexNode;
        const contentStack = contentRow.children[1] as StackNode;
        expect(contentStack.width).toBe('fill');
      });

      it('should include children in content area', () => {
        const content = Text({ children: 'Hello' });
        const node = Border({ children: content }) as StackNode;

        const contentRow = node.children[1] as FlexNode;
        const contentStack = contentRow.children[1] as StackNode;
        expect(contentStack.children).toBeDefined();
      });

      it('should handle multiple children', () => {
        const node = Border({
          children: [
            Text({ children: 'Line 1' }),
            Text({ children: 'Line 2' }),
          ],
        }) as StackNode;

        // Should work without error
        expect(node.type).toBe('stack');
      });
    });

    describe('style application', () => {
      it('should apply custom style', () => {
        const node = Border({
          style: { width: 400 },
          children: Text({ children: 'X' }),
        }) as StackNode;

        expect(node.width).toBe(400);
      });
    });
  });

  // ==================== PANEL COMPONENT ====================

  describe('Panel', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = Panel({ children: Text({ children: 'Content' }) });
        expect(node.type).toBe('stack');
      });

      it('should have separator line', () => {
        const node = Panel({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // Find line node
        const hasLine = node.children.some(
          (child) => (child as LineNode).type === 'line'
        );
        expect(hasLine).toBe(true);
      });

      it('should have content area with padding', () => {
        const node = Panel({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // Last child should be content stack with padding
        const contentStack = node.children[node.children.length - 1] as StackNode;
        expect(contentStack.type).toBe('stack');
        expect(contentStack.padding).toEqual({ top: 5, bottom: 5 });
      });
    });

    describe('title rendering', () => {
      it('should render title when provided', () => {
        const node = Panel({
          title: 'Panel Title',
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // First child should be header flex
        const headerFlex = node.children[0] as FlexNode;
        expect(headerFlex.type).toBe('flex');

        // Header should contain title text
        const titleText = headerFlex.children[0] as TextNode;
        expect(titleText.content).toBe('Panel Title');
        expect(titleText.bold).toBe(true);
      });

      it('should not render header when no title or actions', () => {
        const node = Panel({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // First child should be the separator line
        expect((node.children[0] as LineNode).type).toBe('line');
      });
    });

    describe('header actions', () => {
      it('should render header actions after title', () => {
        const action = Text({ children: '[Close]' });
        const node = Panel({
          title: 'Title',
          headerActions: action,
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const headerFlex = node.children[0] as FlexNode;
        // Title, Spacer, Action
        expect(headerFlex.children).toHaveLength(3);
      });

      it('should include spacer between title and actions', () => {
        const action = Text({ children: '[X]' });
        const node = Panel({
          title: 'Title',
          headerActions: action,
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const headerFlex = node.children[0] as FlexNode;
        const spacer = headerFlex.children[1] as SpacerNode;
        expect(spacer.type).toBe('spacer');
        expect(spacer.flex).toBe(true);
      });

      it('should handle multiple header actions', () => {
        const actions = [
          Text({ children: '[Edit]' }),
          Text({ children: '[Delete]' }),
        ];
        const node = Panel({
          title: 'Title',
          headerActions: actions,
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const headerFlex = node.children[0] as FlexNode;
        // Title, Spacer, Edit, Delete
        expect(headerFlex.children).toHaveLength(4);
      });

      it('should render actions without title', () => {
        const action = Text({ children: '[Action]' });
        const node = Panel({
          headerActions: action,
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const headerFlex = node.children[0] as FlexNode;
        // Spacer, Action
        expect(headerFlex.children).toHaveLength(2);
      });
    });

    describe('content area', () => {
      it('should include children in content area', () => {
        const content = Text({ children: 'Panel content' });
        const node = Panel({ children: content }) as StackNode;

        const contentStack = node.children[node.children.length - 1] as StackNode;
        expect(contentStack.children).toBeDefined();
      });

      it('should handle multiple children', () => {
        const node = Panel({
          children: [
            Text({ children: 'Line 1' }),
            Text({ children: 'Line 2' }),
          ],
        }) as StackNode;

        expect(node.type).toBe('stack');
      });
    });

    describe('style application', () => {
      it('should apply custom style', () => {
        const node = Panel({
          style: { width: 300 },
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect(node.width).toBe(300);
      });
    });
  });

  // ==================== SECTION COMPONENT ====================

  describe('Section', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = Section({ children: Text({ children: 'Content' }) });
        expect(node.type).toBe('stack');
      });

      it('should have default margins', () => {
        const node = Section({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect(node.margin).toEqual({ top: 15, bottom: 15 });
      });
    });

    describe('title rendering', () => {
      it('should render title as heading when provided', () => {
        const node = Section({
          title: 'Section Title',
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // First child should be a heading (text node)
        const heading = node.children[0] as TextNode;
        expect(heading.type).toBe('text');
        expect(heading.content).toBe('Section Title');
      });

      it('should use level 2 heading by default', () => {
        const node = Section({
          title: 'Title',
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const heading = node.children[0] as TextNode;
        // H2 style: bold + doubleWidth
        expect(heading.bold).toBe(true);
        expect(heading.doubleWidth).toBe(true);
      });

      it('should use custom heading level', () => {
        const node = Section({
          title: 'Title',
          level: 3,
          children: Text({ children: 'Content' }),
        }) as StackNode;

        const heading = node.children[0] as TextNode;
        // H3 style: bold + underline
        expect(heading.bold).toBe(true);
        expect(heading.underline).toBe(true);
      });

      it('should not render heading when no title', () => {
        const node = Section({
          children: Text({ children: 'Content' }),
        }) as StackNode;

        // First child should be the content
        const firstChild = node.children[0] as TextNode;
        expect(firstChild.content).toBe('Content');
      });
    });

    describe('children handling', () => {
      it('should include single child', () => {
        const node = Section({
          children: Text({ children: 'Single' }),
        }) as StackNode;

        expect(node.children).toHaveLength(1);
        expect((node.children[0] as TextNode).content).toBe('Single');
      });

      it('should include multiple children', () => {
        const node = Section({
          children: [
            Text({ children: 'First' }),
            Text({ children: 'Second' }),
          ],
        }) as StackNode;

        expect(node.children).toHaveLength(2);
      });

      it('should include children after title', () => {
        const node = Section({
          title: 'Title',
          children: [
            Text({ children: 'First' }),
            Text({ children: 'Second' }),
          ],
        }) as StackNode;

        // Title + 2 children
        expect(node.children).toHaveLength(3);
      });

      it('should handle empty children', () => {
        const node = Section({ children: [] }) as StackNode;
        expect(node.children).toHaveLength(0);
      });
    });

    describe('style application', () => {
      it('should allow margin override', () => {
        const node = Section({
          style: { margin: { top: 30, bottom: 30 } },
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect(node.margin).toEqual({ top: 30, bottom: 30 });
      });

      it('should apply additional styles', () => {
        const node = Section({
          style: { padding: 10 },
          children: Text({ children: 'Content' }),
        }) as StackNode;

        expect(node.padding).toBe(10);
      });
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Decorative Integration', () => {
    it('should compose Divider between Sections', () => {
      const section1 = Section({
        title: 'Section 1',
        children: Text({ children: 'Content 1' }),
      });
      const divider = Divider({ variant: 'double' });
      const section2 = Section({
        title: 'Section 2',
        children: Text({ children: 'Content 2' }),
      });

      expect(section1.type).toBe('stack');
      expect(divider.type).toBe('stack');
      expect(section2.type).toBe('stack');
    });

    it('should compose Border around Panel', () => {
      const panel = Panel({
        title: 'Bordered Panel',
        children: Text({ children: 'Content' }),
      });
      const bordered = Border({
        variant: 'double',
        children: panel,
      }) as StackNode;

      expect(bordered.type).toBe('stack');
      expect(bordered.children).toHaveLength(3); // top, content, bottom
    });

    it('should compose Panel with Section', () => {
      const section = Section({
        title: 'Inner Section',
        children: Text({ children: 'Section content' }),
      });
      const panel = Panel({
        title: 'Panel',
        children: section,
      }) as StackNode;

      expect(panel.type).toBe('stack');
    });

    it('should compose multiple decorative elements', () => {
      const header = Border({
        variant: 'rounded',
        children: Text({ children: 'HEADER' }),
      });
      const divider = Divider({ variant: 'thick' });
      const content = Section({
        title: 'Main Content',
        children: Panel({
          title: 'Details',
          children: Text({ children: 'Details content' }),
        }),
      });

      expect(header.type).toBe('stack');
      expect(divider.type).toBe('stack');
      expect(content.type).toBe('stack');
    });
  });
});
