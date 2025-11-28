/**
 * JSX API for escp-ts Layout System
 *
 * This module exports the JSX runtime and types for building
 * layouts with declarative JSX syntax.
 *
 * @example
 * ```tsx
 * import { Stack, Flex, Text, Spacer, Line } from 'escp-ts/jsx';
 *
 * const layout = (
 *   <Stack style={{ padding: 10, gap: 5 }}>
 *     <Text style={{ bold: true }}>Hello World</Text>
 *     <Flex style={{ justifyContent: 'space-between' }}>
 *       <Text>Left</Text>
 *       <Text>Right</Text>
 *     </Flex>
 *   </Stack>
 * );
 * ```
 */

// Core JSX runtime
export { createElement, Fragment, jsx, jsxs, jsxDEV } from './createElement';

// Component functions for JSX usage
export {
  Stack,
  Flex,
  Text,
  Spacer,
  Line,
  Template,
  If,
  Switch,
  Case,
  For,
  Layout,
} from './components';

// Types
export type {
  NodeStyle,
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
  FunctionComponent,
  JSXChild,
  JSXChildren,
} from './types';

// Re-export to ensure JSX namespace is declared
export * from './types';
