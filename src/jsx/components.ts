/**
 * JSX Component Functions
 *
 * These are component functions that can be used with JSX syntax.
 * They wrap createElement to provide proper typing and element names.
 *
 * Usage:
 * ```tsx
 * import { Stack, Flex, Text, Spacer, Line, Template, If, Switch, Case, For, Layout } from 'escp-ts/jsx';
 *
 * const doc = (
 *   <Stack style={{ padding: 10 }}>
 *     <Text style={{ bold: true }}>Hello</Text>
 *   </Stack>
 * );
 * ```
 */

import { createElement } from './createElement';
import type {
  StackProps,
  FlexProps,
  TextProps,
  SpacerProps,
  LineProps,
  TemplateProps,
  IfProps,
  SwitchProps,
  CaseProps,
  ForProps,
  LayoutProps,
} from './types';
import type { LayoutNode } from '../layout/nodes';

// Helper type to cast props for createElement
type Props = Record<string, unknown>;

/**
 * Stack component - vertical or horizontal container
 */
export function Stack(props: StackProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('Stack', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * Flex component - horizontal flexbox container
 */
export function Flex(props: FlexProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('Flex', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * Text component - text content
 */
export function Text(props: TextProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('Text', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * Spacer component - empty space
 */
export function Spacer(props: SpacerProps = {}): LayoutNode {
  return createElement('Spacer', props as Props) as LayoutNode;
}

/**
 * Line component - horizontal or vertical separator
 */
export function Line(props: LineProps = {}): LayoutNode {
  return createElement('Line', props as Props) as LayoutNode;
}

/**
 * Template component - text with {{variable}} interpolation
 */
export function Template(props: TemplateProps): LayoutNode {
  return createElement('Template', props as unknown as Props) as LayoutNode;
}

/**
 * If component - conditional rendering
 */
export function If(props: IfProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('If', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * Switch component - multi-branch selection
 */
export function Switch(props: SwitchProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('Switch', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * Case component - individual case for Switch
 */
export function Case(props: CaseProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('Case', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * For component - array iteration
 */
export function For(props: ForProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('For', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}

/**
 * Layout component - root container
 */
export function Layout(props: LayoutProps): LayoutNode {
  const { children, ...rest } = props;
  return createElement('Layout', rest as Props, ...(Array.isArray(children) ? children : children ? [children] : [])) as LayoutNode;
}
