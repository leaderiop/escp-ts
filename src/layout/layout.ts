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
  HAlign,
  VAlign,
  JustifyContent,
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
  switch (align) {
    case 'center':
      return Math.floor((containerWidth - contentWidth) / 2);
    case 'right':
      return containerWidth - contentWidth;
    case 'left':
    default:
      return 0;
  }
}

/**
 * Calculate Y offset for vertical alignment
 */
function alignVertical(
  align: VAlign | undefined,
  contentHeight: number,
  containerHeight: number
): number {
  switch (align) {
    case 'center':
      return Math.floor((containerHeight - contentHeight) / 2);
    case 'bottom':
      return containerHeight - contentHeight;
    case 'top':
    default:
      return 0;
  }
}

/**
 * Calculate positions for justify content in flex layouts
 */
function calculateJustifyPositions(
  justify: JustifyContent | undefined,
  childWidths: number[],
  containerWidth: number,
  gap: number
): number[] {
  const totalChildWidth = childWidths.reduce((a, b) => a + b, 0);
  const totalGapWidth = (childWidths.length - 1) * gap;
  const remainingSpace = containerWidth - totalChildWidth - totalGapWidth;
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
      const spaceAround = remainingSpace / childWidths.length;
      let x = spaceAround / 2;
      childWidths.forEach(w => {
        positions.push(x);
        x += w + spaceAround;
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

  const xOffset = alignHorizontal(align, measured.preferredWidth, ctx.width);

  return {
    node: measured.node,
    x: ctx.x + xOffset,
    y: ctx.y,
    width: measured.preferredWidth,
    height: measured.preferredHeight,
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
  return {
    node: measured.node,
    x: ctx.x,
    y: ctx.y,
    width: ctx.width, // Lines fill available width
    height: measured.preferredHeight,
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

  // Content area inside padding
  const contentX = ctx.x + padding.left;
  const contentY = ctx.y + padding.top;
  const contentWidth = ctx.width - padding.left - padding.right;
  const contentHeight = ctx.height - padding.top - padding.bottom;

  const childResults: LayoutResult[] = [];

  if (direction === 'column') {
    // Vertical stack
    let currentY = contentY;

    for (const childMeasured of measured.children) {
      // Calculate X offset based on alignment
      const xOffset = alignHorizontal(node.align, childMeasured.preferredWidth, contentWidth);

      const childResult = layoutNode(childMeasured, {
        x: contentX + xOffset,
        y: currentY,
        width: contentWidth,
        height: childMeasured.preferredHeight,
      });

      childResults.push(childResult);
      currentY += childResult.height + gap;
    }
  } else {
    // Horizontal stack (row)
    let currentX = contentX;

    for (const childMeasured of measured.children) {
      // Calculate Y offset based on vertical alignment
      const yOffset = alignVertical(node.vAlign, childMeasured.preferredHeight, contentHeight);

      const childResult = layoutNode(childMeasured, {
        x: currentX,
        y: contentY + yOffset,
        width: childMeasured.preferredWidth,
        height: contentHeight,
      });

      childResults.push(childResult);
      currentX += childResult.width + gap;
    }
  }

  return {
    node: measured.node,
    x: ctx.x,
    y: ctx.y,
    width: ctx.width,
    height: measured.preferredHeight,
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
  const justify = node.justify;
  const alignItems = node.alignItems;
  const padding = measured.padding;

  // Content area inside padding
  const contentX = ctx.x + padding.left;
  const contentY = ctx.y + padding.top;
  const contentWidth = ctx.width - padding.left - padding.right;
  const contentHeight = measured.preferredHeight - padding.top - padding.bottom;

  // Get child widths for justify calculation
  const childWidths = measured.children.map(c => c.preferredWidth);

  // Calculate X positions based on justify
  const xPositions = calculateJustifyPositions(
    justify,
    childWidths,
    contentWidth,
    gap
  );

  const childResults: LayoutResult[] = [];

  measured.children.forEach((childMeasured, i) => {
    // Calculate Y offset based on alignItems
    const yOffset = alignVertical(alignItems, childMeasured.preferredHeight, contentHeight);
    const xPosition = xPositions[i] ?? 0;

    const childResult = layoutNode(childMeasured, {
      x: contentX + xPosition,
      y: contentY + yOffset,
      width: childMeasured.preferredWidth,
      height: contentHeight,
    });

    childResults.push(childResult);
  });

  return {
    node: measured.node,
    x: ctx.x,
    y: ctx.y,
    width: ctx.width,
    height: measured.preferredHeight,
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
  const columnWidths = measured.columnWidths ?? [];
  const rowHeights = measured.rowHeights ?? [];

  // Content area inside padding
  const contentX = ctx.x + padding.left;
  const contentY = ctx.y + padding.top;

  // Calculate column X positions
  const columnPositions: number[] = [];
  let xPos = 0;
  columnWidths.forEach(width => {
    columnPositions.push(xPos);
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

      // Calculate alignment within cell
      const xOffset = alignHorizontal(cellAlign, childMeasured.preferredWidth, cellWidth);
      const yOffset = alignVertical('top', childMeasured.preferredHeight, cellHeight);

      const colPosition = columnPositions[colIdx] ?? 0;
      const rowPosition = rowPositions[rowIdx] ?? 0;

      const childResult = layoutNode(childMeasured, {
        x: contentX + colPosition + xOffset,
        y: contentY + rowPosition + yOffset,
        width: cellWidth,
        height: cellHeight,
      });

      childResults.push(childResult);
      childIndex++;
    });
  });

  return {
    node: measured.node,
    x: ctx.x,
    y: ctx.y,
    width: measured.preferredWidth,
    height: measured.preferredHeight,
    children: childResults,
    style: measured.style,
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
  switch (measured.node.type) {
    case 'text':
      return layoutTextNode(measured, ctx);

    case 'spacer':
      return layoutSpacerNode(measured, ctx);

    case 'line':
      return layoutLineNode(measured, ctx);

    case 'stack':
      return layoutStackNode(measured, ctx);

    case 'flex':
      return layoutFlexNode(measured, ctx);

    case 'grid':
      return layoutGridNode(measured, ctx);

    default:
      // Unknown node - return basic result
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
