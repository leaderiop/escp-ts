/**
 * Tests for JSX Component Functions
 *
 * Comprehensive tests for all JSX component wrapper functions:
 *
 * Content Components:
 * - Template: text with {{variable}} interpolation
 * - Text: text content rendering
 *
 * Control Flow Components:
 * - For: iteration over array data
 * - If: conditional rendering
 * - Switch: multi-branch selection
 * - Case: individual case branch for Switch
 *
 * Layout Components:
 * - Flex: horizontal flexbox container
 * - Stack: vertical or horizontal container
 * - Spacer: empty space for layout purposes
 * - Layout: root container
 * - Fragment: grouping element without creating a container
 *
 * Each test verifies:
 * 1. Correct node type is returned
 * 2. Props are properly applied
 * 3. Children are properly handled
 * 4. Default values work correctly
 */

import { describe, it, expect } from 'vitest';

// Content Components
import { Template } from '../content/Template';
import { Text } from '../content/Text';

// Control Flow Components
import { For } from '../controls/For';
import { If } from '../controls/If';
import { Switch } from '../controls/Switch';
import { Case } from '../controls/Case';

// Layout Components
import { Flex } from '../layout/Flex';
import { Stack } from '../layout/Stack';
import { Spacer } from '../layout/Spacer';
import { Layout } from '../layout/Layout';
import { Fragment } from '../layout/Fragment';

// Types
import type {
  LayoutNode,
  StackNode,
  FlexNode,
  TextNode,
  SpacerNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
} from '../../../layout/nodes';

// ==================== CONTENT COMPONENTS ====================

describe('Content Components', () => {
  describe('Template', () => {
    describe('node type', () => {
      it('should return a template node', () => {
        const result = Template({ template: 'Hello {{name}}!' });
        expect(result.type).toBe('template');
      });
    });

    describe('props application', () => {
      it('should apply template prop', () => {
        const result = Template({ template: 'Hello {{name}}!' }) as TemplateNode;
        expect(result.template).toBe('Hello {{name}}!');
      });

      it('should apply align prop', () => {
        const result = Template({ template: '{{value}}', align: 'center' }) as TemplateNode;
        expect(result.align).toBe('center');
      });

      it('should apply data prop', () => {
        const data = { name: 'World', count: 42 };
        const result = Template({ template: '{{name}}: {{count}}', data }) as TemplateNode;
        expect(result.data).toEqual(data);
      });

      it('should apply style props', () => {
        const result = Template({
          template: 'test',
          style: { width: 100, bold: true },
        }) as TemplateNode;
        expect(result.width).toBe(100);
        expect(result.bold).toBe(true);
      });

      it('should apply all alignment options', () => {
        const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
        for (const align of alignments) {
          const result = Template({ template: 'test', align }) as TemplateNode;
          expect(result.align).toBe(align);
        }
      });
    });

    describe('default values', () => {
      it('should not set align when not provided', () => {
        const result = Template({ template: 'test' }) as TemplateNode;
        expect(result.align).toBeUndefined();
      });

      it('should not set data when not provided', () => {
        const result = Template({ template: 'test' }) as TemplateNode;
        expect(result.data).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty template string', () => {
        const result = Template({ template: '' }) as TemplateNode;
        expect(result.template).toBe('');
      });

      it('should handle template with multiple variables', () => {
        const result = Template({
          template: '{{greeting}}, {{name}}! You have {{count}} messages.',
        }) as TemplateNode;
        expect(result.template).toBe('{{greeting}}, {{name}}! You have {{count}} messages.');
      });

      it('should handle template with nested path variables', () => {
        const result = Template({
          template: '{{user.name}} - {{order.items[0].name}}',
        }) as TemplateNode;
        expect(result.template).toBe('{{user.name}} - {{order.items[0].name}}');
      });
    });
  });

  describe('Text', () => {
    describe('node type', () => {
      it('should return a text node', () => {
        const result = Text({ children: 'Hello' });
        expect(result.type).toBe('text');
      });
    });

    describe('props application', () => {
      it('should apply string children as content', () => {
        const result = Text({ children: 'Hello World' }) as TextNode;
        expect(result.content).toBe('Hello World');
      });

      it('should apply number children as content', () => {
        const result = Text({ children: 42 }) as TextNode;
        expect(result.content).toBe('42');
      });

      it('should apply align prop', () => {
        const result = Text({ children: 'Test', align: 'right' }) as TextNode;
        expect(result.align).toBe('right');
      });

      it('should apply overflow prop', () => {
        const result = Text({ children: 'Long text', overflow: 'ellipsis' }) as TextNode;
        expect(result.overflow).toBe('ellipsis');
      });

      it('should apply style props', () => {
        const result = Text({
          children: 'Styled',
          style: { bold: true, italic: true, width: 50 },
        }) as TextNode;
        expect(result.bold).toBe(true);
        expect(result.italic).toBe(true);
        expect(result.width).toBe(50);
      });

      it('should apply all alignment options', () => {
        const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
        for (const align of alignments) {
          const result = Text({ children: 'test', align }) as TextNode;
          expect(result.align).toBe(align);
        }
      });

      it('should apply all overflow options', () => {
        const overflows: Array<'visible' | 'clip' | 'ellipsis'> = ['visible', 'clip', 'ellipsis'];
        for (const overflow of overflows) {
          const result = Text({ children: 'test', overflow }) as TextNode;
          expect(result.overflow).toBe(overflow);
        }
      });
    });

    describe('children handling', () => {
      it('should handle array of string children', () => {
        const result = Text({ children: ['Hello', ' ', 'World'] as unknown as string }) as TextNode;
        expect(result.content).toBe('Hello World');
      });

      it('should handle undefined children', () => {
        const result = Text({} as { children?: string }) as TextNode;
        expect(result.content).toBe('');
      });
    });

    describe('default values', () => {
      it('should not set align when not provided', () => {
        const result = Text({ children: 'Test' }) as TextNode;
        expect(result.align).toBeUndefined();
      });

      it('should not set overflow when not provided', () => {
        const result = Text({ children: 'Test' }) as TextNode;
        expect(result.overflow).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty string children', () => {
        const result = Text({ children: '' }) as TextNode;
        expect(result.content).toBe('');
      });

      it('should handle whitespace-only content', () => {
        const result = Text({ children: '   ' }) as TextNode;
        expect(result.content).toBe('   ');
      });

      it('should handle newline characters', () => {
        const result = Text({ children: 'Line1\nLine2' }) as TextNode;
        expect(result.content).toBe('Line1\nLine2');
      });

      it('should handle zero as content', () => {
        // NOTE: Due to the current implementation using truthy check for children,
        // zero (being falsy) is treated as no children. This is a known limitation.
        // The direct createElement('Text', null, 0) works correctly, but the
        // Text component wrapper has this behavior.
        const result = Text({ children: 0 }) as TextNode;
        expect(result.content).toBe('');
      });
    });
  });
});

