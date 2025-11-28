/**
 * Yoga Node Builder
 *
 * Builds Yoga node trees from escp-ts LayoutNode trees.
 * This is the core conversion layer that maps the virtual layout tree
 * to Yoga's flexbox engine.
 */

import { FlexDirection, Gutter } from 'yoga-layout/load';
import type { Node as YogaNode, Yoga } from 'yoga-layout/load';
import type {
  LayoutNode,
  StackNode,
  FlexNode,
  TextNode,
  SpacerNode,
  LineNode,
  LayoutNodeBase,
} from '../nodes';
import { resolveStyle } from '../nodes';
import type { NodeMapping, YogaLayoutContext } from './types';
import {
  applyWidth,
  applyHeight,
  applyPadding,
  applyMargin,
  applyGap,
  applyJustify,
  applyAlignItems,
  applyFlexDirection,
  applyPosition,
  applyConstraints,
  applyFlexItem,
} from './YogaPropertyMapper';
import { createTextMeasureFunc, createLineMeasureFunc } from './TextMeasurer';

/**
 * Build a complete Yoga tree from an escp-ts LayoutNode
 *
 * This is the main entry point for converting layout trees.
 * It recursively builds Yoga nodes for all children.
 *
 * @param Yoga - The Yoga module instance
 * @param node - The escp-ts layout node to convert
 * @param ctx - Layout context with available space and style
 * @returns NodeMapping containing the Yoga node and metadata
 */
export function buildYogaTree(
  Yoga: Yoga,
  node: LayoutNode,
  ctx: YogaLayoutContext
): NodeMapping {
  // Resolve style by inheriting from parent
  // Check for any style property on the node
  const hasStyleProps = 'bold' in node || 'italic' in node || 'underline' in node ||
    'doubleStrike' in node || 'doubleWidth' in node || 'doubleHeight' in node ||
    'condensed' in node || 'cpi' in node;
  const nodeStyle = hasStyleProps ? node : {};
  const resolvedStyle = resolveStyle(nodeStyle, ctx.style);

  // Create child context with resolved style
  const childCtx: YogaLayoutContext = {
    ...ctx,
    style: resolvedStyle,
  };

  // Create Yoga node
  const yogaNode = Yoga.Node.create();

  // Apply common properties (width, height, padding, margin, position, constraints)
  const padding = applyPadding(yogaNode, (node as LayoutNodeBase).padding);
  const margin = applyMargin(yogaNode, (node as LayoutNodeBase).margin);
  applyWidth(yogaNode, (node as LayoutNodeBase).width, ctx.availableWidth);
  applyHeight(yogaNode, (node as LayoutNodeBase).height);
  applyPosition(yogaNode, node as LayoutNodeBase);
  applyConstraints(yogaNode, node as LayoutNodeBase);

  // Build the mapping
  const mapping: NodeMapping = {
    node,
    yogaNode,
    children: [],
    resolvedStyle,
    padding,
    margin,
  };

  // Handle specific node types
  switch (node.type) {
    case 'stack':
      buildStackNode(Yoga, yogaNode, node, mapping, childCtx);
      break;

    case 'flex':
      buildFlexNode(Yoga, yogaNode, node, mapping, childCtx);
      break;

    case 'text':
      buildTextNode(yogaNode, node, mapping, childCtx);
      break;

    case 'spacer':
      buildSpacerNode(yogaNode, node, mapping);
      break;

    case 'line':
      buildLineNode(yogaNode, node, mapping, childCtx);
      break;

    default:
      // Template, conditional, switch, each nodes should be resolved before layout
      // If we encounter them here, they're errors in the pipeline
      console.warn(`Unexpected node type in Yoga builder: ${(node as LayoutNode).type}`);
  }

  return mapping;
}

/**
 * Build a stack node (vertical or horizontal container)
 */
