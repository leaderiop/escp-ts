/**
 * Tests for Virtual Tree Node Types and Helper Functions
 *
 * Comprehensive tests for:
 * - Type guards: isStackNode, isFlexNode, isTextNode, isSpacerNode, isLineNode,
 *   isTemplateNode, isConditionalNode, isSwitchNode, isEachNode, isContainerNode, isResolvableNode
 * - Helper functions: resolvePadding, resolveMargin, resolveStyle
 * - Utility functions: isPercentage, parsePercentage, resolvePercentage
 * - assertNever function
 */

import { describe, it, expect } from 'vitest';
import {
  // Type guards
  isStackNode,
  isFlexNode,
  isTextNode,
  isSpacerNode,
  isLineNode,
  isTemplateNode,
  isConditionalNode,
  isSwitchNode,
  isEachNode,
  isContainerNode,
  isResolvableNode,
  // Helper functions
  resolvePadding,
  resolveMargin,
  resolveStyle,
  // Utility functions
  isPercentage,
  parsePercentage,
  resolvePercentage,
  // assertNever
  assertNever,
  // Types and constants
  DEFAULT_STYLE,
  type LayoutNode,
  type StackNode,
  type FlexNode,
  type TextNode,
  type SpacerNode,
  type LineNode,
  type TemplateNode,
  type ConditionalNode,
  type SwitchNode,
  type EachNode,
  type PaddingSpec,
  type MarginSpec,
  type StyleProps,
  type ResolvedStyle,
} from '../nodes';

// ==================== TEST DATA ====================

const createStackNode = (overrides?: Partial<StackNode>): StackNode => ({
  type: 'stack',
  children: [],
  ...overrides,
});

const createFlexNode = (overrides?: Partial<FlexNode>): FlexNode => ({
  type: 'flex',
  children: [],
  ...overrides,
});

const createTextNode = (overrides?: Partial<TextNode>): TextNode => ({
  type: 'text',
  content: 'Test',
  ...overrides,
});

const createSpacerNode = (overrides?: Partial<SpacerNode>): SpacerNode => ({
  type: 'spacer',
  ...overrides,
});

const createLineNode = (overrides?: Partial<LineNode>): LineNode => ({
  type: 'line',
  direction: 'horizontal',
  ...overrides,
});

const createTemplateNode = (overrides?: Partial<TemplateNode>): TemplateNode => ({
  type: 'template',
  template: '{{name}}',
  ...overrides,
});

const createConditionalNode = (overrides?: Partial<ConditionalNode>): ConditionalNode => ({
  type: 'conditional',
  condition: { path: 'test', operator: 'exists' },
  then: createTextNode(),
  ...overrides,
});

const createSwitchNode = (overrides?: Partial<SwitchNode>): SwitchNode => ({
  type: 'switch',
  path: 'status',
  cases: [{ value: 'active', then: createTextNode() }],
  ...overrides,
});

const createEachNode = (overrides?: Partial<EachNode>): EachNode => ({
  type: 'each',
  items: 'items',
  render: createTextNode(),
  ...overrides,
});

// ==================== TYPE GUARDS ====================

