import { describe, it, expect } from 'vitest';
import {
  resolveNode,
  createDataContext,
  createDefaultSpaceContext,
} from './resolver';
import type {
  LayoutNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
  TextNode,
  StackNode,
  FlexNode,
} from './nodes';

describe('resolver', () => {
  // ==================== CREATE DATA CONTEXT ====================

  describe('createDataContext', () => {
    it('creates context with data and default space', () => {
      const ctx = createDataContext({ name: 'John' });
      expect(ctx.data).toEqual({ name: 'John' });
      expect(ctx.space).toBeDefined();
      expect(ctx.space.availableWidth).toBe(2880);
    });

    it('creates context with custom space', () => {
      const space = createDefaultSpaceContext();
      space.availableWidth = 1000;
      const ctx = createDataContext({ name: 'John' }, space);
      expect(ctx.space.availableWidth).toBe(1000);
    });
  });

  describe('createDefaultSpaceContext', () => {
    it('creates default space context', () => {
      const space = createDefaultSpaceContext();
      expect(space.availableWidth).toBe(2880);
      expect(space.availableHeight).toBe(3600);
      expect(space.pageNumber).toBe(0);
    });
  });

  // ==================== TEMPLATE NODE RESOLUTION ====================

  describe('resolveNode - TemplateNode', () => {
    it('resolves template to text node', () => {
      const node: TemplateNode = {
        type: 'template',
        template: 'Hello {{name}}!',
      };
      const ctx = createDataContext({ name: 'World' });
      const resolved = resolveNode(node, ctx);

      expect(resolved).not.toBeNull();
      expect(resolved?.type).toBe('text');
      expect((resolved as TextNode).content).toBe('Hello World!');
    });

    it('copies style properties to resolved text node', () => {
      const node: TemplateNode = {
        type: 'template',
        template: '{{text}}',
        bold: true,
        italic: true,
        cpi: 12,
      };
      const ctx = createDataContext({ text: 'Hello' });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.bold).toBe(true);
      expect(resolved.italic).toBe(true);
      expect(resolved.cpi).toBe(12);
    });

    it('copies layout properties to resolved text node', () => {
      const node: TemplateNode = {
        type: 'template',
        template: '{{text}}',
        width: 100,
        padding: 10,
      };
      const ctx = createDataContext({ text: 'Hello' });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.width).toBe(100);
      expect(resolved.padding).toBe(10);
    });

    it('merges local data with context data', () => {
      const node: TemplateNode = {
        type: 'template',
        template: '{{greeting}} {{name}}!',
        data: { greeting: 'Hi' },
      };
      const ctx = createDataContext({ name: 'World' });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('Hi World!');
    });
  });

  // ==================== CONDITIONAL NODE RESOLUTION ====================

  describe('resolveNode - ConditionalNode', () => {
    it('resolves to then branch when condition is true', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: { path: 'isActive', operator: 'eq', value: true },
        then: { type: 'text', content: 'Active' },
        else: { type: 'text', content: 'Inactive' },
      };
      const ctx = createDataContext({ isActive: true });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('Active');
    });

    it('resolves to else branch when condition is false', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: { path: 'isActive', operator: 'eq', value: true },
        then: { type: 'text', content: 'Active' },
        else: { type: 'text', content: 'Inactive' },
      };
      const ctx = createDataContext({ isActive: false });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('Inactive');
    });

    it('resolves elseIf branches', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: { path: 'status', operator: 'eq', value: 'gold' },
        then: { type: 'text', content: 'Gold' },
        elseIf: [
          {
            condition: { path: 'status', operator: 'eq', value: 'silver' },
            then: { type: 'text', content: 'Silver' },
          },
        ],
        else: { type: 'text', content: 'Bronze' },
      };

      expect((resolveNode(node, createDataContext({ status: 'gold' })) as TextNode).content).toBe('Gold');
      expect((resolveNode(node, createDataContext({ status: 'silver' })) as TextNode).content).toBe('Silver');
      expect((resolveNode(node, createDataContext({ status: 'bronze' })) as TextNode).content).toBe('Bronze');
    });

    it('returns null when no match and no else', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: { path: 'isActive', operator: 'eq', value: true },
        then: { type: 'text', content: 'Active' },
      };
      const ctx = createDataContext({ isActive: false });
      const resolved = resolveNode(node, ctx);

      expect(resolved).toBeNull();
    });

    it('handles callback conditions', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: (ctx) => (ctx.data as { count: number }).count > 5,
        then: { type: 'text', content: 'Many' },
        else: { type: 'text', content: 'Few' },
      };

      expect((resolveNode(node, createDataContext({ count: 10 })) as TextNode).content).toBe('Many');
      expect((resolveNode(node, createDataContext({ count: 3 })) as TextNode).content).toBe('Few');
    });
  });

  // ==================== SWITCH NODE RESOLUTION ====================

  describe('resolveNode - SwitchNode', () => {
    it('resolves to matching case', () => {
      const node: SwitchNode = {
        type: 'switch',
        path: 'status',
        cases: [
          { value: 'active', then: { type: 'text', content: 'Active' } },
          { value: 'pending', then: { type: 'text', content: 'Pending' } },
        ],
        default: { type: 'text', content: 'Unknown' },
      };

      expect((resolveNode(node, createDataContext({ status: 'active' })) as TextNode).content).toBe('Active');
      expect((resolveNode(node, createDataContext({ status: 'pending' })) as TextNode).content).toBe('Pending');
    });

    it('resolves to default when no match', () => {
      const node: SwitchNode = {
        type: 'switch',
        path: 'status',
        cases: [
          { value: 'active', then: { type: 'text', content: 'Active' } },
        ],
        default: { type: 'text', content: 'Unknown' },
      };
      const ctx = createDataContext({ status: 'other' });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('Unknown');
    });

    it('handles array case values', () => {
      const node: SwitchNode = {
        type: 'switch',
        path: 'status',
        cases: [
          { value: ['active', 'pending'], then: { type: 'text', content: 'In Progress' } },
        ],
        default: { type: 'text', content: 'Done' },
      };

      expect((resolveNode(node, createDataContext({ status: 'active' })) as TextNode).content).toBe('In Progress');
      expect((resolveNode(node, createDataContext({ status: 'pending' })) as TextNode).content).toBe('In Progress');
      expect((resolveNode(node, createDataContext({ status: 'completed' })) as TextNode).content).toBe('Done');
    });

    it('returns null when no match and no default', () => {
      const node: SwitchNode = {
        type: 'switch',
        path: 'status',
        cases: [
          { value: 'active', then: { type: 'text', content: 'Active' } },
        ],
      };
      const ctx = createDataContext({ status: 'other' });
      const resolved = resolveNode(node, ctx);

      expect(resolved).toBeNull();
    });
  });

  // ==================== EACH NODE RESOLUTION ====================

  describe('resolveNode - EachNode', () => {
    it('resolves to stack with rendered items', () => {
      const node: EachNode = {
        type: 'each',
        items: 'items',
        render: { type: 'template', template: '{{item}}' },
      };
      const ctx = createDataContext({ items: ['A', 'B', 'C'] });
      const resolved = resolveNode(node, ctx) as StackNode;

      expect(resolved.type).toBe('stack');
      expect(resolved.children.length).toBe(3);
      expect((resolved.children[0] as TextNode).content).toBe('A');
      expect((resolved.children[1] as TextNode).content).toBe('B');
      expect((resolved.children[2] as TextNode).content).toBe('C');
    });

    it('uses custom item and index names', () => {
      const node: EachNode = {
        type: 'each',
        items: 'users',
        as: 'user',
        indexAs: 'i',
        render: { type: 'template', template: '{{i}}: {{user.name}}' },
      };
      const ctx = createDataContext({
        users: [{ name: 'John' }, { name: 'Jane' }],
      });
      const resolved = resolveNode(node, ctx) as StackNode;

      expect((resolved.children[0] as TextNode).content).toBe('0: John');
      expect((resolved.children[1] as TextNode).content).toBe('1: Jane');
    });

    it('adds separators between items', () => {
      const node: EachNode = {
        type: 'each',
        items: 'items',
        render: { type: 'text', content: 'item' },
        separator: { type: 'line', char: '-' },
      };
      const ctx = createDataContext({ items: [1, 2, 3] });
      const resolved = resolveNode(node, ctx) as StackNode;

      // 3 items + 2 separators = 5 children
      expect(resolved.children.length).toBe(5);
      expect(resolved.children[1]?.type).toBe('line');
      expect(resolved.children[3]?.type).toBe('line');
    });

    it('renders empty node for empty array', () => {
      const node: EachNode = {
        type: 'each',
        items: 'items',
        render: { type: 'text', content: 'item' },
        empty: { type: 'text', content: 'No items' },
      };
      const ctx = createDataContext({ items: [] });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('No items');
    });

    it('returns spacer for empty array without empty node', () => {
      const node: EachNode = {
        type: 'each',
        items: 'items',
        render: { type: 'text', content: 'item' },
      };
      const ctx = createDataContext({ items: [] });
      const resolved = resolveNode(node, ctx);

      expect(resolved?.type).toBe('spacer');
    });

    it('copies style properties to wrapper stack', () => {
      const node: EachNode = {
        type: 'each',
        items: 'items',
        render: { type: 'text', content: 'item' },
        bold: true,
        width: 200,
      };
      const ctx = createDataContext({ items: [1] });
      const resolved = resolveNode(node, ctx) as StackNode;

      expect(resolved.bold).toBe(true);
      expect(resolved.width).toBe(200);
    });
  });

  // ==================== CONTAINER NODE RESOLUTION ====================

  describe('resolveNode - Container nodes', () => {
    it('resolves children of StackNode', () => {
      const node: StackNode = {
        type: 'stack',
        direction: 'column',
        children: [
          { type: 'template', template: 'Hello {{name}}' } as TemplateNode,
          { type: 'text', content: 'Static' },
        ],
      };
      const ctx = createDataContext({ name: 'World' });
      const resolved = resolveNode(node, ctx) as StackNode;

      expect(resolved.children.length).toBe(2);
      expect((resolved.children[0] as TextNode).content).toBe('Hello World');
      expect((resolved.children[1] as TextNode).content).toBe('Static');
    });

    it('resolves children of FlexNode', () => {
      const node: FlexNode = {
        type: 'flex',
        children: [
          { type: 'template', template: '{{left}}' } as TemplateNode,
          { type: 'template', template: '{{right}}' } as TemplateNode,
        ],
      };
      const ctx = createDataContext({ left: 'Left', right: 'Right' });
      const resolved = resolveNode(node, ctx) as FlexNode;

      expect((resolved.children[0] as TextNode).content).toBe('Left');
      expect((resolved.children[1] as TextNode).content).toBe('Right');
    });

    it('filters out null children', () => {
      const node: StackNode = {
        type: 'stack',
        direction: 'column',
        children: [
          {
            type: 'conditional',
            condition: { path: 'show', operator: 'eq', value: true },
            then: { type: 'text', content: 'Visible' },
          } as ConditionalNode,
          { type: 'text', content: 'Always' },
        ],
      };
      const ctx = createDataContext({ show: false });
      const resolved = resolveNode(node, ctx) as StackNode;

      expect(resolved.children.length).toBe(1);
      expect((resolved.children[0] as TextNode).content).toBe('Always');
    });
  });

  // ==================== TEXT NODE WITH CONTENT RESOLVER ====================

  describe('resolveNode - TextNode with contentResolver', () => {
    it('resolves content from contentResolver', () => {
      const node: TextNode = {
        type: 'text',
        content: 'fallback',
        contentResolver: (ctx) => `Dynamic: ${(ctx.data as { value: string }).value}`,
      };
      const ctx = createDataContext({ value: 'test' });
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('Dynamic: test');
      expect(resolved.contentResolver).toBeUndefined();
    });

    it('uses fallback on resolver error', () => {
      const node: TextNode = {
        type: 'text',
        content: 'fallback',
        contentResolver: () => {
          throw new Error('Test error');
        },
      };
      const ctx = createDataContext({});
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved.content).toBe('fallback');
    });

    it('returns node as-is if no contentResolver', () => {
      const node: TextNode = {
        type: 'text',
        content: 'static',
      };
      const ctx = createDataContext({});
      const resolved = resolveNode(node, ctx) as TextNode;

      expect(resolved).toBe(node); // Same reference
    });
  });

  // ==================== PASSTHROUGH NODES ====================

  describe('resolveNode - Passthrough nodes', () => {
    it('returns spacer node as-is', () => {
      const node: LayoutNode = { type: 'spacer', height: 10 };
      const ctx = createDataContext({});
      const resolved = resolveNode(node, ctx);

      expect(resolved).toBe(node);
    });

    it('returns line node as-is', () => {
      const node: LayoutNode = { type: 'line', char: '-' };
      const ctx = createDataContext({});
      const resolved = resolveNode(node, ctx);

      expect(resolved).toBe(node);
    });
  });
});