// ==================== CONTROL FLOW COMPONENTS ====================

describe('Control Flow Components', () => {
  describe('For', () => {
    describe('node type', () => {
      it('should return an each node', () => {
        const result = For({ items: 'users' });
        expect(result.type).toBe('each');
      });
    });

    describe('props application', () => {
      it('should apply items prop', () => {
        const result = For({ items: 'order.lineItems' }) as EachNode;
        expect(result.items).toBe('order.lineItems');
      });

      it('should apply as prop', () => {
        const result = For({ items: 'users', as: 'user' }) as EachNode;
        expect(result.as).toBe('user');
      });

      it('should apply indexAs prop', () => {
        const result = For({ items: 'items', indexAs: 'idx' }) as EachNode;
        expect(result.indexAs).toBe('idx');
      });

      it('should apply empty prop', () => {
        const emptyNode: TextNode = { type: 'text', content: 'No items found' };
        const result = For({ items: 'items', empty: emptyNode }) as EachNode;
        expect(result.empty).toBe(emptyNode);
      });

      it('should apply separator prop', () => {
        const separatorNode: SpacerNode = { type: 'spacer', height: 10 };
        const result = For({ items: 'items', separator: separatorNode }) as EachNode;
        expect(result.separator).toBe(separatorNode);
      });

      it('should apply style props', () => {
        const result = For({
          items: 'items',
          style: { padding: 10, gap: 5 },
        }) as EachNode;
        expect(result.padding).toBe(10);
      });
    });

    describe('children handling', () => {
      it('should set render from children', () => {
        const renderTemplate: TextNode = { type: 'text', content: '{{item.name}}' };
        const result = For({ items: 'items', children: renderTemplate }) as EachNode;
        expect(result.render).toBe(renderTemplate);
      });

      it('should handle array children', () => {
        const child1: TextNode = { type: 'text', content: 'A' };
        const child2: TextNode = { type: 'text', content: 'B' };
        const result = For({ items: 'items', children: [child1, child2] }) as EachNode;
        // First child becomes the render template
        expect(result.render).toBe(child1);
      });

      it('should use empty spacer when no children provided', () => {
        const result = For({ items: 'items' }) as EachNode;
        expect(result.render.type).toBe('spacer');
        expect((result.render as SpacerNode).width).toBe(0);
        expect((result.render as SpacerNode).height).toBe(0);
      });
    });

    describe('default values', () => {
      it('should not set as when not provided', () => {
        const result = For({ items: 'items' }) as EachNode;
        expect(result.as).toBeUndefined();
      });

      it('should not set indexAs when not provided', () => {
        const result = For({ items: 'items' }) as EachNode;
        expect(result.indexAs).toBeUndefined();
      });

      it('should not set empty when not provided', () => {
        const result = For({ items: 'items' }) as EachNode;
        expect(result.empty).toBeUndefined();
      });

      it('should not set separator when not provided', () => {
        const result = For({ items: 'items' }) as EachNode;
        expect(result.separator).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle nested path items', () => {
        const result = For({ items: 'data.categories[0].products' }) as EachNode;
        expect(result.items).toBe('data.categories[0].products');
      });

      it('should handle all props together', () => {
        const renderNode: TextNode = { type: 'text', content: '{{item}}' };
        const emptyNode: TextNode = { type: 'text', content: 'Empty' };
        const separatorNode: SpacerNode = { type: 'spacer', height: 5 };

        const result = For({
          items: 'items',
          as: 'item',
          indexAs: 'i',
          empty: emptyNode,
          separator: separatorNode,
          children: renderNode,
        }) as EachNode;

        expect(result.items).toBe('items');
        expect(result.as).toBe('item');
        expect(result.indexAs).toBe('i');
        expect(result.empty).toBe(emptyNode);
        expect(result.separator).toBe(separatorNode);
        expect(result.render).toBe(renderNode);
      });
    });
  });

  describe('If', () => {
    describe('node type', () => {
      it('should return a conditional node', () => {
        const result = If({ condition: { path: 'active', operator: 'eq', value: true } });
        expect(result.type).toBe('conditional');
      });
    });

    describe('props application', () => {
      it('should apply DataCondition condition', () => {
        const condition = { path: 'user.active', operator: 'eq' as const, value: true };
        const result = If({ condition }) as ConditionalNode;
        expect(result.condition).toBe(condition);
      });

      it('should apply function condition', () => {
        const condition = (ctx: { data: unknown }) => ctx.data !== null;
        const result = If({ condition }) as ConditionalNode;
        expect(result.condition).toBe(condition);
      });

      it('should apply else prop', () => {
        const elseNode: TextNode = { type: 'text', content: 'No' };
        const result = If({
          condition: { path: 'test', operator: 'exists' },
          else: elseNode,
        }) as ConditionalNode;
        expect(result.else).toBe(elseNode);
      });

      it('should handle all DataCondition operators', () => {
        const operators = [
          'eq',
          'neq',
          'gt',
          'gte',
          'lt',
          'lte',
          'in',
          'notIn',
          'exists',
          'notExists',
          'empty',
          'notEmpty',
        ] as const;

        for (const operator of operators) {
          const result = If({
            condition: { path: 'test', operator, value: 'test' },
          }) as ConditionalNode;
          expect((result.condition as { operator: string }).operator).toBe(operator);
        }
      });
    });

    describe('children handling', () => {
      it('should set then from children', () => {
        const thenNode: TextNode = { type: 'text', content: 'Yes' };
        const result = If({
          condition: { path: 'test', operator: 'exists' },
          children: thenNode,
        }) as ConditionalNode;
        expect(result.then).toBe(thenNode);
      });

      it('should handle array children', () => {
        const child: TextNode = { type: 'text', content: 'Content' };
        const result = If({
          condition: { path: 'test', operator: 'exists' },
          children: [child],
        }) as ConditionalNode;
        expect(result.then).toBe(child);
      });

      it('should use empty spacer when no children provided', () => {
        const result = If({
          condition: { path: 'test', operator: 'exists' },
        }) as ConditionalNode;
        expect(result.then.type).toBe('spacer');
        expect((result.then as SpacerNode).width).toBe(0);
        expect((result.then as SpacerNode).height).toBe(0);
      });
    });

    describe('default values', () => {
      it('should not set else when not provided', () => {
        const result = If({
          condition: { path: 'test', operator: 'exists' },
        }) as ConditionalNode;
        expect(result.else).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle complex path in condition', () => {
        const condition = {
          path: 'order.customer.address.city',
          operator: 'eq' as const,
          value: 'NYC',
        };
        const result = If({ condition }) as ConditionalNode;
        expect((result.condition as { path: string }).path).toBe('order.customer.address.city');
      });

      it('should handle array value in condition', () => {
        const condition = { path: 'status', operator: 'in' as const, value: ['active', 'pending'] };
        const result = If({ condition }) as ConditionalNode;
        expect((result.condition as { value: unknown }).value).toEqual(['active', 'pending']);
      });
    });
  });

  describe('Switch', () => {
    describe('node type', () => {
      it('should return a switch node', () => {
        const result = Switch({ path: 'status' });
        expect(result.type).toBe('switch');
      });
    });

    describe('props application', () => {
      it('should apply path prop', () => {
        const result = Switch({ path: 'user.role' }) as SwitchNode;
        expect(result.path).toBe('user.role');
      });

      it('should apply default prop', () => {
        const defaultNode: TextNode = { type: 'text', content: 'Unknown' };
        const result = Switch({ path: 'status', default: defaultNode }) as SwitchNode;
        expect(result.default).toBe(defaultNode);
      });
    });

    describe('children handling', () => {
      it('should extract cases from Case children', () => {
        const caseNode1 = Case({
          value: 'active',
          children: { type: 'text', content: 'Active' } as TextNode,
        });
        const caseNode2 = Case({
          value: 'inactive',
          children: { type: 'text', content: 'Inactive' } as TextNode,
        });

        const result = Switch({ path: 'status', children: [caseNode1, caseNode2] }) as SwitchNode;

        expect(result.cases).toHaveLength(2);
        expect(result.cases[0].value).toBe('active');
        expect(result.cases[1].value).toBe('inactive');
      });

      it('should filter out non-Case children', () => {
        const caseNode = Case({
          value: 'test',
          children: { type: 'text', content: 'Test' } as TextNode,
        });
        const textNode: TextNode = { type: 'text', content: 'Not a case' };

        const result = Switch({ path: 'status', children: [caseNode, textNode] }) as SwitchNode;

        expect(result.cases).toHaveLength(1);
      });

      it('should handle empty children', () => {
        const result = Switch({ path: 'status' }) as SwitchNode;
        expect(result.cases).toEqual([]);
      });
    });

    describe('default values', () => {
      it('should not set default when not provided', () => {
        const result = Switch({ path: 'status' }) as SwitchNode;
        expect(result.default).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle nested path', () => {
        const result = Switch({ path: 'order.status.code' }) as SwitchNode;
        expect(result.path).toBe('order.status.code');
      });
    });
  });

  describe('Case', () => {
    describe('node type', () => {
      it('should return a spacer node (case marker)', () => {
        const result = Case({ value: 'active' });
        expect(result.type).toBe('spacer');
      });

      it('should have __case marker set to true', () => {
        const result = Case({ value: 'active' }) as SpacerNode & { __case: boolean };
        expect(result.__case).toBe(true);
      });
    });

    describe('props application', () => {
      it('should apply single value', () => {
        const result = Case({ value: 'active' }) as SpacerNode & { __value: unknown };
        expect(result.__value).toBe('active');
      });

      it('should apply array of values', () => {
        const result = Case({ value: ['active', 'enabled', 'on'] }) as SpacerNode & {
          __value: unknown;
        };
        expect(result.__value).toEqual(['active', 'enabled', 'on']);
      });

      it('should apply numeric value', () => {
        const result = Case({ value: 42 }) as SpacerNode & { __value: unknown };
        expect(result.__value).toBe(42);
      });

      it('should apply boolean value', () => {
        const result = Case({ value: true }) as SpacerNode & { __value: unknown };
        expect(result.__value).toBe(true);
      });

      it('should apply null value', () => {
        const result = Case({ value: null }) as SpacerNode & { __value: unknown };
        expect(result.__value).toBe(null);
      });
    });

    describe('children handling', () => {
      it('should set __then from children', () => {
        const thenNode: TextNode = { type: 'text', content: 'Active Status' };
        const result = Case({ value: 'active', children: thenNode }) as SpacerNode & {
          __then: LayoutNode;
        };
        expect(result.__then).toBe(thenNode);
      });

      it('should handle array children', () => {
        const child: TextNode = { type: 'text', content: 'Content' };
        const result = Case({ value: 'active', children: [child] }) as SpacerNode & {
          __then: LayoutNode;
        };
        expect(result.__then).toBe(child);
      });

      it('should use empty spacer when no children provided', () => {
        const result = Case({ value: 'active' }) as SpacerNode & { __then: LayoutNode };
        expect(result.__then.type).toBe('spacer');
        expect((result.__then as SpacerNode).width).toBe(0);
        expect((result.__then as SpacerNode).height).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle object value', () => {
        const objectValue = { status: 'active', priority: 1 };
        const result = Case({ value: objectValue }) as SpacerNode & { __value: unknown };
        expect(result.__value).toEqual(objectValue);
      });

      it('should handle empty array value', () => {
        const result = Case({ value: [] }) as SpacerNode & { __value: unknown };
        expect(result.__value).toEqual([]);
      });
    });
  });
});

