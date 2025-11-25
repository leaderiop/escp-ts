/**
 * Measure Phase for ESC/P2 Layout System
 *
 * The measure phase calculates intrinsic sizes for all nodes in the tree,
 * working bottom-up (children before parents). This provides the minimum
 * and preferred sizes needed for the layout phase.
 */

import type {
  LayoutNode,
  StackNode,
  FlexNode,
  GridNode,
  TextNode,
  SpacerNode,
  LineNode,
  WidthSpec,
  ResolvedPadding,
  ResolvedStyle,
} from './nodes';
import { resolvePadding, resolveStyle, DEFAULT_STYLE } from './nodes';
import { calculateTextWidth, getCharacterWidth } from '../fonts/CharacterSet';

// ==================== MEASURE CONTEXT ====================

/**
 * Context passed during measurement
 */
export interface MeasureContext {
  /** Available width from parent (for percentage calculations) */
  availableWidth: number;
  /** Available height from parent */
  availableHeight: number;
  /** Default line spacing in dots */
  lineSpacing: number;
  /** Default inter-character space */
  interCharSpace: number;
  /** Current inherited style */
  style: ResolvedStyle;
}

/**
 * Default measure context
 */
export const DEFAULT_MEASURE_CONTEXT: MeasureContext = {
  availableWidth: 2880, // ~8 inches at 360 DPI
  availableHeight: 3600, // ~10 inches at 360 DPI
  lineSpacing: 60, // 1/6 inch
  interCharSpace: 0,
  style: DEFAULT_STYLE,
};

// ==================== MEASURED NODE ====================

/**
 * Result of measuring a node - contains calculated sizes
 */
