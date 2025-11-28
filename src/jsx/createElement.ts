/**
 * JSX Element Factory for escp-ts Layout System
 *
 * This module provides the createElement function that TypeScript's JSX
 * transform compiles JSX syntax into. It maps JSX elements to LayoutNode
 * objects that can be rendered by the layout engine.
 */

import type {
  LayoutNode,
  StackNode,
  FlexNode,
  TextNode,
  SpacerNode,
  LineNode,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
  HAlign,
  VAlign,
  TextOverflow,
} from '../layout/nodes';
import type { NodeStyle, FunctionComponent } from './types';

// ==================== FRAGMENT ====================

/**
 * Fragment symbol for grouping elements without a wrapper
 */
export const Fragment = Symbol.for('escp.fragment');

// ==================== MAIN CREATE ELEMENT ====================

/**
 * Main JSX factory function
 *
 * TypeScript compiles JSX like:
 *   <Stack style={{ gap: 10 }}><Text>Hello</Text></Stack>
 * Into:
 *   createElement('Stack', { style: { gap: 10 } }, createElement('Text', null, 'Hello'))
 */
export function createElement(
  type: string | FunctionComponent<Record<string, unknown>> | typeof Fragment,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): LayoutNode | LayoutNode[] {
  const resolvedProps = props ?? {};

  // Handle children: prefer props.children if provided, otherwise use rest args
  const rawChildren =
    resolvedProps.children !== undefined ? [resolvedProps.children] : children;
  const resolvedChildren = flattenChildren(rawChildren);

  // Fragment returns array of children
  if (type === Fragment) {
    return resolvedChildren;
  }

  // Function components
  if (typeof type === 'function') {
    const result = type({ ...resolvedProps, children: resolvedChildren });
    return result ?? createEmptySpacer();
  }

  // Intrinsic elements
  return createIntrinsicElement(type, resolvedProps, resolvedChildren);
}

// ==================== JSX RUNTIME EXPORTS ====================

/**
 * jsx function for automatic runtime (single child)
 */
export const jsx = createElement;

/**
 * jsxs function for automatic runtime (multiple children)
 */
export const jsxs = createElement;

/**
 * jsxDEV function for development runtime
 */
export const jsxDEV = createElement;

// ==================== INTRINSIC ELEMENT FACTORY ====================

function createIntrinsicElement(
  type: string,
  props: Record<string, unknown>,
  children: LayoutNode[]
): LayoutNode {
  const style = (props.style ?? {}) as NodeStyle;

  switch (type) {
    case 'Layout':
      return createLayoutNode(style, children);
    case 'Stack':
      return createStackNode(style, props, children);
    case 'Flex':
      return createFlexNode(style, children);
    case 'Text':
      return createTextNode(style, props, children);
    case 'Spacer':
      return createSpacerNode(style, props);
    case 'Line':
      return createLineNode(style, props);
    case 'Template':
      return createTemplateNode(style, props);
    case 'If':
      return createConditionalNode(props, children);
    case 'Switch':
      return createSwitchNode(props, children);
    case 'Case':
      return createCaseMarker(props, children);
    case 'For':
      return createEachNode(style, props, children);
    default:
      throw new Error(`Unknown JSX element type: ${type}`);
  }
}

// ==================== CHILDREN HELPERS ====================

/**
 * Flatten and normalize children array
 * - Flattens nested arrays
 * - Filters out null, undefined, false, true
 * - Converts strings/numbers to TextNode
 */
function flattenChildren(children: unknown[]): LayoutNode[] {
  const result: LayoutNode[] = [];

  for (const child of children.flat(Infinity)) {
    if (child == null || child === false || child === true) {
      continue;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      result.push({ type: 'text', content: String(child) });
    } else {
      result.push(child as LayoutNode);
    }
  }

  return result;
}

/**
 * Create an empty spacer node (used as fallback)
 */
