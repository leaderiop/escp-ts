/**
 * Virtual Tree Node Types for ESC/P2 Layout System
 *
 * These types define the structure of the virtual layout tree that gets
 * built using the fluent builder API, then measured, positioned, and
 * rendered to ESC/P2 printer commands.
 */

// ==================== WIDTH/HEIGHT SPECIFICATIONS ====================

/**
 * Width specification for layout nodes
 * - number: Fixed width in dots (1/360 inch)
 * - 'auto': Size to fit content
 * - 'fill': Take remaining available space
 */
export type WidthSpec = number | 'auto' | 'fill';

/**
 * Height specification for layout nodes
 * - number: Fixed height in dots (1/360 inch)
 * - 'auto': Size to fit content
 */
export type HeightSpec = number | 'auto';

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

// ==================== BASE NODE ====================

/**
 * Base properties shared by all layout nodes
 */
export interface LayoutNodeBase extends StyleProps {
  /** Optional identifier for debugging/tracking */
  id?: string;
  /** Width specification */
  width?: WidthSpec;
  /** Height specification */
  height?: HeightSpec;
  /** Padding inside the node */
  padding?: PaddingSpec;
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
export interface FlexNode extends LayoutNodeBase {
  type: 'flex';
  /** Gap between children in dots */
  gap?: number;
  /** How to distribute horizontal space */
  justify?: JustifyContent;
  /** Vertical alignment of items */
  alignItems?: VAlign;
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