// ==================== LAYOUT COMPONENTS ====================

describe('Layout Components', () => {
  describe('Flex', () => {
    describe('node type', () => {
      it('should return a flex node', () => {
        const result = Flex({});
        expect(result.type).toBe('flex');
      });
    });

    describe('props application', () => {
      it('should apply justifyContent from style', () => {
        const result = Flex({ style: { justifyContent: 'space-between' } }) as FlexNode;
        expect(result.justify).toBe('space-between');
      });

      it('should apply alignItems from style', () => {
        const result = Flex({ style: { alignItems: 'center' } }) as FlexNode;
        expect(result.alignItems).toBe('center');
      });

      it('should apply gap from style', () => {
        const result = Flex({ style: { gap: 20 } }) as FlexNode;
        expect(result.gap).toBe(20);
      });

      it('should apply dimension styles', () => {
        const result = Flex({ style: { width: 300, height: 100 } }) as FlexNode;
        expect(result.width).toBe(300);
        expect(result.height).toBe(100);
      });

      it('should apply text styles', () => {
        const result = Flex({ style: { bold: true, italic: true } }) as FlexNode;
        expect(result.bold).toBe(true);
        expect(result.italic).toBe(true);
      });

      it('should apply all justifyContent options', () => {
        const options: Array<
          'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
        > = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'];
        for (const justifyContent of options) {
          const result = Flex({ style: { justifyContent } }) as FlexNode;
          expect(result.justify).toBe(justifyContent);
        }
      });

      it('should apply all alignItems options', () => {
        const options: Array<'top' | 'center' | 'bottom'> = ['top', 'center', 'bottom'];
        for (const alignItems of options) {
          const result = Flex({ style: { alignItems } }) as FlexNode;
          expect(result.alignItems).toBe(alignItems);
        }
      });
    });

    describe('children handling', () => {
      it('should include children in flex node', () => {
        const child: TextNode = { type: 'text', content: 'Child' };
        const result = Flex({ children: child }) as FlexNode;
        expect(result.children).toHaveLength(1);
        expect(result.children[0]).toBe(child);
      });

      it('should handle array children', () => {
        const child1: TextNode = { type: 'text', content: 'A' };
        const child2: TextNode = { type: 'text', content: 'B' };
        const result = Flex({ children: [child1, child2] }) as FlexNode;
        expect(result.children).toHaveLength(2);
      });

      it('should handle no children', () => {
        const result = Flex({}) as FlexNode;
        expect(result.children).toEqual([]);
      });
    });

    describe('default values', () => {
      it('should not set justify when not provided', () => {
        const result = Flex({}) as FlexNode;
        expect(result.justify).toBeUndefined();
      });

      it('should not set alignItems when not provided', () => {
        const result = Flex({}) as FlexNode;
        expect(result.alignItems).toBeUndefined();
      });

      it('should not set gap when not provided', () => {
        const result = Flex({}) as FlexNode;
        expect(result.gap).toBeUndefined();
      });
    });
  });

  describe('Stack', () => {
    describe('node type', () => {
      it('should return a stack node', () => {
        const result = Stack({});
        expect(result.type).toBe('stack');
      });
    });

    describe('props application', () => {
      it('should apply direction prop', () => {
        const result = Stack({ direction: 'row' }) as StackNode;
        expect(result.direction).toBe('row');
      });

      it('should apply align prop', () => {
        const result = Stack({ align: 'center' }) as StackNode;
        expect(result.align).toBe('center');
      });

      it('should apply vAlign prop', () => {
        const result = Stack({ vAlign: 'bottom' }) as StackNode;
        expect(result.vAlign).toBe('bottom');
      });

      it('should apply gap from style', () => {
        const result = Stack({ style: { gap: 15 } }) as StackNode;
        expect(result.gap).toBe(15);
      });

      it('should apply flexDirection from style', () => {
        const result = Stack({ style: { flexDirection: 'row' } }) as StackNode;
        expect(result.direction).toBe('row');
      });

      it('should prefer direction prop over style.flexDirection', () => {
        const result = Stack({
          direction: 'column',
          style: { flexDirection: 'row' },
        }) as StackNode;
        expect(result.direction).toBe('column');
      });

      it('should apply dimension styles', () => {
        const result = Stack({ style: { width: 200, height: 150 } }) as StackNode;
        expect(result.width).toBe(200);
        expect(result.height).toBe(150);
      });

      it('should apply text styles', () => {
        const result = Stack({ style: { bold: true, underline: true } }) as StackNode;
        expect(result.bold).toBe(true);
        expect(result.underline).toBe(true);
      });

      it('should apply all direction options', () => {
        const directions: Array<'column' | 'row'> = ['column', 'row'];
        for (const direction of directions) {
          const result = Stack({ direction }) as StackNode;
          expect(result.direction).toBe(direction);
        }
      });

      it('should apply all align options', () => {
        const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
        for (const align of alignments) {
          const result = Stack({ align }) as StackNode;
          expect(result.align).toBe(align);
        }
      });

      it('should apply all vAlign options', () => {
        const alignments: Array<'top' | 'center' | 'bottom'> = ['top', 'center', 'bottom'];
        for (const vAlign of alignments) {
          const result = Stack({ vAlign }) as StackNode;
          expect(result.vAlign).toBe(vAlign);
        }
      });
    });

    describe('children handling', () => {
      it('should include children in stack node', () => {
        const child: TextNode = { type: 'text', content: 'Child' };
        const result = Stack({ children: child }) as StackNode;
        expect(result.children).toHaveLength(1);
        expect(result.children[0]).toBe(child);
      });

      it('should handle array children', () => {
        const child1: TextNode = { type: 'text', content: 'A' };
        const child2: TextNode = { type: 'text', content: 'B' };
        const result = Stack({ children: [child1, child2] }) as StackNode;
        expect(result.children).toHaveLength(2);
      });

      it('should handle no children', () => {
        const result = Stack({}) as StackNode;
        expect(result.children).toEqual([]);
      });
    });

    describe('default values', () => {
      it('should default direction to column', () => {
        const result = Stack({}) as StackNode;
        expect(result.direction).toBe('column');
      });

      it('should not set align when not provided', () => {
        const result = Stack({}) as StackNode;
        expect(result.align).toBeUndefined();
      });

      it('should not set vAlign when not provided', () => {
        const result = Stack({}) as StackNode;
        expect(result.vAlign).toBeUndefined();
      });

      it('should not set gap when not provided', () => {
        const result = Stack({}) as StackNode;
        expect(result.gap).toBeUndefined();
      });
    });
  });

  describe('Spacer', () => {
    describe('node type', () => {
      it('should return a spacer node', () => {
        const result = Spacer();
        expect(result.type).toBe('spacer');
      });

      it('should return a spacer node with empty props', () => {
        const result = Spacer({});
        expect(result.type).toBe('spacer');
      });
    });

    describe('props application', () => {
      it('should apply width from style', () => {
        const result = Spacer({ style: { width: 50 } }) as SpacerNode;
        expect(result.width).toBe(50);
      });

      it('should apply height from style', () => {
        const result = Spacer({ style: { height: 30 } }) as SpacerNode;
        expect(result.height).toBe(30);
      });

      it('should apply flex prop', () => {
        const result = Spacer({ flex: true }) as SpacerNode;
        expect(result.flex).toBe(true);
      });

      it('should apply flex false explicitly', () => {
        const result = Spacer({ flex: false }) as SpacerNode;
        expect(result.flex).toBe(false);
      });
    });

    describe('default values', () => {
      it('should default flex to true when no dimensions provided', () => {
        const result = Spacer() as SpacerNode;
        expect(result.flex).toBe(true);
      });

      it('should default flex to false when width is provided', () => {
        const result = Spacer({ style: { width: 50 } }) as SpacerNode;
        expect(result.flex).toBe(false);
      });

      it('should default flex to false when height is provided', () => {
        const result = Spacer({ style: { height: 30 } }) as SpacerNode;
        expect(result.flex).toBe(false);
      });

      it('should respect explicit flex prop even with dimensions', () => {
        const result = Spacer({ style: { width: 50 }, flex: true }) as SpacerNode;
        expect(result.flex).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle zero dimensions', () => {
        const result = Spacer({ style: { width: 0, height: 0 } }) as SpacerNode;
        expect(result.width).toBe(0);
        expect(result.height).toBe(0);
      });

      it('should handle only width', () => {
        const result = Spacer({ style: { width: 100 } }) as SpacerNode;
        expect(result.width).toBe(100);
        expect(result.height).toBeUndefined();
      });

      it('should handle only height', () => {
        const result = Spacer({ style: { height: 50 } }) as SpacerNode;
        expect(result.width).toBeUndefined();
        expect(result.height).toBe(50);
      });
    });
  });

  describe('Layout', () => {
    describe('node type', () => {
      it('should return a stack node', () => {
        const result = Layout({});
        expect(result.type).toBe('stack');
      });
    });

    describe('props application', () => {
      it('should apply width from style', () => {
        const result = Layout({ style: { width: 400 } }) as StackNode;
        expect(result.width).toBe(400);
      });

      it('should apply height from style', () => {
        const result = Layout({ style: { height: 300 } }) as StackNode;
        expect(result.height).toBe(300);
      });

      it('should apply padding from style', () => {
        const result = Layout({ style: { padding: 20 } }) as StackNode;
        expect(result.padding).toBe(20);
      });

      it('should apply margin from style', () => {
        const result = Layout({ style: { margin: 10 } }) as StackNode;
        expect(result.margin).toBe(10);
      });

      it('should apply text styles', () => {
        const result = Layout({ style: { bold: true, cpi: 12 } }) as StackNode;
        expect(result.bold).toBe(true);
        expect(result.cpi).toBe(12);
      });
    });

    describe('children handling', () => {
      it('should include children in layout node', () => {
        const child: TextNode = { type: 'text', content: 'Content' };
        const result = Layout({ children: child }) as StackNode;
        expect(result.children).toHaveLength(1);
        expect(result.children[0]).toBe(child);
      });

      it('should handle array children', () => {
        const child1: TextNode = { type: 'text', content: 'A' };
        const child2: TextNode = { type: 'text', content: 'B' };
        const result = Layout({ children: [child1, child2] }) as StackNode;
        expect(result.children).toHaveLength(2);
      });

      it('should handle no children', () => {
        const result = Layout({}) as StackNode;
        expect(result.children).toEqual([]);
      });
    });

    describe('default values', () => {
      it('should default direction to column', () => {
        const result = Layout({}) as StackNode;
        expect(result.direction).toBe('column');
      });
    });
  });

  describe('Fragment', () => {
    describe('symbol identity', () => {
      it('should be a symbol', () => {
        expect(typeof Fragment).toBe('symbol');
      });

      it('should have the correct symbol key', () => {
        expect(Fragment).toBe(Symbol.for('escp.fragment'));
      });

      it('should be consistent across multiple accesses', () => {
        expect(Fragment).toBe(Symbol.for('escp.fragment'));
        expect(Fragment).toBe(Fragment);
      });
    });

    describe('re-export', () => {
      it('should be exported from layout/Fragment', () => {
        expect(Fragment).toBeDefined();
      });
    });
  });
});

