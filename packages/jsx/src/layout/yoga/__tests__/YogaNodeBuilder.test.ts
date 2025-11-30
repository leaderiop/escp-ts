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

/**
 * Tests for shouldClipText propagation
 *
 * These tests verify that text clipping is correctly controlled based on
 * container width constraints:
 * - width: 'fill' should NOT trigger clipping
 * - width: <number> should trigger clipping
 * - width: '<percent>%' should trigger clipping
 * - clipping context should propagate correctly through nested containers
 */
describe('YogaNodeBuilder shouldClipText propagation', () => {
  describe('Stack width semantics', () => {
    it('should NOT clip text in Stack without explicit width', () => {
      const node: LayoutNode = {
        type: 'stack',
        children: [{ type: 'text', content: 'Long text that should not be clipped' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should NOT clip text in Stack with width="fill"', () => {
      const node: LayoutNode = {
        type: 'stack',
        width: 'fill',
        children: [{ type: 'text', content: 'Long text that should not be clipped' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should clip text in Stack with numeric width', () => {
      const node: LayoutNode = {
        type: 'stack',
        width: 200,
        children: [{ type: 'text', content: 'Text in constrained container' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });

    it('should clip text in Stack with percentage width', () => {
      const node: LayoutNode = {
        type: 'stack',
        width: '50%',
        children: [{ type: 'text', content: 'Text in percentage container' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });
  });

  describe('Flex width semantics', () => {
    it('should NOT clip text in Flex without explicit width', () => {
      const node: LayoutNode = {
        type: 'flex',
        children: [{ type: 'text', content: 'Flex item text' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should NOT clip text in Flex with width="fill"', () => {
      const node: LayoutNode = {
        type: 'flex',
        width: 'fill',
        children: [{ type: 'text', content: 'Flex item in fill container' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should clip text in Flex with numeric width', () => {
      const node: LayoutNode = {
        type: 'flex',
        width: 300,
        children: [{ type: 'text', content: 'Flex item in constrained container' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });

    it('should clip text in Flex with percentage width', () => {
      const node: LayoutNode = {
        type: 'flex',
        width: '75%',
        children: [{ type: 'text', content: 'Flex item in percentage container' }],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const textMapping = mapping.children[0];

      expect(textMapping.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });
  });

  describe('Nested container propagation', () => {
    it('should propagate clipping from parent Stack to nested Stack', () => {
      const node: LayoutNode = {
        type: 'stack',
        width: 200,
        children: [
          {
            type: 'stack',
            // No width - should inherit clipping from parent
            children: [{ type: 'text', content: 'Nested text' }],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const nestedText = mapping.children[0].children[0];

      expect(nestedText.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });

    it('should propagate clipping from parent Stack to nested Flex', () => {
      const node: LayoutNode = {
        type: 'stack',
        width: 200,
        children: [
          {
            type: 'flex',
            // No width - should inherit clipping from parent
            children: [{ type: 'text', content: 'Flex text in constrained parent' }],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const flexText = mapping.children[0].children[0];

      expect(flexText.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });

    it('should NOT propagate clipping through Stack with width="fill"', () => {
      // Outer Stack has no width (no clipping)
      // Inner Stack with width="fill" should inherit no clipping
      const node: LayoutNode = {
        type: 'stack',
        children: [
          {
            type: 'stack',
            width: 'fill',
            children: [{ type: 'text', content: 'Text in fill container' }],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const nestedText = mapping.children[0].children[0];

      expect(nestedText.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should NOT clip in nested fill containers (Border pattern)', () => {
      // This simulates the Border component pattern:
      // Stack (no width) > Flex (no width) > Stack (width="fill") > Text
      const node: LayoutNode = {
        type: 'stack',
        children: [
          {
            type: 'flex',
            children: [
              { type: 'text', content: '|' }, // border char
              {
                type: 'stack',
                width: 'fill',
                children: [{ type: 'text', content: 'Content inside border' }],
              },
              { type: 'text', content: '|' }, // border char
            ],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const contentStack = mapping.children[0].children[1];
      const contentText = contentStack.children[0];

      expect(contentText.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });
  });

  describe('Label component pattern (critical fix)', () => {
    it('should NOT clip text in Flex with gap (Label pattern)', () => {
      // Label uses: Flex({ gap: 18, children: [Text(label), Text(value)] })
      const node: LayoutNode = {
        type: 'flex',
        gap: 18,
        children: [
          { type: 'text', content: 'Subtotal:' },
          { type: 'text', content: '$850.00' },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const labelText = mapping.children[0];
      const valueText = mapping.children[1];

      expect(labelText.shouldClipText).toBe(false);
      expect(valueText.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should NOT clip Labels inside Card content area', () => {
      // Simulates: Stack > Flex (width="fill") > Stack (width="fill") > Flex (Label)
      const node: LayoutNode = {
        type: 'stack',
        children: [
          {
            type: 'flex',
            width: 'fill',
            children: [
              {
                type: 'stack',
                width: 'fill',
                children: [
                  {
                    type: 'flex',
                    gap: 18,
                    children: [
                      { type: 'text', content: 'Estimated:' },
                      { type: 'text', content: 'Dec 20, 2024' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const labelFlex = mapping.children[0].children[0].children[0];
      const labelText = labelFlex.children[0];
      const valueText = labelFlex.children[1];

      expect(labelText.shouldClipText).toBe(false);
      expect(valueText.shouldClipText).toBe(false);
      freeYogaTree(mapping);
    });

    it('should clip Labels ONLY when inside percentage-width container', () => {
      // Label inside Stack with 50% width SHOULD be clipped
      const node: LayoutNode = {
        type: 'stack',
        width: '50%',
        children: [
          {
            type: 'flex',
            gap: 18,
            children: [
              { type: 'text', content: 'Date:' },
              { type: 'text', content: 'Dec 15, 2024' },
            ],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const labelFlex = mapping.children[0];
      const labelText = labelFlex.children[0];
      const valueText = labelFlex.children[1];

      expect(labelText.shouldClipText).toBe(true);
      expect(valueText.shouldClipText).toBe(true);
      freeYogaTree(mapping);
    });
  });

  describe('Invoice card scenario', () => {
    it('should NOT clip right-aligned Labels in unconstrained Stack', () => {
      // Simulates CardContent > Stack (align="right") > Label
      const node: LayoutNode = {
        type: 'stack',
        children: [
          {
            type: 'stack',
            align: 'right',
            children: [
              {
                type: 'flex',
                gap: 18,
                children: [
                  { type: 'text', content: 'Subtotal:' },
                  { type: 'text', content: '$850.00' },
                ],
              },
              {
                type: 'flex',
                gap: 18,
                children: [
                  { type: 'text', content: 'Tax (8%):' },
                  { type: 'text', content: '$68.00' },
                ],
              },
              {
                type: 'flex',
                gap: 18,
                children: [
                  { type: 'text', content: 'TOTAL:' },
                  { type: 'text', content: '$918.00' },
                ],
              },
            ],
          },
        ],
      };
      const mapping = buildYogaTree(Yoga, node, ctx);
      const alignedStack = mapping.children[0];

      // Check all labels don't have clipping
      for (const labelFlex of alignedStack.children) {
        const labelText = labelFlex.children[0];
        const valueText = labelFlex.children[1];
        expect(labelText.shouldClipText).toBe(false);
        expect(valueText.shouldClipText).toBe(false);
      }
      freeYogaTree(mapping);
    });
  });
});

/**
 * Tests for vertical line width calculation
 *
 * Bug fix: Vertical lines were incorrectly using lineSpacing (60 dots) for their
 * width instead of character width (36 dots at 10 CPI). This caused double border
 * characters to render because the width was ~1.67 characters wide.
 *
 * The fix ensures vertical lines use character width based on CPI:
 * charWidth = 360 / cpi (36 dots at 10 CPI)
 */
describe('YogaNodeBuilder vertical line width', () => {
  it('should set vertical line width to character width (36 dots at 10 CPI)', () => {
    // Test that vertical line width is set based on CPI, not lineSpacing
    const node: LayoutNode = {
      type: 'line',
      direction: 'vertical',
      length: 100, // Fixed length to avoid NaN from undefined height
    };
    const mapping = buildYogaTree(Yoga, node, ctx);
    mapping.yogaNode.calculateLayout(500, 500);

    // At 10 CPI: charWidth = 360/10 = 36 dots
    // NOT lineSpacing which is 24 dots in test ctx (or 60 in production)
    const computedWidth = mapping.yogaNode.getComputedWidth();

    // Width should be character width (36 dots at default 10 CPI)
    expect(computedWidth).toBe(36);

    freeYogaTree(mapping);
  });

  it('should calculate vertical line width based on CPI from style context', () => {
    // Test with 12 CPI: charWidth = 360/12 = 30 dots
    const ctxWith12CPI: YogaLayoutContext = {
      ...ctx,
      style: { ...DEFAULT_STYLE, cpi: 12 },
    };

    const node: LayoutNode = {
      type: 'line',
      direction: 'vertical',
      length: 100,
    };
    const mapping = buildYogaTree(Yoga, node, ctxWith12CPI);
    mapping.yogaNode.calculateLayout(500, 500);

    const computedWidth = mapping.yogaNode.getComputedWidth();
    expect(computedWidth).toBe(30); // 360/12 = 30

    freeYogaTree(mapping);
  });

  it('should use default 10 CPI when style.cpi is undefined', () => {
    const ctxWithoutCPI: YogaLayoutContext = {
      ...ctx,
      style: { ...DEFAULT_STYLE, cpi: undefined as unknown as number },
    };

    const node: LayoutNode = {
      type: 'line',
      direction: 'vertical',
      length: 100,
    };
    const mapping = buildYogaTree(Yoga, node, ctxWithoutCPI);
    mapping.yogaNode.calculateLayout(500, 500);

    const computedWidth = mapping.yogaNode.getComputedWidth();
    // Should fall back to 10 CPI: 360/10 = 36
    expect(computedWidth).toBe(36);

    freeYogaTree(mapping);
  });

  it('should set horizontal line height to lineSpacing (not affected by CPI fix)', () => {
    const node: LayoutNode = {
      type: 'line',
      direction: 'horizontal',
      length: 100,
    };
    const mapping = buildYogaTree(Yoga, node, ctx);
    mapping.yogaNode.calculateLayout(500, 500);

    const computedHeight = mapping.yogaNode.getComputedHeight();
    // Horizontal lines should still use lineSpacing for height (24 in test ctx)
    expect(computedHeight).toBe(ctx.lineSpacing);

    freeYogaTree(mapping);
  });

  it('should produce single-character-width vertical borders in BorderedContainer pattern', () => {
    // This test simulates the BorderedContainer content row structure:
    // Flex { Line(vertical) + Stack(content) + Line(vertical) }
    const node: LayoutNode = {
      type: 'flex',
      width: 300,
      height: 100, // Need height for vertical lines with fill
      children: [
        { type: 'line', direction: 'vertical', length: 'fill', flexShrink: 0 },
        {
          type: 'stack',
          flexGrow: 1,
          minWidth: 0,
          flexShrink: 1,
          children: [{ type: 'text', content: 'Content' }],
        },
        { type: 'line', direction: 'vertical', length: 'fill', flexShrink: 0 },
      ],
    };

    const mapping = buildYogaTree(Yoga, node, ctx);
    mapping.yogaNode.calculateLayout(300, 100);

    const leftBorder = mapping.children[0];
    const rightBorder = mapping.children[2];

    // Both vertical borders should be exactly 36 dots wide (1 character at 10 CPI)
    expect(leftBorder.yogaNode.getComputedWidth()).toBe(36);
    expect(rightBorder.yogaNode.getComputedWidth()).toBe(36);

    // Content should get remaining space: 300 - 36 - 36 = 228
    const content = mapping.children[1];
    expect(content.yogaNode.getComputedWidth()).toBe(228);

    freeYogaTree(mapping);
  });
});
