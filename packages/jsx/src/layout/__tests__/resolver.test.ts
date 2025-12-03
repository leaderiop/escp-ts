/**
 * Tests for Node Resolver
 *
 * Comprehensive tests for the node resolution system that transforms dynamic nodes
 * (TemplateNode, ConditionalNode, SwitchNode, EachNode) into static nodes before
 * measurement. Also covers container node (Stack, Flex) child resolution and
 * TextNode contentResolver handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveNode,
  createDefaultSpaceContext,
  createDataContext,
  type ResolverOptions,
} from '../resolver';
import type {
  LayoutNode,
  TextNode,
  StackNode,
  FlexNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
  SpacerNode,
  LineNode,
  DataContext,
  SpaceContext,
} from '../nodes';
import { createFilterRegistry, type FilterRegistry } from '../interpolation';

// ==================== TEST HELPERS ====================

/**
 * Create a minimal DataContext for testing
 */
function createTestContext<T = unknown>(data: T): DataContext<T> {
  return createDataContext(data);
}

/**
 * Create a text node for testing
 */
function textNode(content: string, options: Partial<TextNode> = {}): TextNode {
  return { type: 'text', content, ...options };
}

/**
 * Create a template node for testing
 */
function templateNode(template: string, options: Partial<TemplateNode> = {}): TemplateNode {
  return { type: 'template', template, ...options };
}

// ==================== TESTS ====================