export interface MeasuredNode {
  /** Original node reference */
  node: LayoutNode;
  /** Minimum content width (without padding) */
  minContentWidth: number;
  /** Minimum content height (without padding) */
  minContentHeight: number;
  /** Preferred width (natural size) */
  preferredWidth: number;
  /** Preferred height (natural size) */
  preferredHeight: number;
  /** Resolved padding */
  padding: ResolvedPadding;
  /** Resolved style (with inheritance) */
  style: ResolvedStyle;
  /** Measured children (for container nodes) */
  children: MeasuredNode[];
  /** For grid: measured row info */
  rowHeights?: number[];
  /** For grid: calculated column widths */
  columnWidths?: number[];
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate text height based on style
 */
function getTextHeight(style: ResolvedStyle, lineSpacing: number): number {
  let height = lineSpacing;
  if (style.doubleHeight) {
    height *= 2;
  }
  return height;
}

/**
 * Calculate text width using style settings
 */
function measureTextWidth(text: string, style: ResolvedStyle, interCharSpace: number): number {
  return calculateTextWidth(
    text,
    style.cpi,
    false, // proportional - keeping it simple for now
    style.condensed,
    style.doubleWidth,
    interCharSpace
  );
}

/**
 * Resolve a width specification to a concrete value
 */
function resolveWidthSpec(spec: WidthSpec | undefined, _availableWidth: number): number | 'auto' | 'fill' {
  if (spec === undefined || spec === 'auto') {
    return 'auto';
  }
  if (spec === 'fill') {
    return 'fill';
  }
  return spec; // number
}

// ==================== MEASURE FUNCTIONS ====================

/**
 * Measure a text node
 */
function measureTextNode(
  node: TextNode,
  ctx: MeasureContext,
  parentStyle: ResolvedStyle
): MeasuredNode {
  const style = resolveStyle(node, parentStyle);
  const padding = resolvePadding(node.padding);

  const textWidth = measureTextWidth(node.content, style, ctx.interCharSpace);
  const textHeight = getTextHeight(style, ctx.lineSpacing);

  return {
    node,
    minContentWidth: textWidth,
    minContentHeight: textHeight,
    preferredWidth: textWidth + padding.left + padding.right,
    preferredHeight: textHeight + padding.top + padding.bottom,
    padding,
    style,
    children: [],
  };
}

/**
 * Measure a spacer node
 */
function measureSpacerNode(node: SpacerNode, ctx: MeasureContext): MeasuredNode {
  const width = node.width ?? 0;
  const height = node.height ?? ctx.lineSpacing;

  return {
    node,
    minContentWidth: node.flex ? 0 : width,
    minContentHeight: height,
    preferredWidth: width,
    preferredHeight: height,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    style: ctx.style,
    children: [],
  };
}

/**
 * Measure a line node
 */
function measureLineNode(
  node: LineNode,
  ctx: MeasureContext,
  parentStyle: ResolvedStyle
): MeasuredNode {
  const style = resolveStyle(node, parentStyle);
  const padding = resolvePadding(node.padding);

  const charWidth = getCharacterWidth(
    (node.char ?? '-').charCodeAt(0),
    style.cpi,
    false,
    style.condensed,
    style.doubleWidth
  );

  let width: number;
  if (node.length === 'fill' || node.length === undefined) {
    width = ctx.availableWidth;
  } else {
    width = node.length;
  }

  const height = getTextHeight(style, ctx.lineSpacing);

  return {
    node,
    minContentWidth: node.direction === 'horizontal' ? charWidth : charWidth,
    minContentHeight: height,
    preferredWidth: (node.direction === 'horizontal' ? width : charWidth) + padding.left + padding.right,
    preferredHeight: height + padding.top + padding.bottom,
    padding,
    style,
    children: [],
  };
}

/**
 * Measure a stack node
 */
function measureStackNode(
  node: StackNode,
  ctx: MeasureContext,
  parentStyle: ResolvedStyle
): MeasuredNode {
  const style = resolveStyle(node, parentStyle);
  const padding = resolvePadding(node.padding);
  const gap = node.gap ?? 0;
  const direction = node.direction ?? 'column';

  // Measure all children with inherited style
  const childCtx: MeasureContext = {
    ...ctx,
    style,
    availableWidth: ctx.availableWidth - padding.left - padding.right,
    availableHeight: ctx.availableHeight - padding.top - padding.bottom,
  };

  const measuredChildren = node.children.map(child =>
    measureNode(child, childCtx, style)
  );

  // Calculate aggregate sizes based on direction
  let minContentWidth = 0;
  let minContentHeight = 0;

  if (direction === 'column') {
    // Vertical stack: width is max of children, height is sum
    measuredChildren.forEach((child, i) => {
      minContentWidth = Math.max(minContentWidth, child.preferredWidth);
      minContentHeight += child.preferredHeight;
      if (i > 0) {
        minContentHeight += gap;
      }
    });
  } else {
    // Horizontal stack (row): width is sum, height is max
    measuredChildren.forEach((child, i) => {
      minContentWidth += child.preferredWidth;
      minContentHeight = Math.max(minContentHeight, child.preferredHeight);
      if (i > 0) {
        minContentWidth += gap;
      }
    });
  }

  // Apply explicit width/height if specified
  const widthSpec = resolveWidthSpec(node.width, ctx.availableWidth);
  const finalWidth = widthSpec === 'fill'
    ? ctx.availableWidth
    : widthSpec === 'auto'
      ? minContentWidth + padding.left + padding.right
      : widthSpec;

  return {
    node,
    minContentWidth,
    minContentHeight,
    preferredWidth: finalWidth,
    preferredHeight: minContentHeight + padding.top + padding.bottom,
    padding,
    style,
    children: measuredChildren,
  };
}

/**
 * Measure a flex node
 */
function measureFlexNode(
  node: FlexNode,
  ctx: MeasureContext,
  parentStyle: ResolvedStyle
): MeasuredNode {
  const style = resolveStyle(node, parentStyle);
  const padding = resolvePadding(node.padding);
  const gap = node.gap ?? 0;

  // Measure all children
  const childCtx: MeasureContext = {
    ...ctx,
    style,
    availableWidth: ctx.availableWidth - padding.left - padding.right,
    availableHeight: ctx.availableHeight - padding.top - padding.bottom,
  };

  const measuredChildren = node.children.map(child =>
    measureNode(child, childCtx, style)
  );

  // Flex is horizontal: width is sum, height is max
  let minContentWidth = 0;
  let minContentHeight = 0;

  measuredChildren.forEach((child, i) => {
    minContentWidth += child.preferredWidth;
    minContentHeight = Math.max(minContentHeight, child.preferredHeight);
    if (i > 0) {
      minContentWidth += gap;
    }
  });

  // Apply explicit width if specified
  const widthSpec = resolveWidthSpec(node.width, ctx.availableWidth);
  const finalWidth = widthSpec === 'fill'
    ? ctx.availableWidth
    : widthSpec === 'auto'
      ? minContentWidth + padding.left + padding.right
      : widthSpec;

  return {
    node,
    minContentWidth,
    minContentHeight,
    preferredWidth: finalWidth,
    preferredHeight: minContentHeight + padding.top + padding.bottom,
    padding,
    style,
    children: measuredChildren,
  };
}

/**
 * Measure a grid node
 */
function measureGridNode(
  node: GridNode,
  ctx: MeasureContext,
  parentStyle: ResolvedStyle
): MeasuredNode {
  const style = resolveStyle(node, parentStyle);
  const padding = resolvePadding(node.padding);
  const columnGap = node.columnGap ?? 0;
  const rowGap = node.rowGap ?? 0;
  const numColumns = node.columns.length;

  // First pass: measure all cells
  const measuredRows: MeasuredNode[][] = [];
  const columnMinWidths: number[] = new Array(numColumns).fill(0);

  for (const row of node.rows) {
    const rowStyle = resolveStyle(row, style);
    const childCtx: MeasureContext = {
      ...ctx,
      style: rowStyle,
    };

    const measuredCells: MeasuredNode[] = [];
    for (let colIdx = 0; colIdx < row.cells.length && colIdx < numColumns; colIdx++) {
      const cell = row.cells[colIdx];
      if (!cell) continue;
      const measuredCell = measureNode(cell, childCtx, rowStyle);
      measuredCells.push(measuredCell);

      // Track minimum column width needed
      const currentMin = columnMinWidths[colIdx] ?? 0;
      columnMinWidths[colIdx] = Math.max(currentMin, measuredCell.preferredWidth);
    }
    measuredRows.push(measuredCells);
  }

  // Second pass: resolve column widths
  const totalGapWidth = (numColumns - 1) * columnGap;
  const availableForColumns = ctx.availableWidth - padding.left - padding.right - totalGapWidth;

  const columnWidths = resolveColumnWidths(
    node.columns,
    columnMinWidths,
    availableForColumns
  );

  // Calculate row heights
  const rowHeights: number[] = [];
  for (let rowIdx = 0; rowIdx < measuredRows.length; rowIdx++) {
    const measuredRow = measuredRows[rowIdx];
    if (!measuredRow) continue;

    let maxHeight = ctx.lineSpacing; // Minimum row height

    for (const cell of measuredRow) {
      maxHeight = Math.max(maxHeight, cell.preferredHeight);
    }

    // Apply explicit row height if specified
    const rowNode = node.rows[rowIdx];
    if (rowNode && rowNode.height !== undefined) {
      maxHeight = rowNode.height;
    }

    rowHeights.push(maxHeight);
  }

  // Calculate total dimensions
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0) + totalGapWidth;
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0) + (rowHeights.length - 1) * rowGap;

  // Flatten measured children
  const flatChildren = measuredRows.flat();

  return {
    node,
    minContentWidth: totalWidth,
    minContentHeight: totalHeight,
    preferredWidth: totalWidth + padding.left + padding.right,
    preferredHeight: totalHeight + padding.top + padding.bottom,
    padding,
    style,
    children: flatChildren,
    rowHeights,
    columnWidths,
  };
}

