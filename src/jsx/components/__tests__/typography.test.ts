/**
 * Tests for Typography Components (Heading, Label, Caption, Paragraph)
 *
 * These tests verify that typography components correctly produce LayoutNode
 * structures with proper styling for text presentation.
 */

import { describe, it, expect } from 'vitest';
import { Heading } from '../typography/Heading';
import { Label } from '../typography/Label';
import { Caption } from '../typography/Caption';
import { Paragraph } from '../typography/Paragraph';
import { Text } from '../content/Text';
import type { TextNode, StackNode, FlexNode, LineNode, LayoutNode } from '../../../layout/nodes';

describe('Typography Components', () => {
  // ==================== HEADING COMPONENT ====================

  describe('Heading', () => {
    describe('basic structure', () => {
      it('should return a text node for simple headings', () => {
        const node = Heading({ children: 'Title' });
        expect(node.type).toBe('text');
      });

      it('should return a stack node when underline is present', () => {
        const node = Heading({ level: 1, underline: true, children: 'Title' });
        expect(node.type).toBe('stack');
      });

      it('should contain the heading text', () => {
        const node = Heading({ children: 'My Heading' }) as TextNode;
        expect(node.content).toBe('My Heading');
      });

      it('should handle empty children', () => {
        const node = Heading({ children: '' }) as TextNode;
        expect(node.content).toBe('');
      });

      it('should handle undefined children', () => {
        // @ts-expect-error - Testing undefined children
        const node = Heading({}) as TextNode;
        expect(node.content).toBe('');
      });
    });

    describe('level styles', () => {
      it('should apply H1 style (bold, doubleWidth, doubleHeight)', () => {
        const node = Heading({ level: 1, children: 'H1' }) as TextNode;
        expect(node.bold).toBe(true);
        expect(node.doubleWidth).toBe(true);
        expect(node.doubleHeight).toBe(true);
      });

      it('should apply H2 style (bold, doubleWidth)', () => {
        const node = Heading({ level: 2, children: 'H2' }) as TextNode;
        expect(node.bold).toBe(true);
        expect(node.doubleWidth).toBe(true);
        expect(node.doubleHeight).toBeUndefined();
      });

      it('should apply H3 style (bold, underline)', () => {
        const node = Heading({ level: 3, children: 'H3' }) as TextNode;
        expect(node.bold).toBe(true);
        expect(node.underline).toBe(true);
      });

      it('should apply H4 style (bold only)', () => {
        const node = Heading({ level: 4, children: 'H4' }) as TextNode;
        expect(node.bold).toBe(true);
        expect(node.doubleWidth).toBeUndefined();
        expect(node.underline).toBeUndefined();
      });

      it('should default to H1 when level not specified', () => {
        const node = Heading({ children: 'Default' }) as TextNode;
        expect(node.bold).toBe(true);
        expect(node.doubleWidth).toBe(true);
        expect(node.doubleHeight).toBe(true);
      });
    });

    describe('underline rendering', () => {
      it('should add = underline for H1 when underline is true', () => {
        const node = Heading({
          level: 1,
          underline: true,
          children: 'H1',
        }) as StackNode;

        expect(node.type).toBe('stack');
        expect((node.children[1] as LineNode).char).toBe('=');
      });

      it('should add - underline for H2 when underline is true', () => {
        const node = Heading({
          level: 2,
          underline: true,
          children: 'H2',
        }) as StackNode;

        expect((node.children[1] as LineNode).char).toBe('-');
      });

      it('should not add underline for H3/H4 when underline is true (no default char)', () => {
        const node3 = Heading({ level: 3, underline: true, children: 'H3' });
        const node4 = Heading({ level: 4, underline: true, children: 'H4' });

        // H3 and H4 have no default underline character, so they remain text nodes
        expect(node3.type).toBe('text');
        expect(node4.type).toBe('text');
      });

      it('should use custom underline character', () => {
        const node = Heading({
          level: 3,
          underline: '*',
          children: 'Custom',
        }) as StackNode;

        expect(node.type).toBe('stack');
        expect((node.children[1] as LineNode).char).toBe('*');
      });
    });

    describe('alignment', () => {
      it('should apply left alignment', () => {
        const node = Heading({
          align: 'left',
          children: 'Left',
        }) as TextNode;

        expect(node.align).toBe('left');
      });

      it('should apply center alignment', () => {
        const node = Heading({
          align: 'center',
          children: 'Center',
        }) as TextNode;

        expect(node.align).toBe('center');
      });

      it('should apply right alignment', () => {
        const node = Heading({
          align: 'right',
          children: 'Right',
        }) as TextNode;

        expect(node.align).toBe('right');
      });
    });

    describe('style override', () => {
      it('should allow style override', () => {
        const node = Heading({
          level: 1,
          style: { italic: true },
          children: 'Styled',
        }) as TextNode;

        expect(node.italic).toBe(true);
        // Level styles should still apply
        expect(node.bold).toBe(true);
      });

      it('should merge custom style with level style', () => {
        const node = Heading({
          level: 4,
          style: { cpi: 12, underline: true },
          children: 'Merged',
        }) as TextNode;

        expect(node.bold).toBe(true); // From level 4
        expect(node.cpi).toBe(12); // From custom style
        expect(node.underline).toBe(true); // From custom style
      });
    });
  });

  // ==================== LABEL COMPONENT ====================

  describe('Label', () => {
    describe('basic structure', () => {
      it('should return a flex node', () => {
        const node = Label({ label: 'Name', value: 'John' });
        expect(node.type).toBe('flex');
      });

      it('should have label stack and value as children', () => {
        const node = Label({ label: 'Name', value: 'John' }) as FlexNode;
        expect(node.children).toHaveLength(2);
        // First child is a Stack wrapper for the label
        expect(node.children[0].type).toBe('stack');
      });
    });

    describe('label text', () => {
      it('should include colon by default', () => {
        const node = Label({ label: 'Name', value: 'John' }) as FlexNode;
        const labelStack = node.children[0] as StackNode;
        const labelText = labelStack.children[0] as TextNode;
        expect(labelText.content).toBe('Name:');
      });

      it('should omit colon when colon is false', () => {
        const node = Label({
          label: 'Name',
          value: 'John',
          colon: false,
        }) as FlexNode;

        const labelStack = node.children[0] as StackNode;
        const labelText = labelStack.children[0] as TextNode;
        expect(labelText.content).toBe('Name');
      });

      it('should apply default label width to stack wrapper', () => {
        const node = Label({ label: 'Name', value: 'John' }) as FlexNode;
        const labelStack = node.children[0] as StackNode;
        expect(labelStack.width).toBe(150);
      });

      it('should apply custom label width to stack wrapper', () => {
        const node = Label({
          label: 'Name',
          value: 'John',
          labelWidth: 200,
        }) as FlexNode;

        const labelStack = node.children[0] as StackNode;
        expect(labelStack.width).toBe(200);
      });
    });

    describe('value rendering', () => {
      it('should render string value', () => {
        const node = Label({ label: 'Name', value: 'John' }) as FlexNode;
        const valueText = node.children[1] as TextNode;
        expect(valueText.content).toBe('John');
      });

      it('should render numeric value as string', () => {
        const node = Label({ label: 'Age', value: 25 }) as FlexNode;
        const valueText = node.children[1] as TextNode;
        expect(valueText.content).toBe('25');
      });

      it('should render children when value not provided', () => {
        const customValue = Text({ children: 'Custom Value', style: { bold: true } });
        const node = Label({
          label: 'Status',
          children: customValue,
        }) as FlexNode;

        const valueNode = node.children[1] as TextNode;
        expect(valueNode.content).toBe('Custom Value');
        expect(valueNode.bold).toBe(true);
      });

      it('should prefer value over children', () => {
        const node = Label({
          label: 'Name',
          value: 'Preferred',
          children: Text({ children: 'Ignored' }),
        }) as FlexNode;

        const valueText = node.children[1] as TextNode;
        expect(valueText.content).toBe('Preferred');
      });
    });

    describe('style application', () => {
      it('should apply custom style to flex container', () => {
        const node = Label({
          label: 'Name',
          value: 'John',
          style: { gap: 20 },
        }) as FlexNode;

        expect(node.gap).toBe(20);
      });
    });
  });

  // ==================== CAPTION COMPONENT ====================

  describe('Caption', () => {
    describe('basic structure', () => {
      it('should return a text node', () => {
        const node = Caption({ children: 'Caption text' });
        expect(node.type).toBe('text');
      });

      it('should contain the caption text', () => {
        const node = Caption({ children: 'Figure 1' }) as TextNode;
        expect(node.content).toBe('Figure 1');
      });

      it('should handle empty children', () => {
        const node = Caption({ children: '' }) as TextNode;
        expect(node.content).toBe('');
      });

      it('should handle undefined children', () => {
        // @ts-expect-error - Testing undefined children
        const node = Caption({}) as TextNode;
        expect(node.content).toBe('');
      });
    });

    describe('italic style', () => {
      it('should have italic style by default', () => {
        const node = Caption({ children: 'Caption' }) as TextNode;
        expect(node.italic).toBe(true);
      });
    });

    describe('alignment', () => {
      it('should apply left alignment', () => {
        const node = Caption({
          align: 'left',
          children: 'Left caption',
        }) as TextNode;

        expect(node.align).toBe('left');
      });

      it('should apply center alignment', () => {
        const node = Caption({
          align: 'center',
          children: 'Center caption',
        }) as TextNode;

        expect(node.align).toBe('center');
      });

      it('should apply right alignment', () => {
        const node = Caption({
          align: 'right',
          children: 'Right caption',
        }) as TextNode;

        expect(node.align).toBe('right');
      });
    });

    describe('style override', () => {
      it('should allow additional styles', () => {
        const node = Caption({
          style: { bold: true },
          children: 'Bold caption',
        }) as TextNode;

        expect(node.italic).toBe(true); // Default
        expect(node.bold).toBe(true); // Custom
      });

      it('should allow overriding italic', () => {
        const node = Caption({
          style: { italic: false },
          children: 'Not italic',
        }) as TextNode;

        // Custom style should merge, with custom taking precedence
        expect(node.italic).toBe(false);
      });
    });
  });

  // ==================== PARAGRAPH COMPONENT ====================

  describe('Paragraph', () => {
    describe('basic structure', () => {
      it('should return a stack node', () => {
        const node = Paragraph({ children: 'Text' });
        expect(node.type).toBe('stack');
      });

      it('should contain a text node', () => {
        const node = Paragraph({ children: 'Paragraph text' }) as StackNode;
        const textNode = node.children[0] as TextNode;
        expect(textNode.type).toBe('text');
        expect(textNode.content).toBe('Paragraph text');
      });

      it('should handle empty children', () => {
        const node = Paragraph({ children: '' }) as StackNode;
        const textNode = node.children[0] as TextNode;
        expect(textNode.content).toBe('');
      });

      it('should handle undefined children', () => {
        // @ts-expect-error - Testing undefined children
        const node = Paragraph({}) as StackNode;
        const textNode = node.children[0] as TextNode;
        expect(textNode.content).toBe('');
      });
    });

    describe('margins', () => {
      it('should have default top and bottom margins', () => {
        const node = Paragraph({ children: 'Text' }) as StackNode;
        expect(node.margin).toEqual({ top: 10, bottom: 10 });
      });
    });

    describe('alignment', () => {
      it('should apply left alignment to text', () => {
        const node = Paragraph({
          align: 'left',
          children: 'Left aligned',
        }) as StackNode;

        const textNode = node.children[0] as TextNode;
        expect(textNode.align).toBe('left');
      });

      it('should apply center alignment to text', () => {
        const node = Paragraph({
          align: 'center',
          children: 'Centered',
        }) as StackNode;

        const textNode = node.children[0] as TextNode;
        expect(textNode.align).toBe('center');
      });

      it('should apply right alignment to text', () => {
        const node = Paragraph({
          align: 'right',
          children: 'Right aligned',
        }) as StackNode;

        const textNode = node.children[0] as TextNode;
        expect(textNode.align).toBe('right');
      });
    });

    describe('indentation', () => {
      it('should add indent spaces to string children', () => {
        const node = Paragraph({
          indent: 30,
          children: 'Indented text',
        }) as StackNode;

        const textNode = node.children[0] as TextNode;
        // indent 30 / 10 = 3 spaces (ceil)
        expect(textNode.content).toBe('   Indented text');
      });

      it('should not add indent for numeric children', () => {
        const node = Paragraph({
          indent: 30,
          children: 123,
        }) as StackNode;

        const textNode = node.children[0] as TextNode;
        // Numeric children don't get indented
        expect(textNode.content).toBe('123');
      });

      it('should handle zero indent', () => {
        const node = Paragraph({
          indent: 0,
          children: 'No indent',
        }) as StackNode;

        const textNode = node.children[0] as TextNode;
        expect(textNode.content).toBe('No indent');
      });
    });

    describe('style override', () => {
      it('should allow custom margins', () => {
        const node = Paragraph({
          style: { margin: { top: 20, bottom: 20 } },
          children: 'Custom margins',
        }) as StackNode;

        expect(node.margin).toEqual({ top: 20, bottom: 20 });
      });

      it('should allow additional styles', () => {
        const node = Paragraph({
          style: { bold: true },
          children: 'Bold paragraph',
        }) as StackNode;

        expect(node.bold).toBe(true);
      });
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('Typography Integration', () => {
    it('should allow Heading followed by Paragraph', () => {
      const heading = Heading({ level: 2, children: 'Section Title' });
      const para = Paragraph({ children: 'Section content...' });

      expect(heading.type).toBe('text');
      expect(para.type).toBe('stack');
    });

    it('should allow Label with Caption as value', () => {
      const caption = Caption({ children: 'Italic value' });
      const label = Label({ label: 'Note', children: caption }) as FlexNode;

      expect(label.children).toHaveLength(2);
      const valueNode = label.children[1] as TextNode;
      expect(valueNode.italic).toBe(true);
    });

    it('should allow numeric content in typography', () => {
      const heading = Heading({ children: 'Chapter 1' }) as TextNode;
      const label = Label({ label: 'Page', value: 42 }) as FlexNode;
      const caption = Caption({ children: 100 }) as TextNode;

      expect(heading.content).toBe('Chapter 1');
      expect((label.children[1] as TextNode).content).toBe('42');
      expect(caption.content).toBe('100');
    });
  });
});
