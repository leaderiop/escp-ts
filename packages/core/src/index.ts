/**
 * @escp/core - Core ESC/P and ESC/P2 functionality
 *
 * This package provides the foundational primitives for working with
 * ESC/P and ESC/P2 printer control language.
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
export { bytes, concat, toLowHigh, to32BitLE } from './core/utils';

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

// Borders module - bordered text printing
export {
  // Box drawing characters
  CP437_BOX,
  BOX_DRAWING_CODE_PAGES,
  ASCII_BORDER_CHARS,
  SINGLE_GRID,
  DOUBLE_GRID,
  ASCII_GRID,
  supportsBoxDrawing,
  getSingleBorderChars,
  getDoubleBorderChars,
  getBoxDrawingChars,
  getBorderCharsWithFallback,
  getGridBorderCharSet,
  type BorderCharSet,
  type GridBorderCharSet,
  // Graphics border generator
  BORDER_GRAPHICS_CONFIG,
  createHorizontalLineBitmap,
  createVerticalLineBitmap,
  createCornerBitmap,
  imageToColumnData24Pin,
  borderToBitImage,
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
