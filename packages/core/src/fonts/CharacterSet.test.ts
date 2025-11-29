import { describe, it, expect } from 'vitest';
import {
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
} from './CharacterSet';
import { INTERNATIONAL_CHARSET, TYPEFACE, CHAR_TABLE } from '../core/constants';

describe('CharacterSet', () => {
  // ==================== PROPORTIONAL_WIDTHS ====================

  describe('PROPORTIONAL_WIDTHS', () => {
    it('has zero width for control characters', () => {
      for (let i = 0; i < 32; i++) {
        expect(PROPORTIONAL_WIDTHS[i]).toBe(0);
      }
    });

    it('has correct width for space', () => {
      expect(PROPORTIONAL_WIDTHS[32]).toBe(12);
    });

    it('has correct width for letters', () => {
      expect(PROPORTIONAL_WIDTHS[65]).toBe(27); // A
      expect(PROPORTIONAL_WIDTHS[73]).toBe(12); // I (narrow)
      expect(PROPORTIONAL_WIDTHS[77]).toBe(33); // M (wide)
      expect(PROPORTIONAL_WIDTHS[87]).toBe(36); // W (wide)
    });

    it('has widths for extended ASCII (128-255)', () => {
      for (let i = 128; i < 256; i++) {
        expect(PROPORTIONAL_WIDTHS[i]).toBeDefined();
      }
    });
  });

  // ==================== INTERNATIONAL_CHAR_MAPS ====================

  describe('INTERNATIONAL_CHAR_MAPS', () => {
    it('has entry for USA (empty)', () => {
      expect(INTERNATIONAL_CHAR_MAPS[INTERNATIONAL_CHARSET.USA]).toBeDefined();
      expect(Object.keys(INTERNATIONAL_CHAR_MAPS[INTERNATIONAL_CHARSET.USA]).length).toBe(0);
    });

    it('has France mappings', () => {
      const france = INTERNATIONAL_CHAR_MAPS[INTERNATIONAL_CHARSET.FRANCE];
      expect(france[35]).toBe(0xa3); // # -> £
      expect(france[123]).toBe(0xe9); // { -> é
    });

    it('has Germany mappings', () => {
      const germany = INTERNATIONAL_CHAR_MAPS[INTERNATIONAL_CHARSET.GERMANY];
      expect(germany[91]).toBe(0xc4); // [ -> Ä
      expect(germany[123]).toBe(0xe4); // { -> ä
      expect(germany[126]).toBe(0xdf); // ~ -> ß
    });

    it('has UK mappings', () => {
      const uk = INTERNATIONAL_CHAR_MAPS[INTERNATIONAL_CHARSET.UK];
      expect(uk[35]).toBe(0xa3); // # -> £
    });

    it('has Japan mappings', () => {
      const japan = INTERNATIONAL_CHAR_MAPS[INTERNATIONAL_CHARSET.JAPAN];
      expect(japan[91]).toBe(0xa5); // [ -> ¥
    });
  });

  // ==================== getProportionalWidth ====================

  describe('getProportionalWidth', () => {
    it('returns width for valid character', () => {
      expect(getProportionalWidth(65)).toBe(27); // A
      expect(getProportionalWidth(32)).toBe(12); // Space
    });

    it('returns default width for unknown character', () => {
      // Characters not in table get default 24
      expect(getProportionalWidth(0xff)).toBe(24);
    });

    it('masks to byte range', () => {
      // 256 + 65 should give same as 65
      expect(getProportionalWidth(256 + 65)).toBe(getProportionalWidth(65));
    });
  });

  // ==================== getCharacterWidth ====================

  describe('getCharacterWidth', () => {
    it('calculates fixed width at 10 CPI', () => {
      expect(getCharacterWidth(65, 10, false, false, false)).toBe(36);
    });

    it('calculates fixed width at 12 CPI', () => {
      expect(getCharacterWidth(65, 12, false, false, false)).toBe(30);
    });

    it('calculates fixed width at 15 CPI', () => {
      expect(getCharacterWidth(65, 15, false, false, false)).toBe(24);
    });

    it('uses proportional width when enabled', () => {
      const propWidth = getCharacterWidth(73, 10, true, false, false); // I
      const fixedWidth = getCharacterWidth(73, 10, false, false, false);
      expect(propWidth).toBe(12); // Narrow I in proportional
      expect(fixedWidth).toBe(36); // Full width in fixed
    });

    it('applies condensed reduction (fixed)', () => {
      const normal = getCharacterWidth(65, 10, false, false, false);
      const condensed = getCharacterWidth(65, 10, false, true, false);
      expect(condensed).toBe(Math.round(normal * 0.6));
    });

    it('does not apply condensed to proportional', () => {
      const propNormal = getCharacterWidth(65, 10, true, false, false);
      const propCondensed = getCharacterWidth(65, 10, true, true, false);
      // Proportional doesn't use condensed flag in current implementation
      expect(propCondensed).toBe(propNormal);
    });

    it('doubles width for double-width mode', () => {
      const normal = getCharacterWidth(65, 10, false, false, false);
      const doubled = getCharacterWidth(65, 10, false, false, true);
      expect(doubled).toBe(normal * 2);
    });

    it('combines condensed and double-width', () => {
      const normal = getCharacterWidth(65, 10, false, false, false);
      const combined = getCharacterWidth(65, 10, false, true, true);
      expect(combined).toBe(Math.round(normal * 0.6) * 2);
    });
  });

  // ==================== mapInternationalChar ====================

  describe('mapInternationalChar', () => {
    it('returns unchanged for USA charset', () => {
      expect(mapInternationalChar(35, INTERNATIONAL_CHARSET.USA)).toBe(35);
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.USA)).toBe(91);
    });

    it('maps # to £ for France', () => {
      expect(mapInternationalChar(35, INTERNATIONAL_CHARSET.FRANCE)).toBe(0xa3);
    });

    it('maps [ to Ä for Germany', () => {
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.GERMANY)).toBe(0xc4);
    });

    it('maps # to £ for UK', () => {
      expect(mapInternationalChar(35, INTERNATIONAL_CHARSET.UK)).toBe(0xa3);
    });

    it('returns unchanged for unmapped characters', () => {
      expect(mapInternationalChar(65, INTERNATIONAL_CHARSET.FRANCE)).toBe(65); // A unchanged
    });

    it('handles Denmark I charset', () => {
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.DENMARK_I)).toBe(0xc6); // Æ
    });

    it('handles Sweden charset', () => {
      expect(mapInternationalChar(64, INTERNATIONAL_CHARSET.SWEDEN)).toBe(0xc9); // É
    });

    it('handles Italy charset', () => {
      expect(mapInternationalChar(35, INTERNATIONAL_CHARSET.ITALY)).toBe(0xa3); // £
    });

    it('handles Spain I charset', () => {
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.SPAIN_I)).toBe(0xa1); // ¡
    });

    it('handles Japan charset', () => {
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.JAPAN)).toBe(0xa5); // ¥
    });

    it('handles Norway charset', () => {
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.NORWAY)).toBe(0xc6); // Æ
    });

    it('handles Denmark II charset', () => {
      expect(mapInternationalChar(91, INTERNATIONAL_CHARSET.DENMARK_II)).toBe(0xc6); // Æ
    });

    it('handles Spain II charset', () => {
      expect(mapInternationalChar(64, INTERNATIONAL_CHARSET.SPAIN_II)).toBe(0xa1); // ¡
    });

    it('handles Latin America charset', () => {
      expect(mapInternationalChar(64, INTERNATIONAL_CHARSET.LATIN_AMERICA)).toBe(0xa1); // ¡
    });
  });

  // ==================== encodeText ====================

  describe('encodeText', () => {
    it('encodes ASCII text', () => {
      const result = encodeText('Hello');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(5);
      expect(result[0]).toBe(72); // H
      expect(result[1]).toBe(101); // e
    });

    it('applies international charset mapping', () => {
      const result = encodeText('#', INTERNATIONAL_CHARSET.UK);
      expect(result[0]).toBe(0xa3); // £
    });

    it('clamps characters to byte range', () => {
      // Unicode characters beyond 255 should be clamped
      const result = encodeText('A\u0100B'); // Latin capital A with macron
      expect(result.length).toBe(3);
      expect(result[0]).toBe(65);
      expect(result[1]).toBe(0); // Clamped to byte
      expect(result[2]).toBe(66);
    });

    it('handles empty string', () => {
      const result = encodeText('');
      expect(result.length).toBe(0);
    });

    it('uses default USA charset', () => {
      const result = encodeText('#');
      expect(result[0]).toBe(35); // Not converted
    });

    it('accepts char table parameter', () => {
      // Currently charTable is not used but should not throw
      const result = encodeText('Test', INTERNATIONAL_CHARSET.USA, CHAR_TABLE.PC850_MULTILINGUAL);
      expect(result.length).toBe(4);
    });
  });

  // ==================== calculateTextWidth ====================

  describe('calculateTextWidth', () => {
    it('calculates width of simple text', () => {
      // At 10 CPI, each char is 36 dots
      const width = calculateTextWidth('Hello', 10, false, false, false);
      expect(width).toBe(5 * 36);
    });

    it('calculates width with proportional spacing', () => {
      const width = calculateTextWidth('iW', 10, true, false, false);
      // i = 12, W = 36 in proportional
      expect(width).toBe(12 + 36);
    });

    it('adds intercharacter space', () => {
      const widthNoSpace = calculateTextWidth('AB', 10, false, false, false);
      const widthWithSpace = calculateTextWidth('AB', 10, false, false, false, 10);
      // 2 chars, 1 gap between them
      expect(widthWithSpace).toBe(widthNoSpace + 10);
    });

    it('handles empty string', () => {
      expect(calculateTextWidth('', 10, false, false, false)).toBe(0);
    });

    it('handles single character', () => {
      expect(calculateTextWidth('A', 10, false, false, false)).toBe(36);
    });

    it('applies condensed mode', () => {
      const normal = calculateTextWidth('Test', 10, false, false, false);
      const condensed = calculateTextWidth('Test', 10, false, true, false);
      expect(condensed).toBeLessThan(normal);
    });

    it('applies double width', () => {
      const normal = calculateTextWidth('Test', 10, false, false, false);
      const doubled = calculateTextWidth('Test', 10, false, false, true);
      expect(doubled).toBe(normal * 2);
    });
  });

  // ==================== wordWrap ====================

  describe('wordWrap', () => {
    it('returns single line for short text', () => {
      const lines = wordWrap('Hello', 1000, 10, false, false, false);
      expect(lines).toEqual(['Hello']);
    });

    it('wraps text at word boundaries', () => {
      // At 10 CPI, each char is 36 dots. 5 chars = 180 dots
      const lines = wordWrap('Hello World', 200, 10, false, false, false);
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('Hello');
      expect(lines[1]).toBe('World');
    });

    it('handles multiple spaces', () => {
      const lines = wordWrap('A B C', 500, 10, false, false, false);
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('A B C');
    });

    it('breaks long words', () => {
      // 10 chars at 36 dots each = 360 dots
      const lines = wordWrap('ABCDEFGHIJ', 200, 10, false, false, false);
      expect(lines.length).toBeGreaterThan(1);
    });

    it('handles empty string', () => {
      const lines = wordWrap('', 100, 10, false, false, false);
      expect(lines).toEqual([]);
    });

    it('trims trailing whitespace', () => {
      const lines = wordWrap('Hello   ', 1000, 10, false, false, false);
      expect(lines[0]).toBe('Hello');
    });

    it('handles whitespace between words', () => {
      const lines = wordWrap('A   B', 50, 10, false, false, false);
      // Should wrap at some point due to narrow width
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });

    it('respects maxWidth', () => {
      const maxWidth = 200;
      const lines = wordWrap(
        'This is a longer text that needs wrapping',
        maxWidth,
        10,
        false,
        false,
        false
      );
      for (const line of lines) {
        const width = calculateTextWidth(line, 10, false, false, false);
        expect(width).toBeLessThanOrEqual(maxWidth);
      }
    });

    it('handles proportional spacing', () => {
      const lines = wordWrap('iiiiii WWWWWW', 200, 10, true, false, false);
      // Proportional should allow more narrow chars to fit
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });

    it('handles intercharacter space', () => {
      const linesNoSpace = wordWrap('Hello World', 300, 10, false, false, false, 0);
      const linesWithSpace = wordWrap('Hello World', 300, 10, false, false, false, 10);
      // With extra space, may need more lines
      expect(linesWithSpace.length).toBeGreaterThanOrEqual(linesNoSpace.length);
    });
  });

  // ==================== getTypefaceName ====================

  describe('getTypefaceName', () => {
    it('returns name for Roman', () => {
      expect(getTypefaceName(TYPEFACE.ROMAN)).toBe('Roman');
    });

    it('returns name for Sans Serif', () => {
      expect(getTypefaceName(TYPEFACE.SANS_SERIF)).toBe('Sans Serif');
    });

    it('returns name for Courier', () => {
      expect(getTypefaceName(TYPEFACE.COURIER)).toBe('Courier');
    });

    it('returns name for Prestige', () => {
      expect(getTypefaceName(TYPEFACE.PRESTIGE)).toBe('Prestige');
    });

    it('returns name for Script', () => {
      expect(getTypefaceName(TYPEFACE.SCRIPT)).toBe('Script');
    });

    it('returns name for OCR-B', () => {
      expect(getTypefaceName(TYPEFACE.OCR_B)).toBe('OCR-B');
    });

    it('returns name for OCR-A', () => {
      expect(getTypefaceName(TYPEFACE.OCR_A)).toBe('OCR-A');
    });

    it('returns name for Orator', () => {
      expect(getTypefaceName(TYPEFACE.ORATOR)).toBe('Orator');
    });

    it('returns name for Orator-S', () => {
      expect(getTypefaceName(TYPEFACE.ORATOR_S)).toBe('Orator-S');
    });

    it('returns name for Script-C', () => {
      expect(getTypefaceName(TYPEFACE.SCRIPT_C)).toBe('Script-C');
    });

    it('returns name for Roman-T', () => {
      expect(getTypefaceName(TYPEFACE.ROMAN_T)).toBe('Roman-T');
    });

    it('returns name for Sans Serif H', () => {
      expect(getTypefaceName(TYPEFACE.SANS_SERIF_H)).toBe('Sans Serif H');
    });

    it('returns fallback for unknown typeface', () => {
      expect(getTypefaceName(99 as never)).toBe('Typeface 99');
    });
  });

  // ==================== isScalableTypeface ====================

  describe('isScalableTypeface', () => {
    it('returns true for Roman', () => {
      expect(isScalableTypeface(TYPEFACE.ROMAN)).toBe(true);
    });

    it('returns true for Sans Serif', () => {
      expect(isScalableTypeface(TYPEFACE.SANS_SERIF)).toBe(true);
    });

    it('returns false for Courier', () => {
      expect(isScalableTypeface(TYPEFACE.COURIER)).toBe(false);
    });

    it('returns false for other typefaces', () => {
      expect(isScalableTypeface(TYPEFACE.PRESTIGE)).toBe(false);
      expect(isScalableTypeface(TYPEFACE.SCRIPT)).toBe(false);
      expect(isScalableTypeface(TYPEFACE.OCR_B)).toBe(false);
    });
  });
});
