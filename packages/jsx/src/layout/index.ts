/**
 * Layout Module for @escp/jsx
 *
 * Provides the layout engine, builders, nodes, and Yoga integration
 */

// Layout engine
export { LayoutEngine, LQ_2090II_PROFILE, DEFAULT_ENGINE_OPTIONS } from './LayoutEngine';

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
} from './nodes';

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
} from './nodes';

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
} from './builders';

// Layout result types (from Yoga adapter)
export type { LayoutResult, LayoutContext } from './yoga';

// Renderer
export {
  flattenTree,
  sortRenderItems,
  renderLayout,
  type RenderItem,
  type RenderItemData,
  type RenderResult,
  type RenderOptions,
} from './renderer';

// Yoga Adapter (Flexbox layout engine)
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
} from './yoga';

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
} from './interpolation';

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
} from './conditionals';

// Node Resolution
export {
  resolveNode,
  createDataContext,
  createDefaultSpaceContext,
  type ResolverOptions,
} from './resolver';
