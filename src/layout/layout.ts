/**
 * Layout Phase for ESC/P2 Layout System
 *
 * The layout phase assigns absolute positions to all nodes based on
 * their measured sizes and container layout rules. It works top-down,
 * positioning children within their parent's bounds.
 */

import type {
  LayoutNode,
  StackNode,
  FlexNode,
  GridNode,
  SpacerNode,
  HAlign,
  VAlign,
  JustifyContent,
  LayoutNodeBase,
} from './nodes';
import type { MeasuredNode } from './measure';

// ==================== LAYOUT RESULT ====================

/**
 * Result of layout calculation for a node
 */
export interface LayoutResult {
  /** Original node reference */
  node: LayoutNode;
  /** Absolute X position in dots */
  x: number;
  /** Absolute Y position in dots */
  y: number;
  /** Final width in dots */
  width: number;
  /** Final height in dots */
  height: number;
  /** Layout results for children */
  children: LayoutResult[];
  /** Resolved style (copied from measured node) */
  style: MeasuredNode['style'];
  /** Cell alignment for grid children (renderer handles this) */
  cellAlign?: HAlign;
  /** Render-time constraints for boundary enforcement (e.g., grid cells) */
  renderConstraints?: {
    /** Boundary width that content must fit within */
    boundaryWidth: number;
    /** Boundary height that content must fit within */
    boundaryHeight: number;
    /** Horizontal alignment within boundary */
    hAlign?: HAlign;
    /** Vertical alignment within boundary */
    vAlign?: VAlign;
  };
  /** Relative offset to apply at render time (not used for pagination) */
  relativeOffset?: { x: number; y: number };
}

// ==================== LAYOUT CONTEXT ====================

/**
 * Context passed during layout
 */
export interface LayoutContext {
  /** Starting X position */
  x: number;
  /** Starting Y position */
  y: number;
  /** Available width */
  width: number;
  /** Available height */
  height: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate X offset for horizontal alignment
 */
function alignHorizontal(
  align: HAlign | undefined,
  contentWidth: number,
  containerWidth: number
): number {
  // When content is wider than container, clamp offset to 0 to prevent
  // content from being positioned outside the container's left edge
  switch (align) {
    case 'center':
      return Math.max(0, Math.floor((containerWidth - contentWidth) / 2));
    case 'right':
      return Math.max(0, containerWidth - contentWidth);
    case 'left':
    default:
      return 0;
  }
}

/**
 * Calculate Y offset for vertical alignment
 * When content is taller than container, clamp offset to 0 to prevent
 * content from being positioned above the container's top edge
 * (ESC/P printers can't render at negative Y positions)
 */
function alignVertical(
  align: VAlign | undefined,
  contentHeight: number,
  containerHeight: number
): number {
  switch (align) {
    case 'center':
      return Math.max(0, Math.floor((containerHeight - contentHeight) / 2));
    case 'bottom':
      return Math.max(0, containerHeight - contentHeight);
    case 'top':
    default:
      return 0;
  }
}

/**
 * Calculate positions for justify content in flex layouts
 * @param remainingSpaceOverride - Optional override for remaining space (used for wrapped lines)
 */
function calculateJustifyPositions(
  justify: JustifyContent | undefined,
  childWidths: number[],
  containerWidth: number,
  gap: number,
  remainingSpaceOverride?: number
): number[] {
  const totalChildWidth = childWidths.reduce((a, b) => a + b, 0);
  const totalGapWidth = (childWidths.length - 1) * gap;
  // Use override if provided (for wrapped flex lines), otherwise calculate
  const remainingSpace = remainingSpaceOverride ?? (containerWidth - totalChildWidth - totalGapWidth);
  const positions: number[] = [];

  switch (justify) {
    case 'center': {
      let x = remainingSpace / 2;
      childWidths.forEach(w => {
        positions.push(x);
        x += w + gap;
      });
      break;
    }

    case 'end': {
      let x = remainingSpace;
      childWidths.forEach(w => {
        positions.push(x);
        x += w + gap;
      });
      break;
    }

    case 'space-between': {
      if (childWidths.length === 1) {
        positions.push(0);
      } else {
        const spaceBetween = remainingSpace / (childWidths.length - 1);
        let x = 0;
        childWidths.forEach(w => {
          positions.push(x);
          x += w + spaceBetween;
        });
      }
      break;
    }

    case 'space-around': {
      if (childWidths.length === 0) break;
      const spaceAround = remainingSpace / childWidths.length;
      let x = spaceAround / 2;
      childWidths.forEach(w => {
        positions.push(x);
        x += w + spaceAround;
      });
      break;
    }

    case 'space-evenly': {
      // Equal space before, between, and after all items
      // Formula: spacing = remainingSpace / (itemCount + 1)
      if (childWidths.length === 0) break;
      const spacing = remainingSpace / (childWidths.length + 1);
      let x = spacing;
      childWidths.forEach(w => {
        positions.push(x);
        x += w + spacing;
      });
      break;
    }

    case 'start':
    default: {
      let x = 0;
      childWidths.forEach(w => {
        positions.push(x);
        x += w + gap;
      });
      break;
    }
  }

  return positions;
}

// ==================== LAYOUT FUNCTIONS ====================

/**
 * Layout a text node (leaf - just position it)
 */
function layoutTextNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  const node = measured.node;
  const align = 'align' in node ? (node as { align?: HAlign }).align : undefined;
  const margin = measured.margin;

