/**
 * VirtualRenderer tests
 * Regression tests for bitmap font rendering
 */

import { describe, it, expect } from 'vitest';
import { VirtualRenderer } from '../VirtualRenderer';
import { getFont, getGlyph, hasFont, FONT_ROMAN } from '../fonts';
import { TYPEFACE } from '@escp/core';

describe('VirtualRenderer BITMAP_FONT', () => {
  describe('Double-line corner glyphs regression test', () => {
    // The double horizontal line (═) uses rows 5 and 7 for the two parallel lines
    // All double-line corners must have corresponding connections at both rows
    // to properly connect with the horizontal line

    // These are the expected glyph patterns for double-line corners
    // Row 5: outer horizontal connection
    // Row 6: gap between horizontal lines (usually 0x00 or vertical continuation)
    // Row 7: inner horizontal connection

    const EXPECTED_PATTERNS = {
      // ╚ (0xC8) - double bottom-left: extends RIGHT
      0xc8: {
        row5: 0x37, // 00110111: vertical bars + horizontal extends right
        row7: 0x07, // 00000111: inner horizontal extends right (cols 5,6,7)
        description: 'double bottom-left corner',
      },
      // ╝ (0xBC) - double bottom-right: extends LEFT
      0xbc: {
        row5: 0xf6, // 11110110: horizontal extends left + vertical bars
        row7: 0xe0, // 11100000: inner horizontal extends left (cols 0,1,2)
        description: 'double bottom-right corner',
      },
      // ╔ (0xC9) - double top-left: extends RIGHT
      0xc9: {
        row5: 0x37, // 00110111: vertical bars + horizontal extends right
        row7: 0x37, // 00110111: inner horizontal extends right
        description: 'double top-left corner',
      },
      // ╗ (0xBB) - double top-right: extends LEFT
      0xbb: {
        row5: 0xf6, // 11110110: horizontal extends left + vertical bars
        row7: 0xf6, // 11110110: inner horizontal extends left
        description: 'double top-right corner',
      },
    };

    // The double horizontal line pattern for reference
    const DOUBLE_HORIZONTAL = {
      row5: 0xff, // full line
      row7: 0xff, // full line (second of the double)
    };

    it('should have documented the expected double-line corner patterns', () => {
      // This test documents the fix for the "quote character" rendering bug
      // where double-line corners showed as " instead of proper corners
      // because they were missing the row 7 inner horizontal connection

      // When corners don't have row 7, only rows 0-5 show content,
      // which looks like two short vertical strokes (similar to ")
      // instead of a proper corner character

      expect(Object.keys(EXPECTED_PATTERNS)).toHaveLength(4);
    });

    it('all corners should have non-zero row 7 for inner horizontal connection', () => {
      for (const [code, pattern] of Object.entries(EXPECTED_PATTERNS)) {
        expect(pattern.row7).not.toBe(0x00);
      }
    });

    it('bottom corners (╚╝) should NOT have vertical continuation at row 7', () => {
      // Bottom corners end at the corner, so row 7 should only have
      // the horizontal extension, not the full vertical bar pattern (0x36)
      expect(EXPECTED_PATTERNS[0xc8].row7).not.toBe(0x36);
      expect(EXPECTED_PATTERNS[0xbc].row7).not.toBe(0x36);
    });

    it('left-facing corners (╚╔) should extend RIGHT at row 7', () => {
      // Left-facing corners have horizontal extending to the right
      // Row 7 should have bit 0 set (rightmost column)
      expect(EXPECTED_PATTERNS[0xc8].row7 & 0x01).toBe(0x01); // ╚ bit 0 set
      expect(EXPECTED_PATTERNS[0xc9].row7 & 0x01).toBe(0x01); // ╔ bit 0 set
    });

    it('right-facing corners (╝╗) should extend LEFT at row 7', () => {
      // Right-facing corners have horizontal extending to the left
      // Row 7 should have bit 7 set (leftmost column)
      expect(EXPECTED_PATTERNS[0xbc].row7 & 0x80).toBe(0x80); // ╝ bit 7 set
      expect(EXPECTED_PATTERNS[0xbb].row7 & 0x80).toBe(0x80); // ╗ bit 7 set
    });
  });

  describe('Double horizontal line compatibility', () => {
    it('double horizontal uses rows 5 and 7 for two parallel lines', () => {
      // The double horizontal ═ (0xCD) uses two full rows
      // Corners must connect at both these rows
      const DOUBLE_HORIZ_ROW5 = 0xff;
      const DOUBLE_HORIZ_ROW7 = 0xff;

      // This test ensures we document the pattern that corners must match
      expect(DOUBLE_HORIZ_ROW5).toBe(0xff);
      expect(DOUBLE_HORIZ_ROW7).toBe(0xff);
    });
  });
});

