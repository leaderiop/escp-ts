/**
 * Tests for JSX Element Factory (createElement.ts)
 *
 * Comprehensive tests for:
 * - createElement function (main JSX factory)
 * - jsx, jsxs, jsxDEV runtime exports
 * - Fragment handling
 * - Intrinsic elements: Stack, Flex, Text, Spacer, Line, Layout, Template, If, Switch, Case, For
 * - Function components
 * - Children handling (strings, numbers, nested arrays, null/undefined filtering)
 * - Node creation functions
 * - Style and layout prop application
 */

import { describe, it, expect } from 'vitest';
import { createElement, jsx, jsxs, jsxDEV, Fragment } from '../createElement';
import type {
  LayoutNode,
  StackNode,
  FlexNode,
  TextNode,
  SpacerNode,
  LineNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
} from '../../layout/nodes';
import type { FunctionComponent, NodeStyle } from '../types';

// ==================== FRAGMENT TESTS ====================

describe('Fragment', () => {
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

// ==================== JSX RUNTIME EXPORTS ====================

describe('JSX Runtime Exports', () => {
  describe('jsx', () => {
    it('should be the same as createElement', () => {
      expect(jsx).toBe(createElement);
    });

    it('should create elements correctly', () => {
      const result = jsx('Text', { children: 'Hello' }) as TextNode;
      expect(result.type).toBe('text');
      expect(result.content).toBe('Hello');
    });
  });

  describe('jsxs', () => {
    it('should be the same as createElement', () => {
      expect(jsxs).toBe(createElement);
    });

    it('should create elements with multiple children', () => {
      const result = jsxs('Stack', {
        children: [
          { type: 'text', content: 'A' },
          { type: 'text', content: 'B' },
        ],
      }) as StackNode;
      expect(result.type).toBe('stack');
      expect(result.children).toHaveLength(2);
    });
  });

  describe('jsxDEV', () => {
    it('should be the same as createElement', () => {
      expect(jsxDEV).toBe(createElement);
    });

    it('should create elements correctly in dev mode', () => {
      const result = jsxDEV('Spacer', { style: { width: 10 } }) as SpacerNode;
      expect(result.type).toBe('spacer');
      expect(result.width).toBe(10);
    });
  });
});

// ==================== FRAGMENT ELEMENT CREATION ====================

describe('createElement with Fragment', () => {
  it('should return empty array for fragment with no children', () => {
    const result = createElement(Fragment, null);
    expect(result).toEqual([]);
  });

  it('should return array of children for fragment', () => {
    const child1: TextNode = { type: 'text', content: 'A' };
    const child2: TextNode = { type: 'text', content: 'B' };
    const result = createElement(Fragment, null, child1, child2);
    expect(result).toEqual([child1, child2]);
  });

  it('should flatten nested children in fragment', () => {
    const child1: TextNode = { type: 'text', content: 'A' };
    const child2: TextNode = { type: 'text', content: 'B' };
    const result = createElement(Fragment, null, [child1, child2]);
    expect(result).toEqual([child1, child2]);
  });

  it('should filter null and undefined from fragment children', () => {
    const child: TextNode = { type: 'text', content: 'A' };
    const result = createElement(Fragment, null, null, child, undefined);
    expect(result).toEqual([child]);
  });

  it('should convert strings to text nodes in fragment', () => {
    const result = createElement(Fragment, null, 'Hello') as LayoutNode[];
    expect(result).toHaveLength(1);
    expect((result[0] as TextNode).type).toBe('text');
    expect((result[0] as TextNode).content).toBe('Hello');
  });

  it('should convert numbers to text nodes in fragment', () => {
    const result = createElement(Fragment, null, 42) as LayoutNode[];
    expect(result).toHaveLength(1);
    expect((result[0] as TextNode).type).toBe('text');
    expect((result[0] as TextNode).content).toBe('42');
  });

  it('should handle props.children for fragment', () => {
    const child: TextNode = { type: 'text', content: 'A' };
    const result = createElement(Fragment, { children: child });
    expect(result).toEqual([child]);
  });
});

// ==================== FUNCTION COMPONENTS ====================

describe('createElement with Function Components', () => {
  it('should call function component with props', () => {
    const MyComponent: FunctionComponent<{ name: string }> = (props) => ({
      type: 'text',
      content: `Hello, ${props.name}!`,
    });

    const result = createElement(MyComponent, { name: 'World' }) as TextNode;
    expect(result.type).toBe('text');
    expect(result.content).toBe('Hello, World!');
  });

  it('should pass children to function component', () => {
    const Container: FunctionComponent = (props) => ({
      type: 'stack',
      direction: 'column',
      children: props.children as LayoutNode[],
    });

    const child: TextNode = { type: 'text', content: 'Child' };
    const result = createElement(Container, null, child) as StackNode;
    expect(result.type).toBe('stack');
    expect(result.children).toHaveLength(1);
    expect((result.children[0] as TextNode).content).toBe('Child');
  });

  it('should return empty spacer when function component returns null', () => {
    const NullComponent: FunctionComponent = () => null;

    const result = createElement(NullComponent, null) as SpacerNode;
    expect(result.type).toBe('spacer');
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('should return empty spacer when function component returns undefined', () => {
    const UndefinedComponent: FunctionComponent = () => undefined as unknown as LayoutNode;

    const result = createElement(UndefinedComponent, null) as SpacerNode;
    expect(result.type).toBe('spacer');
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('should handle function component with no props', () => {
    const SimpleComponent: FunctionComponent = () => ({
      type: 'text',
      content: 'Simple',
    });

    const result = createElement(SimpleComponent, null) as TextNode;
    expect(result.content).toBe('Simple');
  });

  it('should merge props with children', () => {
    let receivedProps: Record<string, unknown> | null = null;
    const CaptureComponent: FunctionComponent<{ custom: string }> = (props) => {
      receivedProps = props as Record<string, unknown>;
      return { type: 'text', content: 'test' };
    };

    const child: TextNode = { type: 'text', content: 'Child' };
    createElement(CaptureComponent, { custom: 'value' }, child);

    expect(receivedProps).not.toBeNull();
    expect(receivedProps!.custom).toBe('value');
    expect(receivedProps!.children).toHaveLength(1);
  });
});

// ==================== CHILDREN HANDLING ====================

describe('Children Handling', () => {
  describe('flattenChildren', () => {
    it('should flatten nested arrays', () => {
      const child1: TextNode = { type: 'text', content: 'A' };
      const child2: TextNode = { type: 'text', content: 'B' };
      const result = createElement('Stack', null, [[child1], [child2]]) as StackNode;
      expect(result.children).toHaveLength(2);
    });

    it('should flatten deeply nested arrays', () => {
      const child: TextNode = { type: 'text', content: 'Deep' };
      const result = createElement('Stack', null, [[[[child]]]]) as StackNode;
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TextNode).content).toBe('Deep');
    });

    it('should filter out null values', () => {
      const child: TextNode = { type: 'text', content: 'A' };
      const result = createElement('Stack', null, null, child, null) as StackNode;
      expect(result.children).toHaveLength(1);
    });

    it('should filter out undefined values', () => {
      const child: TextNode = { type: 'text', content: 'A' };
      const result = createElement('Stack', null, undefined, child, undefined) as StackNode;
      expect(result.children).toHaveLength(1);
    });

    it('should filter out false values', () => {
      const child: TextNode = { type: 'text', content: 'A' };
      const result = createElement('Stack', null, false, child, false) as StackNode;
      expect(result.children).toHaveLength(1);
    });

    it('should filter out true values', () => {
      const child: TextNode = { type: 'text', content: 'A' };
      const result = createElement('Stack', null, true, child, true) as StackNode;
      expect(result.children).toHaveLength(1);
    });

    it('should convert string children to TextNode', () => {
      const result = createElement('Stack', null, 'Hello') as StackNode;
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TextNode).type).toBe('text');
      expect((result.children[0] as TextNode).content).toBe('Hello');
    });

    it('should convert number children to TextNode', () => {
      const result = createElement('Stack', null, 42) as StackNode;
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TextNode).type).toBe('text');
      expect((result.children[0] as TextNode).content).toBe('42');
    });

    it('should convert 0 to TextNode (not filter it)', () => {
      const result = createElement('Stack', null, 0) as StackNode;
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TextNode).content).toBe('0');
    });

    it('should convert empty string to TextNode', () => {
      const result = createElement('Stack', null, '') as StackNode;
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TextNode).content).toBe('');
    });

    it('should handle mixed children types', () => {
      const node: TextNode = { type: 'text', content: 'Node' };
      const result = createElement('Stack', null, 'String', 42, node, null, undefined) as StackNode;
      expect(result.children).toHaveLength(3);
      expect((result.children[0] as TextNode).content).toBe('String');
      expect((result.children[1] as TextNode).content).toBe('42');
      expect((result.children[2] as TextNode).content).toBe('Node');
    });

    it('should prefer props.children over rest args', () => {
      const propsChild: TextNode = { type: 'text', content: 'FromProps' };
      const restChild: TextNode = { type: 'text', content: 'FromRest' };
      const result = createElement('Stack', { children: propsChild }, restChild) as StackNode;
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TextNode).content).toBe('FromProps');
    });
  });
});

