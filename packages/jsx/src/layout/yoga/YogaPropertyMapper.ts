/**
 * Yoga Property Mapper
 *
 * Maps escp-ts layout properties to Yoga node properties.
 * This module handles the translation between the two APIs.
 */

import {
  Edge,
  FlexDirection,
  Justify,
  Align,
  // NOTE: Wrap was removed - flex-wrap is incompatible with printer pagination
  PositionType,
  Gutter,
} from 'yoga-layout/load';
import type { Node as YogaNode } from 'yoga-layout/load';
import type {
  WidthSpec,
  HeightSpec,
  PaddingSpec,
  MarginSpec,
  JustifyContent,
  VAlign,
  HAlign,
  ResolvedPadding,
  ResolvedMargin,
  LayoutNodeBase,
} from '../nodes';
import { isPercentage, parsePercentage, resolvePadding, resolveMargin } from '../nodes';

/**
 * Apply width specification to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param width - Width specification (number, 'auto', 'fill', or percentage)
 * @param availableWidth - Available width for percentage calculation
 */
export function applyWidth(
  yogaNode: YogaNode,
  width: WidthSpec | undefined,
  _availableWidth: number
): void {
  if (width === undefined || width === 'auto') {
    // Auto width - let Yoga determine from content
    yogaNode.setWidthAuto();
  } else if (width === 'fill') {
    // Fill available width - use 100% width
    // Note: We use widthPercent instead of flexGrow because flexGrow
    // affects the main axis (height for column containers), not width.
    yogaNode.setWidthPercent(100);
  } else if (isPercentage(width)) {
    // Percentage width
    const percent = parsePercentage(width);
    yogaNode.setWidthPercent(percent);
  } else {
    // Fixed width in dots
    yogaNode.setWidth(width);
  }
}

/**
 * Apply height specification to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param height - Height specification (number, 'auto', or percentage)
 */
export function applyHeight(yogaNode: YogaNode, height: HeightSpec | undefined): void {
  if (height === undefined || height === 'auto') {
    // Auto height - let Yoga determine from content
    yogaNode.setHeightAuto();
  } else if (isPercentage(height)) {
    // Percentage height
    const percent = parsePercentage(height);
    yogaNode.setHeightPercent(percent);
  } else {
    // Fixed height in dots
    yogaNode.setHeight(height);
  }
}

/**
 * Apply padding to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param padding - Padding specification
 * @returns Resolved padding for tracking
 */
export function applyPadding(
  yogaNode: YogaNode,
  padding: PaddingSpec | undefined
): ResolvedPadding {
  const resolved = resolvePadding(padding);

  if (resolved.top > 0) yogaNode.setPadding(Edge.Top, resolved.top);
  if (resolved.right > 0) yogaNode.setPadding(Edge.Right, resolved.right);
  if (resolved.bottom > 0) yogaNode.setPadding(Edge.Bottom, resolved.bottom);
  if (resolved.left > 0) yogaNode.setPadding(Edge.Left, resolved.left);

  return resolved;
}

/**
 * Apply margin to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param margin - Margin specification
 * @returns Resolved margin for tracking (with autoHorizontal flag)
 */
export function applyMargin(yogaNode: YogaNode, margin: MarginSpec | undefined): ResolvedMargin {
  const resolved = resolveMargin(margin);

  // Handle auto horizontal margins (centering)
  if (resolved.autoHorizontal) {
    yogaNode.setMarginAuto(Edge.Left);
    yogaNode.setMarginAuto(Edge.Right);
  } else {
    if (resolved.left > 0) yogaNode.setMargin(Edge.Left, resolved.left);
    if (resolved.right > 0) yogaNode.setMargin(Edge.Right, resolved.right);
  }

  if (resolved.top > 0) yogaNode.setMargin(Edge.Top, resolved.top);
  if (resolved.bottom > 0) yogaNode.setMargin(Edge.Bottom, resolved.bottom);

  return resolved;
}

/**
 * Apply gap to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param gap - Gap between children in dots
 * @param direction - Gap direction: 'column', 'row', or 'all'
 */
export function applyGap(
  yogaNode: YogaNode,
  gap: number | undefined,
  direction: 'column' | 'row' | 'all' = 'all'
): void {
  if (gap === undefined || gap === 0) return;

  switch (direction) {
    case 'column':
      yogaNode.setGap(Gutter.Column, gap);
      break;
    case 'row':
      yogaNode.setGap(Gutter.Row, gap);
      break;
    case 'all':
      yogaNode.setGap(Gutter.All, gap);
      break;
  }
}