  // Content width excludes margins (this is the measured text width + padding)
  const measuredContentWidth = measured.preferredWidth - margin.left - margin.right;

  // Calculate available width from context (constraint width)
  const availableWidth = ctx.width - margin.left - margin.right;

  // Calculate effective width and offset consistently to avoid mismatch
  let effectiveWidth: number;
  let xOffset: number;

  if (margin.autoHorizontal) {
    // Auto horizontal margins: use explicit width if set, but cap to container width
    if (measured.explicitWidth) {
      effectiveWidth = Math.min(measured.explicitWidth, ctx.width);
    } else {
      effectiveWidth = Math.min(measuredContentWidth, availableWidth);
    }
    // Center based on effective width (same value used for rendering)
    xOffset = Math.floor((ctx.width - effectiveWidth) / 2);
  } else {
    // Without auto margins: standard width calculation
    effectiveWidth = measured.explicitWidth
      ? Math.min(measured.explicitWidth, availableWidth)
      : Math.min(measuredContentWidth, availableWidth);
    xOffset = margin.left + alignHorizontal(align, measuredContentWidth, availableWidth);
  }

  return {
    node: measured.node,
    x: ctx.x + xOffset,
    y: ctx.y + margin.top,
    width: effectiveWidth,
    height: measured.preferredHeight - margin.top - margin.bottom,
    children: [],
    style: measured.style,
  };
}

/**
 * Layout a spacer node
 */
function layoutSpacerNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  return {
    node: measured.node,
    x: ctx.x,
    y: ctx.y,
    width: measured.preferredWidth,
    height: measured.preferredHeight,
    children: [],
    style: measured.style,
  };
}

/**
 * Layout a line node
 */
function layoutLineNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  const margin = measured.margin;

  return {
    node: measured.node,
    x: ctx.x + margin.left,
    y: ctx.y + margin.top,
    width: ctx.width - margin.left - margin.right, // Lines fill available width minus margins
    height: measured.preferredHeight - margin.top - margin.bottom,
    children: [],
    style: measured.style,
  };
}

/**
 * Layout a stack node
 */
function layoutStackNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  const node = measured.node as StackNode;
  const direction = node.direction ?? 'column';
  const gap = node.gap ?? 0;
  const padding = measured.padding;
  const margin = measured.margin;

  // Content area inside margin and padding
  // When stack has explicit width (percentage or fixed), use its preferredWidth
  // When stack has auto/fill width, use ctx.width (parent's available width)
  const hasExplicitWidth = node.width !== undefined && node.width !== 'auto' && node.width !== 'fill';
  const baseWidth = hasExplicitWidth
    ? measured.preferredWidth - margin.left - margin.right
    : ctx.width - margin.left - margin.right;

  const contentX = ctx.x + margin.left + padding.left;
  const contentY = ctx.y + margin.top + padding.top;
  const contentWidth = baseWidth - padding.left - padding.right;

  const childResults: LayoutResult[] = [];

  if (direction === 'column') {
    // Vertical stack
    let currentY = contentY;

    for (const childMeasured of measured.children) {
      // Calculate X offset based on alignment or auto margins
      // Use explicit width if set, otherwise fall back to preferred width
      const childLogicalWidth = childMeasured.explicitWidth ?? childMeasured.preferredWidth;

      let xOffset: number;
      if (childMeasured.margin.autoHorizontal) {
        // Auto horizontal margins - center the child based on logical width
        xOffset = Math.floor((contentWidth - childLogicalWidth) / 2);
      } else {
        // Include margins in width for alignment calculation
        // so the entire margin box is aligned, not just the content box
        const outerWidth = childMeasured.preferredWidth + childMeasured.margin.left + childMeasured.margin.right;
        xOffset = alignHorizontal(node.align, outerWidth, contentWidth);
      }

      // For auto-margin children, pass their logical width (not container width)
      // so their internal content layouts correctly within their explicit bounds
      const childLayoutWidth = childMeasured.margin.autoHorizontal
        ? childLogicalWidth
        : contentWidth;

      const childResult = layoutNode(childMeasured, {
        x: contentX + xOffset,
        y: currentY,
        width: childLayoutWidth,
        height: childMeasured.preferredHeight,
      });

      childResults.push(childResult);
      // Only advance currentY for non-absolutely-positioned children
      // Absolutely positioned elements don't affect normal document flow
      if (!isAbsolutelyPositioned(childMeasured.node)) {
        currentY += childResult.height + childMeasured.margin.top + childMeasured.margin.bottom + gap;
      }
    }
  } else {
    // Horizontal stack (row)
    let currentX = contentX;

    // Calculate row height from tallest child for proper vertical alignment
    const rowHeight = Math.max(...measured.children.map((c) => c.preferredHeight));

    for (const childMeasured of measured.children) {
      // Calculate Y offset based on vertical alignment within the row height
      // This aligns box edges (like CSS flexbox align-items)
      const yOffset = alignVertical(node.vAlign, childMeasured.preferredHeight, rowHeight);

      // Handle auto horizontal margins - center child within content width
      let childX = currentX;
      let childLayoutWidth = childMeasured.preferredWidth;

      if (childMeasured.margin.autoHorizontal) {
        const childLogicalWidth = childMeasured.explicitWidth ?? childMeasured.preferredWidth;
        childX = contentX + Math.floor((contentWidth - childLogicalWidth) / 2);
        childLayoutWidth = childLogicalWidth;
      }

      const childResult = layoutNode(childMeasured, {
        x: childX,
        y: contentY + yOffset,
        width: childLayoutWidth,
        height: childMeasured.preferredHeight,
      });

      childResults.push(childResult);
      // Only advance currentX for non-absolutely-positioned children
      if (!isAbsolutelyPositioned(childMeasured.node)) {
        currentX += childResult.width + childMeasured.margin.left + childMeasured.margin.right + gap;
      }
    }
  }

  return {
    node: measured.node,
    x: ctx.x + margin.left,
    y: ctx.y + margin.top,
    width: measured.preferredWidth - margin.left - margin.right,
    height: measured.preferredHeight - margin.top - margin.bottom,
    children: childResults,
    style: measured.style,
  };
}

/**
 * Layout a flex node
 */
function layoutFlexNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  const node = measured.node as FlexNode;
  const gap = node.gap ?? 0;
  const rowGap = node.rowGap ?? 0;
  const justify = node.justify;
  const alignItems = node.alignItems;
  const padding = measured.padding;
  const margin = measured.margin;

  // Content area inside margin and padding
  // Use explicit width if flex container has one, otherwise use context width
  const contentX = ctx.x + margin.left + padding.left;
  const contentY = ctx.y + margin.top + padding.top;
  const baseWidth = measured.explicitWidth ?? ctx.width;
  const contentWidth = baseWidth - margin.left - margin.right - padding.left - padding.right;
  const contentHeight = measured.preferredHeight - margin.top - margin.bottom - padding.top - padding.bottom;

  const childResults: LayoutResult[] = [];

  if (measured.flexLines && measured.flexLines.length > 0) {
    // Wrapping mode: layout line by line
    let currentY = contentY;

    measured.flexLines.forEach((line, lineIndex) => {
      // Get children for this line
      const lineChildren = measured.children.slice(line.startIndex, line.endIndex);
      const lineChildWidths = lineChildren.map(c => c.preferredWidth);

      // Calculate remaining space for THIS specific line
      // Each wrapped line is an independent justify context
      const lineContentWidth = lineChildWidths.reduce((a, b) => a + b, 0);
      const lineGapWidth = Math.max(0, lineChildWidths.length - 1) * gap;
      const lineRemainingSpace = contentWidth - lineContentWidth - lineGapWidth;

      // Calculate X positions for this line with line-specific remaining space
      const xPositions = calculateJustifyPositions(
        justify,
        lineChildWidths,
        contentWidth,
        gap,
        lineRemainingSpace
      );

      // Layout each child in the line
      lineChildren.forEach((childMeasured, i) => {
        // Calculate Y offset based on alignItems within the line height
        const yOffset = alignVertical(alignItems, childMeasured.preferredHeight, line.height);
        const xPosition = xPositions[i] ?? 0;

        const childResult = layoutNode(childMeasured, {
          x: contentX + xPosition,
          y: currentY + yOffset,
          width: childMeasured.preferredWidth,
          height: childMeasured.preferredHeight,  // Use child's own height, not line.height
        });

        childResults.push(childResult);
      });

      // Move to next line
      currentY += line.height + (lineIndex < (measured.flexLines?.length ?? 0) - 1 ? rowGap : 0);
    });
  } else {
    // No wrapping: single row layout
    // First, identify flex spacers and distribute remaining space to them
    const flexSpacerIndices: number[] = [];
    let totalFixedWidth = 0;

    measured.children.forEach((child, i) => {
      const childNode = child.node;
      if (childNode.type === 'spacer' && (childNode as SpacerNode).flex) {
        flexSpacerIndices.push(i);
      } else {
        totalFixedWidth += child.preferredWidth;
      }
    });

    // Calculate child widths, distributing remaining space to flex spacers
    const totalGapWidth = (measured.children.length - 1) * gap;
    const remainingSpace = Math.max(0, contentWidth - totalFixedWidth - totalGapWidth);
    const spacerWidth = flexSpacerIndices.length > 0
      ? Math.floor(remainingSpace / flexSpacerIndices.length)
      : 0;

    const childWidths = measured.children.map((c, i) => {
      if (flexSpacerIndices.includes(i)) {
        return spacerWidth;
      }
      return c.preferredWidth;
    });

    // Calculate X positions based on justify
    const xPositions = calculateJustifyPositions(
      justify,
      childWidths,
      contentWidth,
      gap
    );

    measured.children.forEach((childMeasured, i) => {
      // Calculate Y offset based on alignItems
      const yOffset = alignVertical(alignItems, childMeasured.preferredHeight, contentHeight);
      let xPosition = xPositions[i] ?? 0;
      const childWidth = childWidths[i] ?? childMeasured.preferredWidth;

      // Handle auto horizontal margins - center child within available space
      if (childMeasured.margin.autoHorizontal) {
        const childLogicalWidth = childMeasured.explicitWidth ?? childMeasured.preferredWidth;
        // For single child or children with auto margins, center within content area
        xPosition = Math.floor((contentWidth - childLogicalWidth) / 2);
      }

      // Use the allocated childWidth for all children, including nested flex containers
      // Nested flex should use its allocated width, not the parent's full contentWidth
      const childLayoutWidth = childMeasured.margin.autoHorizontal
        ? (childMeasured.explicitWidth ?? childMeasured.preferredWidth)
        : childWidth;

      const childResult = layoutNode(childMeasured, {
        x: contentX + xPosition,
        y: contentY + yOffset,
        width: childLayoutWidth,
        height: childMeasured.preferredHeight,  // Also use child's own height for nested containers
      });

      childResults.push(childResult);
    });
  }

  return {
    node: measured.node,
    x: ctx.x + margin.left,
    y: ctx.y + margin.top,
    width: measured.preferredWidth - margin.left - margin.right,
    height: measured.preferredHeight - margin.top - margin.bottom,
    children: childResults,
    style: measured.style,
  };
}

