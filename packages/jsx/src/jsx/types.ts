/**
 * JSX Type Definitions for escp-ts Layout System
 *
 * Provides TypeScript types for the JSX API including:
 * - NodeStyle interface for styling
 * - Component props interfaces
 * - JSX namespace declaration
 */

import type {
  LayoutNode,
  WidthSpec,
  HeightSpec,
  PaddingSpec,
  MarginSpec,
  HAlign,
  VAlign,
  JustifyContent,
  PositionMode,
  TextOverflow,
  DataCondition,
  DataContext,
} from '../layout/nodes';

import type { TypefaceValue, PrintQualityValue } from '@escp/core';

// ==================== STYLE INTERFACE ====================

/**
 * Style properties for JSX components
 * All visual/layout properties go in the style prop
 */
export interface NodeStyle {
  // Dimensions
  width?: WidthSpec;
  height?: HeightSpec;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Spacing
  padding?: PaddingSpec;
  margin?: MarginSpec;
  gap?: number;

  // Flex properties
  flexDirection?: 'column' | 'row';
  justifyContent?: JustifyContent;
  alignItems?: VAlign;
  flexBasis?: number;
  flexGrow?: number;
  flexShrink?: number;

  // Positioning
  position?: PositionMode;
  posX?: number;
  posY?: number;
  top?: number;
  left?: number;
  offsetX?: number;
  offsetY?: number;

  // Text styles (inherited)
  bold?: boolean | undefined;
  italic?: boolean | undefined;
  underline?: boolean | undefined;
  doubleStrike?: boolean | undefined;
  doubleWidth?: boolean | undefined;
  doubleHeight?: boolean | undefined;
  condensed?: boolean | undefined;
  cpi?: number | undefined;
  /** Typeface/font selection - number or string like 'roman', 'courier', 'sans-serif' */
  typeface?: TypefaceValue | undefined;
  /** Print quality: 'draft' or 'lq' (letter quality) */
  printQuality?: PrintQualityValue | undefined;
}

// ==================== BASE PROPS ====================

/**
 * Base props interface for components that support the box model
 * (margin → border → padding → content)
 *
 * Components extending this interface gain consistent layout capabilities
 */
export interface BaseProps {
  /** Margin outside the component */
  margin?: MarginSpec;
  /** Border around the component */
  border?: boolean | 'single' | 'double' | 'ascii' | false;
  /** Padding inside the border */
  padding?: PaddingSpec;
  /** Additional style properties */
  style?: NodeStyle;
  /** Child content */
  children?: JSXChildren;
}

// ==================== COMPONENT PROPS ====================

/**
 * Children types for JSX components
 */
export type JSXChild = LayoutNode | string | number | boolean | null | undefined;
export type JSXChildren = JSXChild | JSXChild[];

/**
 * Stack component props
 * Arranges children vertically (column) or horizontally (row)
 */
export interface StackProps {
  style?: NodeStyle;
  direction?: 'column' | 'row';
  align?: HAlign;
  vAlign?: VAlign;
  children?: JSXChildren;
}

/**
 * Flex component props
 * Horizontal flexbox container
 */
