/**
 * Tests for BoxDrawingChars module
 */

import { describe, it, expect } from 'vitest';
import {
  CP437_BOX,
  UNICODE_BOX,
  BOX_DRAWING_CODE_PAGES,
  ASCII_BORDER_CHARS,
  supportsBoxDrawing,
  getSingleBorderChars,
  getDoubleBorderChars,
  getBoxDrawingChars,
  getBorderCharsWithFallback,
} from '../BoxDrawingChars';
import { CHAR_TABLE } from '../../core/constants';
import type { CharacterTable } from '../../core/types';

describe('BoxDrawingChars', () => {
  describe('CP437_BOX constants', () => {
    it('should have correct single-line box drawing codes', () => {
      expect(CP437_BOX.SINGLE_TOP_LEFT).toBe(0xda);
      expect(CP437_BOX.SINGLE_TOP_RIGHT).toBe(0xbf);
      expect(CP437_BOX.SINGLE_BOTTOM_LEFT).toBe(0xc0);
      expect(CP437_BOX.SINGLE_BOTTOM_RIGHT).toBe(0xd9);
      expect(CP437_BOX.SINGLE_HORIZONTAL).toBe(0xc4);
      expect(CP437_BOX.SINGLE_VERTICAL).toBe(0xb3);
    });

    it('should have correct double-line box drawing codes', () => {
      expect(CP437_BOX.DOUBLE_TOP_LEFT).toBe(0xc9);
      expect(CP437_BOX.DOUBLE_TOP_RIGHT).toBe(0xbb);
      expect(CP437_BOX.DOUBLE_BOTTOM_LEFT).toBe(0xc8);
      expect(CP437_BOX.DOUBLE_BOTTOM_RIGHT).toBe(0xbc);
      expect(CP437_BOX.DOUBLE_HORIZONTAL).toBe(0xcd);
      expect(CP437_BOX.DOUBLE_VERTICAL).toBe(0xba);
    });
  });

  describe('BOX_DRAWING_CODE_PAGES', () => {
    it('should include PC437 (US English)', () => {
      expect(BOX_DRAWING_CODE_PAGES).toContain(CHAR_TABLE.PC437_USA);
    });

    it('should include PC850 (Western European)', () => {
      expect(BOX_DRAWING_CODE_PAGES).toContain(CHAR_TABLE.PC850_MULTILINGUAL);
    });

    it('should include other PC code pages', () => {
      expect(BOX_DRAWING_CODE_PAGES).toContain(CHAR_TABLE.PC860_PORTUGUESE);
      expect(BOX_DRAWING_CODE_PAGES).toContain(CHAR_TABLE.PC863_CANADIAN_FRENCH);
      expect(BOX_DRAWING_CODE_PAGES).toContain(CHAR_TABLE.PC865_NORDIC);
      expect(BOX_DRAWING_CODE_PAGES).toContain(CHAR_TABLE.PC866_CYRILLIC);
    });

    it('should NOT include Katakana', () => {
      expect(BOX_DRAWING_CODE_PAGES).not.toContain(CHAR_TABLE.KATAKANA);
    });

    it('should NOT include ISO Latin-1', () => {
      expect(BOX_DRAWING_CODE_PAGES).not.toContain(CHAR_TABLE.ISO_LATIN_1);
    });
  });

  describe('supportsBoxDrawing', () => {
    it('should return true for PC437', () => {
      expect(supportsBoxDrawing(CHAR_TABLE.PC437_USA as CharacterTable)).toBe(true);
    });

    it('should return true for PC850', () => {
      expect(supportsBoxDrawing(CHAR_TABLE.PC850_MULTILINGUAL as CharacterTable)).toBe(true);
    });

    it('should return false for Katakana', () => {
      expect(supportsBoxDrawing(CHAR_TABLE.KATAKANA as CharacterTable)).toBe(false);
    });

    it('should return false for ISO Latin-1', () => {
      expect(supportsBoxDrawing(CHAR_TABLE.ISO_LATIN_1 as CharacterTable)).toBe(false);
    });

    it('should return false for ISO-8859-15', () => {
      expect(supportsBoxDrawing(CHAR_TABLE.ISO_8859_15 as CharacterTable)).toBe(false);
    });
  });

  describe('getSingleBorderChars', () => {
    it('should return single-line Unicode chars for PC437', () => {
      const chars = getSingleBorderChars(CHAR_TABLE.PC437_USA as CharacterTable);
      expect(chars).not.toBeNull();
      // Now returns Unicode box-drawing characters for display/preview
      expect(chars?.topLeft).toBe(UNICODE_BOX.SINGLE_TOP_LEFT);
      expect(chars?.topRight).toBe(UNICODE_BOX.SINGLE_TOP_RIGHT);
      expect(chars?.bottomLeft).toBe(UNICODE_BOX.SINGLE_BOTTOM_LEFT);
      expect(chars?.bottomRight).toBe(UNICODE_BOX.SINGLE_BOTTOM_RIGHT);
      expect(chars?.horizontal).toBe(UNICODE_BOX.SINGLE_HORIZONTAL);
      expect(chars?.vertical).toBe(UNICODE_BOX.SINGLE_VERTICAL);
    });

    it('should return null for unsupported code pages', () => {
      const chars = getSingleBorderChars(CHAR_TABLE.ISO_LATIN_1 as CharacterTable);
      expect(chars).toBeNull();
    });
  });

  describe('getDoubleBorderChars', () => {
    it('should return double-line Unicode chars for PC437', () => {
      const chars = getDoubleBorderChars(CHAR_TABLE.PC437_USA as CharacterTable);
      expect(chars).not.toBeNull();
      // Now returns Unicode box-drawing characters for display/preview
      expect(chars?.topLeft).toBe(UNICODE_BOX.DOUBLE_TOP_LEFT);
      expect(chars?.topRight).toBe(UNICODE_BOX.DOUBLE_TOP_RIGHT);
      expect(chars?.bottomLeft).toBe(UNICODE_BOX.DOUBLE_BOTTOM_LEFT);
      expect(chars?.bottomRight).toBe(UNICODE_BOX.DOUBLE_BOTTOM_RIGHT);
      expect(chars?.horizontal).toBe(UNICODE_BOX.DOUBLE_HORIZONTAL);
      expect(chars?.vertical).toBe(UNICODE_BOX.DOUBLE_VERTICAL);
    });

    it('should return null for unsupported code pages', () => {
      const chars = getDoubleBorderChars(CHAR_TABLE.KATAKANA as CharacterTable);
      expect(chars).toBeNull();
    });
  });

  describe('getBoxDrawingChars', () => {
    it('should return single-line Unicode chars by default', () => {
      const chars = getBoxDrawingChars(CHAR_TABLE.PC437_USA as CharacterTable);
      expect(chars?.topLeft).toBe(UNICODE_BOX.SINGLE_TOP_LEFT);
    });

    it('should return double-line Unicode chars when specified', () => {
      const chars = getBoxDrawingChars(CHAR_TABLE.PC437_USA as CharacterTable, 'double');
      expect(chars?.topLeft).toBe(UNICODE_BOX.DOUBLE_TOP_LEFT);
    });

    it('should return null for unsupported code pages', () => {
      expect(getBoxDrawingChars(CHAR_TABLE.ISO_LATIN_1 as CharacterTable)).toBeNull();
      expect(getBoxDrawingChars(CHAR_TABLE.ISO_LATIN_1 as CharacterTable, 'double')).toBeNull();
    });
  });

  describe('getBorderCharsWithFallback', () => {
    it('should return Unicode chars for supported code pages', () => {
      const chars = getBorderCharsWithFallback(CHAR_TABLE.PC437_USA as CharacterTable, 'single');
      expect(chars.topLeft).toBe(UNICODE_BOX.SINGLE_TOP_LEFT);
    });

    it('should return ASCII fallback for unsupported code pages', () => {
      const chars = getBorderCharsWithFallback(CHAR_TABLE.ISO_LATIN_1 as CharacterTable, 'single');
      expect(chars.topLeft).toBe('+');
      expect(chars.horizontal).toBe('-');
      expect(chars.vertical).toBe('|');
    });

    it('should return ASCII chars when style is ascii', () => {
      const chars = getBorderCharsWithFallback(CHAR_TABLE.PC437_USA as CharacterTable, 'ascii');
      expect(chars.topLeft).toBe('+');
      expect(chars.horizontal).toBe('-');
      expect(chars.vertical).toBe('|');
    });

    it('should never return null', () => {
      expect(getBorderCharsWithFallback(CHAR_TABLE.PC437_USA as CharacterTable)).toBeDefined();
      expect(getBorderCharsWithFallback(CHAR_TABLE.ISO_LATIN_1 as CharacterTable)).toBeDefined();
      expect(getBorderCharsWithFallback(CHAR_TABLE.KATAKANA as CharacterTable)).toBeDefined();
    });
  });

  describe('ASCII_BORDER_CHARS', () => {
    it('should have correct fallback characters', () => {
      expect(ASCII_BORDER_CHARS.topLeft).toBe('+');
      expect(ASCII_BORDER_CHARS.topRight).toBe('+');
      expect(ASCII_BORDER_CHARS.bottomLeft).toBe('+');
      expect(ASCII_BORDER_CHARS.bottomRight).toBe('+');
      expect(ASCII_BORDER_CHARS.horizontal).toBe('-');
      expect(ASCII_BORDER_CHARS.vertical).toBe('|');
    });
  });
});
