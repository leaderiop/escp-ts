/**
 * ESC/P2 Layout Engine for TypeScript
 *
 * A complete implementation of the ESC/P and ESC/P2 printer control language
 * optimized for the EPSON LQ-2090II 24-pin dot matrix printer.
 *
 * @example
 * ```typescript
 * import { LayoutEngine, CommandBuilder } from 'escp-ts';
 *
 * // Create a layout engine
 * const engine = new LayoutEngine();
 *
 * // Build a document
 * engine
 *   .initialize()
 *   .setQuality(1) // LQ mode
 *   .setBold(true)
 *   .println('Hello, World!')
 *   .setBold(false)
 *   .println('This is a test document.')
 *   .formFeed();
 *
 * // Get raw printer commands
 * const output = engine.getOutput();
 *
 * // Or use CommandBuilder directly
 * const cmd = CommandBuilder.initialize();
 * ```
 *
 * @packageDocumentation
 */

// Core types and constants
export * from './core/types';
export * from './core/constants';

// Error classes
export {
  EscpError,
  ValidationError,
  EscpRangeError,
  GraphicsError,
  EncodingError,
  ConfigurationError,
} from './core/errors';

// Validation utilities
export {
  assertByte,
  assertRange,
  assertUint16,
  assertValidHex,
  assertPositiveDimensions,
  assertNonNegative,
  assertOneOf,
} from './core/validation';

// Byte manipulation utilities
export {
  bytes,
  concat,
  toLowHigh,
  to32BitLE,
} from './core/utils';

// Printer state management
export {
  PrinterStateManager,
  createInitialState,
  calculateCharWidth,
  calculateLineHeight,
  calculateHMI,
  getPrintableWidth,
  getPrintableHeight,
  getPageWidth,
  getPageHeight,
  getMaxX,
  getMaxY,
  isInPrintableArea,
  inchesToDots,
  dotsToInches,
  mmToDots,
  dotsToMm,
  columnsToDots,
  linesToDots,
  DEFAULT_FONT_STYLE,
  DEFAULT_FONT_CONFIG,
  DEFAULT_MARGINS,
  DEFAULT_PAPER_CONFIG,
} from './core/PrinterState';

// Command builder
export { CommandBuilder } from './commands/CommandBuilder';

// Character set and font handling
export {
  PROPORTIONAL_WIDTHS,
  INTERNATIONAL_CHAR_MAPS,
  getProportionalWidth,
  getCharacterWidth,
  mapInternationalChar,
  encodeText,
  calculateTextWidth,
  wordWrap,
  getTypefaceName,
  isScalableTypeface,
} from './fonts/CharacterSet';

// Graphics conversion
export {
  GRAPHICS_MODES,
  DEFAULT_CONVERSION_OPTIONS,
  applyDithering,
  scaleImageNearest,
  scaleImageBilinear,
  convertToColumnFormat24Pin,
  convertToColumnFormat8Pin,
  convertToBitImage,
  splitIntoStripes,
  createTestPattern,
  createCheckerboard,
  type GrayscaleImage,
  type DitheringMethod,
  type ConversionOptions,
} from './graphics/BitmapConverter';

// Layout engine
export {
  LayoutEngine,
  LQ_2090II_PROFILE,
  DEFAULT_ENGINE_OPTIONS,
} from './layout/LayoutEngine';

// Layout system - Virtual DOM nodes and types
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
  // Advanced layout types
  SpaceContext,
  SpaceQuery,
  ContentCondition,
  PositionMode,
  TextOrientation,
  TextOverflow,
  // NOTE: FlexWrap was removed - incompatible with printer pagination
  // NOTE: Grid was removed - not natively supported by Yoga
  // Template/Component system types
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
  // Template/Component system type guards
  isTemplateNode,
  isConditionalNode,
  isSwitchNode,
  isEachNode,
  isResolvableNode,
} from './layout/nodes';

// Layout system - Builders
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
  // Template/Component builders
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

// Layout system - Layout result types (from Yoga adapter)
export type {
  LayoutResult,
  LayoutContext,
} from './layout/yoga';

// Layout system - Renderer
export {
  flattenTree,
  sortRenderItems,
  renderLayout,
  type RenderItem,
  type RenderItemData,
  type RenderResult,
  type RenderOptions,
} from './layout/renderer';

// Layout system - Yoga Adapter (Flexbox layout engine)
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

// Layout system - Template Interpolation
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
} from './layout/interpolation';

// Layout system - Conditional Evaluation
export {
  evaluateCondition,
  evaluateDataCondition,
  matchesCaseValue,
  // Helper functions for creating conditions
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

// Layout system - Node Resolution
export {
  resolveNode,
  createDataContext,
  createDefaultSpaceContext,
  type ResolverOptions,
} from './layout/resolver';

// Virtual renderer
export {
  VirtualRenderer,
  DEFAULT_RENDER_OPTIONS,
  type VirtualPage,
  type VirtualRenderOptions,
} from './renderer/VirtualRenderer';

// Borders module - bordered text printing
export {
  // Box drawing characters
  CP437_BOX,
  BOX_DRAWING_CODE_PAGES,
  ASCII_BORDER_CHARS,
  supportsBoxDrawing,
  getSingleBorderChars,
  getDoubleBorderChars,
  getBoxDrawingChars,
  getBorderCharsWithFallback,
  type BorderCharSet,
  // Graphics border generator
  BORDER_GRAPHICS_CONFIG,
  createHorizontalBorderLine,
  createBorderCorner,
  charsToDotsAt120DPI,
  getGraphicsLineSpacing,
  type BitImageData,
  type CornerType,
  // Border renderer
  selectRenderMode,
  renderBorder,
  normalizePadding,
  type BorderRenderMode,
  type BorderStyle,
  type PaddingSpec as BorderPaddingSpec,
  type BorderRenderOptions,
  type BorderRenderResult,
  // High-level API
  printBoxedText,
  printSimpleBox,
  printDoubleBox,
  type BoxedTextOptions,
} from './borders';

// JSX Runtime
export {
  createElement,
  Fragment,
  jsx,
  jsxs,
  jsxDEV,
  // Component functions for JSX usage
  Stack as JStack,
  Flex as JFlex,
  Text as JText,
  Spacer as JSpacer,
  Line as JLine,
  Template as JTemplate,
  If as JIf,
  Switch as JSwitch,
  Case as JCase,
  For as JFor,
  Layout as JLayout,
} from './jsx';

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
} from './jsx';

// Default export
export { LayoutEngine as default } from './layout/LayoutEngine';