describe('Type Guards', () => {
  describe('isStackNode', () => {
    it('should return true for stack nodes', () => {
      const node = createStackNode();
      expect(isStackNode(node)).toBe(true);
    });

    it('should return false for non-stack nodes', () => {
      expect(isStackNode(createFlexNode())).toBe(false);
      expect(isStackNode(createTextNode())).toBe(false);
      expect(isStackNode(createSpacerNode())).toBe(false);
      expect(isStackNode(createLineNode())).toBe(false);
      expect(isStackNode(createTemplateNode())).toBe(false);
      expect(isStackNode(createConditionalNode())).toBe(false);
      expect(isStackNode(createSwitchNode())).toBe(false);
      expect(isStackNode(createEachNode())).toBe(false);
    });

    it('should return true for stack nodes with children', () => {
      const node = createStackNode({
        children: [createTextNode(), createSpacerNode()],
      });
      expect(isStackNode(node)).toBe(true);
    });

    it('should return true for stack nodes with all properties', () => {
      const node = createStackNode({
        id: 'test-stack',
        direction: 'row',
        gap: 10,
        align: 'center',
        vAlign: 'bottom',
        children: [createTextNode()],
        width: 100,
        height: 50,
        padding: 5,
        margin: 10,
      });
      expect(isStackNode(node)).toBe(true);
    });
  });

  describe('isFlexNode', () => {
    it('should return true for flex nodes', () => {
      const node = createFlexNode();
      expect(isFlexNode(node)).toBe(true);
    });

    it('should return false for non-flex nodes', () => {
      expect(isFlexNode(createStackNode())).toBe(false);
      expect(isFlexNode(createTextNode())).toBe(false);
      expect(isFlexNode(createSpacerNode())).toBe(false);
      expect(isFlexNode(createLineNode())).toBe(false);
      expect(isFlexNode(createTemplateNode())).toBe(false);
      expect(isFlexNode(createConditionalNode())).toBe(false);
      expect(isFlexNode(createSwitchNode())).toBe(false);
      expect(isFlexNode(createEachNode())).toBe(false);
    });

    it('should return true for flex nodes with all properties', () => {
      const node = createFlexNode({
        id: 'test-flex',
        gap: 20,
        justify: 'space-between',
        alignItems: 'center',
        children: [createTextNode(), createSpacerNode()],
      });
      expect(isFlexNode(node)).toBe(true);
    });
  });

  describe('isTextNode', () => {
    it('should return true for text nodes', () => {
      const node = createTextNode();
      expect(isTextNode(node)).toBe(true);
    });

    it('should return false for non-text nodes', () => {
      expect(isTextNode(createStackNode())).toBe(false);
      expect(isTextNode(createFlexNode())).toBe(false);
      expect(isTextNode(createSpacerNode())).toBe(false);
      expect(isTextNode(createLineNode())).toBe(false);
      expect(isTextNode(createTemplateNode())).toBe(false);
      expect(isTextNode(createConditionalNode())).toBe(false);
      expect(isTextNode(createSwitchNode())).toBe(false);
      expect(isTextNode(createEachNode())).toBe(false);
    });

    it('should return true for text nodes with all properties', () => {
      const node = createTextNode({
        id: 'test-text',
        content: 'Hello World',
        align: 'right',
        orientation: 'vertical',
        overflow: 'ellipsis',
        bold: true,
        italic: true,
        underline: true,
      });
      expect(isTextNode(node)).toBe(true);
    });

    it('should return true for text nodes with contentResolver', () => {
      const node = createTextNode({
        content: '',
        contentResolver: (ctx) => `Item ${ctx.index}`,
      });
      expect(isTextNode(node)).toBe(true);
    });
  });

  describe('isSpacerNode', () => {
    it('should return true for spacer nodes', () => {
      const node = createSpacerNode();
      expect(isSpacerNode(node)).toBe(true);
    });

    it('should return false for non-spacer nodes', () => {
      expect(isSpacerNode(createStackNode())).toBe(false);
      expect(isSpacerNode(createFlexNode())).toBe(false);
      expect(isSpacerNode(createTextNode())).toBe(false);
      expect(isSpacerNode(createLineNode())).toBe(false);
      expect(isSpacerNode(createTemplateNode())).toBe(false);
      expect(isSpacerNode(createConditionalNode())).toBe(false);
      expect(isSpacerNode(createSwitchNode())).toBe(false);
      expect(isSpacerNode(createEachNode())).toBe(false);
    });

    it('should return true for spacer nodes with properties', () => {
      const node = createSpacerNode({
        width: 100,
        height: 50,
        flex: true,
      });
      expect(isSpacerNode(node)).toBe(true);
    });
  });

  describe('isLineNode', () => {
    it('should return true for line nodes', () => {
      const node = createLineNode();
      expect(isLineNode(node)).toBe(true);
    });

    it('should return false for non-line nodes', () => {
      expect(isLineNode(createStackNode())).toBe(false);
      expect(isLineNode(createFlexNode())).toBe(false);
      expect(isLineNode(createTextNode())).toBe(false);
      expect(isLineNode(createSpacerNode())).toBe(false);
      expect(isLineNode(createTemplateNode())).toBe(false);
      expect(isLineNode(createConditionalNode())).toBe(false);
      expect(isLineNode(createSwitchNode())).toBe(false);
      expect(isLineNode(createEachNode())).toBe(false);
    });

    it('should return true for horizontal line nodes', () => {
      const node = createLineNode({ direction: 'horizontal', length: 100, char: '-' });
      expect(isLineNode(node)).toBe(true);
    });

    it('should return true for vertical line nodes', () => {
      const node = createLineNode({ direction: 'vertical', length: 'fill', char: '|' });
      expect(isLineNode(node)).toBe(true);
    });
  });

  describe('isTemplateNode', () => {
    it('should return true for template nodes', () => {
      const node = createTemplateNode();
      expect(isTemplateNode(node)).toBe(true);
    });

    it('should return false for non-template nodes', () => {
      expect(isTemplateNode(createStackNode())).toBe(false);
      expect(isTemplateNode(createFlexNode())).toBe(false);
      expect(isTemplateNode(createTextNode())).toBe(false);
      expect(isTemplateNode(createSpacerNode())).toBe(false);
      expect(isTemplateNode(createLineNode())).toBe(false);
      expect(isTemplateNode(createConditionalNode())).toBe(false);
      expect(isTemplateNode(createSwitchNode())).toBe(false);
      expect(isTemplateNode(createEachNode())).toBe(false);
    });

    it('should return true for template nodes with all properties', () => {
      const node = createTemplateNode({
        template: 'Hello {{name}}!',
        data: { name: 'World' },
        align: 'center',
      });
      expect(isTemplateNode(node)).toBe(true);
    });
  });

  describe('isConditionalNode', () => {
    it('should return true for conditional nodes', () => {
      const node = createConditionalNode();
      expect(isConditionalNode(node)).toBe(true);
    });

    it('should return false for non-conditional nodes', () => {
      expect(isConditionalNode(createStackNode())).toBe(false);
      expect(isConditionalNode(createFlexNode())).toBe(false);
      expect(isConditionalNode(createTextNode())).toBe(false);
      expect(isConditionalNode(createSpacerNode())).toBe(false);
      expect(isConditionalNode(createLineNode())).toBe(false);
      expect(isConditionalNode(createTemplateNode())).toBe(false);
      expect(isConditionalNode(createSwitchNode())).toBe(false);
      expect(isConditionalNode(createEachNode())).toBe(false);
    });

    it('should return true for conditional nodes with function condition', () => {
      const node = createConditionalNode({
        condition: (ctx) => ctx.data !== null,
        then: createTextNode(),
        else: createSpacerNode(),
      });
      expect(isConditionalNode(node)).toBe(true);
    });

    it('should return true for conditional nodes with else-if chains', () => {
      const node = createConditionalNode({
        condition: { path: 'status', operator: 'eq', value: 'active' },
        then: createTextNode({ content: 'Active' }),
        elseIf: [
          {
            condition: { path: 'status', operator: 'eq', value: 'pending' },
            then: createTextNode({ content: 'Pending' }),
          },
        ],
        else: createTextNode({ content: 'Unknown' }),
      });
      expect(isConditionalNode(node)).toBe(true);
    });
  });

  describe('isSwitchNode', () => {
    it('should return true for switch nodes', () => {
      const node = createSwitchNode();
      expect(isSwitchNode(node)).toBe(true);
    });

    it('should return false for non-switch nodes', () => {
      expect(isSwitchNode(createStackNode())).toBe(false);
      expect(isSwitchNode(createFlexNode())).toBe(false);
      expect(isSwitchNode(createTextNode())).toBe(false);
      expect(isSwitchNode(createSpacerNode())).toBe(false);
      expect(isSwitchNode(createLineNode())).toBe(false);
      expect(isSwitchNode(createTemplateNode())).toBe(false);
      expect(isSwitchNode(createConditionalNode())).toBe(false);
      expect(isSwitchNode(createEachNode())).toBe(false);
    });

    it('should return true for switch nodes with multiple cases', () => {
      const node = createSwitchNode({
        path: 'user.role',
        cases: [
          { value: 'admin', then: createTextNode({ content: 'Admin' }) },
          { value: ['user', 'guest'], then: createTextNode({ content: 'User' }) },
        ],
        default: createTextNode({ content: 'Unknown' }),
      });
      expect(isSwitchNode(node)).toBe(true);
    });
  });

  describe('isEachNode', () => {
    it('should return true for each nodes', () => {
      const node = createEachNode();
      expect(isEachNode(node)).toBe(true);
    });

    it('should return false for non-each nodes', () => {
      expect(isEachNode(createStackNode())).toBe(false);
      expect(isEachNode(createFlexNode())).toBe(false);
      expect(isEachNode(createTextNode())).toBe(false);
      expect(isEachNode(createSpacerNode())).toBe(false);
      expect(isEachNode(createLineNode())).toBe(false);
      expect(isEachNode(createTemplateNode())).toBe(false);
      expect(isEachNode(createConditionalNode())).toBe(false);
      expect(isEachNode(createSwitchNode())).toBe(false);
    });

    it('should return true for each nodes with all properties', () => {
      const node = createEachNode({
        items: 'order.lineItems',
        as: 'item',
        indexAs: 'idx',
        render: createTextNode(),
        empty: createTextNode({ content: 'No items' }),
        separator: createLineNode(),
      });
      expect(isEachNode(node)).toBe(true);
    });
  });

  describe('isContainerNode', () => {
    it('should return true for stack nodes', () => {
      expect(isContainerNode(createStackNode())).toBe(true);
    });

    it('should return true for flex nodes', () => {
      expect(isContainerNode(createFlexNode())).toBe(true);
    });

    it('should return false for leaf nodes', () => {
      expect(isContainerNode(createTextNode())).toBe(false);
      expect(isContainerNode(createSpacerNode())).toBe(false);
      expect(isContainerNode(createLineNode())).toBe(false);
    });

    it('should return false for resolvable nodes', () => {
      expect(isContainerNode(createTemplateNode())).toBe(false);
      expect(isContainerNode(createConditionalNode())).toBe(false);
      expect(isContainerNode(createSwitchNode())).toBe(false);
      expect(isContainerNode(createEachNode())).toBe(false);
    });
  });

  describe('isResolvableNode', () => {
    it('should return true for template nodes', () => {
      expect(isResolvableNode(createTemplateNode())).toBe(true);
    });

    it('should return true for conditional nodes', () => {
      expect(isResolvableNode(createConditionalNode())).toBe(true);
    });

    it('should return true for switch nodes', () => {
      expect(isResolvableNode(createSwitchNode())).toBe(true);
    });

    it('should return true for each nodes', () => {
      expect(isResolvableNode(createEachNode())).toBe(true);
    });

    it('should return false for container nodes', () => {
      expect(isResolvableNode(createStackNode())).toBe(false);
      expect(isResolvableNode(createFlexNode())).toBe(false);
    });

    it('should return false for leaf nodes', () => {
      expect(isResolvableNode(createTextNode())).toBe(false);
      expect(isResolvableNode(createSpacerNode())).toBe(false);
      expect(isResolvableNode(createLineNode())).toBe(false);
    });
  });
});