export interface FlexProps {
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * Text component props
 * Renders text content
 */
export interface TextProps {
  style?: NodeStyle;
  align?: HAlign;
  overflow?: TextOverflow;
  children?: string | number;
}

/**
 * Spacer component props
 * Empty space for layout purposes
 */
export interface SpacerProps {
  style?: Pick<NodeStyle, 'width' | 'height'>;
  flex?: boolean;
}

/**
 * Line component props
 * Horizontal or vertical separator line
 */
export interface LineProps {
  style?: NodeStyle;
  direction?: 'horizontal' | 'vertical';
  char?: string;
  length?: number | 'fill';
}

/**
 * Template component props
 * Text with {{variable}} interpolation
 */
export interface TemplateProps {
  style?: NodeStyle;
  template: string;
  align?: HAlign;
  data?: Record<string, unknown>;
}

/**
 * If component props
 * Conditional rendering based on data condition
 */
export interface IfProps {
  condition: DataCondition | ((ctx: DataContext) => boolean);
  else?: LayoutNode;
  children?: JSXChildren;
}

/**
 * Switch component props
 * Multi-branch selection based on data value
 */
export interface SwitchProps {
  path: string;
  default?: LayoutNode;
  children?: JSXChildren;
}

/**
 * Case component props
 * Individual case branch for Switch
 */
export interface CaseProps {
  value: unknown | unknown[];
  children?: JSXChildren;
}

/**
 * For component props
 * Iteration over array data
 */
export interface ForProps {
  style?: NodeStyle;
  items: string;
  as?: string;
  indexAs?: string;
  empty?: LayoutNode;
  separator?: LayoutNode;
  children?: JSXChildren;
}

/**
 * Layout component props
 * Root container component
 */
export interface LayoutProps {
  style?: NodeStyle;
  children?: JSXChildren;
}

// ==================== DATA DISPLAY COMPONENT PROPS ====================

/**
 * Table column definition
 */
export interface TableColumn {
  header: string;
  key: string;
  width?: WidthSpec;
  align?: HAlign;
}

/**
 * Table component props
 * Displays tabular data with column definitions or custom children
 */
export interface TableProps {
  columns?: TableColumn[];
  data?: unknown[];
  items?: string;
  showHeader?: boolean;
  headerStyle?: NodeStyle;
  rowStyle?: NodeStyle;
  separator?: string;
  style?: NodeStyle;
  children?: JSXChildren;
  /**
   * Enable full grid borders around table cells
   * - true: Auto-detect (CP437 'single' if supported, 'ascii' fallback)
   * - 'single': Single-line CP437 box drawing (┌─┬─┐, │, ├─┼─┤, └─┴─┘)
   * - 'double': Double-line CP437 box drawing (╔═╦═╗, ║, ╠═╬═╣, ╚═╩═╝)
   * - 'ascii': ASCII characters (+, -, |)
   */
  border?: boolean | 'single' | 'double' | 'ascii';
}

/**
 * TableRow component props
 * Row container for Table children mode
 */
export interface TableRowProps {
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * TableCell component props
 * Cell container for Table children mode
 */
export interface TableCellProps {
  width?: WidthSpec;
  align?: HAlign;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * List component props
 * Ordered or unordered list
 */
export interface ListProps {
  items?: string;
  as?: string;
  variant?: 'bullet' | 'numbered' | 'none';
  bullet?: string;
  indent?: number;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * ListItem component props
 * Individual list item
 */
export interface ListItemProps {
  bullet?: string;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * Badge component props
 * Inline status indicator
 */
export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: NodeStyle;
  children?: string | number;
}

/**
 * Card component props
 * Root container with composition API (shadcn/ui style)
 */
export interface CardProps {
  /**
   * Border style for the card
   * - true: Auto-detect (CP437 'single' if supported, 'ascii' fallback)
   * - 'single': Single-line CP437 box drawing
   * - 'double': Double-line CP437 box drawing
   * - 'ascii': ASCII characters (+, -, |)
   * - false: No border
   * @default 'single'
   */
  border?: boolean | 'single' | 'double' | 'ascii';
  /**
   * Padding inside the card border
   * @default { top: 5, right: 10, bottom: 5, left: 10 }
   */
  padding?: PaddingSpec;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * CardHeader component props
 * Top section containing title and description
 */
export interface CardHeaderProps extends BaseProps {
  /** Horizontal alignment of header content */
  align?: HAlign;
  /** Gap between title and description @default 3 */
  gap?: number;
}

/**
 * CardTitle component props
 * Main heading of the card (renders bold)
 */
export interface CardTitleProps {
  /** Heading level for styling (1-2 use doubleWidth) @default 3 */
  level?: 1 | 2 | 3 | 4;
  align?: HAlign;
  style?: NodeStyle;
  children?: string | number;
}

/**
 * CardDescription component props
 * Secondary text below title (renders italic)
 */
export interface CardDescriptionProps {
  align?: HAlign;
  style?: NodeStyle;
  children?: string | number;
}

/**
 * CardContent component props
 * Main body content area
 */
export interface CardContentProps extends BaseProps {
  /** Gap between content children @default 5 */
  gap?: number;
}

/**
 * CardFooter component props
 * Bottom section for actions or summary
 */
export interface CardFooterProps extends BaseProps {
  /** Layout direction @default 'row' */
  direction?: 'row' | 'column';
  /** How to distribute space @default 'end' */
  justify?: JustifyContent;
  /** Vertical alignment @default 'center' */
  align?: VAlign;
  /** Gap between items @default 10 */
  gap?: number;
}

// ==================== TYPOGRAPHY COMPONENT PROPS ====================

/**
 * Heading component props
 * H1-H4 style heading with level-based styling
 */
export interface HeadingProps {
  level?: 1 | 2 | 3 | 4;
  align?: HAlign;
  underline?: boolean | string;
  /** Typeface for heading (direct prop, takes precedence over style.typeface) */
  typeface?: TypefaceValue;
  style?: NodeStyle;
  children?: string | number;
}

/**
 * Paragraph component props
 * Text block with automatic margins
 */
export interface ParagraphProps {
  align?: HAlign;
  indent?: number;
  /** Typeface for paragraph text */
  typeface?: TypefaceValue;
  style?: NodeStyle;
  children?: string | number;
}

/**
 * Label component props
 * Key-value pair display
 */
export interface LabelProps {
  label: string;
  value?: string | number;
  labelWidth?: number;
  colon?: boolean;
  /** Typeface for label text */
  typeface?: TypefaceValue;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * Caption component props
 * Small italic text
 */
export interface CaptionProps {
  align?: HAlign;
  /** Typeface for caption text */
  typeface?: TypefaceValue;
  style?: NodeStyle;
  children?: string | number;
}

/**
 * Code component props
 * Code block with optional border
 */
export interface CodeProps {
  inline?: boolean;
  border?: boolean;
  /** Typeface for code (defaults to 'courier' for code blocks) */
  typeface?: TypefaceValue;
  style?: NodeStyle;
  children?: string | number;
}

// ==================== DECORATIVE COMPONENT PROPS ====================

/**
 * Divider component props
 * Enhanced separator with variants
 */
export interface DividerProps {
  variant?: 'single' | 'double' | 'thick' | 'dashed';
  spacing?: number;
  style?: NodeStyle;
}

/**
 * Border character set
 */
export interface BorderChars {
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
  horizontal?: string;
  vertical?: string;
}

/**
 * Border component props
 * ASCII and CP437 box drawing around content
 */
export interface BorderProps {
  /** Border variant: ASCII ('single', 'double', 'rounded') or CP437 ('cp437-single', 'cp437-double') */
  variant?: 'single' | 'double' | 'rounded' | 'cp437-single' | 'cp437-double';
  chars?: BorderChars;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * BoxedText component props
 * Renders text with a border using CP437 box-drawing or ASCII characters
 */
export interface BoxedTextProps {
  /** Text content to display in the box */
  children?: string | number;
  /** Horizontal padding inside the box (in characters, default: 1) */
  padding?: number;
  /** Border style: 'single', 'double', or 'ascii' */
  borderStyle?: 'single' | 'double' | 'ascii';
  /** Use CP437 line-drawing characters (default: true) */
  useLineDrawing?: boolean;
  /** Additional style overrides */
  style?: NodeStyle;
}

/**
 * Box component props
 * Container with padding and optional border
 */
export interface BoxProps {
  padding?: PaddingSpec;
  border?: boolean;
  borderVariant?: 'single' | 'double' | 'rounded';
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * Panel component props
 * Titled panel with header area
 */
export interface PanelProps {
  title?: string;
  headerActions?: JSXChildren;
  style?: NodeStyle;
  children?: JSXChildren;
}

/**
 * Section component props
 * Semantic section with optional heading
 */
export interface SectionProps {
  title?: string;
  level?: 1 | 2 | 3 | 4;
  style?: NodeStyle;
  children?: JSXChildren;
}

// ==================== FUNCTION COMPONENT ====================

/**
 * Function component signature
 * Takes props and returns a LayoutNode
 */
export type FunctionComponent<P = Record<string, unknown>> = (
  props: P & { children?: JSXChildren }
) => LayoutNode | null;

// JSX namespace declarations are in jsx.d.ts (declaration files are the correct place for ambient type declarations)