// ==================== INTRINSIC ELEMENTS ====================

describe('Intrinsic Elements', () => {
  describe('Layout', () => {
    it('should create a stack node with column direction', () => {
      const result = createElement('Layout', null) as StackNode;
      expect(result.type).toBe('stack');
      expect(result.direction).toBe('column');
      expect(result.children).toEqual([]);
    });

    it('should apply style props to Layout', () => {
      const style: NodeStyle = { width: 100, height: 50, padding: 10 };
      const result = createElement('Layout', { style }) as StackNode;
      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
      expect(result.padding).toBe(10);
    });

    it('should include children in Layout', () => {
      const child: TextNode = { type: 'text', content: 'Child' };
      const result = createElement('Layout', null, child) as StackNode;
      expect(result.children).toHaveLength(1);
    });
  });

  describe('Stack', () => {
    it('should create a stack node with default column direction', () => {
      const result = createElement('Stack', null) as StackNode;
      expect(result.type).toBe('stack');
      expect(result.direction).toBe('column');
    });

    it('should accept direction prop', () => {
      const result = createElement('Stack', { direction: 'row' }) as StackNode;
      expect(result.direction).toBe('row');
    });

    it('should accept direction from style.flexDirection', () => {
      const result = createElement('Stack', { style: { flexDirection: 'row' } }) as StackNode;
      expect(result.direction).toBe('row');
    });

    it('should prefer direction prop over style.flexDirection', () => {
      const result = createElement('Stack', {
        direction: 'column',
        style: { flexDirection: 'row' },
      }) as StackNode;
      expect(result.direction).toBe('column');
    });

    it('should apply gap from style', () => {
      const result = createElement('Stack', { style: { gap: 10 } }) as StackNode;
      expect(result.gap).toBe(10);
    });

    it('should apply align prop', () => {
      const result = createElement('Stack', { align: 'center' }) as StackNode;
      expect(result.align).toBe('center');
    });

    it('should apply vAlign prop', () => {
      const result = createElement('Stack', { vAlign: 'bottom' }) as StackNode;
      expect(result.vAlign).toBe('bottom');
    });

    it('should not set align when not provided', () => {
      const result = createElement('Stack', null) as StackNode;
      expect(result.align).toBeUndefined();
    });

    it('should not set vAlign when not provided', () => {
      const result = createElement('Stack', null) as StackNode;
      expect(result.vAlign).toBeUndefined();
    });

    it('should include children', () => {
      const child: TextNode = { type: 'text', content: 'Child' };
      const result = createElement('Stack', null, child) as StackNode;
      expect(result.children).toHaveLength(1);
    });
  });

  describe('Flex', () => {
    it('should create a flex node', () => {
      const result = createElement('Flex', null) as FlexNode;
      expect(result.type).toBe('flex');
      expect(result.children).toEqual([]);
    });

    it('should apply justifyContent from style', () => {
      const result = createElement('Flex', {
        style: { justifyContent: 'space-between' },
      }) as FlexNode;
      expect(result.justify).toBe('space-between');
    });

    it('should apply alignItems from style', () => {
      const result = createElement('Flex', { style: { alignItems: 'center' } }) as FlexNode;
      expect(result.alignItems).toBe('center');
    });

    it('should apply gap from style', () => {
      const result = createElement('Flex', { style: { gap: 20 } }) as FlexNode;
      expect(result.gap).toBe(20);
    });

    it('should not set justify when not provided', () => {
      const result = createElement('Flex', null) as FlexNode;
      expect(result.justify).toBeUndefined();
    });

    it('should include children', () => {
      const child: TextNode = { type: 'text', content: 'Child' };
      const result = createElement('Flex', null, child) as FlexNode;
      expect(result.children).toHaveLength(1);
    });
  });

  describe('Text', () => {
    it('should create a text node with string content', () => {
      const result = createElement('Text', null, 'Hello') as TextNode;
      expect(result.type).toBe('text');
      expect(result.content).toBe('Hello');
    });

    it('should create a text node with number content', () => {
      const result = createElement('Text', null, 42) as TextNode;
      expect(result.content).toBe('42');
    });

    it('should concatenate multiple children as content', () => {
      const result = createElement('Text', null, 'Hello', ' ', 'World') as TextNode;
      expect(result.content).toBe('Hello World');
    });

    it('should extract content from props.children', () => {
      const result = createElement('Text', { children: 'FromProps' }) as TextNode;
      expect(result.content).toBe('FromProps');
    });

    it('should handle empty content', () => {
      const result = createElement('Text', null) as TextNode;
      expect(result.content).toBe('');
    });

    it('should apply align prop', () => {
      const result = createElement('Text', { align: 'center' }) as TextNode;
      expect(result.align).toBe('center');
    });

    it('should apply overflow prop', () => {
      const result = createElement('Text', { overflow: 'ellipsis' }) as TextNode;
      expect(result.overflow).toBe('ellipsis');
    });

    it('should not set align when not provided', () => {
      const result = createElement('Text', null) as TextNode;
      expect(result.align).toBeUndefined();
    });

    it('should extract content from nested text nodes', () => {
      const nestedText: TextNode = { type: 'text', content: 'Nested' };
      const result = createElement('Text', { children: [nestedText] }) as TextNode;
      expect(result.content).toBe('Nested');
    });

    it('should handle mixed content types', () => {
      const nestedText: TextNode = { type: 'text', content: ' World' };
      const result = createElement('Text', { children: ['Hello', nestedText] }) as TextNode;
      expect(result.content).toBe('Hello World');
    });

    it('should return empty string for non-text/non-string/non-number children', () => {
      const spacer: SpacerNode = { type: 'spacer', width: 10, height: 10 };
      const result = createElement('Text', { children: [spacer] }) as TextNode;
      expect(result.content).toBe('');
    });

    it('should return empty string for object children (not string, number, or array)', () => {
      // When children is an object that is not a string, number, or array
      // extractTextContent should return ''
      const result = createElement('Text', { children: { invalid: true } }) as TextNode;
      expect(result.content).toBe('');
    });

    it('should return empty string for boolean children', () => {
      const result = createElement('Text', { children: true as unknown as string }) as TextNode;
      expect(result.content).toBe('');
    });

    it('should return empty string for null children', () => {
      const result = createElement('Text', { children: null }) as TextNode;
      expect(result.content).toBe('');
    });

    it('should return empty string for undefined children', () => {
      const result = createElement('Text', { children: undefined }) as TextNode;
      expect(result.content).toBe('');
    });
  });

  describe('Spacer', () => {
    it('should create a spacer node with flex true by default', () => {
      const result = createElement('Spacer', null) as SpacerNode;
      expect(result.type).toBe('spacer');
      expect(result.flex).toBe(true);
    });

    it('should apply width from style', () => {
      const result = createElement('Spacer', { style: { width: 50 } }) as SpacerNode;
      expect(result.width).toBe(50);
    });

    it('should apply height from style', () => {
      const result = createElement('Spacer', { style: { height: 30 } }) as SpacerNode;
      expect(result.height).toBe(30);
    });

    it('should set flex to false when width is provided', () => {
      const result = createElement('Spacer', { style: { width: 50 } }) as SpacerNode;
      expect(result.flex).toBe(false);
    });

    it('should set flex to false when height is provided', () => {
      const result = createElement('Spacer', { style: { height: 30 } }) as SpacerNode;
      expect(result.flex).toBe(false);
    });

    it('should respect explicit flex prop even with dimensions', () => {
      const result = createElement('Spacer', {
        flex: true,
        style: { width: 50 },
      }) as SpacerNode;
      expect(result.flex).toBe(true);
    });

    it('should allow explicit flex false without dimensions', () => {
      const result = createElement('Spacer', { flex: false }) as SpacerNode;
      expect(result.flex).toBe(false);
    });
  });

  describe('Line', () => {
    it('should create a horizontal line by default', () => {
      const result = createElement('Line', null) as LineNode;
      expect(result.type).toBe('line');
      expect(result.direction).toBe('horizontal');
    });

    it('should accept direction prop', () => {
      const result = createElement('Line', { direction: 'vertical' }) as LineNode;
      expect(result.direction).toBe('vertical');
    });

    it('should apply char prop', () => {
      const result = createElement('Line', { char: '=' }) as LineNode;
      expect(result.char).toBe('=');
    });

    it('should apply numeric length prop', () => {
      const result = createElement('Line', { length: 50 }) as LineNode;
      expect(result.length).toBe(50);
    });

    it('should apply fill length prop', () => {
      const result = createElement('Line', { length: 'fill' }) as LineNode;
      expect(result.length).toBe('fill');
    });

    it('should not set char when not provided', () => {
      const result = createElement('Line', null) as LineNode;
      expect(result.char).toBeUndefined();
    });

    it('should not set length when not provided', () => {
      const result = createElement('Line', null) as LineNode;
      expect(result.length).toBeUndefined();
    });
  });

  describe('Template', () => {
    it('should create a template node', () => {
      const result = createElement('Template', { template: 'Hello {{name}}!' }) as TemplateNode;
      expect(result.type).toBe('template');
      expect(result.template).toBe('Hello {{name}}!');
    });

    it('should apply align prop', () => {
      const result = createElement('Template', {
        template: '{{value}}',
        align: 'right',
      }) as TemplateNode;
      expect(result.align).toBe('right');
    });

    it('should apply data prop', () => {
      const data = { name: 'World' };
      const result = createElement('Template', {
        template: '{{name}}',
        data,
      }) as TemplateNode;
      expect(result.data).toBe(data);
    });

    it('should not set align when not provided', () => {
      const result = createElement('Template', { template: 'test' }) as TemplateNode;
      expect(result.align).toBeUndefined();
    });

    it('should not set data when not provided', () => {
      const result = createElement('Template', { template: 'test' }) as TemplateNode;
      expect(result.data).toBeUndefined();
    });
  });

  describe('If (Conditional)', () => {
    it('should create a conditional node with path condition', () => {
      const condition = { path: 'user.active', operator: 'eq' as const, value: true };
      const thenNode: TextNode = { type: 'text', content: 'Active' };
      const result = createElement('If', { condition }, thenNode) as ConditionalNode;

      expect(result.type).toBe('conditional');
      expect(result.condition).toBe(condition);
      expect(result.then).toBe(thenNode);
    });

    it('should create a conditional node with function condition', () => {
      const condition = () => true;
      const thenNode: TextNode = { type: 'text', content: 'True' };
      const result = createElement('If', { condition }, thenNode) as ConditionalNode;

      expect(result.type).toBe('conditional');
      expect(result.condition).toBe(condition);
    });

    it('should apply else prop', () => {
      const condition = { path: 'test', operator: 'exists' as const };
      const thenNode: TextNode = { type: 'text', content: 'Yes' };
      const elseNode: TextNode = { type: 'text', content: 'No' };
      const result = createElement(
        'If',
        { condition, else: elseNode },
        thenNode
      ) as ConditionalNode;

      expect(result.else).toBe(elseNode);
    });

    it('should use empty spacer when no children provided', () => {
      const condition = { path: 'test', operator: 'exists' as const };
      const result = createElement('If', { condition }) as ConditionalNode;

      expect(result.then.type).toBe('spacer');
      expect((result.then as SpacerNode).width).toBe(0);
      expect((result.then as SpacerNode).height).toBe(0);
    });

    it('should not set else when not provided', () => {
      const condition = { path: 'test', operator: 'exists' as const };
      const thenNode: TextNode = { type: 'text', content: 'Test' };
      const result = createElement('If', { condition }, thenNode) as ConditionalNode;

      expect(result.else).toBeUndefined();
    });
  });

  describe('Switch', () => {
    it('should create a switch node', () => {
      const result = createElement('Switch', { path: 'status' }) as SwitchNode;
      expect(result.type).toBe('switch');
      expect(result.path).toBe('status');
      expect(result.cases).toEqual([]);
    });

    it('should apply default prop', () => {
      const defaultNode: TextNode = { type: 'text', content: 'Default' };
      const result = createElement('Switch', {
        path: 'status',
        default: defaultNode,
      }) as SwitchNode;

      expect(result.default).toBe(defaultNode);
    });

    it('should not set default when not provided', () => {
      const result = createElement('Switch', { path: 'status' }) as SwitchNode;
      expect(result.default).toBeUndefined();
    });

    it('should extract cases from Case children', () => {
      const caseNode1 = createElement(
        'Case',
        { value: 'active' },
        { type: 'text', content: 'Active' }
      );
      const caseNode2 = createElement(
        'Case',
        { value: 'inactive' },
        { type: 'text', content: 'Inactive' }
      );

      const result = createElement(
        'Switch',
        { path: 'status' },
        caseNode1,
        caseNode2
      ) as SwitchNode;

      expect(result.cases).toHaveLength(2);
      expect(result.cases[0].value).toBe('active');
      expect((result.cases[0].then as TextNode).content).toBe('Active');
      expect(result.cases[1].value).toBe('inactive');
      expect((result.cases[1].then as TextNode).content).toBe('Inactive');
    });

    it('should filter out non-Case children', () => {
      const caseNode = createElement('Case', { value: 'test' }, { type: 'text', content: 'Test' });
      const textNode: TextNode = { type: 'text', content: 'Not a case' };

      const result = createElement('Switch', { path: 'status' }, caseNode, textNode) as SwitchNode;

      expect(result.cases).toHaveLength(1);
    });
  });

  describe('Case', () => {
    it('should create a case marker', () => {
      const thenNode: TextNode = { type: 'text', content: 'Test' };
      const result = createElement('Case', { value: 'active' }, thenNode) as SpacerNode & {
        __case: boolean;
        __value: unknown;
        __then: LayoutNode;
      };

      expect(result.type).toBe('spacer');
      expect(result.__case).toBe(true);
      expect(result.__value).toBe('active');
      expect(result.__then).toBe(thenNode);
    });

    it('should handle array case values', () => {
      const thenNode: TextNode = { type: 'text', content: 'Test' };
      const result = createElement('Case', { value: ['a', 'b', 'c'] }, thenNode) as SpacerNode & {
        __case: boolean;
        __value: unknown;
        __then: LayoutNode;
      };

      expect(result.__value).toEqual(['a', 'b', 'c']);
    });

    it('should use empty spacer when no children provided', () => {
      const result = createElement('Case', { value: 'test' }) as SpacerNode & {
        __case: boolean;
        __value: unknown;
        __then: LayoutNode;
      };

      expect(result.__then.type).toBe('spacer');
      expect((result.__then as SpacerNode).width).toBe(0);
      expect((result.__then as SpacerNode).height).toBe(0);
    });
  });

  describe('For (Each)', () => {
    it('should create an each node', () => {
      const renderNode: TextNode = { type: 'text', content: '{{item}}' };
      const result = createElement('For', { items: 'users' }, renderNode) as EachNode;

      expect(result.type).toBe('each');
      expect(result.items).toBe('users');
      expect(result.render).toBe(renderNode);
    });

    it('should apply as prop', () => {
      const renderNode: TextNode = { type: 'text', content: '{{user}}' };
      const result = createElement('For', { items: 'users', as: 'user' }, renderNode) as EachNode;

      expect(result.as).toBe('user');
    });

    it('should apply indexAs prop', () => {
      const renderNode: TextNode = { type: 'text', content: '{{idx}}' };
      const result = createElement(
        'For',
        { items: 'users', indexAs: 'idx' },
        renderNode
      ) as EachNode;

      expect(result.indexAs).toBe('idx');
    });

    it('should apply empty prop', () => {
      const renderNode: TextNode = { type: 'text', content: '{{item}}' };
      const emptyNode: TextNode = { type: 'text', content: 'No items' };
      const result = createElement(
        'For',
        { items: 'users', empty: emptyNode },
        renderNode
      ) as EachNode;

      expect(result.empty).toBe(emptyNode);
    });

    it('should apply separator prop', () => {
      const renderNode: TextNode = { type: 'text', content: '{{item}}' };
      const separatorNode: LineNode = { type: 'line', direction: 'horizontal' };
      const result = createElement(
        'For',
        { items: 'users', separator: separatorNode },
        renderNode
      ) as EachNode;

      expect(result.separator).toBe(separatorNode);
    });

    it('should use empty spacer when no children provided', () => {
      const result = createElement('For', { items: 'users' }) as EachNode;

      expect(result.render.type).toBe('spacer');
      expect((result.render as SpacerNode).width).toBe(0);
      expect((result.render as SpacerNode).height).toBe(0);
    });

    it('should not set as when not provided', () => {
      const renderNode: TextNode = { type: 'text', content: '{{item}}' };
      const result = createElement('For', { items: 'users' }, renderNode) as EachNode;

      expect(result.as).toBeUndefined();
    });

    it('should not set indexAs when not provided', () => {
      const renderNode: TextNode = { type: 'text', content: '{{item}}' };
      const result = createElement('For', { items: 'users' }, renderNode) as EachNode;

      expect(result.indexAs).toBeUndefined();
    });
  });
});