function buildStackNode(
  Yoga: Yoga,
  yogaNode: YogaNode,
  node: StackNode,
  mapping: NodeMapping,
  ctx: YogaLayoutContext
): void {
  const direction = node.direction ?? 'column';

  // Configure flex container properties
  applyFlexDirection(yogaNode, direction);
  applyGap(yogaNode, node.gap);

  // For column direction with align, we apply alignItems
  // For row direction with vAlign, we apply alignItems
  if (direction === 'column' && node.align) {
    // In column direction, align controls horizontal alignment
    // This maps to alignItems in flexbox
    yogaNode.setAlignItems(
      node.align === 'center' ? 2 : // Align.Center
      node.align === 'right' ? 3 : // Align.FlexEnd
      1 // Align.FlexStart
    );
  }

  if (direction === 'row' && node.vAlign) {
    applyAlignItems(yogaNode, node.vAlign);
  }

  // Build children recursively
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue; // Skip undefined children
    const childMapping = buildYogaTree(Yoga, child, ctx);
    yogaNode.insertChild(childMapping.yogaNode, i);
    mapping.children.push(childMapping);
  }
}

/**
 * Build a flex node (horizontal row with flexible distribution)
 */
function buildFlexNode(
  Yoga: Yoga,
  yogaNode: YogaNode,
  node: FlexNode,
  mapping: NodeMapping,
  ctx: YogaLayoutContext
): void {
  // Flex is always row direction
  yogaNode.setFlexDirection(FlexDirection.Row);

  // Configure flex container properties
  applyJustify(yogaNode, node.justify);
  applyAlignItems(yogaNode, node.alignItems);
  // NOTE: Flex-wrap was removed - it's incompatible with printer pagination.
  // Use Stack for multi-line layouts.

  // Apply gap between items
  if (node.gap) {
    yogaNode.setGap(Gutter.Column, node.gap);
  }

  // Build children recursively
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue; // Skip undefined children
    const childMapping = buildYogaTree(Yoga, child, ctx);
    yogaNode.insertChild(childMapping.yogaNode, i);
    mapping.children.push(childMapping);
  }
}

/**
 * Build a text node (leaf with custom measure function)
 */
function buildTextNode(
  yogaNode: YogaNode,
  node: TextNode,
  mapping: NodeMapping,
  ctx: YogaLayoutContext
): void {
  // Set custom measure function for text sizing
  const measureFunc = createTextMeasureFunc(
    node.content,
    mapping.resolvedStyle,
    ctx.lineSpacing,
    ctx.interCharSpace
  );
  yogaNode.setMeasureFunc(measureFunc);

  // Track explicit width if set (for centering calculations)
  if (typeof node.width === 'number') {
    mapping.explicitWidth = node.width;
  }
}

/**
 * Build a spacer node (empty space or flex filler)
 */
function buildSpacerNode(
  yogaNode: YogaNode,
  node: SpacerNode,
  _mapping: NodeMapping
): void {
  // Fixed dimensions if specified
  if (node.width !== undefined) {
    yogaNode.setWidth(node.width);
  }
  if (node.height !== undefined) {
    yogaNode.setHeight(node.height);
  }

  // Flex grow if flex property is set
  applyFlexItem(yogaNode, node.flex);
}

/**
 * Build a line node (horizontal or vertical line)
 */
function buildLineNode(
  yogaNode: YogaNode,
  node: LineNode,
  _mapping: NodeMapping,
  ctx: YogaLayoutContext
): void {
  const direction = node.direction ?? 'horizontal';
  const length = node.length;

  // Set custom measure function for line sizing
  const measureFunc = createLineMeasureFunc(
    length,
    ctx.lineSpacing,
    direction
  );
  yogaNode.setMeasureFunc(measureFunc);

  // If length is 'fill', set flex grow
  if (length === 'fill') {
    yogaNode.setFlexGrow(1);
  }
}

/**
 * Free all Yoga nodes in a mapping tree
 *
 * Must be called after layout calculation to prevent memory leaks.
 *
 * @param mapping - The root node mapping to free
 */
export function freeYogaTree(mapping: NodeMapping): void {
  // Free children first (bottom-up)
  for (const child of mapping.children) {
    freeYogaTree(child);
  }
  // Free this node
  mapping.yogaNode.free();
}
