/**
 * Border Renderer
 * Core rendering logic with automatic mode selection between text and graphics
 */

import { CommandBuilder } from '../commands/CommandBuilder';
import { BIT_IMAGE_MODE } from '../core/constants';
import type { CharacterTable, BitImageMode } from '../core/types';
import { concat } from '../core/utils';

import { supportsBoxDrawing, getBorderCharsWithFallback, type BorderCharSet } from './BoxDrawingChars';
import {
  createHorizontalBorderLine,
  createBorderCorner,
  getGraphicsLineSpacing,
  BORDER_GRAPHICS_CONFIG,
} from './GraphicsBorderGenerator';

/**
 * Border render mode
 */
export type BorderRenderMode = 'auto' | 'text' | 'graphics';

/**
 * Border style
 */
export type BorderStyle = 'single' | 'double' | 'ascii';

/**
 * Padding specification
 */
export interface PaddingSpec {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Options for border rendering
 */
export interface BorderRenderOptions {
  /** Render mode: 'auto' (default), 'text', or 'graphics' */
  mode: BorderRenderMode;
  /** Border style: 'single', 'double', or 'ascii' */
  style: BorderStyle;
  /** Content width in characters */
  contentWidthChars: number;
  /** Number of content lines */
  contentLines: number;
  /** Padding in characters */
  padding: PaddingSpec;
  /** Characters per inch */
  cpi: 10 | 12 | 15;
  /** Current code page/character table */
  charTable: CharacterTable;
}

/**
 * Result of border rendering
 */
export interface BorderRenderResult {
  /** Actual mode used ('text' or 'graphics') */
  mode: 'text' | 'graphics';
  /** Border character set (for text mode) */
  chars: BorderCharSet;
  /** Top border command bytes */
  topBorder: Uint8Array;
  /** Bottom border command bytes */
  bottomBorder: Uint8Array;
  /** Left border character/bytes (per line) */
  leftBorder: Uint8Array;
  /** Right border character/bytes (per line) */
  rightBorder: Uint8Array;
  /** Total box width in characters (for text mode) */
  totalWidthChars: number;
  /** Setup commands (line spacing, etc.) */
  setupCommands: Uint8Array;
  /** Restore commands (reset line spacing, etc.) */
  restoreCommands: Uint8Array;
}

/**
 * Select the actual render mode based on requested mode and code page capabilities
 * Auto mode prefers text when the code page supports box drawing (faster printing)
 *
 * @param requestedMode The requested render mode
 * @param charTable The current code page
 * @returns The actual render mode to use
 */
export function selectRenderMode(
  requestedMode: BorderRenderMode,
  charTable: CharacterTable
): 'text' | 'graphics' {
  if (requestedMode === 'graphics') {
    return 'graphics';
  }

  if (requestedMode === 'text') {
    if (!supportsBoxDrawing(charTable)) {
      // Text mode requested but code page doesn't support box drawing
      // Fall back to graphics mode
      return 'graphics';
    }
    return 'text';
  }

  // Auto mode: prefer text when available (user preference for speed)
  return supportsBoxDrawing(charTable) ? 'text' : 'graphics';
}


/**
 * Render border using text characters
 */
function renderTextBorder(options: BorderRenderOptions): BorderRenderResult {
  const { style, contentWidthChars, padding, charTable } = options;

  // Get border characters (with ASCII fallback for 'ascii' style)
  const chars = getBorderCharsWithFallback(charTable, style);

  // Calculate total width: left border + left padding + content + right padding + right border
  const totalWidthChars = 1 + padding.left + contentWidthChars + padding.right + 1;

  // Build horizontal line (content area width only, corners are separate)
  const horizontalLength = padding.left + contentWidthChars + padding.right;
  const horizontalLine = chars.horizontal.repeat(horizontalLength);

  // Top border: corner + line + corner + newline
  const topBorder = CommandBuilder.printLine(chars.topLeft + horizontalLine + chars.topRight);

  // Bottom border: corner + line + corner + newline
  const bottomBorder = CommandBuilder.printLine(chars.bottomLeft + horizontalLine + chars.bottomRight);

  // Side borders are just the vertical character
  const leftBorder = CommandBuilder.encodeText(chars.vertical);
  const rightBorder = CommandBuilder.encodeText(chars.vertical);

  return {
    mode: 'text',
    chars,
    topBorder,
    bottomBorder,
    leftBorder,
    rightBorder,
    totalWidthChars,
    setupCommands: new Uint8Array(0),
    restoreCommands: new Uint8Array(0),
  };
}

/**
 * Render border using bitmap graphics
 */
function renderGraphicsBorder(options: BorderRenderOptions): BorderRenderResult {
  const { contentWidthChars, padding, cpi } = options;

  // Calculate dimensions in dots at 120 DPI
  // At 120 DPI: 10 CPI = 12 dots/char, 12 CPI = 10 dots/char, 15 CPI = 8 dots/char
  const dotsPerChar = BORDER_GRAPHICS_CONFIG.HORIZONTAL_DPI / cpi;
  const cornerSize = Math.max(6, Math.round(dotsPerChar / 2));

  // Calculate horizontal line width (between corners)
  const horizontalCharWidth = padding.left + contentWidthChars + padding.right;
  const horizontalDots = Math.round(horizontalCharWidth * dotsPerChar);

  // Create bitmap data for horizontal lines
  const horizontalLine = createHorizontalBorderLine(horizontalDots);

  // Create corners
  const topLeftCorner = createBorderCorner('topLeft', cornerSize);
  const topRightCorner = createBorderCorner('topRight', cornerSize);
  const bottomLeftCorner = createBorderCorner('bottomLeft', cornerSize);
  const bottomRightCorner = createBorderCorner('bottomRight', cornerSize);

  // Build top border: corner + line + corner
  const topBorder = concat(
    CommandBuilder.bitImage(
      BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      topLeftCorner.width,
      topLeftCorner.data
    ),
    CommandBuilder.bitImage(
      BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      horizontalLine.width,
      horizontalLine.data
    ),
    CommandBuilder.bitImage(
      BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      topRightCorner.width,
      topRightCorner.data
    ),
    CommandBuilder.carriageReturn(),
    CommandBuilder.lineFeed()
  );

  // Build bottom border: corner + line + corner
  const bottomBorder = concat(
    CommandBuilder.bitImage(
      BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      bottomLeftCorner.width,
      bottomLeftCorner.data
    ),
    CommandBuilder.bitImage(
      BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      horizontalLine.width,
      horizontalLine.data
    ),
    CommandBuilder.bitImage(
      BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
      bottomRightCorner.width,
      bottomRightCorner.data
    ),
    CommandBuilder.carriageReturn(),
    CommandBuilder.lineFeed()
  );

  // For side borders in graphics mode, we still use text '|' for simplicity
  // (Mixing graphics and text on same line is complex)
  const leftBorder = CommandBuilder.encodeText('|');
  const rightBorder = CommandBuilder.encodeText('|');

  // ASCII fallback chars for the result
  const chars: BorderCharSet = {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
  };

  // Calculate total width in characters (for alignment purposes)
  const totalWidthChars = 1 + padding.left + contentWidthChars + padding.right + 1;

  // Setup: set line spacing for graphics (24/180 inch per stripe)
  const setupCommands = CommandBuilder.lineSpacingN180(getGraphicsLineSpacing());

  // Restore: reset to 1/6 inch line spacing
  const restoreCommands = CommandBuilder.lineSpacing1_6();

  return {
    mode: 'graphics',
    chars,
    topBorder,
    bottomBorder,
    leftBorder,
    rightBorder,
    totalWidthChars,
    setupCommands,
    restoreCommands,
  };
}

/**
 * Render a border with automatic mode selection
 *
 * @param options Border rendering options
 * @returns BorderRenderResult with all necessary components
 */
export function renderBorder(options: BorderRenderOptions): BorderRenderResult {
  const actualMode = selectRenderMode(options.mode, options.charTable);

  if (actualMode === 'text') {
    return renderTextBorder(options);
  } else {
    return renderGraphicsBorder(options);
  }
}

/**
 * Create default padding spec from a single number or partial spec
 */
export function normalizePadding(padding: number | Partial<PaddingSpec> | undefined): PaddingSpec {
  if (padding === undefined) {
    return { top: 0, right: 1, bottom: 0, left: 1 };
  }

  if (typeof padding === 'number') {
    return { top: 0, right: padding, bottom: 0, left: padding };
  }

  return {
    top: padding.top ?? 0,
    right: padding.right ?? 1,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 1,
  };
}

export default {
  selectRenderMode,
  renderBorder,
  normalizePadding,
};