function createEmptySpacer(): SpacerNode {
  return { type: 'spacer', width: 0, height: 0 };
}

// ==================== NODE FACTORY FUNCTIONS ====================

function createLayoutNode(
  style: NodeStyle,
  children: LayoutNode[]
): StackNode {
  const node: StackNode = {
    type: 'stack',
    direction: 'column',
    children,
  };
  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

function createStackNode(
  style: NodeStyle,
  props: Record<string, unknown>,
  children: LayoutNode[]
): StackNode {
  const direction = (props.direction as 'column' | 'row') ?? style.flexDirection ?? 'column';
  const node: StackNode = {
    type: 'stack',
    direction,
    children,
  };

  if (style.gap !== undefined) node.gap = style.gap;

  const align = props.align as HAlign | undefined;
  if (align !== undefined) node.align = align;

  const vAlign = props.vAlign as VAlign | undefined;
  if (vAlign !== undefined) node.vAlign = vAlign;

  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

function createFlexNode(
  style: NodeStyle,
  children: LayoutNode[]
): FlexNode {
  const node: FlexNode = {
    type: 'flex',
    children,
  };

  if (style.justifyContent !== undefined) node.justify = style.justifyContent;
  if (style.alignItems !== undefined) node.alignItems = style.alignItems;
  if (style.gap !== undefined) node.gap = style.gap;

  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

function createTextNode(
  style: NodeStyle,
  props: Record<string, unknown>,
  children: LayoutNode[]
): TextNode {
  const content = extractTextContent(props.children ?? children);
  const node: TextNode = {
    type: 'text',
    content,
  };

  const align = props.align as HAlign | undefined;
  if (align !== undefined) node.align = align;

  const overflow = props.overflow as TextOverflow | undefined;
  if (overflow !== undefined) node.overflow = overflow;

  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

function createSpacerNode(
  style: NodeStyle,
  props: Record<string, unknown>
): SpacerNode {
  const width = style.width as number | undefined;
  const height = style.height as number | undefined;
  return {
    type: 'spacer',
    width,
    height,
    flex: (props.flex as boolean) ?? (width === undefined && height === undefined),
  };
}

function createLineNode(
  style: NodeStyle,
  props: Record<string, unknown>
): LineNode {
  const node: LineNode = {
    type: 'line',
    direction: (props.direction as 'horizontal' | 'vertical') ?? 'horizontal',
  };

  const char = props.char as string | undefined;
  if (char !== undefined) node.char = char;

  const length = props.length as number | 'fill' | undefined;
  if (length !== undefined) node.length = length;

  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

function createTemplateNode(
  style: NodeStyle,
  props: Record<string, unknown>
): TemplateNode {
  const node: TemplateNode = {
    type: 'template',
    template: props.template as string,
  };

  const align = props.align as HAlign | undefined;
  if (align !== undefined) node.align = align;

  const data = props.data as Record<string, unknown> | undefined;
  if (data !== undefined) node.data = data;

  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

function createConditionalNode(
  props: Record<string, unknown>,
  children: LayoutNode[]
): ConditionalNode {
  const node: ConditionalNode = {
    type: 'conditional',
    condition: props.condition as ConditionalNode['condition'],
    then: children[0] ?? createEmptySpacer(),
  };
  if (props.else !== undefined) {
    node.else = props.else as LayoutNode;
  }
  return node;
}

/**
 * Case marker interface for Switch processing
 */
interface CaseMarker extends SpacerNode {
  __case: true;
  __value: unknown;
  __then: LayoutNode;
}

function createCaseMarker(
  props: Record<string, unknown>,
  children: LayoutNode[]
): CaseMarker {
  return {
    type: 'spacer',
    width: 0,
    height: 0,
    __case: true,
    __value: props.value,
    __then: children[0] ?? createEmptySpacer(),
  } as CaseMarker;
}

function createSwitchNode(
  props: Record<string, unknown>,
  children: LayoutNode[]
): SwitchNode {
  // Extract Case children
  const cases = children
    .filter((c): c is CaseMarker => (c as CaseMarker).__case === true)
    .map((c) => ({
      value: c.__value,
      then: c.__then,
    }));

  const node: SwitchNode = {
    type: 'switch',
    path: props.path as string,
    cases,
  };
  if (props.default !== undefined) {
    node.default = props.default as LayoutNode;
  }
  return node;
}

function createEachNode(
  style: NodeStyle,
  props: Record<string, unknown>,
  children: LayoutNode[]
): EachNode {
  const node: EachNode = {
    type: 'each',
    items: props.items as string,
    render: children[0] ?? createEmptySpacer(),
  };

  const as = props.as as string | undefined;
  if (as !== undefined) node.as = as;

  const indexAs = props.indexAs as string | undefined;
  if (indexAs !== undefined) node.indexAs = indexAs;

  if (props.empty !== undefined) {
    node.empty = props.empty as LayoutNode;
  }
  if (props.separator !== undefined) {
    node.separator = props.separator as LayoutNode;
  }
  applyLayoutProps(node, style);
  applyStyleProps(node, style);
  return node;
}

// ==================== STYLE APPLICATION HELPERS ====================

// Use a generic type to handle node assignment
type AnyNode = StackNode | FlexNode | TextNode | LineNode | TemplateNode | EachNode;

/**
 * Apply layout properties from style to a node (mutates node)
 */
function applyLayoutProps(node: AnyNode, style: NodeStyle): void {
  // Dimensions
  if (style.width !== undefined) (node as StackNode).width = style.width;
  if (style.height !== undefined) (node as StackNode).height = style.height;
  if (style.minWidth !== undefined) (node as StackNode).minWidth = style.minWidth;
  if (style.maxWidth !== undefined) (node as StackNode).maxWidth = style.maxWidth;
  if (style.minHeight !== undefined) (node as StackNode).minHeight = style.minHeight;
  if (style.maxHeight !== undefined) (node as StackNode).maxHeight = style.maxHeight;

  // Spacing
  if (style.padding !== undefined) (node as StackNode).padding = style.padding;
  if (style.margin !== undefined) (node as StackNode).margin = style.margin;

  // Positioning
  if (style.position !== undefined) {
    (node as StackNode).position = style.position;
    if (style.position === 'absolute') {
      if (style.left !== undefined) (node as StackNode).posX = style.left;
      if (style.top !== undefined) (node as StackNode).posY = style.top;
    } else if (style.position === 'relative') {
      if (style.offsetX !== undefined) (node as StackNode).offsetX = style.offsetX;
      if (style.offsetY !== undefined) (node as StackNode).offsetY = style.offsetY;
    }
  }
}

/**
 * Apply text style properties from style to a node (mutates node)
 */
function applyStyleProps(node: AnyNode, style: NodeStyle): void {
  if (style.bold !== undefined) (node as StackNode).bold = style.bold;
  if (style.italic !== undefined) (node as StackNode).italic = style.italic;
  if (style.underline !== undefined) (node as StackNode).underline = style.underline;
  if (style.doubleStrike !== undefined) (node as StackNode).doubleStrike = style.doubleStrike;
  if (style.doubleWidth !== undefined) (node as StackNode).doubleWidth = style.doubleWidth;
  if (style.doubleHeight !== undefined) (node as StackNode).doubleHeight = style.doubleHeight;
  if (style.condensed !== undefined) (node as StackNode).condensed = style.condensed;
  if (style.cpi !== undefined) (node as StackNode).cpi = style.cpi;
}

/**
 * Extract text content from children
 */
function extractTextContent(children: unknown): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children
      .map((c) => {
        if (typeof c === 'string' || typeof c === 'number') return String(c);
        if ((c as TextNode)?.type === 'text') return (c as TextNode).content;
        return '';
      })
      .join('');
  }
  return '';
}