// ==================== UNKNOWN ELEMENT TYPE ====================

describe('Unknown Element Type', () => {
  it('should throw error for unknown intrinsic element', () => {
    expect(() => createElement('Unknown', null)).toThrow('Unknown JSX element type: Unknown');
  });

  it('should throw error with element name in message', () => {
    expect(() => createElement('CustomElement', null)).toThrow(
      'Unknown JSX element type: CustomElement'
    );
  });
});

// ==================== STYLE AND LAYOUT PROPS APPLICATION ====================

describe('Style and Layout Props Application', () => {
  describe('applyLayoutProps', () => {
    it('should apply width from style', () => {
      const result = createElement('Stack', { style: { width: 100 } }) as StackNode;
      expect(result.width).toBe(100);
    });

    it('should apply height from style', () => {
      const result = createElement('Stack', { style: { height: 50 } }) as StackNode;
      expect(result.height).toBe(50);
    });

    it('should apply minWidth from style', () => {
      const result = createElement('Stack', { style: { minWidth: 50 } }) as StackNode;
      expect(result.minWidth).toBe(50);
    });

    it('should apply maxWidth from style', () => {
      const result = createElement('Stack', { style: { maxWidth: 200 } }) as StackNode;
      expect(result.maxWidth).toBe(200);
    });

    it('should apply minHeight from style', () => {
      const result = createElement('Stack', { style: { minHeight: 30 } }) as StackNode;
      expect(result.minHeight).toBe(30);
    });

    it('should apply maxHeight from style', () => {
      const result = createElement('Stack', { style: { maxHeight: 100 } }) as StackNode;
      expect(result.maxHeight).toBe(100);
    });

    it('should apply padding from style', () => {
      const result = createElement('Stack', { style: { padding: 10 } }) as StackNode;
      expect(result.padding).toBe(10);
    });

    it('should apply padding object from style', () => {
      const padding = { top: 10, right: 20, bottom: 30, left: 40 };
      const result = createElement('Stack', { style: { padding } }) as StackNode;
      expect(result.padding).toEqual(padding);
    });

    it('should apply margin from style', () => {
      const result = createElement('Stack', { style: { margin: 15 } }) as StackNode;
      expect(result.margin).toBe(15);
    });

    it('should apply margin object from style', () => {
      const margin = { top: 5, right: 10, bottom: 15, left: 20 };
      const result = createElement('Stack', { style: { margin } }) as StackNode;
      expect(result.margin).toEqual(margin);
    });

    it('should apply flexGrow from style', () => {
      const result = createElement('Stack', { style: { flexGrow: 1 } }) as StackNode;
      expect(result.flexGrow).toBe(1);
    });

    it('should apply flexShrink from style', () => {
      const result = createElement('Stack', { style: { flexShrink: 0 } }) as StackNode;
      expect(result.flexShrink).toBe(0);
    });

    it('should apply flexBasis from style', () => {
      const result = createElement('Stack', { style: { flexBasis: 100 } }) as StackNode;
      expect(result.flexBasis).toBe(100);
    });
  });

  describe('applyPositionProps', () => {
    it('should apply position static', () => {
      const result = createElement('Stack', { style: { position: 'static' } }) as StackNode;
      expect(result.position).toBe('static');
    });

    it('should apply position absolute with posX and posY', () => {
      const result = createElement('Stack', {
        style: { position: 'absolute', left: 50, top: 100 },
      }) as StackNode;
      expect(result.position).toBe('absolute');
      expect(result.posX).toBe(50);
      expect(result.posY).toBe(100);
    });

    it('should not apply posX/posY for non-absolute position', () => {
      const result = createElement('Stack', {
        style: { position: 'static', left: 50, top: 100 },
      }) as StackNode;
      expect(result.posX).toBeUndefined();
      expect(result.posY).toBeUndefined();
    });

    it('should apply position relative with offsetX and offsetY', () => {
      const result = createElement('Stack', {
        style: { position: 'relative', offsetX: 10, offsetY: 20 },
      }) as StackNode;
      expect(result.position).toBe('relative');
      expect(result.offsetX).toBe(10);
      expect(result.offsetY).toBe(20);
    });

    it('should apply position relative with only offsetX', () => {
      const result = createElement('Stack', {
        style: { position: 'relative', offsetX: 15 },
      }) as StackNode;
      expect(result.position).toBe('relative');
      expect(result.offsetX).toBe(15);
      expect(result.offsetY).toBeUndefined();
    });

    it('should apply position relative with only offsetY', () => {
      const result = createElement('Stack', {
        style: { position: 'relative', offsetY: 25 },
      }) as StackNode;
      expect(result.position).toBe('relative');
      expect(result.offsetX).toBeUndefined();
      expect(result.offsetY).toBe(25);
    });

    it('should apply position relative without offsets', () => {
      const result = createElement('Stack', {
        style: { position: 'relative' },
      }) as StackNode;
      expect(result.position).toBe('relative');
      expect(result.offsetX).toBeUndefined();
      expect(result.offsetY).toBeUndefined();
    });

    it('should not apply offsetX/offsetY for non-relative position', () => {
      const result = createElement('Stack', {
        style: { position: 'absolute', offsetX: 10, offsetY: 20 },
      }) as StackNode;
      expect(result.offsetX).toBeUndefined();
      expect(result.offsetY).toBeUndefined();
    });

    it('should not set position props when position is not specified', () => {
      const result = createElement('Stack', {
        style: { left: 50, top: 100, offsetX: 10, offsetY: 20 },
      }) as StackNode;
      expect(result.position).toBeUndefined();
      expect(result.posX).toBeUndefined();
      expect(result.posY).toBeUndefined();
      expect(result.offsetX).toBeUndefined();
      expect(result.offsetY).toBeUndefined();
    });
  });

  describe('applyStyleProps', () => {
    it('should apply bold from style', () => {
      const result = createElement('Stack', { style: { bold: true } }) as StackNode;
      expect(result.bold).toBe(true);
    });

    it('should apply italic from style', () => {
      const result = createElement('Stack', { style: { italic: true } }) as StackNode;
      expect(result.italic).toBe(true);
    });

    it('should apply underline from style', () => {
      const result = createElement('Stack', { style: { underline: true } }) as StackNode;
      expect(result.underline).toBe(true);
    });

    it('should apply doubleStrike from style', () => {
      const result = createElement('Stack', { style: { doubleStrike: true } }) as StackNode;
      expect(result.doubleStrike).toBe(true);
    });

    it('should apply doubleWidth from style', () => {
      const result = createElement('Stack', { style: { doubleWidth: true } }) as StackNode;
      expect(result.doubleWidth).toBe(true);
    });

    it('should apply doubleHeight from style', () => {
      const result = createElement('Stack', { style: { doubleHeight: true } }) as StackNode;
      expect(result.doubleHeight).toBe(true);
    });

    it('should apply condensed from style', () => {
      const result = createElement('Stack', { style: { condensed: true } }) as StackNode;
      expect(result.condensed).toBe(true);
    });

    it('should apply cpi from style', () => {
      const result = createElement('Stack', { style: { cpi: 12 } }) as StackNode;
      expect(result.cpi).toBe(12);
    });

    it('should apply typeface from style', () => {
      const result = createElement('Stack', { style: { typeface: 'roman' } }) as StackNode;
      expect(result.typeface).toBe('roman');
    });

    it('should apply printQuality from style', () => {
      const result = createElement('Stack', { style: { printQuality: 'draft' } }) as StackNode;
      expect(result.printQuality).toBe('draft');
    });

    it('should apply multiple style props', () => {
      const result = createElement('Stack', {
        style: {
          bold: true,
          italic: true,
          underline: true,
          cpi: 15,
        },
      }) as StackNode;
      expect(result.bold).toBe(true);
      expect(result.italic).toBe(true);
      expect(result.underline).toBe(true);
      expect(result.cpi).toBe(15);
    });
  });

  describe('Style props on different node types', () => {
    it('should apply layout and style props to Text node', () => {
      const result = createElement(
        'Text',
        {
          style: { width: 100, bold: true },
        },
        'Test'
      ) as TextNode;
      expect(result.width).toBe(100);
      expect(result.bold).toBe(true);
    });

    it('should apply layout and style props to Flex node', () => {
      const result = createElement('Flex', {
        style: { height: 50, italic: true },
      }) as FlexNode;
      expect(result.height).toBe(50);
      expect(result.italic).toBe(true);
    });

    it('should apply layout and style props to Line node', () => {
      const result = createElement('Line', {
        style: { width: 200, underline: true },
      }) as LineNode;
      expect(result.width).toBe(200);
      expect(result.underline).toBe(true);
    });

    it('should apply layout and style props to Template node', () => {
      const result = createElement('Template', {
        template: 'test',
        style: { width: 150, bold: true },
      }) as TemplateNode;
      expect(result.width).toBe(150);
      expect(result.bold).toBe(true);
    });

    it('should apply layout and style props to For node', () => {
      const renderNode: TextNode = { type: 'text', content: 'item' };
      const result = createElement(
        'For',
        {
          items: 'items',
          style: { padding: 5, condensed: true },
        },
        renderNode
      ) as EachNode;
      expect(result.padding).toBe(5);
      expect(result.condensed).toBe(true);
    });
  });
});

