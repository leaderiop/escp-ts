/**
 * Virtual Tree Node Types for ESC/P2 Layout System
 *
 * These types define the structure of the virtual layout tree that gets
 * built using the fluent builder API, then measured, positioned, and
 * rendered to ESC/P2 printer commands.
 */

// ==================== WIDTH/HEIGHT SPECIFICATIONS ====================

/**
 * Percentage string type (e.g., '50%', '100%')
 */
export type PercentageString = `${number}%`;

/**
 * Width specification for layout nodes
 * - number: Fixed width in dots (1/360 inch)
 * - 'auto': Size to fit content
 * - 'fill': Take remaining available space
 * - '50%': Percentage of available width (any number followed by %)
 */
export type WidthSpec = number | 'auto' | 'fill' | PercentageString;

/**
 * Height specification for layout nodes
 * - number: Fixed height in dots (1/360 inch)
 * - 'auto': Size to fit content
 * - '50%': Percentage of available height (any number followed by %)
 */
export type HeightSpec = number | 'auto' | PercentageString;

/**
 * Check if a value is a percentage string
 */
export function isPercentage(value: unknown): value is PercentageString {
  return typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value);
}

/**
 * Parse a percentage string to get the numeric value
 * @param value - A percentage string like '50%'
 * @returns The numeric percentage (e.g., 50 for '50%')
 */
export function parsePercentage(value: PercentageString): number {
  return parseFloat(value.slice(0, -1));
}

/**
 * Calculate the actual size from a percentage
 * @param percentage - The percentage value (e.g., 50 for 50%)
 * @param availableSize - The available size to calculate against
 * @returns The calculated size in dots
 */
export function resolvePercentage(percentage: number, availableSize: number): number {
  return Math.floor((percentage / 100) * availableSize);
}

// ==================== PADDING ====================

/**
 * Padding specification
 * - number: Same padding on all sides (in dots)
 * - object: Individual padding per side
 */
export type PaddingSpec = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

/**
 * Resolved padding with all four sides
 */
export interface ResolvedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ==================== MARGIN ====================

/**
 * Margin specification
 * - number: Same margin on all sides (in dots)
 * - 'auto': Auto margin (used for centering)
 * - object: Individual margin per side (values can be number or 'auto')
 */
export type MarginSpec = number | 'auto' | {
  top?: number;
  right?: number | 'auto';
  bottom?: number;
  left?: number | 'auto';
};

/**
 * Resolved margin with all four sides
 * Auto margins are stored as 0 with the autoHorizontal flag set
 */
export interface ResolvedMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
  /** True if horizontal margins should auto-center the element */
  autoHorizontal?: boolean;
}

// ==================== ALIGNMENT ====================

/**
 * Horizontal alignment within a container
 */
export type HAlign = 'left' | 'center' | 'right';

/**
 * Vertical alignment within a container
 */
export type VAlign = 'top' | 'center' | 'bottom';

/**
 * Flex justify content options
 */
export type JustifyContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around';

// ==================== STYLE PROPERTIES ====================

/**
 * Style properties that can be set on any node and inherited by children.
 * Similar to CSS inheritance - if a property is undefined, it inherits
 * from the parent node.
 */
export interface StyleProps {
  /** Bold text */
  bold?: boolean;
  /** Italic text */
  italic?: boolean;
  /** Underlined text */
  underline?: boolean;
  /** Double-strike (darker) text */
  doubleStrike?: boolean;
  /** Double width characters */
  doubleWidth?: boolean;
  /** Double height characters */
  doubleHeight?: boolean;
  /** Condensed (narrower) characters */
  condensed?: boolean;
  /** Characters per inch (10, 12, 15, 17, 20) */
  cpi?: number;
}

/**
 * Resolved style with all properties defined (after inheritance)
 */
export interface ResolvedStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  doubleStrike: boolean;
  doubleWidth: boolean;
  doubleHeight: boolean;
  condensed: boolean;
  cpi: number;
}

/**
 * Default style values (used at the root level)
 */
export const DEFAULT_STYLE: ResolvedStyle = {
  bold: false,
  italic: false,
  underline: false,
  doubleStrike: false,
  doubleWidth: false,
  doubleHeight: false,
  condensed: false,
  cpi: 10,
};

// ==================== PAGINATION HINTS ====================

/**
 * Page break hint properties for controlling pagination behavior
 */
export interface PageBreakHints {
  /** Force a page break before this node */
  breakBefore?: boolean;
  /** Force a page break after this node */
  breakAfter?: boolean;
  /** Keep this node and its children on the same page if possible */
  keepTogether?: boolean;
  /** Minimum number of children before allowing a page break (orphan control) */
  minBeforeBreak?: number;
  /** Minimum number of children after a page break (widow control) */
  minAfterBreak?: number;
}

// ==================== CONDITIONAL CONTENT ====================

/**
 * Context passed to conditional content callbacks
 * Provides information about available space for rendering decisions
 */