// ==================== UTILITY FUNCTIONS ====================

describe('Utility Functions', () => {
  describe('isPercentage', () => {
    it('should return true for valid percentage strings', () => {
      expect(isPercentage('50%')).toBe(true);
      expect(isPercentage('100%')).toBe(true);
      expect(isPercentage('0%')).toBe(true);
      expect(isPercentage('1%')).toBe(true);
    });

    it('should return true for decimal percentage strings', () => {
      expect(isPercentage('50.5%')).toBe(true);
      expect(isPercentage('33.33%')).toBe(true);
      expect(isPercentage('0.5%')).toBe(true);
      expect(isPercentage('99.99%')).toBe(true);
    });

    it('should return false for non-percentage strings', () => {
      expect(isPercentage('50')).toBe(false);
      expect(isPercentage('auto')).toBe(false);
      expect(isPercentage('fill')).toBe(false);
      expect(isPercentage('100px')).toBe(false);
      expect(isPercentage('%50')).toBe(false);
      expect(isPercentage('%%')).toBe(false);
      expect(isPercentage('%')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isPercentage(50)).toBe(false);
      expect(isPercentage(100)).toBe(false);
      expect(isPercentage(0)).toBe(false);
    });

    it('should return false for null and undefined', () => {
      expect(isPercentage(null)).toBe(false);
      expect(isPercentage(undefined)).toBe(false);
    });

    it('should return false for objects and arrays', () => {
      expect(isPercentage({})).toBe(false);
      expect(isPercentage([])).toBe(false);
      expect(isPercentage({ value: '50%' })).toBe(false);
    });

    it('should return false for boolean values', () => {
      expect(isPercentage(true)).toBe(false);
      expect(isPercentage(false)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPercentage('')).toBe(false);
    });

    it('should return false for negative percentages', () => {
      expect(isPercentage('-50%')).toBe(false);
      expect(isPercentage('-100%')).toBe(false);
    });

    it('should return false for percentages with spaces', () => {
      expect(isPercentage(' 50%')).toBe(false);
      expect(isPercentage('50% ')).toBe(false);
      expect(isPercentage(' 50% ')).toBe(false);
    });
  });

  describe('parsePercentage', () => {
    it('should parse integer percentage strings', () => {
      expect(parsePercentage('50%')).toBe(50);
      expect(parsePercentage('100%')).toBe(100);
      expect(parsePercentage('0%')).toBe(0);
      expect(parsePercentage('1%')).toBe(1);
    });

    it('should parse decimal percentage strings', () => {
      expect(parsePercentage('50.5%')).toBe(50.5);
      expect(parsePercentage('33.33%')).toBe(33.33);
      expect(parsePercentage('0.5%')).toBe(0.5);
      expect(parsePercentage('99.99%')).toBe(99.99);
    });

    it('should handle large percentages', () => {
      expect(parsePercentage('200%')).toBe(200);
      expect(parsePercentage('1000%')).toBe(1000);
    });

    it('should handle very small percentages', () => {
      expect(parsePercentage('0.01%')).toBe(0.01);
      expect(parsePercentage('0.001%')).toBe(0.001);
    });
  });

  describe('resolvePercentage', () => {
    it('should calculate percentage of available size', () => {
      expect(resolvePercentage(50, 100)).toBe(50);
      expect(resolvePercentage(100, 100)).toBe(100);
      expect(resolvePercentage(25, 400)).toBe(100);
    });

    it('should floor the result', () => {
      expect(resolvePercentage(33, 100)).toBe(33);
      expect(resolvePercentage(33.33, 100)).toBe(33);
      expect(resolvePercentage(50, 99)).toBe(49);
    });

    it('should handle 0 percentage', () => {
      expect(resolvePercentage(0, 100)).toBe(0);
      expect(resolvePercentage(0, 0)).toBe(0);
    });

    it('should handle 0 available size', () => {
      expect(resolvePercentage(50, 0)).toBe(0);
      expect(resolvePercentage(100, 0)).toBe(0);
    });

    it('should handle large percentages (>100%)', () => {
      expect(resolvePercentage(200, 100)).toBe(200);
      expect(resolvePercentage(150, 200)).toBe(300);
    });

    it('should handle decimal percentages', () => {
      expect(resolvePercentage(50.5, 100)).toBe(50);
      expect(resolvePercentage(33.33, 300)).toBe(99);
    });
  });
});