/**
 * Layout a grid node
 */
function layoutGridNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  const node = measured.node as GridNode;
  const columnGap = node.columnGap ?? 0;
  const rowGap = node.rowGap ?? 0;
  const padding = measured.padding;
  const margin = measured.margin;
  const columnWidths = measured.columnWidths ?? [];
  const rowHeights = measured.rowHeights ?? [];

  // Content area inside margin and padding
  const contentX = ctx.x + margin.left + padding.left;
  const contentY = ctx.y + margin.top + padding.top;

  // Calculate column X positions (use integers to avoid accumulating rounding errors)
  const columnPositions: number[] = [];
  let xPos = 0;
  columnWidths.forEach(width => {
    columnPositions.push(Math.floor(xPos));
    xPos += width + columnGap;
  });

  // Calculate row Y positions
  const rowPositions: number[] = [];
  let yPos = 0;
  rowHeights.forEach(height => {
    rowPositions.push(yPos);
    yPos += height + rowGap;
  });

  // Layout each cell
  const childResults: LayoutResult[] = [];
  let childIndex = 0;

  node.rows.forEach((row, rowIdx) => {
    row.cells.forEach((cellNode, colIdx) => {
      if (colIdx >= columnWidths.length) return;

      const childMeasured = measured.children[childIndex];
      if (!childMeasured) return;

      const cellWidth = columnWidths[colIdx] ?? 0;
      const cellHeight = rowHeights[rowIdx] ?? 0;

      // Get cell alignment from the text node if present
      const cellAlign = 'align' in cellNode ? (cellNode as { align?: HAlign }).align : undefined;

      // Don't apply horizontal alignment offset at layout time
      // Store alignment in result for renderer to handle within cell boundaries
      const yOffset = alignVertical('top', childMeasured.preferredHeight, cellHeight);

      const colPosition = columnPositions[colIdx] ?? 0;
      const rowPosition = rowPositions[rowIdx] ?? 0;

      const childResult = layoutNode(childMeasured, {
        x: contentX + colPosition,
        y: contentY + rowPosition + yOffset,
        width: cellWidth,
        height: cellHeight,
      });

      // Handle auto horizontal margins - center child within cell width
      if (childMeasured.margin.autoHorizontal) {
        const childLogicalWidth = childMeasured.explicitWidth ?? childMeasured.preferredWidth;
        childResult.x = contentX + colPosition + Math.floor((cellWidth - childLogicalWidth) / 2);
      } else {
        // Reset x position to column start - layoutTextNode may have applied alignment
        // but for grid cells, the renderer should handle alignment within cell boundaries
        childResult.x = contentX + colPosition;
      }

      // Store cell alignment for renderer to use (legacy)
      if (cellAlign) {
        childResult.cellAlign = cellAlign;
      }

      // Store render constraints for proper boundary enforcement
      childResult.renderConstraints = {
        boundaryWidth: cellWidth,
        boundaryHeight: cellHeight,
        ...(cellAlign ? { hAlign: cellAlign } : {}),
        vAlign: 'top',
      };

      childResults.push(childResult);
      childIndex++;
    });
  });

  return {
    node: measured.node,
    x: ctx.x + margin.left,
    y: ctx.y + margin.top,
    width: measured.preferredWidth - margin.left - margin.right,
    height: measured.preferredHeight - margin.top - margin.bottom,
    children: childResults,
    style: measured.style,
  };
}