export interface SpaceContext {
  /** Available width in dots */
  availableWidth: number;
  /** Available height in dots */
  availableHeight: number;
  /** Remaining width after previous siblings */
  remainingWidth: number;
  /** Remaining height after previous siblings */
  remainingHeight: number;
  /** Current page number (0-indexed) */
  pageNumber: number;
}

/**
 * Declarative space query for conditional content
 * All conditions must be met for the content to be shown
 */
export interface SpaceQuery {
  /** Minimum available width required */
  minWidth?: number;
  /** Maximum available width allowed */
  maxWidth?: number;
  /** Minimum available height required */
  minHeight?: number;
  /** Maximum available height allowed */
  maxHeight?: number;
}

/**
 * Condition for conditional content rendering
 * Can be a callback function or a declarative SpaceQuery object
 */
export type ContentCondition =
  | ((ctx: SpaceContext) => boolean)
  | SpaceQuery;

// ==================== POSITIONING ====================

/**
 * Positioning mode for layout nodes
 * - 'static': Normal flow positioning (default)
 * - 'relative': Normal flow with offset (element stays in flow but rendered offset)
 * - 'absolute': Position at specific x,y coordinates (removed from flow)
 */
export type PositionMode = 'static' | 'relative' | 'absolute';

/**
 * Text orientation for vertical text support
 */
export type TextOrientation = 'horizontal' | 'vertical';

// ==================== BASE NODE ====================

/**
 * Base properties shared by all layout nodes
 */
export interface LayoutNodeBase extends StyleProps, PageBreakHints {
  /** Optional identifier for debugging/tracking */
  id?: string;
  /** Width specification */
  width?: WidthSpec;
  /** Height specification */
  height?: HeightSpec;
  /** Padding inside the node */
  padding?: PaddingSpec;
  /** Margin outside the node (spacing between siblings) */
  margin?: MarginSpec;

  // ===== SIZE CONSTRAINTS =====
  /** Minimum width in dots */
  minWidth?: number;
  /** Maximum width in dots */
  maxWidth?: number;
  /** Minimum height in dots */
  minHeight?: number;
  /** Maximum height in dots */
  maxHeight?: number;

  // ===== POSITIONING =====
  /** Positioning mode: 'static' (default), 'relative', or 'absolute' */
  position?: PositionMode;
  /** Absolute X position in dots (only used when position='absolute') */
  posX?: number;
  /** Absolute Y position in dots (only used when position='absolute') */
  posY?: number;
  /** Horizontal offset in dots (only used when position='relative') */
  offsetX?: number;
  /** Vertical offset in dots (only used when position='relative') */
  offsetY?: number;

  // ===== CONDITIONAL CONTENT =====
  /** Condition for showing this node (callback or declarative query) */
  when?: ContentCondition;
  /** Fallback node to show when condition is false */
  fallback?: LayoutNode;
}

// ==================== CONTAINER NODES ====================

/**
 * Stack node - arranges children vertically (column) or horizontally (row)
 * Default direction is 'column' (vertical stacking)
 */
export interface StackNode extends LayoutNodeBase {
  type: 'stack';
  /** Stack direction: 'column' = vertical, 'row' = horizontal */
  direction?: 'column' | 'row';
  /** Gap between children in dots */
  gap?: number;
  /** Horizontal alignment of children (for column direction) */
  align?: HAlign;
  /** Vertical alignment of children (for row direction) */
  vAlign?: VAlign;
  /** Child nodes */
  children: LayoutNode[];
}

/**
 * Flex node - horizontal row with flexible distribution
 * Similar to CSS flexbox but simplified for printer layouts
 */
/**
 * Flex wrap mode
 * - 'nowrap': All items stay on one line (default)
 * - 'wrap': Items wrap to new lines when they don't fit
 */
export type FlexWrap = 'nowrap' | 'wrap';

export interface FlexNode extends LayoutNodeBase {
  type: 'flex';
  /** Gap between children in dots */
  gap?: number;
  /** How to distribute horizontal space */
  justify?: JustifyContent;
  /** Vertical alignment of items */
  alignItems?: VAlign;
  /** Whether to wrap items onto multiple lines */
  wrap?: FlexWrap;
  /** Gap between rows when wrapping */
  rowGap?: number;
  /** Child nodes */
  children: LayoutNode[];
}

/**
 * Grid node - table-like layout with columns and rows
 */
export interface GridNode extends LayoutNodeBase {
  type: 'grid';
  /** Column width specifications */
  columns: WidthSpec[];
  /** Gap between columns in dots */
  columnGap?: number;
  /** Gap between rows in dots */
  rowGap?: number;
  /** Row definitions containing cells */
  rows: GridRowNode[];
}

/**
 * A row in a grid, containing cells
 */
export interface GridRowNode extends StyleProps {
  /** Cells in this row (should match column count) */
  cells: LayoutNode[];
  /** Fixed row height in dots (auto if not specified) */
  height?: number | undefined;
  /** Whether this is a header row (affects styling) */
  isHeader?: boolean | undefined;
  /** Keep this row with the next row on the same page */
  keepWithNext?: boolean | undefined;
  /** Force a page break before this row */
  breakBefore?: boolean | undefined;
}

