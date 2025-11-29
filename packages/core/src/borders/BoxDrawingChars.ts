/**
 * Box Drawing Character Definitions
 * Provides CP437/CP850 box-drawing character codes and code page detection
 */

import { CHAR_TABLE } from '../core/constants';
import type { CharacterTable } from '../core/types';

/**
 * CP437 Box Drawing Character Codes (byte values)
 * These are the standard IBM PC line-drawing characters used in CP437, CP850, and related code pages
 * Note: These are the raw byte values for ESC/P printer output
 */
export const CP437_BOX = {
  // Single-line box drawing
  SINGLE_TOP_LEFT: 0xda, // ┌
  SINGLE_TOP_RIGHT: 0xbf, // ┐
  SINGLE_BOTTOM_LEFT: 0xc0, // └
  SINGLE_BOTTOM_RIGHT: 0xd9, // ┘
  SINGLE_HORIZONTAL: 0xc4, // ─
  SINGLE_VERTICAL: 0xb3, // │

  // Double-line box drawing
  DOUBLE_TOP_LEFT: 0xc9, // ╔
  DOUBLE_TOP_RIGHT: 0xbb, // ╗
  DOUBLE_BOTTOM_LEFT: 0xc8, // ╚
  DOUBLE_BOTTOM_RIGHT: 0xbc, // ╝
  DOUBLE_HORIZONTAL: 0xcd, // ═
  DOUBLE_VERTICAL: 0xba, // ║

  // T-junctions (single)
  SINGLE_T_DOWN: 0xc2, // ┬
  SINGLE_T_UP: 0xc1, // ┴
  SINGLE_T_RIGHT: 0xc3, // ├
  SINGLE_T_LEFT: 0xb4, // ┤
  SINGLE_CROSS: 0xc5, // ┼

  // T-junctions (double)
  DOUBLE_T_DOWN: 0xcb, // ╦
  DOUBLE_T_UP: 0xca, // ╩
  DOUBLE_T_RIGHT: 0xcc, // ╠
  DOUBLE_T_LEFT: 0xb9, // ╣
  DOUBLE_CROSS: 0xce, // ╬
} as const;

/**
 * Unicode Box Drawing Characters
 * These are the Unicode equivalents for preview/display rendering
 * JavaScript's String.fromCharCode uses Unicode, not CP437, so we need these mappings
 */
export const UNICODE_BOX = {
  // Single-line box drawing (U+250x range)
  SINGLE_TOP_LEFT: '\u250C', // ┌
  SINGLE_TOP_RIGHT: '\u2510', // ┐
  SINGLE_BOTTOM_LEFT: '\u2514', // └
  SINGLE_BOTTOM_RIGHT: '\u2518', // ┘
  SINGLE_HORIZONTAL: '\u2500', // ─
  SINGLE_VERTICAL: '\u2502', // │

  // Double-line box drawing (U+255x range)
  DOUBLE_TOP_LEFT: '\u2554', // ╔
  DOUBLE_TOP_RIGHT: '\u2557', // ╗
  DOUBLE_BOTTOM_LEFT: '\u255A', // ╚
  DOUBLE_BOTTOM_RIGHT: '\u255D', // ╝
  DOUBLE_HORIZONTAL: '\u2550', // ═
  DOUBLE_VERTICAL: '\u2551', // ║

  // T-junctions (single)
  SINGLE_T_DOWN: '\u252C', // ┬
  SINGLE_T_UP: '\u2534', // ┴
  SINGLE_T_RIGHT: '\u251C', // ├
  SINGLE_T_LEFT: '\u2524', // ┤
  SINGLE_CROSS: '\u253C', // ┼

  // T-junctions (double)
  DOUBLE_T_DOWN: '\u2566', // ╦
  DOUBLE_T_UP: '\u2569', // ╩
  DOUBLE_T_RIGHT: '\u2560', // ╠
  DOUBLE_T_LEFT: '\u2563', // ╣
  DOUBLE_CROSS: '\u256C', // ╬
} as const;

