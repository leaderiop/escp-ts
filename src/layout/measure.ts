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
  HeightSpec,
  ResolvedPadding,
  ResolvedMargin,
  ResolvedStyle,
  SpaceContext,
  ContentCondition,
  LayoutNodeBase,
  DataContext,
} from './nodes';
import { resolvePadding, resolveMargin, resolveStyle, DEFAULT_STYLE, isPercentage, parsePercentage, resolvePercentage, isResolvableNode } from './nodes';
import { resolveNode } from './resolver';
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
  /** Data context for template/conditional resolution */
  dataContext?: DataContext;
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
/**
 * Represents a line of flex items when wrapping
 */
export interface FlexLine {
  /** Start index of children in this line */
  startIndex: number;
  /** End index (exclusive) of children in this line */
  endIndex: number;
  /** Height of this line (max child height) */
  height: number;
  /** Total width of children in this line (including gaps) */
  width: number;
}

export interface MeasuredNode {
  /** Original node reference */
  node: LayoutNode;
  /** Minimum content width (without padding) */
  minContentWidth: number;
  /** Minimum content height (without padding) */
  minContentHeight: number;
  /** Preferred width (natural size, includes margin) */
  preferredWidth: number;
  /** Preferred height (natural size, includes margin) */
  preferredHeight: number;
  /** Resolved padding */
  padding: ResolvedPadding;
  /** Resolved margin */
  margin: ResolvedMargin;
  /** Resolved style (with inheritance) */
  style: ResolvedStyle;
  /** Measured children (for container nodes) */
  children: MeasuredNode[];
  /** For grid: measured row info */
  rowHeights?: number[];
  /** For grid: calculated column widths */
  columnWidths?: number[];
  /** For conditional content: whether the condition was met */
  conditionMet?: boolean;
  /** For conditional content: measured fallback node */
  fallbackMeasured?: MeasuredNode;
  /** For flex wrap: lines of wrapped children */
  flexLines?: FlexLine[];
  /** Explicit width if specified (number or resolved percentage, not 'auto' or 'fill') */
  explicitWidth?: number;
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
function resolveWidthSpec(spec: WidthSpec | undefined, availableWidth: number): number | 'auto' | 'fill' {
  if (spec === undefined || spec === 'auto') {
    return 'auto';
  }
  if (spec === 'fill') {
    return 'fill';
  }
  if (isPercentage(spec)) {
    const percentage = parsePercentage(spec);
    return resolvePercentage(percentage, availableWidth);
  }
  return spec; // number
}

/**
 * Resolve a height specification to a concrete value
 */
function resolveHeightSpec(spec: HeightSpec | undefined, availableHeight: number): number | 'auto' {
  if (spec === undefined || spec === 'auto') {
    return 'auto';
  }
  if (isPercentage(spec)) {
    const percentage = parsePercentage(spec);
    return resolvePercentage(percentage, availableHeight);
  }
  return spec; // number
}

/**
 * Apply size constraints to width and height
 */
function applyConstraints(
  width: number,
  height: number,
  node: LayoutNodeBase
): { width: number; height: number } {
  let constrainedWidth = width;
  let constrainedHeight = height;

  if (node.minWidth !== undefined) {
    constrainedWidth = Math.max(constrainedWidth, node.minWidth);
  }
  if (node.maxWidth !== undefined) {
    constrainedWidth = Math.min(constrainedWidth, node.maxWidth);
  }
  if (node.minHeight !== undefined) {
    constrainedHeight = Math.max(constrainedHeight, node.minHeight);
  }
  if (node.maxHeight !== undefined) {
    constrainedHeight = Math.min(constrainedHeight, node.maxHeight);
  }

  return { width: constrainedWidth, height: constrainedHeight };
}

/**
 * Evaluate a content condition against space context
 */
function evaluateCondition(condition: ContentCondition, ctx: SpaceContext): boolean {
  if (typeof condition === 'function') {
    return condition(ctx);
  }
  // Declarative SpaceQuery object
  if (condition.minWidth !== undefined && ctx.availableWidth < condition.minWidth) {
    return false;
  }
  if (condition.maxWidth !== undefined && ctx.availableWidth > condition.maxWidth) {
    return false;
  }
  if (condition.minHeight !== undefined && ctx.availableHeight < condition.minHeight) {
    return false;
  }
  if (condition.maxHeight !== undefined && ctx.availableHeight > condition.maxHeight) {
    return false;
  }
  return true;
}

/**
 * Create a SpaceContext from MeasureContext
 */
function createSpaceContext(ctx: MeasureContext, pageNumber: number = 0): SpaceContext {
  return {
    availableWidth: ctx.availableWidth,
    availableHeight: ctx.availableHeight,
    remainingWidth: ctx.availableWidth,
    remainingHeight: ctx.availableHeight,
    pageNumber,
  };
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
  const margin = resolveMargin(node.margin);

  let textWidth: number;
  let textHeight: number;

  if (node.orientation === 'vertical') {
    // Vertical text: each character stacked vertically
    const charHeight = getTextHeight(style, ctx.lineSpacing);
    // Width is the width of the widest character (approximate with 'W')
    const charWidth = getCharacterWidth(
      'W'.charCodeAt(0),
      style.cpi,
      false,
      style.condensed,
      style.doubleWidth
    );
    textWidth = charWidth;
    textHeight = node.content.length * charHeight;
  } else {
    // Horizontal text (default)
    textWidth = measureTextWidth(node.content, style, ctx.interCharSpace);
    textHeight = getTextHeight(style, ctx.lineSpacing);
  }

  // Calculate preferred dimensions with padding and margin
  let preferredWidth = textWidth + padding.left + padding.right + margin.left + margin.right;
  let preferredHeight = textHeight + padding.top + padding.bottom + margin.top + margin.bottom;

  // Apply constraints
  const constrained = applyConstraints(preferredWidth, preferredHeight, node);
  preferredWidth = constrained.width;
  preferredHeight = constrained.height;

  // Track explicit width if specified (number or resolved percentage)
  let explicitWidth: number | undefined;
  const widthSpec = resolveWidthSpec(node.width, ctx.availableWidth);
  if (typeof widthSpec === 'number') {
    explicitWidth = widthSpec;
  }

  return {
    node,
    minContentWidth: textWidth,
    minContentHeight: textHeight,
    preferredWidth,
    preferredHeight,
    padding,
    margin,
    style,
    children: [],
    ...(explicitWidth !== undefined && { explicitWidth }),
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
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
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
  const margin = resolveMargin(node.margin);

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
    preferredWidth: (node.direction === 'horizontal' ? width : charWidth) + padding.left + padding.right + margin.left + margin.right,
    preferredHeight: height + padding.top + padding.bottom + margin.top + margin.bottom,
    padding,
    margin,
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
  const margin = resolveMargin(node.margin);
  const gap = node.gap ?? 0;
  const direction = node.direction ?? 'column';

  // Measure all children with inherited style
  const childCtx: MeasureContext = {
    ...ctx,
    style,
    availableWidth: ctx.availableWidth - padding.left - padding.right - margin.left - margin.right,
    availableHeight: ctx.availableHeight - padding.top - padding.bottom - margin.top - margin.bottom,
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
  const heightSpec = resolveHeightSpec(node.height, ctx.availableHeight);
  let preferredWidth = widthSpec === 'fill'
    ? ctx.availableWidth
    : widthSpec === 'auto'
      ? minContentWidth + padding.left + padding.right + margin.left + margin.right
      : widthSpec;
  let preferredHeight = heightSpec === 'auto'
    ? minContentHeight + padding.top + padding.bottom + margin.top + margin.bottom
    : heightSpec;

  // Apply constraints
  const constrained = applyConstraints(preferredWidth, preferredHeight, node);
  preferredWidth = constrained.width;
  preferredHeight = constrained.height;

  // Track explicit width if specified (number or resolved percentage)
  const explicitWidth = typeof widthSpec === 'number' ? widthSpec : undefined;

  return {
    node,
    minContentWidth,
    minContentHeight,
    preferredWidth,
    preferredHeight,
    padding,
    margin,
    style,
    children: measuredChildren,
    ...(explicitWidth !== undefined && { explicitWidth }),
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
  const margin = resolveMargin(node.margin);
  const gap = node.gap ?? 0;
  const rowGap = node.rowGap ?? 0;
  const shouldWrap = node.wrap === 'wrap';

  // Content area width (for wrapping calculations)
  // Use explicit width if flex container has one, otherwise use available width
  const containerWidthSpec = resolveWidthSpec(node.width, ctx.availableWidth);
  const containerBaseWidth = (containerWidthSpec === 'fill' || containerWidthSpec === 'auto')
    ? ctx.availableWidth
    : (typeof containerWidthSpec === 'number' ? containerWidthSpec : ctx.availableWidth);
  const contentAreaWidth = containerBaseWidth - padding.left - padding.right - margin.left - margin.right;

  // Measure all children
  const childCtx: MeasureContext = {
    ...ctx,
    style,
    availableWidth: contentAreaWidth,
    availableHeight: ctx.availableHeight - padding.top - padding.bottom - margin.top - margin.bottom,
  };

  const measuredChildren = node.children.map(child =>
    measureNode(child, childCtx, style)
  );

  let minContentWidth = 0;
  let minContentHeight = 0;
  let flexLines: FlexLine[] | undefined;

  if (shouldWrap && measuredChildren.length > 0) {
    // Calculate flex lines for wrapping
    const lines: FlexLine[] = [];
    flexLines = lines;
    let currentLineStart = 0;
    let currentLineWidth = 0;
    let currentLineHeight = 0;

    measuredChildren.forEach((child, i) => {
      const childWidth = child.preferredWidth;
      const gapBefore = (i > currentLineStart) ? gap : 0;

      // Check if child fits on current line (with gap if not first item on line)
      if (currentLineWidth + gapBefore + childWidth > contentAreaWidth && i > currentLineStart) {
        // Save current line
        lines.push({
          startIndex: currentLineStart,
          endIndex: i,
          height: currentLineHeight,
          width: currentLineWidth,
        });

        // Start new line - no gap for first item
        currentLineStart = i;
        currentLineWidth = childWidth;
        currentLineHeight = child.preferredHeight;
      } else {
        // Add to current line (with gap if not first item)
        currentLineWidth += gapBefore + childWidth;
        currentLineHeight = Math.max(currentLineHeight, child.preferredHeight);
      }
    });

    // Save last line
    if (currentLineStart < measuredChildren.length) {
      flexLines.push({
        startIndex: currentLineStart,
        endIndex: measuredChildren.length,
        height: currentLineHeight,
        width: currentLineWidth,
      });
    }

    // Calculate total size with wrapping
    minContentWidth = Math.max(...flexLines.map(l => l.width));
    minContentHeight = flexLines.reduce((sum, line, i) => {
      return sum + line.height + (i > 0 ? rowGap : 0);
    }, 0);
  } else {
    // No wrap: width is sum, height is max
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
  const heightSpec = resolveHeightSpec(node.height, ctx.availableHeight);
  let preferredWidth = widthSpec === 'fill'
    ? ctx.availableWidth
    : widthSpec === 'auto'
      ? minContentWidth + padding.left + padding.right + margin.left + margin.right
      : widthSpec;
  let preferredHeight = heightSpec === 'auto'
    ? minContentHeight + padding.top + padding.bottom + margin.top + margin.bottom
    : heightSpec;

  // Apply constraints
  const constrained = applyConstraints(preferredWidth, preferredHeight, node);
  preferredWidth = constrained.width;
  preferredHeight = constrained.height;

  // Track explicit width if specified (number or resolved percentage)
  const explicitWidth = typeof widthSpec === 'number' ? widthSpec : undefined;

  return {
    node,
    minContentWidth,
    minContentHeight,
    preferredWidth,
    preferredHeight,
    padding,
    margin,
    style,
    children: measuredChildren,
    ...(flexLines && { flexLines }),
    ...(explicitWidth !== undefined && { explicitWidth }),
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
  const margin = resolveMargin(node.margin);
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
  const availableForColumns = ctx.availableWidth - padding.left - padding.right - margin.left - margin.right - totalGapWidth;

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

  // Calculate preferred dimensions with padding and margin
  let preferredWidth = totalWidth + padding.left + padding.right + margin.left + margin.right;
  let preferredHeight = totalHeight + padding.top + padding.bottom + margin.top + margin.bottom;

  // Apply constraints
  const constrained = applyConstraints(preferredWidth, preferredHeight, node);
  preferredWidth = constrained.width;
  preferredHeight = constrained.height;

  return {
    node,
    minContentWidth: totalWidth,
    minContentHeight: totalHeight,
    preferredWidth,
    preferredHeight,
    padding,
    margin,
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

  // First pass: assign fixed widths, percentages, and collect auto/fill columns
  let fixedWidth = 0;
  const autoColumns: number[] = [];
  const fillColumns: number[] = [];

  for (let i = 0; i < numColumns; i++) {
    const spec = columnSpecs[i];
    if (typeof spec === 'number') {
      widths[i] = spec;
      fixedWidth += spec;
    } else if (isPercentage(spec)) {
      // Resolve percentage width
      const percentage = parsePercentage(spec);
      const width = resolvePercentage(percentage, availableWidth);
      widths[i] = width;
      fixedWidth += width;
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
 * @param pageNumber - Current page number (for conditional content)
 * @returns Measured node with calculated sizes
 */
export function measureNode(
  node: LayoutNode,
  ctx: MeasureContext = DEFAULT_MEASURE_CONTEXT,
  parentStyle: ResolvedStyle = DEFAULT_STYLE,
  pageNumber: number = 0
): MeasuredNode {
  // Resolve dynamic nodes (template, conditional, switch, each) when data context is available
  if (ctx.dataContext && isResolvableNode(node)) {
    const resolved = resolveNode(node, ctx.dataContext);
    if (!resolved) {
      // Node resolved to null (e.g., condition not met) - return zero-size measurement
      return {
        node,
        minContentWidth: 0,
        minContentHeight: 0,
        preferredWidth: 0,
        preferredHeight: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        style: parentStyle,
        children: [],
      };
    }
    // Continue measuring the resolved node
    node = resolved;
  }

  // Check for conditional content
  const nodeBase = node as LayoutNodeBase;
  if (nodeBase.when !== undefined) {
    const spaceCtx = createSpaceContext(ctx, pageNumber);
    const conditionMet = evaluateCondition(nodeBase.when, spaceCtx);

    if (!conditionMet) {
      // Condition not met - measure fallback or return zero-size
      if (nodeBase.fallback) {
        const fallbackMeasured = measureNode(nodeBase.fallback, ctx, parentStyle, pageNumber);
        return {
          ...fallbackMeasured,
          node, // Keep original node reference
          conditionMet: false,
          fallbackMeasured,
        };
      }
      // No fallback - return zero-size measurement
      return {
        node,
        minContentWidth: 0,
        minContentHeight: 0,
        preferredWidth: 0,
        preferredHeight: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        style: parentStyle,
        children: [],
        conditionMet: false,
      };
    }
  }

  let result: MeasuredNode;

  switch (node.type) {
    case 'text':
      result = measureTextNode(node, ctx, parentStyle);
      break;

    case 'spacer':
      result = measureSpacerNode(node, ctx);
      break;

    case 'line':
      result = measureLineNode(node, ctx, parentStyle);
      break;

    case 'stack':
      result = measureStackNode(node, ctx, parentStyle);
      break;

    case 'flex':
      result = measureFlexNode(node, ctx, parentStyle);
      break;

    case 'grid':
      result = measureGridNode(node, ctx, parentStyle);
      break;

    default:
      // Unknown node type - return empty measurement
      result = {
        node,
        minContentWidth: 0,
        minContentHeight: 0,
        preferredWidth: 0,
        preferredHeight: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        style: parentStyle,
        children: [],
      };
  }

  // Mark condition as met if we got here
  if (nodeBase.when !== undefined) {
    result.conditionMet = true;
  }

  return result;
}