// ==================== INTEGRATION TESTS ====================

describe('Component Integration', () => {
  describe('nested components', () => {
    it('should create a complete layout with multiple component types', () => {
      const textChild: TextNode = { type: 'text', content: 'Hello' };
      const spacerChild: SpacerNode = { type: 'spacer', flex: true };

      const flexResult = Flex({
        style: { justifyContent: 'space-between' },
        children: [textChild, spacerChild],
      }) as FlexNode;

      const layoutResult = Layout({
        style: { width: 300, padding: 10 },
        children: flexResult,
      }) as StackNode;

      expect(layoutResult.type).toBe('stack');
      expect(layoutResult.width).toBe(300);
      expect(layoutResult.children).toHaveLength(1);
      expect((layoutResult.children[0] as FlexNode).type).toBe('flex');
    });

    it('should create conditional layout with Switch and Case', () => {
      const activeCase = Case({
        value: 'active',
        children: { type: 'text', content: 'Active' } as TextNode,
      });
      const inactiveCase = Case({
        value: 'inactive',
        children: { type: 'text', content: 'Inactive' } as TextNode,
      });

      const switchResult = Switch({
        path: 'status',
        default: { type: 'text', content: 'Unknown' } as TextNode,
        children: [activeCase, inactiveCase],
      }) as SwitchNode;

      expect(switchResult.type).toBe('switch');
      expect(switchResult.cases).toHaveLength(2);
      expect(switchResult.default).toBeDefined();
    });

    it('should create iteration layout with For', () => {
      const templateChild: TemplateNode = {
        type: 'template',
        template: '{{item.name}}',
      };

      const forResult = For({
        items: 'products',
        as: 'item',
        indexAs: 'idx',
        empty: { type: 'text', content: 'No products' } as TextNode,
        children: templateChild,
      }) as EachNode;

      expect(forResult.type).toBe('each');
      expect(forResult.items).toBe('products');
      expect(forResult.render).toBe(templateChild);
    });

    it('should create conditional layout with If', () => {
      const thenChild: TextNode = { type: 'text', content: 'Visible' };
      const elseChild: TextNode = { type: 'text', content: 'Hidden' };

      const ifResult = If({
        condition: { path: 'isVisible', operator: 'eq', value: true },
        else: elseChild,
        children: thenChild,
      }) as ConditionalNode;

      expect(ifResult.type).toBe('conditional');
      expect(ifResult.then).toBe(thenChild);
      expect(ifResult.else).toBe(elseChild);
    });
  });

  describe('style inheritance patterns', () => {
    it('should apply styles at different nesting levels', () => {
      const innerStack = Stack({
        style: { bold: true },
        children: { type: 'text', content: 'Inner' } as TextNode,
      }) as StackNode;

      const outerLayout = Layout({
        style: { italic: true },
        children: innerStack,
      }) as StackNode;

      expect(outerLayout.italic).toBe(true);
      expect((outerLayout.children[0] as StackNode).bold).toBe(true);
    });
  });
});

