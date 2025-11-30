/**
 * Tests for YogaNodeBuilder - Dynamic Node Handling
 *
 * These tests target Blackhole #2: Silent failure when unresolved
 * dynamic nodes (template, conditional, switch, each) reach the Yoga builder.
 * The builder should throw an error instead of logging a warning.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { buildYogaTree, freeYogaTree } from '../YogaNodeBuilder';
import { loadYoga } from 'yoga-layout/load';
import type { Yoga } from 'yoga-layout/load';
import { DEFAULT_STYLE } from '../../nodes';
import type { LayoutNode, TemplateNode, ConditionalNode, SwitchNode, EachNode } from '../../nodes';
import type { YogaLayoutContext } from '../types';

let Yoga: Yoga;

beforeAll(async () => {
  Yoga = await loadYoga();
});

const ctx: YogaLayoutContext = {
  availableWidth: 500,
  availableHeight: 500,
  lineSpacing: 24,
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

describe('YogaNodeBuilder dynamic node handling', () => {
  describe('Template node rejection', () => {
    it('should throw for unresolved template node', () => {
      const node: TemplateNode = { type: 'template', template: '{{x}}' };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow();
    });

    it('should include "template" in error message', () => {
      const node: TemplateNode = { type: 'template', template: '{{name}}' };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow(/template/i);
    });

    it('should mention resolution in error', () => {
      const node: TemplateNode = { type: 'template', template: '{{x}}' };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow(
        /resolved.*before.*layout/i
      );
    });
  });

  describe('Conditional node rejection', () => {
    it('should throw for unresolved conditional node', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: { path: 'active', operator: 'eq', value: true },
        then: { type: 'text', content: 'Yes' },
      };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow();
    });

    it('should throw for conditional with function condition', () => {
      const node: ConditionalNode = {
        type: 'conditional',
        condition: () => true,
        then: { type: 'text', content: 'Yes' },
        else: { type: 'text', content: 'No' },
      };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow(/conditional/i);
    });
  });

  describe('Switch node rejection', () => {
    it('should throw for unresolved switch node', () => {
      const node: SwitchNode = {
        type: 'switch',
        path: 'status',
        cases: [{ value: 'active', then: { type: 'text', content: 'Active' } }],
      };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow(/switch/i);
    });

    it('should throw for switch with default', () => {
      const node: SwitchNode = {
        type: 'switch',
        path: 'role',
        cases: [],
        default: { type: 'text', content: 'Unknown' },
      };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow();
    });
  });

  describe('Each node rejection', () => {
    it('should throw for unresolved each node', () => {
      const node: EachNode = {
        type: 'each',
        items: 'products',
        render: { type: 'text', content: '{{item.name}}' },
      };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow(/each/i);
    });

    it('should throw for each with separator', () => {
      const node: EachNode = {
        type: 'each',
        items: 'items',
        as: 'item',
        render: { type: 'text', content: 'Item' },
        separator: { type: 'line', direction: 'horizontal' },
      };
      expect(() => buildYogaTree(Yoga, node as LayoutNode, ctx)).toThrow();
    });
  });

  describe('Nested dynamic nodes', () => {
    it('should throw when template is nested in stack', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'Header' },
          { type: 'template', template: '{{content}}' } as LayoutNode,
        ],
      };
      expect(() => buildYogaTree(Yoga, node, ctx)).toThrow(/template/i);
    });

    it('should throw when conditional is deeply nested', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          {
            type: 'flex',
            children: [
              {
                type: 'conditional',
                condition: () => true,
                then: { type: 'text', content: 'X' },
              } as LayoutNode,
            ],
          },
        ],
      };
      expect(() => buildYogaTree(Yoga, node, ctx)).toThrow(/conditional/i);
    });

    it('should throw when each is inside flex', () => {
      const node: LayoutNode = {
        type: 'flex',
        children: [
          { type: 'text', content: 'Before' },
          {
            type: 'each',
            items: 'list',
            render: { type: 'text', content: 'Item' },
          } as LayoutNode,
        ],
      };
      expect(() => buildYogaTree(Yoga, node, ctx)).toThrow(/each/i);
    });

    it('should throw when switch is inside nested stacks', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          {
            type: 'stack',
            children: [
              {
                type: 'switch',
                path: 'type',
                cases: [{ value: 'A', then: { type: 'text', content: 'A' } }],
              } as LayoutNode,
            ],
          },
        ],
      };
      expect(() => buildYogaTree(Yoga, node, ctx)).toThrow(/switch/i);
    });
  });

  describe('Valid nodes still work', () => {
    it('should build tree for text node', () => {
      const node: LayoutNode = { type: 'text', content: 'Hello' };
      const mapping = buildYogaTree(Yoga, node, ctx);
      expect(mapping).toBeDefined();
      expect(mapping.yogaNode).toBeDefined();
      freeYogaTree(mapping);
    });

    it('should build tree for stack with children', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [
          { type: 'text', content: 'A' },
          { type: 'text', content: 'B' },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      expect(mapping.children).toHaveLength(2);
      freeYogaTree(mapping);
    });

    it('should build tree for flex with spacer', () => {
      const node: LayoutNode = {
        type: 'flex',
        children: [
          { type: 'text', content: 'Left' },
          { type: 'spacer', flex: true },
          { type: 'text', content: 'Right' },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      expect(mapping.children).toHaveLength(3);
      freeYogaTree(mapping);
    });

    it('should build tree for line node', () => {
      const node: LayoutNode = { type: 'line', direction: 'horizontal', length: 'fill' };
      const mapping = buildYogaTree(Yoga, node, ctx);
      expect(mapping).toBeDefined();
      freeYogaTree(mapping);
    });

    it('should build tree for spacer node', () => {
      const node: LayoutNode = { type: 'spacer', height: 20, width: 10 };
      const mapping = buildYogaTree(Yoga, node, ctx);
      expect(mapping).toBeDefined();
      freeYogaTree(mapping);
    });
  });
});
