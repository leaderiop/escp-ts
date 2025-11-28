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
  top?: number;
  left?: number;
  offsetX?: number;
  offsetY?: number;

  // Text styles (inherited)
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  doubleStrike?: boolean;
  doubleWidth?: boolean;
  doubleHeight?: boolean;
  condensed?: boolean;
  cpi?: number;
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

// ==================== FUNCTION COMPONENT ====================

/**
 * Function component signature
 * Takes props and returns a LayoutNode
 */
export type FunctionComponent<P = Record<string, unknown>> = (
  props: P & { children?: JSXChildren }
) => LayoutNode | null;

// ==================== JSX NAMESPACE ====================

declare global {
  namespace JSX {
    type Element = LayoutNode;

    interface IntrinsicElements {
      Layout: LayoutProps;
      Stack: StackProps;
      Flex: FlexProps;
      Text: TextProps;
      Spacer: SpacerProps;
      Line: LineProps;
      Template: TemplateProps;
      If: IfProps;
      Switch: SwitchProps;
      Case: CaseProps;
      For: ForProps;
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export {};
