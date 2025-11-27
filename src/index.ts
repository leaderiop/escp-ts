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
  GridNode,
  GridRowNode,
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
  PageBreakHints,
  // Advanced layout types
  SpaceContext,
  SpaceQuery,
  ContentCondition,
  PositionMode,
  TextOrientation,
  FlexWrap,
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
  isGridNode,
  isTextNode,
  isSpacerNode,
  isLineNode,
  assertNever,
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
  spaceQuery,
  type TextOptions,
  type CellOptions,
} from './layout/builders';

// Layout system - Measure phase
export {
  measureNode,
  DEFAULT_MEASURE_CONTEXT,
  type MeasuredNode,
  type MeasureContext,
  type FlexLine,
} from './layout/measure';

// Layout system - Layout phase
export {
  layoutNode,
  performLayout,
  type LayoutResult,
  type LayoutContext,
} from './layout/layout';

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

// Layout system - Pagination
export {
  paginateLayout,
  createPageConfig,
  type PageConfig,
  type PageSegment,
  type PaginatedLayoutResult,
} from './layout/pagination';

// Virtual renderer
export {
  VirtualRenderer,
  DEFAULT_RENDER_OPTIONS,
  type VirtualPage,
  type VirtualRenderOptions,
} from './renderer/VirtualRenderer';

// Default export
export { LayoutEngine as default } from './layout/LayoutEngine';