// ==================== EDGE CASES ====================

describe('Edge Cases', () => {
  describe('empty and null handling', () => {
    it('should handle Stack with undefined style', () => {
      const result = Stack({ style: undefined }) as StackNode;
      expect(result.type).toBe('stack');
    });

    it('should handle Flex with undefined style', () => {
      const result = Flex({ style: undefined }) as FlexNode;
      expect(result.type).toBe('flex');
    });

    it('should handle Layout with undefined style', () => {
      const result = Layout({ style: undefined }) as StackNode;
      expect(result.type).toBe('stack');
    });
  });

  describe('special values', () => {
    it('should handle zero values in dimensions', () => {
      const result = Stack({
        style: { width: 0, height: 0, gap: 0, padding: 0 },
      }) as StackNode;
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.gap).toBe(0);
      expect(result.padding).toBe(0);
    });

    it('should handle percentage width', () => {
      const result = Stack({
        style: { width: '50%' as unknown as number },
      }) as StackNode;
      expect(result.width).toBe('50%');
    });

    it('should handle fill width', () => {
      const result = Stack({
        style: { width: 'fill' as unknown as number },
      }) as StackNode;
      expect(result.width).toBe('fill');
    });
  });

  describe('complex style combinations', () => {
    it('should handle all positioning props', () => {
      const result = Stack({
        style: {
          position: 'absolute',
          left: 100,
          top: 50,
        },
      }) as StackNode;
      expect(result.position).toBe('absolute');
      expect(result.posX).toBe(100);
      expect(result.posY).toBe(50);
    });

    it('should handle relative positioning with offsets', () => {
      const result = Stack({
        style: {
          position: 'relative',
          offsetX: 10,
          offsetY: 20,
        },
      }) as StackNode;
      expect(result.position).toBe('relative');
      expect(result.offsetX).toBe(10);
      expect(result.offsetY).toBe(20);
    });

    it('should handle flex properties', () => {
      const result = Stack({
        style: {
          flexGrow: 1,
          flexShrink: 0,
          flexBasis: 100,
        },
      }) as StackNode;
      expect(result.flexGrow).toBe(1);
      expect(result.flexShrink).toBe(0);

      // ==================== BADGE COMPONENT TESTS ====================

      import { Badge } from '../typography/Badge';
      import { Label } from '../typography/Label';
      import type { TextNode, FlexNode } from '../../../layout/nodes';

      describe('Badge', () => {
        describe('basic functionality', () => {
          it('should wrap content in brackets', () => {
            const result = Badge({ children: 'ACTIVE' }) as TextNode;
            expect(result.type).toBe('text');
            expect(result.content).toBe('[ACTIVE]');
          });

          it('should handle string children', () => {
            const result = Badge({ children: 'STATUS' }) as TextNode;
            expect(result.content).toBe('[STATUS]');
          });

          it('should apply variant styles', () => {
            const success = Badge({ variant: 'success', children: 'OK' }) as TextNode;
            expect(success.bold).toBe(true);

            const warning = Badge({ variant: 'warning', children: 'WARN' }) as TextNode;
            expect(warning.italic).toBe(true);
          });
        });

        describe('[[object Object]] bug fix', () => {
          it('should NOT produce [object Object] when children is a TextNode array', () => {
            // This simulates what happens when Badge is used in JSX
            // JSX transforms children into LayoutNode arrays via flattenChildren
            const textNode: TextNode = { type: 'text', content: 'ACTIVE' };
            const result = Badge({ children: [textNode] as unknown as string }) as TextNode;

            // Should extract text content from TextNode, not stringify the object
            expect(result.content).not.toContain('[object Object]');
            expect(result.content).toBe('[ACTIVE]');
          });

          it('should handle mixed children (strings and TextNodes)', () => {
            const textNode: TextNode = { type: 'text', content: 'PAID' };
            // When JSX has multiple children they become an array
            const result = Badge({ children: [textNode] as unknown as string }) as TextNode;

            expect(result.content).toBe('[PAID]');
          });
        });
      });

      describe('Label with Badge children', () => {
        it('should properly render Badge as value content', () => {
          // Simulate JSX: <Label label="Status"><Badge>ACTIVE</Badge></Label>
          // Badge returns a TextNode, which becomes children for Label
          const badgeResult = Badge({ children: 'ACTIVE' }) as TextNode;
          const result = Label({
            label: 'Status',
            labelWidth: 100,
            children: badgeResult,
          }) as FlexNode;

          expect(result.type).toBe('flex');
          expect(result.children.length).toBe(2);

          // Second child should be the Badge's TextNode
          const valueNode = result.children[1] as TextNode;
          expect(valueNode.type).toBe('text');
          expect(valueNode.content).toBe('[ACTIVE]');
          expect(valueNode.content).not.toContain('[object Object]');
        });
      });
      expect(result.flexBasis).toBe(100);
    });

    it('should handle all text styles', () => {
      const result = Stack({
        style: {
          bold: true,
          italic: true,
          underline: true,
          doubleStrike: true,
          doubleWidth: true,
          doubleHeight: true,
          condensed: true,
          cpi: 12,
          typeface: 'roman',
          printQuality: 'lq',
        },
      }) as StackNode;
      expect(result.bold).toBe(true);
      expect(result.italic).toBe(true);
      expect(result.underline).toBe(true);
      expect(result.doubleStrike).toBe(true);
      expect(result.doubleWidth).toBe(true);
      expect(result.doubleHeight).toBe(true);
      expect(result.condensed).toBe(true);
      expect(result.cpi).toBe(12);
      expect(result.typeface).toBe('roman');
      expect(result.printQuality).toBe('lq');
    });
  });
});
