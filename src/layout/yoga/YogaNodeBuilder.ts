/**
 * Yoga Node Builder
 *
 * Builds Yoga node trees from escp-ts LayoutNode trees.
 * This is the core conversion layer that maps the virtual layout tree
 * to Yoga's flexbox engine.
 */

import { FlexDirection, Gutter } from 'yoga-layout/load';
import type { Node as YogaNode, Yoga, Config } from 'yoga-layout/load';
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
import { createTextMeasureFunc } from './TextMeasurer';

/**
 * Build a complete Yoga tree from an escp-ts LayoutNode
 *
 * This is the main entry point for converting layout trees.
 * It recursively builds Yoga nodes for all children.
 *
 * @param Yoga - The Yoga module instance
 * @param node - The escp-ts layout node to convert
 * @param ctx - Layout context with available space and style
 * @param config - Optional Yoga config for node creation (enables pointScaleFactor, etc.)
 * @returns NodeMapping containing the Yoga node and metadata
 */
export function buildYogaTree(
  Yoga: Yoga,
  node: LayoutNode,
  ctx: YogaLayoutContext,
  config?: Config
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

  // Create Yoga node with config if provided (for pointScaleFactor, etc.)
  const yogaNode = config ? Yoga.Node.create(config) : Yoga.Node.create();

  // Apply common properties (width, height, padding, margin, position, constraints)
  const padding = applyPadding(yogaNode, (node as LayoutNodeBase).padding);
  const margin = applyMargin(yogaNode, (node as LayoutNodeBase).margin);
  applyWidth(yogaNode, (node as LayoutNodeBase).width, ctx.availableWidth);
  applyHeight(yogaNode, (node as LayoutNodeBase).height);
  applyPosition(yogaNode, node as LayoutNodeBase);
  applyConstraints(yogaNode, node as LayoutNodeBase);

  // Nodes with explicit width should NOT shrink when in a Flex container.
  // This ensures table columns with explicit widths maintain their size.
  const nodeWidth = (node as LayoutNodeBase).width;
  if (typeof nodeWidth === 'number') {
    yogaNode.setFlexShrink(0);
  }

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
      buildStackNode(Yoga, yogaNode, node, mapping, childCtx, config);
      break;

    case 'flex':
      buildFlexNode(Yoga, yogaNode, node, mapping, childCtx, config);
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
  ctx: YogaLayoutContext,
  config?: Config
): void {
  const direction = node.direction ?? 'column';

  // Mark container as always forming a containing block for absolute children
  // This ensures absolute positioned children are relative to this container
  yogaNode.setAlwaysFormsContainingBlock(true);

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
  // Stack is NOT a flex row - text should never shrink in a Stack.
  // Stack items flow naturally with gap and can overflow if needed.
  // This is different from Flex which uses flexbox distribution semantics.
  const hasExplicitWidth = typeof node.width === 'number' ||
                           node.width === 'fill' ||
                           (typeof node.width === 'string' && node.width.endsWith('%'));
  let childCtx: YogaLayoutContext;

  if (hasExplicitWidth) {
    // Stack with explicit width (including percentage) provides a fixed boundary
    // Text inside should be clipped to fit within the container
    childCtx = { ...ctx, inFlexRow: false, shouldClipText: true };
  } else {
    // Stack without explicit width - INHERIT parent's shouldClipText
    // This allows nested components (like Section) to correctly propagate
    // clipping behavior from their parent with explicit width
    childCtx = { ...ctx, inFlexRow: false, shouldClipText: ctx.shouldClipText ?? false };
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue; // Skip undefined children
    const childMapping = buildYogaTree(Yoga, child, childCtx, config);
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
  ctx: YogaLayoutContext,
  config?: Config
): void {
  // Mark container as always forming a containing block for absolute children
  // This ensures absolute positioned children are relative to this container
  yogaNode.setAlwaysFormsContainingBlock(true);

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
  // Flex row: text should NOT shrink (Spacers handle flexible distribution).
  // Text clipping depends on whether Flex has explicit width OR inherits from parent.
  const hasExplicitWidth = typeof node.width === 'number' ||
                           node.width === 'fill' ||
                           (typeof node.width === 'string' && node.width.endsWith('%'));
  const flexRowCtx: YogaLayoutContext = {
    ...ctx,
    inFlexRow: true,
    // In Flex with explicit width (including percentage), text should be clipped to container
    // In Flex without explicit width, INHERIT parent's shouldClipText
    shouldClipText: hasExplicitWidth || (ctx.shouldClipText ?? false),
  };
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue; // Skip undefined children
    const childMapping = buildYogaTree(Yoga, child, flexRowCtx, config);
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

  // Text should NOT shrink in any context - it maintains its intrinsic size.
  // In Flex rows, Spacers handle flexible space distribution by growing/shrinking.
  // Text shrinking leads to unexpected clipping even when there's adequate space.
  yogaNode.setFlexShrink(0);

  // Text clipping depends on CONTAINER context, NOT text's own explicit width.
  // Explicit width on text is for LAYOUT allocation (reserving space in flex),
  // not for text truncation. For example:
  // - List bullets use width:20 to reserve space but shouldn't be clipped
  // - Table cells use Stack with width to define column width
  //
  // Text is only clipped when its PARENT container has explicit width constraints.
  if (typeof node.width === 'number') {
    mapping.explicitWidth = node.width;
    // NOTE: We do NOT set shouldClipText here - explicit width is for layout only
  }

  if (ctx.shouldClipText) {
    mapping.shouldClipText = true; // Parent has explicit width, clip to container
  } else {
    mapping.shouldClipText = false; // Allow overflow
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

  if (direction === 'horizontal') {
    // Horizontal line: fill width, fixed height
    yogaNode.setHeight(ctx.lineSpacing);
    yogaNode.setFlexShrink(0); // Don't shrink height

    if (length === 'fill') {
      // Use 100% width to fill container
      yogaNode.setWidthPercent(100);
    } else if (typeof length === 'number') {
      yogaNode.setWidth(length);
    }
    // Note: No measure function needed - we set explicit dimensions
  } else {
    // Vertical line: fixed width, fill height
    yogaNode.setWidth(ctx.lineSpacing);
    yogaNode.setFlexShrink(0); // Don't shrink width

    if (length === 'fill') {
      // Use flexGrow for vertical fill
      yogaNode.setFlexGrow(1);
    } else if (typeof length === 'number') {
      yogaNode.setHeight(length);
    }
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