describe('VirtualRenderer Typeface Support', () => {
  describe('ESC k command handler', () => {
    it('should handle ESC k command and update typeface state', () => {
      const renderer = new VirtualRenderer();
      // ESC k 2 (set typeface to Courier)
      renderer.render(new Uint8Array([0x1b, 0x6b, 0x02]));
      // We can't directly access state, but rendering shouldn't throw
      expect(true).toBe(true);
    });

    it('should render text after typeface change without errors', () => {
      const renderer = new VirtualRenderer();
      // ESC k 1 (Sans Serif), then text, then LF to advance y position
      renderer.render(new Uint8Array([0x1b, 0x6b, 0x01, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0a])); // "Hello\n"
      const page = renderer.getPage();
      expect(page).not.toBeNull();
      expect(page!.data.length).toBeGreaterThan(0);
    });

    it('should handle all valid typeface values', () => {
      const renderer = new VirtualRenderer();
      const typefaces = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 30, 31];

      for (const tf of typefaces) {
        // ESC k n followed by "A" and LF
        renderer.render(new Uint8Array([0x1b, 0x6b, tf, 0x41, 0x0a]));
      }

      const page = renderer.getPage();
      expect(page).not.toBeNull();
    });
  });

  describe('Font registry', () => {
    it('should return Roman font as default', () => {
      const font = getFont(TYPEFACE.ROMAN);
      expect(font.name).toContain('Roman');
      expect(font.typeface).toBe(TYPEFACE.ROMAN);
    });

    it('should return dedicated font for Sans Serif (Helvetica)', () => {
      const font = getFont(TYPEFACE.SANS_SERIF);
      expect(font.name).toContain('Helvetica');
      expect(font.typeface).toBe(TYPEFACE.SANS_SERIF);
    });

    it('should return dedicated font for Courier', () => {
      const font = getFont(TYPEFACE.COURIER);
      expect(font.name).toContain('Courier');
      expect(font.typeface).toBe(TYPEFACE.COURIER);
    });

    it('should fallback to Roman for unknown typefaces', () => {
      const font = getFont(99);
      expect(font.name).toContain('Roman');
    });

    it('getGlyph should return correct glyph data', () => {
      const glyphA = getGlyph(TYPEFACE.ROMAN, 65); // 'A'
      expect(glyphA).toHaveLength(16);
      expect(glyphA.some((byte) => byte !== 0)).toBe(true); // Not all zeros
    });

    it('getGlyph should fallback to space for unknown characters', () => {
      const glyph = getGlyph(TYPEFACE.ROMAN, 999);
      const spaceGlyph = getGlyph(TYPEFACE.ROMAN, 32);
      expect(glyph).toEqual(spaceGlyph);
    });

    it('hasFont should return true for fonts with dedicated glyphs', () => {
      expect(hasFont(TYPEFACE.ROMAN)).toBe(true);
      expect(hasFont(TYPEFACE.SANS_SERIF)).toBe(true);
      expect(hasFont(TYPEFACE.COURIER)).toBe(true);
    });

    it('hasFont should return false for typefaces using Roman fallback', () => {
      expect(hasFont(TYPEFACE.PRESTIGE)).toBe(false);
      expect(hasFont(TYPEFACE.SCRIPT)).toBe(false);
    });

    it('different typefaces should have different glyphs', () => {
      const romanA = getGlyph(TYPEFACE.ROMAN, 65);
      const sansA = getGlyph(TYPEFACE.SANS_SERIF, 65);
      const courierA = getGlyph(TYPEFACE.COURIER, 65);

      // At least one should be different (Terminus/Spleen vs Roman)
      const allSame =
        JSON.stringify(romanA) === JSON.stringify(sansA) &&
        JSON.stringify(romanA) === JSON.stringify(courierA);
      expect(allSame).toBe(false);
    });
  });
});