/**
 * Resolve column widths for a grid
 */
function resolveColumnWidths(
  columnSpecs: WidthSpec[],
  minWidths: number[],
  availableWidth: number
): number[] {
  const numColumns = columnSpecs.length;
  const widths: number[] = new Array(numColumns).fill(0);

  // First pass: assign fixed widths and collect auto/fill columns
  let fixedWidth = 0;
  const autoColumns: number[] = [];
  const fillColumns: number[] = [];

  for (let i = 0; i < numColumns; i++) {
    const spec = columnSpecs[i];
    if (typeof spec === 'number') {
      widths[i] = spec;
      fixedWidth += spec;
    } else if (spec === 'auto') {
      autoColumns.push(i);
    } else if (spec === 'fill') {
      fillColumns.push(i);
    }
  }

  // Second pass: assign auto widths based on content
  for (const colIdx of autoColumns) {
    const minWidth = minWidths[colIdx] ?? 0;
    widths[colIdx] = minWidth;
    fixedWidth += minWidth;
  }

  // Third pass: distribute remaining space to fill columns
  const remainingWidth = availableWidth - fixedWidth;
  if (fillColumns.length > 0 && remainingWidth > 0) {
    const fillWidth = remainingWidth / fillColumns.length;
    for (const colIdx of fillColumns) {
      const minWidth = minWidths[colIdx] ?? 0;
      widths[colIdx] = Math.max(fillWidth, minWidth);
    }
  } else if (fillColumns.length > 0) {
    // Not enough space, use minimum widths
    for (const colIdx of fillColumns) {
      widths[colIdx] = minWidths[colIdx] ?? 0;
    }
  }

  return widths;
}

// ==================== MAIN MEASURE FUNCTION ====================

/**
 * Measure a layout node and all its children
 *
 * @param node - The layout node to measure
 * @param ctx - Measure context with available space and settings
 * @param parentStyle - Style inherited from parent
 * @returns Measured node with calculated sizes
 */
export function measureNode(
  node: LayoutNode,
  ctx: MeasureContext = DEFAULT_MEASURE_CONTEXT,
  parentStyle: ResolvedStyle = DEFAULT_STYLE
): MeasuredNode {
  switch (node.type) {
    case 'text':
      return measureTextNode(node, ctx, parentStyle);

    case 'spacer':
      return measureSpacerNode(node, ctx);

    case 'line':
      return measureLineNode(node, ctx, parentStyle);

    case 'stack':
      return measureStackNode(node, ctx, parentStyle);

    case 'flex':
      return measureFlexNode(node, ctx, parentStyle);

    case 'grid':
      return measureGridNode(node, ctx, parentStyle);

    default:
      // Unknown node type - return empty measurement
      return {
        node,
        minContentWidth: 0,
        minContentHeight: 0,
        preferredWidth: 0,
        preferredHeight: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        style: parentStyle,
        children: [],
      };
  }
}