// ==================== NULL PROPS HANDLING ====================

describe('Null Props Handling', () => {
  it('should handle null props for Stack', () => {
    const result = createElement('Stack', null) as StackNode;
    expect(result.type).toBe('stack');
    expect(result.direction).toBe('column');
  });

  it('should handle null props for Flex', () => {
    const result = createElement('Flex', null) as FlexNode;
    expect(result.type).toBe('flex');
  });

  it('should handle null props for Text', () => {
    const result = createElement('Text', null, 'Hello') as TextNode;
    expect(result.content).toBe('Hello');
  });

  it('should handle null props for Spacer', () => {
    const result = createElement('Spacer', null) as SpacerNode;
    expect(result.type).toBe('spacer');
    expect(result.flex).toBe(true);
  });

  it('should handle null props for Line', () => {
    const result = createElement('Line', null) as LineNode;
    expect(result.direction).toBe('horizontal');
  });

  it('should handle null props for Layout', () => {
    const result = createElement('Layout', null) as StackNode;
    expect(result.type).toBe('stack');
    expect(result.direction).toBe('column');
  });

  it('should handle null props for function component', () => {
    const Component: FunctionComponent = () => ({ type: 'text', content: 'Test' });
    const result = createElement(Component, null) as TextNode;
    expect(result.content).toBe('Test');
  });

  it('should handle null props for Fragment', () => {
    const result = createElement(Fragment, null);
    expect(result).toEqual([]);
  });
});