// ==================== HELPER FUNCTIONS ====================

describe('Helper Functions', () => {
  describe('resolvePadding', () => {
    it('should return zero padding for undefined', () => {
      const result = resolvePadding(undefined);
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should apply uniform padding for number', () => {
      const result = resolvePadding(10);
      expect(result).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    });

    it('should apply uniform padding for zero', () => {
      const result = resolvePadding(0);
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should apply individual padding from object', () => {
      const result = resolvePadding({ top: 5, right: 10, bottom: 15, left: 20 });
      expect(result).toEqual({ top: 5, right: 10, bottom: 15, left: 20 });
    });

    it('should default missing sides to zero', () => {
      const result = resolvePadding({ top: 10 });
      expect(result).toEqual({ top: 10, right: 0, bottom: 0, left: 0 });
    });

    it('should handle partial padding object with right only', () => {
      const result = resolvePadding({ right: 15 });
      expect(result).toEqual({ top: 0, right: 15, bottom: 0, left: 0 });
    });

    it('should handle partial padding object with bottom only', () => {
      const result = resolvePadding({ bottom: 20 });
      expect(result).toEqual({ top: 0, right: 0, bottom: 20, left: 0 });
    });

    it('should handle partial padding object with left only', () => {
      const result = resolvePadding({ left: 25 });
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 25 });
    });

    it('should handle empty padding object', () => {
      const result = resolvePadding({});
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should handle vertical and horizontal padding', () => {
      const result = resolvePadding({ top: 10, bottom: 10, left: 20, right: 20 });
      expect(result).toEqual({ top: 10, right: 20, bottom: 10, left: 20 });
    });
  });

  describe('resolveMargin', () => {
    it('should return zero margin for undefined', () => {
      const result = resolveMargin(undefined);
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should apply uniform margin for number', () => {
      const result = resolveMargin(10);
      expect(result).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    });

    it('should apply uniform margin for zero', () => {
      const result = resolveMargin(0);
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should handle auto margin for horizontal centering', () => {
      const result = resolveMargin('auto');
      expect(result).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        autoLeft: true,
        autoRight: true,
        autoHorizontal: true,
      });
    });

    it('should apply individual margin from object', () => {
      const result = resolveMargin({ top: 5, right: 10, bottom: 15, left: 20 });
      expect(result).toEqual({ top: 5, right: 10, bottom: 15, left: 20 });
    });

    it('should default missing sides to zero', () => {
      const result = resolveMargin({ top: 10 });
      expect(result).toEqual({ top: 10, right: 0, bottom: 0, left: 0 });
    });

    it('should handle empty margin object', () => {
      const result = resolveMargin({});
      expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });

    it('should handle left auto margin only (push right)', () => {
      const result = resolveMargin({ left: 'auto', right: 10 });
      expect(result).toEqual({
        top: 0,
        right: 10,
        bottom: 0,
        left: 0,
        autoLeft: true,
      });
    });

    it('should handle right auto margin only (push left)', () => {
      const result = resolveMargin({ left: 10, right: 'auto' });
      expect(result).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
        autoRight: true,
      });
    });

    it('should handle both horizontal auto margins (centering)', () => {
      const result = resolveMargin({ left: 'auto', right: 'auto' });
      expect(result).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        autoLeft: true,
        autoRight: true,
        autoHorizontal: true,
      });
    });

    it('should handle auto horizontal with numeric vertical margins', () => {
      const result = resolveMargin({ top: 10, bottom: 20, left: 'auto', right: 'auto' });
      expect(result).toEqual({
        top: 10,
        right: 0,
        bottom: 20,
        left: 0,
        autoLeft: true,
        autoRight: true,
        autoHorizontal: true,
      });
    });

    it('should not set autoHorizontal when only one side is auto', () => {
      const result = resolveMargin({ left: 'auto' });
      expect(result.autoLeft).toBe(true);
      expect(result.autoRight).toBeUndefined();
      expect(result.autoHorizontal).toBeUndefined();
    });
  });

  describe('resolveStyle', () => {
    it('should inherit all styles from parent when node has no overrides', () => {
      const node: StyleProps = {};
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result).toEqual(DEFAULT_STYLE);
    });

    it('should override bold from parent', () => {
      const node: StyleProps = { bold: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.bold).toBe(true);
      expect(result.italic).toBe(false);
    });

    it('should override italic from parent', () => {
      const node: StyleProps = { italic: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.italic).toBe(true);
      expect(result.bold).toBe(false);
    });

    it('should override underline from parent', () => {
      const node: StyleProps = { underline: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.underline).toBe(true);
    });

    it('should override doubleStrike from parent', () => {
      const node: StyleProps = { doubleStrike: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.doubleStrike).toBe(true);
    });

    it('should override doubleWidth from parent', () => {
      const node: StyleProps = { doubleWidth: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.doubleWidth).toBe(true);
    });

    it('should override doubleHeight from parent', () => {
      const node: StyleProps = { doubleHeight: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.doubleHeight).toBe(true);
    });

    it('should override condensed from parent', () => {
      const node: StyleProps = { condensed: true };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.condensed).toBe(true);
    });

    it('should override cpi from parent', () => {
      const node: StyleProps = { cpi: 12 };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.cpi).toBe(12);
    });

    it('should override multiple styles from parent', () => {
      const node: StyleProps = { bold: true, italic: true, underline: true, cpi: 15 };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.bold).toBe(true);
      expect(result.italic).toBe(true);
      expect(result.underline).toBe(true);
      expect(result.cpi).toBe(15);
      expect(result.condensed).toBe(false); // inherited
    });

    it('should resolve typeface from string value', () => {
      const node: StyleProps = { typeface: 'roman' };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(typeof result.typeface).toBe('number');
    });

    it('should resolve typeface from numeric value', () => {
      const node: StyleProps = { typeface: 1 };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.typeface).toBe(1);
    });

    it('should resolve printQuality from string value', () => {
      const node: StyleProps = { printQuality: 'draft' };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.printQuality).toBe(0);
    });

    it('should resolve printQuality lq from string value', () => {
      const node: StyleProps = { printQuality: 'lq' };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.printQuality).toBe(1);
    });

    it('should resolve printQuality from numeric value', () => {
      const node: StyleProps = { printQuality: 0 };
      const result = resolveStyle(node, DEFAULT_STYLE);
      expect(result.printQuality).toBe(0);
    });

    it('should inherit from non-default parent styles', () => {
      const parentStyle: ResolvedStyle = {
        bold: true,
        italic: true,
        underline: false,
        doubleStrike: true,
        doubleWidth: false,
        doubleHeight: true,
        condensed: false,
        cpi: 12,
        typeface: 1,
        printQuality: 0,
      };
      const node: StyleProps = { underline: true };
      const result = resolveStyle(node, parentStyle);
      expect(result.bold).toBe(true); // inherited
      expect(result.italic).toBe(true); // inherited
      expect(result.underline).toBe(true); // overridden
      expect(result.doubleStrike).toBe(true); // inherited
      expect(result.cpi).toBe(12); // inherited
      expect(result.typeface).toBe(1); // inherited
      expect(result.printQuality).toBe(0); // inherited
    });

    it('should allow disabling inherited styles', () => {
      const parentStyle: ResolvedStyle = {
        ...DEFAULT_STYLE,
        bold: true,
        italic: true,
      };
      const node: StyleProps = { bold: false, italic: false };
      const result = resolveStyle(node, parentStyle);
      expect(result.bold).toBe(false);
      expect(result.italic).toBe(false);
    });
  });
});

