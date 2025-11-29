/**
 * Box Drawing Character Definitions
 * Provides CP437/CP850 box-drawing character codes and code page detection
 */

import { CHAR_TABLE } from '../core/constants';
import type { CharacterTable } from '../core/types';

/**
 * CP437 Box Drawing Character Codes
 * These are the standard IBM PC line-drawing characters used in CP437, CP850, and related code pages
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
    topLeft: String.fromCharCode(CP437_BOX.SINGLE_TOP_LEFT),
    topRight: String.fromCharCode(CP437_BOX.SINGLE_TOP_RIGHT),
    bottomLeft: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_LEFT),
    bottomRight: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_RIGHT),
    horizontal: String.fromCharCode(CP437_BOX.SINGLE_HORIZONTAL),
    vertical: String.fromCharCode(CP437_BOX.SINGLE_VERTICAL),
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
    topLeft: String.fromCharCode(CP437_BOX.DOUBLE_TOP_LEFT),
    topRight: String.fromCharCode(CP437_BOX.DOUBLE_TOP_RIGHT),
    bottomLeft: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_LEFT),
    bottomRight: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_RIGHT),
    horizontal: String.fromCharCode(CP437_BOX.DOUBLE_HORIZONTAL),
    vertical: String.fromCharCode(CP437_BOX.DOUBLE_VERTICAL),
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
  BOX_DRAWING_CODE_PAGES,
  ASCII_BORDER_CHARS,
  supportsBoxDrawing,
  getSingleBorderChars,
  getDoubleBorderChars,
  getBoxDrawingChars,
  getBorderCharsWithFallback,
};
