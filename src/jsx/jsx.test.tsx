/**
 * JSX API Tests
 */
import { describe, it, expect } from 'vitest';
import { createElement, Fragment } from './createElement';
import type { StackNode, FlexNode, TextNode, SpacerNode, LineNode } from '../layout/nodes';
import type { FunctionComponent } from './types';

describe('JSX createElement', () => {
  describe('Layout component', () => {
    it('creates a stack node with column direction', () => {
      const node = createElement('Layout', { style: { padding: 10 } }) as StackNode;

      expect(node.type).toBe('stack');
      expect(node.direction).toBe('column');
      expect(node.padding).toBe(10);
    });
  });

  describe('Stack component', () => {
    it('creates a stack node with default column direction', () => {
      const node = createElement('Stack', null) as StackNode;

      expect(node.type).toBe('stack');
      expect(node.direction).toBe('column');
    });

    it('creates a horizontal stack with direction prop', () => {
      const node = createElement('Stack', { direction: 'row' }) as StackNode;

      expect(node.direction).toBe('row');
    });

    it('applies style properties', () => {
      const node = createElement('Stack', {
        style: {
          width: 200,
          height: 100,
          padding: 10,
          gap: 5,
          bold: true,
        },
      }) as StackNode;

      expect(node.width).toBe(200);
      expect(node.height).toBe(100);
      expect(node.padding).toBe(10);
      expect(node.gap).toBe(5);
      expect(node.bold).toBe(true);
    });
  });

  describe('Flex component', () => {
    it('creates a flex node', () => {
      const node = createElement('Flex', null) as FlexNode;

      expect(node.type).toBe('flex');
    });

    it('applies justify and alignItems from style', () => {
      const node = createElement('Flex', {
        style: {
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        },
      }) as FlexNode;

      expect(node.justify).toBe('space-between');
      expect(node.alignItems).toBe('center');
      expect(node.gap).toBe(10);
    });
  });

  describe('Text component', () => {
    it('creates a text node with string child', () => {
      const node = createElement('Text', null, 'Hello World') as TextNode;

      expect(node.type).toBe('text');
      expect(node.content).toBe('Hello World');
    });

    it('applies text style properties', () => {
      const node = createElement('Text', {
        style: { bold: true, italic: true },
        align: 'center',
      }, 'Styled') as TextNode;

      expect(node.bold).toBe(true);
      expect(node.italic).toBe(true);
      expect(node.align).toBe('center');
    });
  });

  describe('Spacer component', () => {
    it('creates a spacer with flex by default', () => {
      const node = createElement('Spacer', null) as SpacerNode;

      expect(node.type).toBe('spacer');
      expect(node.flex).toBe(true);
    });

    it('creates a fixed spacer with dimensions', () => {
      const node = createElement('Spacer', {
        style: { width: 20, height: 10 },
      }) as SpacerNode;

      expect(node.width).toBe(20);
      expect(node.height).toBe(10);
      expect(node.flex).toBe(false);
    });
  });

  describe('Line component', () => {
    it('creates a horizontal line by default', () => {
      const node = createElement('Line', null) as LineNode;

      expect(node.type).toBe('line');
      expect(node.direction).toBe('horizontal');
    });

    it('creates a line with custom properties', () => {
      const node = createElement('Line', {
        direction: 'vertical',
        char: '|',
        length: 100,
      }) as LineNode;

      expect(node.direction).toBe('vertical');
      expect(node.char).toBe('|');
      expect(node.length).toBe(100);
    });
  });

  describe('Children handling', () => {
    it('converts string children to text nodes', () => {
      const node = createElement('Stack', null, 'Hello', 'World') as StackNode;

      expect(node.children).toHaveLength(2);
      expect((node.children[0] as TextNode).type).toBe('text');
      expect((node.children[0] as TextNode).content).toBe('Hello');
      expect((node.children[1] as TextNode).type).toBe('text');
      expect((node.children[1] as TextNode).content).toBe('World');
    });

    it('flattens nested arrays', () => {
      const node = createElement('Stack', null,
        createElement('Text', null, 'A'),
        [createElement('Text', null, 'B'), createElement('Text', null, 'C')],
      ) as StackNode;

      expect(node.children).toHaveLength(3);
    });

    it('filters null and undefined children', () => {
      const node = createElement('Stack', null,
        createElement('Text', null, 'A'),
        null,
        undefined,
        false,
        createElement('Text', null, 'B'),
      ) as StackNode;

      expect(node.children).toHaveLength(2);
    });
  });

  describe('Fragment', () => {
    it('returns array of children', () => {
      const nodes = createElement(Fragment, null,
        createElement('Text', null, 'A'),
        createElement('Text', null, 'B'),
      );

      expect(Array.isArray(nodes)).toBe(true);
      expect(nodes).toHaveLength(2);
    });
  });

  describe('Function components', () => {
    it('calls function components with props', () => {
      const MyComponent: FunctionComponent<{ title: string }> = (props) => {
        return createElement('Text', { style: { bold: true } }, props.title) as TextNode;
      };

      const node = createElement(MyComponent, { title: 'Hello' }) as TextNode;

      expect(node.type).toBe('text');
      expect(node.content).toBe('Hello');
      expect(node.bold).toBe(true);
    });

    it('passes children to function components', () => {
      const Wrapper: FunctionComponent = (props) => {
        return createElement('Stack', null, ...(props.children as unknown[])) as StackNode;
      };

      const node = createElement(Wrapper, null,
        createElement('Text', null, 'Child 1'),
        createElement('Text', null, 'Child 2'),
      ) as StackNode;

      expect(node.children).toHaveLength(2);
    });
  });

  describe('Template component', () => {
    it('creates a template node', () => {
      const node = createElement('Template', { template: 'Hello {{name}}!' });

      expect(node.type).toBe('template');
      expect((node as { template: string }).template).toBe('Hello {{name}}!');
    });
  });

  describe('Conditional components', () => {
    it('creates an If node', () => {
      const node = createElement('If',
        { condition: { path: 'active', operator: 'eq', value: true } },
        createElement('Text', null, 'Active!'),
      );

      expect(node.type).toBe('conditional');
    });

    it('creates a Switch node with cases', () => {
      const node = createElement('Switch', { path: 'status' },
        createElement('Case', { value: 'active' },
          createElement('Text', null, 'Active'),
        ),
        createElement('Case', { value: 'inactive' },
          createElement('Text', null, 'Inactive'),
        ),
      );

      expect(node.type).toBe('switch');
      expect((node as { cases: unknown[] }).cases).toHaveLength(2);
    });
  });

  describe('For component', () => {
    it('creates an each node', () => {
      const node = createElement('For', { items: 'items', as: 'item' },
        createElement('Template', { template: '{{item.name}}' }),
      );

      expect(node.type).toBe('each');
      expect((node as { items: string }).items).toBe('items');
      expect((node as { as: string }).as).toBe('item');
    });
  });
});