// ==================== EDGE CASES ====================

describe('Edge Cases', () => {
  it('should handle empty style object', () => {
    const result = createElement('Stack', { style: {} }) as StackNode;
    expect(result.type).toBe('stack');
    expect(result.width).toBeUndefined();
  });

  it('should handle undefined style values', () => {
    const result = createElement('Stack', {
      style: { width: undefined, height: undefined },
    }) as StackNode;
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
  });

  it('should handle zero values correctly', () => {
    const result = createElement('Stack', {
      style: { width: 0, height: 0, padding: 0, margin: 0 },
    }) as StackNode;
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
    expect(result.padding).toBe(0);
    expect(result.margin).toBe(0);
  });

  it('should handle deeply nested fragment children', () => {
    const child: TextNode = { type: 'text', content: 'Deep' };
    const result = createElement(Fragment, null, [
      [[[child, null], undefined], false],
    ]) as LayoutNode[];
    expect(result).toHaveLength(1);
    expect((result[0] as TextNode).content).toBe('Deep');
  });

  it('should handle function component returning complex structure', () => {
    const ComplexComponent: FunctionComponent = () => ({
      type: 'stack',
      direction: 'column',
      children: [
        { type: 'text', content: 'A' },
        {
          type: 'flex',
          children: [
            { type: 'text', content: 'B' },
            { type: 'spacer', width: 10 },
          ],
        },
      ],
    });

    const result = createElement(ComplexComponent, null) as StackNode;
    expect(result.type).toBe('stack');
    expect(result.children).toHaveLength(2);
    expect((result.children[1] as FlexNode).type).toBe('flex');
  });

  it('should handle very large dimension values', () => {
    const result = createElement('Stack', {
      style: { width: 999999, height: 999999 },
    }) as StackNode;
    expect(result.width).toBe(999999);
    expect(result.height).toBe(999999);
  });

  it('should handle negative values in style', () => {
    // While semantically wrong, the function should not crash
    const result = createElement('Stack', {
      style: { offsetX: -10, offsetY: -20, position: 'relative' },
    }) as StackNode;
    expect(result.offsetX).toBe(-10);
    expect(result.offsetY).toBe(-20);
  });

  it('should handle percentage width in style', () => {
    const result = createElement('Stack', {
      style: { width: '50%' as unknown as number },
    }) as StackNode;
    expect(result.width).toBe('50%');
  });

  it('should preserve LayoutNode children without modification', () => {
    const complexChild: StackNode = {
      type: 'stack',
      direction: 'row',
      gap: 10,
      children: [{ type: 'text', content: 'Inner' }],
      bold: true,
    };
    const result = createElement('Stack', null, complexChild) as StackNode;
    expect(result.children[0]).toBe(complexChild);
  });

  it('should handle Text node with only whitespace content', () => {
    const result = createElement('Text', null, '   ') as TextNode;
    expect(result.content).toBe('   ');
  });

  it('should handle Text node with newlines in content', () => {
    const result = createElement('Text', null, 'Line1\nLine2\nLine3') as TextNode;
    expect(result.content).toBe('Line1\nLine2\nLine3');
  });
});

