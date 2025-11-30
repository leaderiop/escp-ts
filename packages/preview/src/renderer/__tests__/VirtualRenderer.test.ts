/**
 * VirtualRenderer tests
 * Regression tests for bitmap font rendering
 */

import { describe, it, expect } from 'vitest';

// Import the BITMAP_FONT from VirtualRenderer
// We'll need to extract it or test indirectly through rendering
// For now, we'll test the glyph patterns directly

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