/**
 * Border character set for text-mode rendering
 */
export interface BorderCharSet {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

/**
 * Extended border character set for grid/table borders
 * Adds T-junctions and cross characters needed for full grids
 */
export interface GridBorderCharSet extends BorderCharSet {
  tDown: string; // ┬ (top T-junction, between columns)
  tUp: string; // ┴ (bottom T-junction, between columns)
  tRight: string; // ├ (left T-junction, row separator start)
  tLeft: string; // ┤ (right T-junction, row separator end)
  cross: string; // ┼ (interior row/column intersection)
}

/**
 * Code pages that support CP437-compatible box drawing characters
 * All these code pages use the same character codes (0xB3-0xDA range)
 */
export const BOX_DRAWING_CODE_PAGES: readonly CharacterTable[] = [
  CHAR_TABLE.PC437_USA, // 0 - US English (full IBM PC character set)
  CHAR_TABLE.PC850_MULTILINGUAL, // 2 - Western European
  CHAR_TABLE.PC860_PORTUGUESE, // 3 - Portuguese
  CHAR_TABLE.PC863_CANADIAN_FRENCH, // 4 - Canadian French
  CHAR_TABLE.PC865_NORDIC, // 5 - Nordic languages
  CHAR_TABLE.PC858_EURO, // 13 - Multilingual with Euro symbol
  CHAR_TABLE.PC866_CYRILLIC, // 17 - Russian/Cyrillic
  CHAR_TABLE.PC852_EASTERN_EUROPE, // 18 - Eastern European
  CHAR_TABLE.PC858_MULTILINGUAL, // 19 - Multilingual with Euro
] as const;

/**
 * Check if a character table (code page) supports box drawing characters
 * @param charTable The character table/code page to check
 * @returns true if the code page has CP437-compatible box drawing characters
 */
export function supportsBoxDrawing(charTable: CharacterTable): boolean {
  return (BOX_DRAWING_CODE_PAGES as readonly number[]).includes(charTable);
}

/**
 * Get single-line border character set for a code page
 * @param charTable The character table/code page
 * @returns BorderCharSet with single-line box drawing characters, or null if not supported
 */
export function getSingleBorderChars(charTable: CharacterTable): BorderCharSet | null {
  if (!supportsBoxDrawing(charTable)) {
    return null;
  }

  return {
    topLeft: UNICODE_BOX.SINGLE_TOP_LEFT,
    topRight: UNICODE_BOX.SINGLE_TOP_RIGHT,
    bottomLeft: UNICODE_BOX.SINGLE_BOTTOM_LEFT,
    bottomRight: UNICODE_BOX.SINGLE_BOTTOM_RIGHT,
    horizontal: UNICODE_BOX.SINGLE_HORIZONTAL,
    vertical: UNICODE_BOX.SINGLE_VERTICAL,
  };
}

/**
 * Get double-line border character set for a code page
 * @param charTable The character table/code page
 * @returns BorderCharSet with double-line box drawing characters, or null if not supported
 */
export function getDoubleBorderChars(charTable: CharacterTable): BorderCharSet | null {
  if (!supportsBoxDrawing(charTable)) {
    return null;
  }

  return {
    topLeft: UNICODE_BOX.DOUBLE_TOP_LEFT,
    topRight: UNICODE_BOX.DOUBLE_TOP_RIGHT,
    bottomLeft: UNICODE_BOX.DOUBLE_BOTTOM_LEFT,
    bottomRight: UNICODE_BOX.DOUBLE_BOTTOM_RIGHT,
    horizontal: UNICODE_BOX.DOUBLE_HORIZONTAL,
    vertical: UNICODE_BOX.DOUBLE_VERTICAL,
  };
}

/**
 * Get border character set for a code page and style
 * @param charTable The character table/code page
 * @param style 'single' or 'double' line style
 * @returns BorderCharSet or null if the code page doesn't support box drawing
 */
export function getBoxDrawingChars(
  charTable: CharacterTable,
  style: 'single' | 'double' = 'single'
): BorderCharSet | null {
  return style === 'double' ? getDoubleBorderChars(charTable) : getSingleBorderChars(charTable);
}

/**
 * ASCII fallback border characters (works on all code pages)
 */
export const ASCII_BORDER_CHARS: BorderCharSet = {
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
};

/**
 * Single-line grid characters (Unicode for display/preview)
 */
export const SINGLE_GRID: GridBorderCharSet = {
  topLeft: UNICODE_BOX.SINGLE_TOP_LEFT,
  topRight: UNICODE_BOX.SINGLE_TOP_RIGHT,
  bottomLeft: UNICODE_BOX.SINGLE_BOTTOM_LEFT,
  bottomRight: UNICODE_BOX.SINGLE_BOTTOM_RIGHT,
  horizontal: UNICODE_BOX.SINGLE_HORIZONTAL,
  vertical: UNICODE_BOX.SINGLE_VERTICAL,
  tDown: UNICODE_BOX.SINGLE_T_DOWN,
  tUp: UNICODE_BOX.SINGLE_T_UP,
  tRight: UNICODE_BOX.SINGLE_T_RIGHT,
  tLeft: UNICODE_BOX.SINGLE_T_LEFT,
  cross: UNICODE_BOX.SINGLE_CROSS,
};

/**
 * Double-line grid characters (Unicode for display/preview)
 */
export const DOUBLE_GRID: GridBorderCharSet = {
  topLeft: UNICODE_BOX.DOUBLE_TOP_LEFT,
  topRight: UNICODE_BOX.DOUBLE_TOP_RIGHT,
  bottomLeft: UNICODE_BOX.DOUBLE_BOTTOM_LEFT,
  bottomRight: UNICODE_BOX.DOUBLE_BOTTOM_RIGHT,
  horizontal: UNICODE_BOX.DOUBLE_HORIZONTAL,
  vertical: UNICODE_BOX.DOUBLE_VERTICAL,
  tDown: UNICODE_BOX.DOUBLE_T_DOWN,
  tUp: UNICODE_BOX.DOUBLE_T_UP,
  tRight: UNICODE_BOX.DOUBLE_T_RIGHT,
  tLeft: UNICODE_BOX.DOUBLE_T_LEFT,
  cross: UNICODE_BOX.DOUBLE_CROSS,
};

/**
 * ASCII fallback grid characters (works on all code pages)
 */
export const ASCII_GRID: GridBorderCharSet = {
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
  tDown: '+',
  tUp: '+',
  tRight: '+',
  tLeft: '+',
  cross: '+',
};

/**
 * Get grid border character set by style
 * @param style 'single', 'double', or 'ascii'
 * @returns GridBorderCharSet for the specified style
 */
export function getGridBorderCharSet(style: 'single' | 'double' | 'ascii'): GridBorderCharSet {
  switch (style) {
    case 'double':
      return DOUBLE_GRID;
    case 'ascii':
      return ASCII_GRID;
    default:
      return SINGLE_GRID;
  }
}

/**
 * Get border characters with ASCII fallback
 * @param charTable The character table/code page
 * @param style 'single', 'double', or 'ascii'
 * @returns BorderCharSet (never null - falls back to ASCII)
 */
export function getBorderCharsWithFallback(
  charTable: CharacterTable,
  style: 'single' | 'double' | 'ascii' = 'single'
): BorderCharSet {
  if (style === 'ascii') {
    return ASCII_BORDER_CHARS;
  }

  const boxChars = getBoxDrawingChars(charTable, style);
  return boxChars ?? ASCII_BORDER_CHARS;
}

export default {
  CP437_BOX,
  UNICODE_BOX,
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
};