// ==================== POSITIONING HELPERS ====================

/**
 * Check if a node uses absolute positioning
 */
function isAbsolutelyPositioned(node: LayoutNode): boolean {
  const nodeBase = node as LayoutNodeBase;
  return nodeBase.position === 'absolute';
}

/**
 * Check if a node uses relative positioning
 */
function isRelativelyPositioned(node: LayoutNode): boolean {
  const nodeBase = node as LayoutNodeBase;
  return nodeBase.position === 'relative';
}

/**
 * Get absolute position overrides from node
 * Uses 0 as default, not context position, since absolute positioning
 * means coordinates relative to page origin, not parent.
 */
function getAbsolutePosition(node: LayoutNode): { x: number; y: number } {
  const nodeBase = node as LayoutNodeBase;
  return {
    x: nodeBase.posX ?? 0,
    y: nodeBase.posY ?? 0,
  };
}

/**
 * Get relative position offsets from node
 */
function getRelativeOffset(node: LayoutNode): { x: number; y: number } {
  const nodeBase = node as LayoutNodeBase;
  return {
    x: nodeBase.offsetX ?? 0,
    y: nodeBase.offsetY ?? 0,
  };
}

// ==================== MAIN LAYOUT FUNCTION ====================

/**
 * Layout a measured node and all its children
 *
 * @param measured - Measured node from measure phase
 * @param ctx - Layout context with position and available space
 * @returns Layout result with absolute positions
 */
export function layoutNode(
  measured: MeasuredNode,
  ctx: LayoutContext
): LayoutResult {
  // Check for absolute positioning
  let effectiveCtx = ctx;
  if (isAbsolutelyPositioned(measured.node)) {
    const absPos = getAbsolutePosition(measured.node);
    effectiveCtx = {
      ...ctx,
      x: absPos.x,
      y: absPos.y,
    };
  }

  // Check for conditional content - if condition not met, use fallback
  if (measured.conditionMet === false && measured.fallbackMeasured) {
    return layoutNode(measured.fallbackMeasured, effectiveCtx);
  }

  // If condition not met and no fallback, return zero-size result
  if (measured.conditionMet === false) {
    return {
      node: measured.node,
      x: effectiveCtx.x,
      y: effectiveCtx.y,
      width: 0,
      height: 0,
      children: [],
      style: measured.style,
    };
  }

  let result: LayoutResult;

  switch (measured.node.type) {
    case 'text':
      result = layoutTextNode(measured, effectiveCtx);
      break;

    case 'spacer':
      result = layoutSpacerNode(measured, effectiveCtx);
      break;

    case 'line':
      result = layoutLineNode(measured, effectiveCtx);
      break;

    case 'stack':
      result = layoutStackNode(measured, effectiveCtx);
      break;

    case 'flex':
      result = layoutFlexNode(measured, effectiveCtx);
      break;

    case 'grid':
      result = layoutGridNode(measured, effectiveCtx);
      break;

    default:
      // Unknown node - return basic result
      result = {
        node: measured.node,
        x: effectiveCtx.x,
        y: effectiveCtx.y,
        width: measured.preferredWidth,
        height: measured.preferredHeight,
        children: [],
        style: measured.style,
      };
  }

  // Store relative positioning offset for render-time application
  // This ensures pagination sees the flow position, not the offset position
  if (isRelativelyPositioned(measured.node)) {
    result.relativeOffset = getRelativeOffset(measured.node);
  }

  return result;
}

/**
 * Perform full layout starting from root
 *
 * @param measured - Measured root node
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param availableWidth - Available width
 * @param availableHeight - Available height
 * @returns Layout result tree with absolute positions
 */
export function performLayout(
  measured: MeasuredNode,
  startX: number,
  startY: number,
  availableWidth: number,
  availableHeight: number
): LayoutResult {
  return layoutNode(measured, {
    x: startX,
    y: startY,
    width: availableWidth,
    height: availableHeight,
  });
}
