/**
 * Borders Module
 * Provides bordered text printing for ESC/P2 printers
 *
 * Features:
 * - Automatic mode selection between text and graphics rendering
 * - CP437/CP850 box-drawing characters for text mode
 * - 120 DPI bitmap graphics fallback for unsupported code pages
 * - Support for 10, 12, and 15 CPI
 *
 * @example
 * ```typescript
 * import { printBoxedText, supportsBoxDrawing } from 'escp-ts/borders';
 * import { CHAR_TABLE } from 'escp-ts/core/constants';
 *
 * // Check if code page supports box drawing
 * if (supportsBoxDrawing(CHAR_TABLE.PC437_USA)) {
 *   console.log('Using text mode for borders');
 * }
 *
 * // Print boxed text with auto mode selection
 * const commands = printBoxedText('Hello World', CHAR_TABLE.PC437_USA, {
 *   padding: 2,
 *   borderStyle: 'single',
 * });
 * ```
 */

// Box Drawing Characters
export {
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
} from './BoxDrawingChars';

// Graphics Border Generator
export {
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
} from './GraphicsBorderGenerator';

// Border Renderer
export {
  selectRenderMode,
  renderBorder,
  normalizePadding,
  type BorderRenderMode,
  type BorderStyle,
  type PaddingSpec,
  type BorderRenderOptions,
  type BorderRenderResult,
} from './BorderRenderer';

// High-Level API
export {
  printBoxedText,
  printSimpleBox,
  printDoubleBox,
  type BoxedTextOptions,
} from './printBoxedText';