/**
 * Map escp-ts justify content to Yoga justify
 *
 * @param justify - escp-ts justify content value
 * @returns Yoga Justify enum value
 */
export function mapJustify(justify: JustifyContent | undefined): Justify {
  switch (justify) {
    case 'start':
      return Justify.FlexStart;
    case 'center':
      return Justify.Center;
    case 'end':
      return Justify.FlexEnd;
    case 'space-between':
      return Justify.SpaceBetween;
    case 'space-around':
      return Justify.SpaceAround;
    case 'space-evenly':
      return Justify.SpaceEvenly;
    default:
      return Justify.FlexStart;
  }
}

/**
 * Apply justify content to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param justify - escp-ts justify content value
 */
export function applyJustify(yogaNode: YogaNode, justify: JustifyContent | undefined): void {
  yogaNode.setJustifyContent(mapJustify(justify));
}

/**
 * Map escp-ts vertical alignment to Yoga align
 *
 * @param align - escp-ts vertical alignment value
 * @returns Yoga Align enum value
 */
export function mapAlignItems(align: VAlign | undefined): Align {
  switch (align) {
    case 'top':
      return Align.FlexStart;
    case 'center':
      return Align.Center;
    case 'bottom':
      return Align.FlexEnd;
    default:
      return Align.FlexStart;
  }
}

/**
 * Apply align items to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param alignItems - escp-ts vertical alignment value
 */
export function applyAlignItems(yogaNode: YogaNode, alignItems: VAlign | undefined): void {
  yogaNode.setAlignItems(mapAlignItems(alignItems));
}

/**
 * Map escp-ts horizontal alignment to Yoga align for cross-axis alignment
 *
 * @param align - escp-ts horizontal alignment value
 * @returns Yoga Align enum value
 */
export function mapHAlign(align: HAlign | undefined): Align {
  switch (align) {
    case 'left':
      return Align.FlexStart;
    case 'center':
      return Align.Center;
    case 'right':
      return Align.FlexEnd;
    default:
      return Align.FlexStart;
  }
}

/**
 * Apply flex direction to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param direction - 'column' or 'row'
 */
export function applyFlexDirection(
  yogaNode: YogaNode,
  direction: 'column' | 'row' | undefined
): void {
  yogaNode.setFlexDirection(direction === 'row' ? FlexDirection.Row : FlexDirection.Column);
}

// NOTE: applyFlexWrap was removed because flex-wrap is incompatible with
// printer pagination. Use Stack for multi-line layouts.

/**
 * Apply position type to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param node - The escp-ts node with position properties
 */
export function applyPosition(yogaNode: YogaNode, node: LayoutNodeBase): void {
  const position = node.position;

  if (position === 'absolute') {
    yogaNode.setPositionType(PositionType.Absolute);
    // Set absolute position offsets
    if (node.posX !== undefined) {
      yogaNode.setPosition(Edge.Left, node.posX);
    }
    if (node.posY !== undefined) {
      yogaNode.setPosition(Edge.Top, node.posY);
    }
  } else if (position === 'relative') {
    yogaNode.setPositionType(PositionType.Relative);
    // Relative offsets are handled at render time, not in Yoga
    // We store them in the node mapping and apply in the result extractor
  } else {
    // Static (default)
    yogaNode.setPositionType(PositionType.Static);
  }
}

/**
 * Apply size constraints (min/max width/height) to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param node - The escp-ts node with constraint properties
 */
export function applyConstraints(yogaNode: YogaNode, node: LayoutNodeBase): void {
  if (node.minWidth !== undefined) {
    yogaNode.setMinWidth(node.minWidth);
  }
  if (node.maxWidth !== undefined) {
    yogaNode.setMaxWidth(node.maxWidth);
  }
  if (node.minHeight !== undefined) {
    yogaNode.setMinHeight(node.minHeight);
  }
  if (node.maxHeight !== undefined) {
    yogaNode.setMaxHeight(node.maxHeight);
  }
}

/**
 * Apply flex grow/shrink properties to a Yoga node
 *
 * @param yogaNode - The Yoga node to configure
 * @param flex - If true, node should grow to fill space
 */
export function applyFlexItem(yogaNode: YogaNode, flex: boolean | undefined): void {
  if (flex) {
    yogaNode.setFlexGrow(1);
    yogaNode.setFlexShrink(1);
    yogaNode.setFlexBasis(0);
  }
}
