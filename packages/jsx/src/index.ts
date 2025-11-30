/**
 * @escp/jsx - JSX components and layout engine for ESC/P printers
 *
 * @example
 * ```tsx
 * import { LayoutEngine, Stack, Text, Heading } from '@escp/jsx';
 *
 * const doc = (
 *   <Stack>
 *     <Heading level={1}>Invoice</Heading>
 *     <Text>Hello, World!</Text>
 *   </Stack>
 * );
 *
 * const engine = new LayoutEngine();
 * const output = engine.render(doc);
 * ```
 *
 * @packageDocumentation
 */

// Re-export commonly used core types for convenience
export type {
  PrinterState,
  PaperConfig,
  FontConfig,
  PrintQuality,
  Typeface,
  TypefaceValue,
  PrintQualityValue,
  CharacterTable,
  InternationalCharset,
  BitImageMode,
} from '@escp/core';

// Re-export commonly used core constants for convenience
export {
  PRINT_QUALITY,
  TYPEFACE,
  TYPEFACE_ALIASES,
  INTERNATIONAL_CHARSET,
  CHAR_TABLE,
  CPI,
  BIT_IMAGE_MODE,
  GRAPHICS_MODES,
  createTestPattern,
  createCheckerboard,
  type GrayscaleImage,
  type DitheringMethod,
} from '@escp/core';

// Layout engine and types
export { LayoutEngine, LQ_2090II_PROFILE, DEFAULT_ENGINE_OPTIONS } from './layout/LayoutEngine';

// Layout nodes and types
export type {
  LayoutNode,
  StackNode,
  FlexNode,
  TextNode,
  SpacerNode,
  LineNode,
  WidthSpec,
  HeightSpec,
  PaddingSpec,
  MarginSpec,
  PercentageString,
  HAlign,
  VAlign,
  JustifyContent,
  StyleProps,
  ResolvedStyle,
  ResolvedPadding,
  ResolvedMargin,
  SpaceContext,
  SpaceQuery,
  ContentCondition,
  PositionMode,
  TextOrientation,
  TextOverflow,
  DataContext,
  DataCondition,
  ContentResolver,
  TemplateNode,
  ConditionalNode,
  SwitchNode,
  EachNode,
} from './layout/nodes';

export {
  DEFAULT_STYLE,
  resolvePadding,
  resolveMargin,
  resolveStyle,
  isPercentage,
  parsePercentage,
  resolvePercentage,
  isContainerNode,
  isStackNode,
  isFlexNode,
  isTextNode,
  isSpacerNode,
  isLineNode,
  assertNever,
  isTemplateNode,
  isConditionalNode,
  isSwitchNode,
  isEachNode,
  isResolvableNode,
} from './layout/nodes';

// Layout builders
export {
  StackBuilder,
  FlexBuilder,
  GridBuilder,
  stack,
  flex,
  grid,
  text,
  spacer,
  line,
  TemplateBuilder,
  ConditionalBuilder,
  SwitchBuilder,
  EachBuilder,
  template,
  conditional,
  switchOn,
  each,
  type TextOptions,
} from './layout/builders';

// Layout result types (from Yoga adapter)
export type { LayoutResult, LayoutContext } from './layout/yoga';

// Renderer
export {
  flattenTree,
  sortRenderItems,
  renderLayout,
  type RenderItem,
  type RenderItemData,
  type RenderResult,
  type RenderOptions,
} from './layout/renderer';

// Yoga Adapter
export {
  YogaAdapter,
  createYogaAdapter,
  calculateYogaLayout,
  initDefaultAdapter,
  getDefaultAdapter,
  resetDefaultAdapter,
  type YogaAdapterOptions,
  type YogaLayoutOptions,
  type YogaLayoutContext,
  type NodeMapping,
} from './layout/yoga';

// Template Interpolation
export {
  interpolate,
  parseTemplate,
  resolvePath,
  defaultFilters,
  createFilterRegistry,
  type VariableExpression,
  type FilterCall,
  type FilterFunction,
  type FilterRegistry,
  type InterpolateOptions,
} from './layout/interpolation';

// Conditional Evaluation
export {
  evaluateCondition,
  evaluateDataCondition,
  matchesCaseValue,
  eq,
  neq,
  gt,
  gte,
  lt,
  lte,
  isIn,
  notIn,
  exists,
  notExists,
  empty,
  notEmpty,
} from './layout/conditionals';

// Node Resolution
export {
  resolveNode,
  createDataContext,
  createDefaultSpaceContext,
  type ResolverOptions,
} from './layout/resolver';

// JSX Runtime
export { createElement, Fragment, jsx, jsxs, jsxDEV } from './jsx';

// All JSX components
export * from './jsx/components';

// JSX types
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
} from './jsx/types';

// Table border utilities (depends on JSX components)
export {
  resolveBorderConfig,
  createTopBorderRow,
  createBottomBorderRow,
  createRowSeparator,
  createBorderedCell,
  wrapCellsWithVerticalBorders,
  getDefaultGridChars,
  type TableBorderStyle,
  type TableStructure,
  type TableBorderConfig,
} from './borders/TableBorderRenderer';

// Default export
export { LayoutEngine as default } from './layout/LayoutEngine';