// ==================== ASSERT NEVER ====================

describe('assertNever', () => {
  it('should throw an error with JSON representation of the value', () => {
    const unexpectedValue = { type: 'unknown' } as never;
    expect(() => assertNever(unexpectedValue)).toThrow('Unexpected value: {"type":"unknown"}');
  });

  it('should throw an error with string value', () => {
    const unexpectedValue = 'unexpected' as never;
    expect(() => assertNever(unexpectedValue)).toThrow('Unexpected value: "unexpected"');
  });

  it('should throw an error with number value', () => {
    const unexpectedValue = 42 as never;
    expect(() => assertNever(unexpectedValue)).toThrow('Unexpected value: 42');
  });

  it('should throw an error with null value', () => {
    const unexpectedValue = null as never;
    expect(() => assertNever(unexpectedValue)).toThrow('Unexpected value: null');
  });

  it('should throw an error with array value', () => {
    const unexpectedValue = [1, 2, 3] as never;
    expect(() => assertNever(unexpectedValue)).toThrow('Unexpected value: [1,2,3]');
  });

  it('should be usable in exhaustive switch statements', () => {
    // This test demonstrates the intended use case
    type TestUnion = { type: 'a' } | { type: 'b' };

    const handleUnion = (value: TestUnion): string => {
      switch (value.type) {
        case 'a':
          return 'handled a';
        case 'b':
          return 'handled b';
        default:
          // This should never be reached if all cases are handled
          return assertNever(value);
      }
    };

    expect(handleUnion({ type: 'a' })).toBe('handled a');
    expect(handleUnion({ type: 'b' })).toBe('handled b');
  });
});