// ==================== INTEGRATION TESTS ====================

describe('Integration Tests', () => {
  it('should create a complete layout structure', () => {
    const layout = createElement(
      'Layout',
      { style: { width: 300, padding: 10 } },
      createElement(
        'Stack',
        { direction: 'column', style: { gap: 5 } },
        createElement('Text', { style: { bold: true } }, 'Header'),
        createElement(
          'Flex',
          { style: { justifyContent: 'space-between' } },
          createElement('Text', null, 'Left'),
          createElement('Spacer', null),
          createElement('Text', null, 'Right')
        ),
        createElement('Line', { char: '-', length: 'fill' }),
        createElement('Text', null, 'Footer')
      )
    ) as StackNode;

    expect(layout.type).toBe('stack');
    expect(layout.width).toBe(300);
    expect(layout.padding).toBe(10);
    expect(layout.children).toHaveLength(1);

    const stack = layout.children[0] as StackNode;
    expect(stack.type).toBe('stack');
    expect(stack.gap).toBe(5);
    expect(stack.children).toHaveLength(4);
  });

  it('should create conditional layout with switch', () => {
    const statusSwitch = createElement(
      'Switch',
      { path: 'status', default: { type: 'text', content: 'Unknown' } as TextNode },
      createElement('Case', { value: 'active' }, { type: 'text', content: 'Active' }),
      createElement('Case', { value: 'inactive' }, { type: 'text', content: 'Inactive' }),
      createElement(
        'Case',
        { value: ['pending', 'processing'] },
        { type: 'text', content: 'In Progress' }
      )
    ) as SwitchNode;

    expect(statusSwitch.type).toBe('switch');
    expect(statusSwitch.path).toBe('status');
    expect(statusSwitch.cases).toHaveLength(3);
    expect(statusSwitch.default).toBeDefined();
    expect((statusSwitch.default as TextNode).content).toBe('Unknown');
  });

  it('should create iteration layout with For', () => {
    const itemList = createElement(
      'For',
      {
        items: 'items',
        as: 'item',
        indexAs: 'idx',
        empty: { type: 'text', content: 'No items found' } as TextNode,
        separator: { type: 'line', direction: 'horizontal' } as LineNode,
      },
      createElement('Template', { template: '{{idx + 1}}. {{item.name}}' })
    ) as EachNode;

    expect(itemList.type).toBe('each');
    expect(itemList.items).toBe('items');
    expect(itemList.as).toBe('item');
    expect(itemList.indexAs).toBe('idx');
    expect(itemList.empty).toBeDefined();
    expect(itemList.separator).toBeDefined();
    expect((itemList.render as TemplateNode).type).toBe('template');
  });

  it('should work with JSX-like nested structure', () => {
    // Simulating: <Stack><If condition={...}><Text>Yes</Text></If></Stack>
    const result = createElement(
      'Stack',
      null,
      createElement(
        'If',
        { condition: { path: 'show', operator: 'eq', value: true } },
        createElement('Text', null, 'Yes')
      )
    ) as StackNode;

    expect(result.type).toBe('stack');
    expect(result.children).toHaveLength(1);
    expect((result.children[0] as ConditionalNode).type).toBe('conditional');
    expect(((result.children[0] as ConditionalNode).then as TextNode).content).toBe('Yes');
  });
});