describe('resolver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== resolveNode MAIN FUNCTION ====================

  describe('resolveNode', () => {
    describe('node type dispatch', () => {
      it('should resolve template nodes', () => {
        const node: TemplateNode = { type: 'template', template: 'Hello {{name}}!' };
        const ctx = createTestContext({ name: 'World' });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect(result!.type).toBe('text');
        expect((result as TextNode).content).toBe('Hello World!');
      });

      it('should resolve conditional nodes', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'isActive', operator: 'eq', value: true },
          then: textNode('Active'),
          else: textNode('Inactive'),
        };
        const ctx = createTestContext({ isActive: true });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect((result as TextNode).content).toBe('Active');
      });

      it('should resolve switch nodes', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'status',
          cases: [
            { value: 'pending', then: textNode('Pending') },
            { value: 'active', then: textNode('Active') },
          ],
          default: textNode('Unknown'),
        };
        const ctx = createTestContext({ status: 'active' });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect((result as TextNode).content).toBe('Active');
      });

      it('should resolve each nodes', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{item}}'),
        };
        const ctx = createTestContext({ items: ['A', 'B', 'C'] });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect(result!.type).toBe('stack');
        expect((result as StackNode).children).toHaveLength(3);
      });

      it('should resolve stack node children recursively', () => {
        const node: StackNode = {
          type: 'stack',
          children: [templateNode('{{name}}'), textNode('Static')],
        };
        const ctx = createTestContext({ name: 'John' });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect(result!.type).toBe('stack');
        const children = (result as StackNode).children;
        expect(children).toHaveLength(2);
        expect((children[0] as TextNode).content).toBe('John');
        expect((children[1] as TextNode).content).toBe('Static');
      });

      it('should resolve flex node children recursively', () => {
        const node: FlexNode = {
          type: 'flex',
          children: [templateNode('{{a}}'), templateNode('{{b}}')],
        };
        const ctx = createTestContext({ a: 'Left', b: 'Right' });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect(result!.type).toBe('flex');
        const children = (result as FlexNode).children;
        expect(children).toHaveLength(2);
        expect((children[0] as TextNode).content).toBe('Left');
        expect((children[1] as TextNode).content).toBe('Right');
      });

      it('should resolve text node with contentResolver', () => {
        const node: TextNode = {
          type: 'text',
          content: 'fallback',
          contentResolver: (ctx) => `Hello ${(ctx.data as { name: string }).name}`,
        };
        const ctx = createTestContext({ name: 'World' });

        const result = resolveNode(node, ctx);

        expect(result).not.toBeNull();
        expect((result as TextNode).content).toBe('Hello World');
        expect((result as TextNode).contentResolver).toBeUndefined();
      });

      it('should return spacer nodes as-is', () => {
        const node: SpacerNode = { type: 'spacer', width: 100, height: 50 };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect(result).toBe(node);
      });

      it('should return line nodes as-is', () => {
        const node: LineNode = { type: 'line', direction: 'horizontal', length: 100 };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect(result).toBe(node);
      });

      it('should return text nodes without contentResolver as-is', () => {
        const node: TextNode = { type: 'text', content: 'Static text' };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect(result).toBe(node);
      });
    });
  });

  // ==================== TEMPLATE NODE RESOLUTION ====================

  describe('resolveTemplateNode', () => {
    describe('basic interpolation', () => {
      it('should interpolate simple variables', () => {
        const node: TemplateNode = { type: 'template', template: '{{name}}' };
        const ctx = createTestContext({ name: 'John' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('John');
      });

      it('should interpolate nested paths', () => {
        const node: TemplateNode = { type: 'template', template: '{{user.name}}' };
        const ctx = createTestContext({ user: { name: 'Jane' } });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Jane');
      });

      it('should interpolate array indices', () => {
        const node: TemplateNode = { type: 'template', template: '{{items[0].name}}' };
        const ctx = createTestContext({ items: [{ name: 'First' }] });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('First');
      });

      it('should interpolate multiple variables', () => {
        const node: TemplateNode = { type: 'template', template: '{{first}} {{last}}' };
        const ctx = createTestContext({ first: 'John', last: 'Doe' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('John Doe');
      });

      it('should handle missing variables with empty string', () => {
        const node: TemplateNode = { type: 'template', template: 'Hello {{missing}}!' };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Hello !');
      });
    });

    describe('local data merging', () => {
      it('should merge local data with context data', () => {
        const node: TemplateNode = {
          type: 'template',
          template: '{{name}} - {{localVar}}',
          data: { localVar: 'Local' },
        };
        const ctx = createTestContext({ name: 'Global' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Global - Local');
      });

      it('should override context data with local data', () => {
        const node: TemplateNode = {
          type: 'template',
          template: '{{name}}',
          data: { name: 'Override' },
        };
        const ctx = createTestContext({ name: 'Original' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Override');
      });

      it('should handle empty local data', () => {
        const node: TemplateNode = {
          type: 'template',
          template: '{{name}}',
          data: {},
        };
        const ctx = createTestContext({ name: 'Test' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Test');
      });
    });

    describe('filter support', () => {
      it('should apply uppercase filter', () => {
        const node: TemplateNode = { type: 'template', template: '{{name | uppercase}}' };
        const ctx = createTestContext({ name: 'john' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('JOHN');
      });

      it('should apply filter chain', () => {
        const node: TemplateNode = { type: 'template', template: '{{name | trim | uppercase}}' };
        const ctx = createTestContext({ name: '  hello  ' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('HELLO');
      });

      it('should apply default filter for missing values', () => {
        const node: TemplateNode = { type: 'template', template: '{{missing | default:"N/A"}}' };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('N/A');
      });

      it('should apply currency filter', () => {
        const node: TemplateNode = { type: 'template', template: '{{price | currency:"$":2}}' };
        const ctx = createTestContext({ price: 99.5 });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('$99.50');
      });
    });

    describe('custom filters', () => {
      it('should use custom filter registry', () => {
        const customFilters = createFilterRegistry();
        customFilters.register('reverse', (value) => String(value).split('').reverse().join(''));

        const node: TemplateNode = { type: 'template', template: '{{text | reverse}}' };
        const ctx = createTestContext({ text: 'abc' });
        const options: ResolverOptions = { filters: customFilters };

        const result = resolveNode(node, ctx, options);

        expect((result as TextNode).content).toBe('cba');
      });
    });

    describe('property copying', () => {
      it('should copy alignment property', () => {
        const node: TemplateNode = { type: 'template', template: '{{name}}', align: 'center' };
        const ctx = createTestContext({ name: 'Test' });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.align).toBe('center');
      });

      it('should copy style properties', () => {
        const node: TemplateNode = {
          type: 'template',
          template: '{{name}}',
          bold: true,
          italic: true,
          underline: true,
          doubleStrike: true,
          doubleWidth: true,
          doubleHeight: true,
          condensed: true,
          cpi: 12,
        };
        const ctx = createTestContext({ name: 'Test' });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.bold).toBe(true);
        expect(result.italic).toBe(true);
        expect(result.underline).toBe(true);
        expect(result.doubleStrike).toBe(true);
        expect(result.doubleWidth).toBe(true);
        expect(result.doubleHeight).toBe(true);
        expect(result.condensed).toBe(true);
        expect(result.cpi).toBe(12);
      });

      it('should copy layout properties', () => {
        const node: TemplateNode = {
          type: 'template',
          template: '{{name}}',
          width: 100,
          height: 50,
          padding: 10,
          margin: 5,
          minWidth: 50,
          maxWidth: 200,
          minHeight: 25,
          maxHeight: 100,
        };
        const ctx = createTestContext({ name: 'Test' });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.width).toBe(100);
        expect(result.height).toBe(50);
        expect(result.padding).toBe(10);
        expect(result.margin).toBe(5);
        expect(result.minWidth).toBe(50);
        expect(result.maxWidth).toBe(200);
        expect(result.minHeight).toBe(25);
        expect(result.maxHeight).toBe(100);
      });

      it('should copy positioning properties', () => {
        const node: TemplateNode = {
          type: 'template',
          template: '{{name}}',
          position: 'absolute',
          posX: 100,
          posY: 200,
          offsetX: 10,
          offsetY: 20,
        };
        const ctx = createTestContext({ name: 'Test' });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.position).toBe('absolute');
        expect(result.posX).toBe(100);
        expect(result.posY).toBe(200);
        expect(result.offsetX).toBe(10);
        expect(result.offsetY).toBe(20);
      });

      it('should not copy undefined properties', () => {
        const node: TemplateNode = { type: 'template', template: '{{name}}' };
        const ctx = createTestContext({ name: 'Test' });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.align).toBeUndefined();
        expect(result.bold).toBeUndefined();
        expect(result.width).toBeUndefined();
        expect(result.position).toBeUndefined();
      });
    });
  });

  // ==================== CONDITIONAL NODE RESOLUTION ====================

  describe('resolveConditionalNode', () => {
    describe('primary condition (if)', () => {
      it('should return then branch when condition is true (DataCondition)', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'active', operator: 'eq', value: true },
          then: textNode('Active'),
          else: textNode('Inactive'),
        };
        const ctx = createTestContext({ active: true });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Active');
      });

      it('should return else branch when condition is false (DataCondition)', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'active', operator: 'eq', value: true },
          then: textNode('Active'),
          else: textNode('Inactive'),
        };
        const ctx = createTestContext({ active: false });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Inactive');
      });

      it('should return then branch when callback returns true', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: (ctx) => (ctx.data as { count: number }).count > 5,
          then: textNode('Many'),
          else: textNode('Few'),
        };
        const ctx = createTestContext({ count: 10 });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Many');
      });

      it('should return else branch when callback returns false', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: (ctx) => (ctx.data as { count: number }).count > 5,
          then: textNode('Many'),
          else: textNode('Few'),
        };
        const ctx = createTestContext({ count: 2 });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Few');
      });

      it('should treat callback exceptions as false', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: () => {
            throw new Error('Condition error');
          },
          then: textNode('Should not appear'),
          else: textNode('Fallback'),
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Fallback');
      });
    });

    describe('else-if chains', () => {
      it('should check else-if when primary condition is false', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'status', operator: 'eq', value: 'active' },
          then: textNode('Active'),
          elseIf: [
            {
              condition: { path: 'status', operator: 'eq', value: 'pending' },
              then: textNode('Pending'),
            },
          ],
          else: textNode('Unknown'),
        };
        const ctx = createTestContext({ status: 'pending' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Pending');
      });

      it('should check multiple else-if branches in order', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'value', operator: 'gt', value: 100 },
          then: textNode('Large'),
          elseIf: [
            {
              condition: { path: 'value', operator: 'gt', value: 50 },
              then: textNode('Medium'),
            },
            {
              condition: { path: 'value', operator: 'gt', value: 10 },
              then: textNode('Small'),
            },
          ],
          else: textNode('Tiny'),
        };
        const ctx = createTestContext({ value: 30 });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Small');
      });

      it('should stop at first matching else-if', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'value', operator: 'eq', value: 'never' },
          then: textNode('Never'),
          elseIf: [
            {
              condition: { path: 'value', operator: 'eq', value: 'first' },
              then: textNode('First Match'),
            },
            {
              condition: { path: 'value', operator: 'eq', value: 'first' }, // Same condition
              then: textNode('Second Match'),
            },
          ],
          else: textNode('Else'),
        };
        const ctx = createTestContext({ value: 'first' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('First Match');
      });

      it('should support callback functions in else-if', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: () => false,
          then: textNode('Primary'),
          elseIf: [
            {
              condition: (ctx) => (ctx.data as { flag: boolean }).flag === true,
              then: textNode('Callback Match'),
            },
          ],
          else: textNode('Else'),
        };
        const ctx = createTestContext({ flag: true });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Callback Match');
      });
    });

    describe('else clause', () => {
      it('should return else when all conditions are false', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'status', operator: 'eq', value: 'a' },
          then: textNode('A'),
          elseIf: [
            { condition: { path: 'status', operator: 'eq', value: 'b' }, then: textNode('B') },
          ],
          else: textNode('Default'),
        };
        const ctx = createTestContext({ status: 'c' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Default');
      });

      it('should return null when no conditions match and no else', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'active', operator: 'eq', value: true },
          then: textNode('Active'),
        };
        const ctx = createTestContext({ active: false });

        const result = resolveNode(node, ctx);

        expect(result).toBeNull();
      });
    });

    describe('recursive resolution', () => {
      it('should resolve nested nodes in then branch', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'show', operator: 'eq', value: true },
          then: templateNode('Hello {{name}}!'),
        };
        const ctx = createTestContext({ show: true, name: 'World' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Hello World!');
      });

      it('should resolve nested nodes in else branch', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'show', operator: 'eq', value: true },
          then: textNode('Yes'),
          else: templateNode('Fallback {{value}}'),
        };
        const ctx = createTestContext({ show: false, value: 'Data' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Fallback Data');
      });

      it('should resolve nested nodes in else-if branch', () => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: () => false,
          then: textNode('Never'),
          elseIf: [
            {
              condition: () => true,
              then: templateNode('{{message}}'),
            },
          ],
        };
        const ctx = createTestContext({ message: 'Resolved' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Resolved');
      });
    });

    describe('different operators', () => {
      it.each([
        ['eq', 'value', 'eq', 'value', true],
        ['eq', 'value', 'eq', 'other', false],
        ['neq', 'value', 'neq', 'other', true],
        ['neq', 'value', 'neq', 'value', false],
        ['gt', 10, 'gt', 5, true],
        ['gt', 5, 'gt', 10, false],
        ['gte', 10, 'gte', 10, true],
        ['lt', 5, 'lt', 10, true],
        ['lte', 10, 'lte', 10, true],
        ['exists', 'value', 'exists', undefined, true],
        ['notExists', undefined, 'notExists', undefined, true],
      ] as const)('should handle %s operator', (_, dataValue, operator, compareValue, expected) => {
        const node: ConditionalNode = {
          type: 'conditional',
          condition: { path: 'test', operator: operator as 'eq', value: compareValue },
          then: textNode('True'),
          else: textNode('False'),
        };
        const ctx = createTestContext({ test: dataValue });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe(expected ? 'True' : 'False');
      });
    });
  });

  // ==================== SWITCH NODE RESOLUTION ====================

  describe('resolveSwitchNode', () => {
    describe('case matching', () => {
      it('should match exact value', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'status',
          cases: [
            { value: 'active', then: textNode('Active') },
            { value: 'pending', then: textNode('Pending') },
          ],
          default: textNode('Unknown'),
        };
        const ctx = createTestContext({ status: 'active' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Active');
      });

      it('should match second case', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'status',
          cases: [
            { value: 'active', then: textNode('Active') },
            { value: 'pending', then: textNode('Pending') },
          ],
          default: textNode('Unknown'),
        };
        const ctx = createTestContext({ status: 'pending' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Pending');
      });

      it('should match array of values (any match)', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'role',
          cases: [
            { value: ['admin', 'superadmin'], then: textNode('Admin Access') },
            { value: ['user', 'guest'], then: textNode('User Access') },
          ],
          default: textNode('No Access'),
        };
        const ctx = createTestContext({ role: 'superadmin' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Admin Access');
      });

      it('should match numeric values', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'code',
          cases: [
            { value: 200, then: textNode('OK') },
            { value: 404, then: textNode('Not Found') },
            { value: 500, then: textNode('Error') },
          ],
        };
        const ctx = createTestContext({ code: 404 });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Not Found');
      });

      it('should match boolean values', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'enabled',
          cases: [
            { value: true, then: textNode('Enabled') },
            { value: false, then: textNode('Disabled') },
          ],
        };
        const ctx = createTestContext({ enabled: false });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Disabled');
      });

      it('should stop at first matching case', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'value',
          cases: [
            { value: 'match', then: textNode('First') },
            { value: 'match', then: textNode('Second') },
          ],
        };
        const ctx = createTestContext({ value: 'match' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('First');
      });
    });

    describe('nested path resolution', () => {
      it('should resolve nested paths', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'user.role',
          cases: [
            { value: 'admin', then: textNode('Admin') },
            { value: 'user', then: textNode('User') },
          ],
        };
        const ctx = createTestContext({ user: { role: 'admin' } });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Admin');
      });

      it('should resolve array index paths', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'items[0].type',
          cases: [
            { value: 'book', then: textNode('Book') },
            { value: 'video', then: textNode('Video') },
          ],
        };
        const ctx = createTestContext({ items: [{ type: 'video' }] });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Video');
      });
    });

    describe('default case', () => {
      it('should return default when no cases match', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'status',
          cases: [
            { value: 'a', then: textNode('A') },
            { value: 'b', then: textNode('B') },
          ],
          default: textNode('Default'),
        };
        const ctx = createTestContext({ status: 'c' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Default');
      });

      it('should return null when no cases match and no default', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'status',
          cases: [{ value: 'a', then: textNode('A') }],
        };
        const ctx = createTestContext({ status: 'z' });

        const result = resolveNode(node, ctx);

        expect(result).toBeNull();
      });

      it('should return default when path is undefined', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'missing',
          cases: [{ value: 'a', then: textNode('A') }],
          default: textNode('Missing'),
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Missing');
      });
    });

    describe('recursive resolution', () => {
      it('should resolve nested nodes in case branches', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'type',
          cases: [{ value: 'greeting', then: templateNode('Hello {{name}}!') }],
          default: textNode('Unknown'),
        };
        const ctx = createTestContext({ type: 'greeting', name: 'World' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Hello World!');
      });

      it('should resolve nested nodes in default branch', () => {
        const node: SwitchNode = {
          type: 'switch',
          path: 'type',
          cases: [],
          default: templateNode('Default: {{message}}'),
        };
        const ctx = createTestContext({ type: 'none', message: 'Hello' });

        const result = resolveNode(node, ctx);

        expect((result as TextNode).content).toBe('Default: Hello');
      });
    });
  });

  // ==================== EACH NODE RESOLUTION ====================

  describe('resolveEachNode', () => {
    describe('basic iteration', () => {
      it('should iterate over array and render each item', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{item}}'),
        };
        const ctx = createTestContext({ items: ['A', 'B', 'C'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.type).toBe('stack');
        expect(result.direction).toBe('column');
        expect(result.children).toHaveLength(3);
        expect((result.children[0] as TextNode).content).toBe('A');
        expect((result.children[1] as TextNode).content).toBe('B');
        expect((result.children[2] as TextNode).content).toBe('C');
      });

      it('should use default item name "item"', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('Value: {{item}}'),
        };
        const ctx = createTestContext({ items: ['X'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('Value: X');
      });

      it('should use custom item name from "as"', () => {
        const node: EachNode = {
          type: 'each',
          items: 'users',
          as: 'user',
          render: templateNode('{{user}}'),
        };
        const ctx = createTestContext({ users: ['Alice', 'Bob'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('Alice');
        expect((result.children[1] as TextNode).content).toBe('Bob');
      });
    });

    describe('index access', () => {
      it('should provide default index variable', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{index}}: {{item}}'),
        };
        const ctx = createTestContext({ items: ['A', 'B'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('0: A');
        expect((result.children[1] as TextNode).content).toBe('1: B');
      });

      it('should use custom index name from "indexAs"', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          indexAs: 'i',
          render: templateNode('#{{i}}'),
        };
        const ctx = createTestContext({ items: ['A', 'B', 'C'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('#0');
        expect((result.children[1] as TextNode).content).toBe('#1');
        expect((result.children[2] as TextNode).content).toBe('#2');
      });
    });

    describe('object iteration', () => {
      it('should iterate over array of objects', () => {
        const node: EachNode = {
          type: 'each',
          items: 'users',
          as: 'user',
          render: templateNode('{{user.name}}: {{user.age}}'),
        };
        const ctx = createTestContext({
          users: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
        });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('Alice: 30');
        expect((result.children[1] as TextNode).content).toBe('Bob: 25');
      });
    });

    describe('nested path items', () => {
      it('should resolve nested items path', () => {
        const node: EachNode = {
          type: 'each',
          items: 'order.items',
          render: templateNode('{{item}}'),
        };
        const ctx = createTestContext({ order: { items: ['Item1', 'Item2'] } });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.children).toHaveLength(2);
        expect((result.children[0] as TextNode).content).toBe('Item1');
      });
    });

    describe('separator handling', () => {
      it('should insert separator between items', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{item}}'),
          separator: textNode('---'),
        };
        const ctx = createTestContext({ items: ['A', 'B', 'C'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.children).toHaveLength(5); // 3 items + 2 separators
        expect((result.children[0] as TextNode).content).toBe('A');
        expect((result.children[1] as TextNode).content).toBe('---');
        expect((result.children[2] as TextNode).content).toBe('B');
        expect((result.children[3] as TextNode).content).toBe('---');
        expect((result.children[4] as TextNode).content).toBe('C');
      });

      it('should not insert separator after last item', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
          separator: textNode('|'),
        };
        const ctx = createTestContext({ items: ['A', 'B'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.children).toHaveLength(3); // 2 items + 1 separator
        expect((result.children[2] as TextNode).content).not.toBe('|');
      });

      it('should resolve separator with scoped context', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{item}}'),
          separator: templateNode('after {{item}}'),
        };
        const ctx = createTestContext({ items: ['A', 'B'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[1] as TextNode).content).toBe('after A');
      });

      it('should handle single item with no separator', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
          separator: textNode('---'),
        };
        const ctx = createTestContext({ items: ['Only'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.children).toHaveLength(1);
      });
    });

    describe('empty state', () => {
      it('should return empty node for empty array', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
        };
        const ctx = createTestContext({ items: [] });

        const result = resolveNode(node, ctx) as SpacerNode;

        expect(result.type).toBe('spacer');
        expect(result.width).toBe(0);
        expect(result.height).toBe(0);
      });

      it('should return empty node for missing array', () => {
        const node: EachNode = {
          type: 'each',
          items: 'missing',
          render: textNode('Item'),
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx) as SpacerNode;

        expect(result.type).toBe('spacer');
      });

      it('should return empty node for non-array value', () => {
        const node: EachNode = {
          type: 'each',
          items: 'notArray',
          render: textNode('Item'),
        };
        const ctx = createTestContext({ notArray: 'string' });

        const result = resolveNode(node, ctx) as SpacerNode;

        expect(result.type).toBe('spacer');
      });

      it('should use empty node when provided and array is empty', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
          empty: textNode('No items found'),
        };
        const ctx = createTestContext({ items: [] });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.type).toBe('text');
        expect(result.content).toBe('No items found');
      });

      it('should resolve empty node with context', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
          empty: templateNode('{{message}}'),
        };
        const ctx = createTestContext({ items: [], message: 'Empty list' });

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.content).toBe('Empty list');
      });
    });

    describe('scoped context', () => {
      it('should provide index and total in scoped context', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: {
            type: 'text',
            content: 'placeholder',
            contentResolver: (ctx) => `${ctx.index}/${ctx.total}`,
          },
        };
        const ctx = createTestContext({ items: ['A', 'B', 'C'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('0/3');
        expect((result.children[1] as TextNode).content).toBe('1/3');
        expect((result.children[2] as TextNode).content).toBe('2/3');
      });

      it('should merge parent data with item data', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{prefix}}: {{item}}'),
        };
        const ctx = createTestContext({ prefix: 'Item', items: ['A', 'B'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect((result.children[0] as TextNode).content).toBe('Item: A');
        expect((result.children[1] as TextNode).content).toBe('Item: B');
      });
    });

    describe('property copying', () => {
      it('should copy style properties to stack', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
          bold: true,
          italic: true,
        };
        const ctx = createTestContext({ items: ['A'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.bold).toBe(true);
        expect(result.italic).toBe(true);
      });

      it('should copy layout properties to stack', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: textNode('Item'),
          width: 100,
          padding: 10,
          margin: 5,
        };
        const ctx = createTestContext({ items: ['A'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.width).toBe(100);
        expect(result.padding).toBe(10);
        expect(result.margin).toBe(5);
      });
    });

    describe('null filtering', () => {
      it('should filter out null resolved items', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: {
            type: 'conditional',
            condition: { path: 'item', operator: 'neq', value: 'skip' },
            then: templateNode('{{item}}'),
            // No else - returns null for 'skip'
          },
        };
        const ctx = createTestContext({ items: ['A', 'skip', 'B'] });

        const result = resolveNode(node, ctx) as StackNode;

        expect(result.children).toHaveLength(2);
        expect((result.children[0] as TextNode).content).toBe('A');
        expect((result.children[1] as TextNode).content).toBe('B');
      });

      it('should filter out null separators', () => {
        const node: EachNode = {
          type: 'each',
          items: 'items',
          render: templateNode('{{item}}'),
          separator: {
            type: 'conditional',
            condition: () => false, // Always returns null
            then: textNode('---'),
          },
        };
        const ctx = createTestContext({ items: ['A', 'B'] });

        const result = resolveNode(node, ctx) as StackNode;

        // Should only have the items, not the null separators
        expect(result.children).toHaveLength(2);
      });
    });
  });

  // ==================== STACK NODE RESOLUTION ====================

  describe('resolveStackNode', () => {
    it('should resolve all children', () => {
      const node: StackNode = {
        type: 'stack',
        children: [templateNode('{{a}}'), templateNode('{{b}}'), textNode('Static')],
      };
      const ctx = createTestContext({ a: 'First', b: 'Second' });

      const result = resolveNode(node, ctx) as StackNode;

      expect(result.type).toBe('stack');
      expect(result.children).toHaveLength(3);
      expect((result.children[0] as TextNode).content).toBe('First');
      expect((result.children[1] as TextNode).content).toBe('Second');
      expect((result.children[2] as TextNode).content).toBe('Static');
    });

    it('should filter out null children', () => {
      const node: StackNode = {
        type: 'stack',
        children: [
          textNode('Before'),
          {
            type: 'conditional',
            condition: () => false,
            then: textNode('Hidden'),
          },
          textNode('After'),
        ],
      };
      const ctx = createTestContext({});

      const result = resolveNode(node, ctx) as StackNode;

      expect(result.children).toHaveLength(2);
      expect((result.children[0] as TextNode).content).toBe('Before');
      expect((result.children[1] as TextNode).content).toBe('After');
    });

    it('should preserve stack properties', () => {
      const node: StackNode = {
        type: 'stack',
        direction: 'row',
        gap: 10,
        align: 'center',
        vAlign: 'bottom',
        children: [textNode('Child')],
      };
      const ctx = createTestContext({});

      const result = resolveNode(node, ctx) as StackNode;

      expect(result.direction).toBe('row');
      expect(result.gap).toBe(10);
      expect(result.align).toBe('center');
      expect(result.vAlign).toBe('bottom');
    });

    it('should handle deeply nested resolution', () => {
      const node: StackNode = {
        type: 'stack',
        children: [
          {
            type: 'stack',
            children: [templateNode('{{nested}}')],
          },
        ],
      };
      const ctx = createTestContext({ nested: 'Deep' });

      const result = resolveNode(node, ctx) as StackNode;
      const innerStack = result.children[0] as StackNode;
      const text = innerStack.children[0] as TextNode;

      expect(text.content).toBe('Deep');
    });

    it('should handle empty children array', () => {
      const node: StackNode = {
        type: 'stack',
        children: [],
      };
      const ctx = createTestContext({});

      const result = resolveNode(node, ctx) as StackNode;

      expect(result.children).toHaveLength(0);
    });
  });

  // ==================== FLEX NODE RESOLUTION ====================

  describe('resolveFlexNode', () => {
    it('should resolve all children', () => {
      const node: FlexNode = {
        type: 'flex',
        children: [templateNode('{{left}}'), templateNode('{{right}}')],
      };
      const ctx = createTestContext({ left: 'Left', right: 'Right' });

      const result = resolveNode(node, ctx) as FlexNode;

      expect(result.type).toBe('flex');
      expect(result.children).toHaveLength(2);
      expect((result.children[0] as TextNode).content).toBe('Left');
      expect((result.children[1] as TextNode).content).toBe('Right');
    });

    it('should filter out null children', () => {
      const node: FlexNode = {
        type: 'flex',
        children: [
          textNode('Visible'),
          {
            type: 'conditional',
            condition: { path: 'show', operator: 'eq', value: true },
            then: textNode('Hidden'),
          },
        ],
      };
      const ctx = createTestContext({ show: false });

      const result = resolveNode(node, ctx) as FlexNode;

      expect(result.children).toHaveLength(1);
    });

    it('should preserve flex properties', () => {
      const node: FlexNode = {
        type: 'flex',
        gap: 20,
        justify: 'space-between',
        alignItems: 'center',
        children: [textNode('Child')],
      };
      const ctx = createTestContext({});

      const result = resolveNode(node, ctx) as FlexNode;

      expect(result.gap).toBe(20);
      expect(result.justify).toBe('space-between');
      expect(result.alignItems).toBe('center');
    });
  });

  // ==================== TEXT NODE WITH CONTENT RESOLVER ====================

  describe('resolveTextNode', () => {
    describe('contentResolver handling', () => {
      it('should call contentResolver with data context', () => {
        const resolver = vi.fn().mockReturnValue('Dynamic content');
        const node: TextNode = {
          type: 'text',
          content: 'static',
          contentResolver: resolver,
        };
        const ctx = createTestContext({ key: 'value' });

        resolveNode(node, ctx);

        expect(resolver).toHaveBeenCalledWith(ctx);
      });

      it('should use contentResolver result as content', () => {
        const node: TextNode = {
          type: 'text',
          content: 'fallback',
          contentResolver: () => 'Resolved',
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.content).toBe('Resolved');
      });

      it('should remove contentResolver from result', () => {
        const node: TextNode = {
          type: 'text',
          content: 'fallback',
          contentResolver: () => 'Resolved',
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.contentResolver).toBeUndefined();
      });

      it('should preserve other text node properties', () => {
        const node: TextNode = {
          type: 'text',
          content: 'fallback',
          contentResolver: () => 'Resolved',
          align: 'right',
          bold: true,
          width: 100,
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.align).toBe('right');
        expect(result.bold).toBe(true);
        expect(result.width).toBe(100);
      });
    });

    describe('error fallback', () => {
      beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      it('should fall back to static content when contentResolver throws', () => {
        const node: TextNode = {
          type: 'text',
          content: 'Fallback Content',
          contentResolver: () => {
            throw new Error('Resolver error');
          },
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.content).toBe('Fallback Content');
      });

      it('should log warning when contentResolver throws', () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        const node: TextNode = {
          type: 'text',
          content: 'fallback',
          contentResolver: () => {
            throw new Error('Test error message');
          },
        };
        const ctx = createTestContext({});

        resolveNode(node, ctx);

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy.mock.calls[0][0]).toContain('contentResolver threw an error');
        expect(consoleSpy.mock.calls[0][0]).toContain('Test error message');
      });

      it('should handle non-Error throws', () => {
        const consoleSpy = vi.spyOn(console, 'warn');
        const node: TextNode = {
          type: 'text',
          content: 'fallback',
          contentResolver: () => {
            throw 'string error';
          },
        };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx) as TextNode;

        expect(result.content).toBe('fallback');
        expect(consoleSpy.mock.calls[0][0]).toContain('string error');
      });
    });

    describe('no contentResolver', () => {
      it('should return node unchanged when no contentResolver', () => {
        const node: TextNode = { type: 'text', content: 'Static' };
        const ctx = createTestContext({});

        const result = resolveNode(node, ctx);

        expect(result).toBe(node);
      });
    });
  });

  // ==================== HELPER FUNCTIONS ====================

  describe('createDefaultSpaceContext', () => {
    it('should return SpaceContext with default dimensions', () => {
      const space = createDefaultSpaceContext();

      expect(space.availableWidth).toBe(2880);
      expect(space.availableHeight).toBe(3600);
      expect(space.remainingWidth).toBe(2880);
      expect(space.remainingHeight).toBe(3600);
      expect(space.pageNumber).toBe(0);
    });

    it('should return new object each time', () => {
      const space1 = createDefaultSpaceContext();
      const space2 = createDefaultSpaceContext();

      expect(space1).not.toBe(space2);
      expect(space1).toEqual(space2);
    });
  });

  describe('createDataContext', () => {
    it('should create DataContext with provided data', () => {
      const data = { name: 'Test', value: 42 };
      const ctx = createDataContext(data);

      expect(ctx.data).toBe(data);
      expect(ctx.space).toBeDefined();
    });

    it('should use default space context when not provided', () => {
      const ctx = createDataContext({ test: true });

      expect(ctx.space.availableWidth).toBe(2880);
      expect(ctx.space.availableHeight).toBe(3600);
    });

    it('should use provided space context', () => {
      const customSpace: SpaceContext = {
        availableWidth: 1000,
        availableHeight: 500,
        remainingWidth: 800,
        remainingHeight: 400,
        pageNumber: 2,
      };
      const ctx = createDataContext({ test: true }, customSpace);

      expect(ctx.space).toBe(customSpace);
      expect(ctx.space.availableWidth).toBe(1000);
      expect(ctx.space.pageNumber).toBe(2);
    });

    it('should preserve generic type parameter', () => {
      interface TestData {
        name: string;
        count: number;
      }
      const data: TestData = { name: 'Test', count: 5 };
      const ctx = createDataContext<TestData>(data);

      // TypeScript should allow this
      expect(ctx.data.name).toBe('Test');
      expect(ctx.data.count).toBe(5);
    });
  });

  // ==================== INTEGRATION TESTS ====================

  describe('integration scenarios', () => {
    it('should handle complex nested structure', () => {
      const node: StackNode = {
        type: 'stack',
        children: [
          templateNode('Order #{{order.id}}'),
          {
            type: 'each',
            items: 'order.items',
            as: 'item',
            render: {
              type: 'flex',
              children: [templateNode('{{item.name}}'), templateNode('{{item.price | currency}}')],
            },
            separator: { type: 'line', direction: 'horizontal', length: 'fill' },
          },
          {
            type: 'conditional',
            condition: { path: 'order.discount', operator: 'gt', value: 0 },
            then: templateNode('Discount: {{order.discount | currency}}'),
          },
          templateNode('Total: {{order.total | currency}}'),
        ],
      };

      const ctx = createTestContext({
        order: {
          id: '12345',
          items: [
            { name: 'Widget', price: 9.99 },
            { name: 'Gadget', price: 19.99 },
          ],
          discount: 5,
          total: 24.98,
        },
      });

      const result = resolveNode(node, ctx) as StackNode;

      expect(result.type).toBe('stack');
      // Check header
      expect((result.children[0] as TextNode).content).toBe('Order #12345');
      // Check items stack
      const itemsStack = result.children[1] as StackNode;
      expect(itemsStack.children.length).toBe(3); // 2 items + 1 separator
      // Check discount (should be present)
      expect((result.children[2] as TextNode).content).toBe('Discount: $5.00');
      // Check total
      expect((result.children[3] as TextNode).content).toBe('Total: $24.98');
    });

    it('should handle conditional inside each', () => {
      const node: EachNode = {
        type: 'each',
        items: 'users',
        as: 'user',
        render: {
          type: 'conditional',
          condition: { path: 'user.active', operator: 'eq', value: true },
          then: templateNode('{{user.name}} (active)'),
          else: templateNode('{{user.name}} (inactive)'),
        },
      };

      const ctx = createTestContext({
        users: [
          { name: 'Alice', active: true },
          { name: 'Bob', active: false },
        ],
      });

      const result = resolveNode(node, ctx) as StackNode;

      expect((result.children[0] as TextNode).content).toBe('Alice (active)');
      expect((result.children[1] as TextNode).content).toBe('Bob (inactive)');
    });

    it('should handle switch inside conditional', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: { path: 'hasRole', operator: 'eq', value: true },
        then: {
          type: 'switch',
          path: 'role',
          cases: [
            { value: 'admin', then: textNode('Administrator') },
            { value: 'user', then: textNode('Regular User') },
          ],
          default: textNode('Guest'),
        },
        else: textNode('No role assigned'),
      };

      const ctx = createTestContext({ hasRole: true, role: 'admin' });
      const result = resolveNode(node, ctx) as TextNode;

      expect(result.content).toBe('Administrator');
    });

    it('should pass resolver options through recursively', () => {
      const customFilters = createFilterRegistry();
      customFilters.register('exclaim', (value) => `${value}!`);

      const node: StackNode = {
        type: 'stack',
        children: [
          {
            type: 'each',
            items: 'items',
            render: templateNode('{{item | exclaim}}'),
          },
        ],
      };

      const ctx = createTestContext({ items: ['Hello', 'World'] });
      const options: ResolverOptions = { filters: customFilters };

      const result = resolveNode(node, ctx, options) as StackNode;
      const itemsStack = result.children[0] as StackNode;

      expect((itemsStack.children[0] as TextNode).content).toBe('Hello!');
      expect((itemsStack.children[1] as TextNode).content).toBe('World!');
    });
  });
});