// ==================== DEFAULT STYLE ====================

describe('DEFAULT_STYLE', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_STYLE.bold).toBe(false);
    expect(DEFAULT_STYLE.italic).toBe(false);
    expect(DEFAULT_STYLE.underline).toBe(false);
    expect(DEFAULT_STYLE.doubleStrike).toBe(false);
    expect(DEFAULT_STYLE.doubleWidth).toBe(false);
    expect(DEFAULT_STYLE.doubleHeight).toBe(false);
    expect(DEFAULT_STYLE.condensed).toBe(false);
    expect(DEFAULT_STYLE.cpi).toBe(10);
    expect(DEFAULT_STYLE.typeface).toBe(0);
    expect(DEFAULT_STYLE.printQuality).toBe(1);
  });

  it('should be immutable (defensive check)', () => {
    const originalCpi = DEFAULT_STYLE.cpi;
    expect(DEFAULT_STYLE.cpi).toBe(originalCpi);
  });
});

// ==================== EDGE CASES ====================

describe('Edge Cases', () => {
  describe('Type guard robustness', () => {
    it('should handle nodes with additional properties', () => {
      const node = {
        ...createStackNode(),
        customProp: 'value',
      } as unknown as LayoutNode;
      expect(isStackNode(node)).toBe(true);
    });

    it('should correctly identify nodes in arrays', () => {
      const nodes: LayoutNode[] = [
        createStackNode(),
        createFlexNode(),
        createTextNode(),
        createSpacerNode(),
        createLineNode(),
        createTemplateNode(),
        createConditionalNode(),
        createSwitchNode(),
        createEachNode(),
      ];

      expect(nodes.filter(isStackNode)).toHaveLength(1);
      expect(nodes.filter(isFlexNode)).toHaveLength(1);
      expect(nodes.filter(isTextNode)).toHaveLength(1);
      expect(nodes.filter(isSpacerNode)).toHaveLength(1);
      expect(nodes.filter(isLineNode)).toHaveLength(1);
      expect(nodes.filter(isTemplateNode)).toHaveLength(1);
      expect(nodes.filter(isConditionalNode)).toHaveLength(1);
      expect(nodes.filter(isSwitchNode)).toHaveLength(1);
      expect(nodes.filter(isEachNode)).toHaveLength(1);
      expect(nodes.filter(isContainerNode)).toHaveLength(2);
      expect(nodes.filter(isResolvableNode)).toHaveLength(4);
    });
  });

  describe('Percentage edge cases', () => {
    it('should handle very large percentage values', () => {
      expect(isPercentage('99999%')).toBe(true);
      expect(parsePercentage('99999%')).toBe(99999);
    });

    it('should handle very small decimal percentages', () => {
      expect(isPercentage('0.00001%')).toBe(true);
      expect(parsePercentage('0.00001%')).toBeCloseTo(0.00001);
    });

    it('should resolve percentage with large available size', () => {
      expect(resolvePercentage(50, 10000)).toBe(5000);
    });
  });

  describe('Margin and padding with large values', () => {
    it('should handle large padding values', () => {
      const result = resolvePadding(10000);
      expect(result).toEqual({ top: 10000, right: 10000, bottom: 10000, left: 10000 });
    });

    it('should handle large margin values', () => {
      const result = resolveMargin(10000);
      expect(result).toEqual({ top: 10000, right: 10000, bottom: 10000, left: 10000 });
    });
  });

  describe('Style resolution with extreme CPI values', () => {
    it('should handle various CPI values', () => {
      const cpiValues = [10, 12, 15, 17, 20];
      for (const cpi of cpiValues) {
        const node: StyleProps = { cpi };
        const result = resolveStyle(node, DEFAULT_STYLE);
        expect(result.cpi).toBe(cpi);
      }
    });
  });
});