// ==================== LEAF NODES ====================

/**
 * Text node - leaf node containing printable text
 */
export interface TextNode extends LayoutNodeBase {
  type: 'text';
  /** Text content to print */
  content: string;
  /** Horizontal alignment within available width */
  align?: HAlign;
  /** Text orientation: 'horizontal' (default) or 'vertical' */
  orientation?: TextOrientation;
}

/**
 * Spacer node - empty space for layout purposes
 * Useful in flex layouts for pushing items apart
 */
export interface SpacerNode {
  type: 'spacer';
  /** Fixed width in dots (fills available space if not specified) */
  width?: number | undefined;
  /** Fixed height in dots */
  height?: number | undefined;
  /** If true, this spacer will grow to fill available space in flex */
  flex?: boolean | undefined;
}

/**
 * Line node - horizontal or vertical line
 */
export interface LineNode extends LayoutNodeBase {
  type: 'line';
  /** Line direction */
  direction: 'horizontal' | 'vertical';
  /** Line length in dots (auto = fill available space) */
  length?: number | 'fill' | undefined;
  /** Line character to use (default: '-' for horizontal, '|' for vertical) */
  char?: string | undefined;
}

// ==================== UNION TYPE ====================

/**
 * Union of all possible layout node types
 */
export type LayoutNode =
  | StackNode
  | FlexNode
  | GridNode
  | TextNode
  | SpacerNode
  | LineNode;

/**
 * Type guard to check if a node is a container (has children)
 */
export function isContainerNode(node: LayoutNode): node is StackNode | FlexNode | GridNode {
  return node.type === 'stack' || node.type === 'flex' || node.type === 'grid';
}

/**
 * Type guard to check if a node is a stack node
 */
export function isStackNode(node: LayoutNode): node is StackNode {
  return node.type === 'stack';
}

/**
 * Type guard to check if a node is a flex node
 */
export function isFlexNode(node: LayoutNode): node is FlexNode {
  return node.type === 'flex';
}

/**
 * Type guard to check if a node is a grid node
 */
export function isGridNode(node: LayoutNode): node is GridNode {
  return node.type === 'grid';
}

/**
 * Type guard to check if a node is a text node
 */
export function isTextNode(node: LayoutNode): node is TextNode {
  return node.type === 'text';
}

/**
 * Type guard to check if a node is a spacer node
 */
export function isSpacerNode(node: LayoutNode): node is SpacerNode {
  return node.type === 'spacer';
}

/**
 * Type guard to check if a node is a line node
 */
export function isLineNode(node: LayoutNode): node is LineNode {
  return node.type === 'line';
}

/**
 * Helper for exhaustive switch statements
 * Ensures all cases in a discriminated union are handled
 *
 * @example
 * ```typescript
 * switch (node.type) {
 *   case 'text': return handleText(node);
 *   case 'stack': return handleStack(node);
 *   // ... other cases
 *   default: assertNever(node);
 * }
 * ```
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Resolve padding specification to all four sides
 */
export function resolvePadding(padding?: PaddingSpec): ResolvedPadding {
  if (padding === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  };
}

/**
 * Resolve margin specification to all four sides
 * Auto margins are resolved to 0 with autoHorizontal flag set
 */
export function resolveMargin(margin?: MarginSpec): ResolvedMargin {
  if (margin === undefined) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  if (margin === 'auto') {
    // 'auto' on top-level means horizontal centering (left and right auto)
    return { top: 0, right: 0, bottom: 0, left: 0, autoHorizontal: true };
  }
  if (typeof margin === 'number') {
    return { top: margin, right: margin, bottom: margin, left: margin };
  }
  // Check for auto horizontal centering
  const leftAuto = margin.left === 'auto';
  const rightAuto = margin.right === 'auto';
  const autoHorizontal = leftAuto && rightAuto;

  return {
    top: margin.top ?? 0,
    right: typeof margin.right === 'number' ? margin.right : 0,
    bottom: margin.bottom ?? 0,
    left: typeof margin.left === 'number' ? margin.left : 0,
    autoHorizontal: autoHorizontal || undefined,
  };
}

/**
 * Resolve style by inheriting from parent and overriding with node's own styles
 */
export function resolveStyle(node: StyleProps, parentStyle: ResolvedStyle): ResolvedStyle {
  return {
    bold: node.bold ?? parentStyle.bold,
    italic: node.italic ?? parentStyle.italic,
    underline: node.underline ?? parentStyle.underline,
    doubleStrike: node.doubleStrike ?? parentStyle.doubleStrike,
    doubleWidth: node.doubleWidth ?? parentStyle.doubleWidth,
    doubleHeight: node.doubleHeight ?? parentStyle.doubleHeight,
    condensed: node.condensed ?? parentStyle.condensed,
    cpi: node.cpi ?? parentStyle.cpi,
  };
}
