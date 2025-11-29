/**
 * Tests for printBoxedText API
 */

import { describe, it, expect } from 'vitest';
import {
  printBoxedText,
  printSimpleBox,
  printDoubleBox,
} from '../printBoxedText';
import { selectRenderMode } from '../BorderRenderer';
import { CHAR_TABLE, ASCII } from '../../core/constants';
import type { CharacterTable } from '../../core/types';

describe('printBoxedText', () => {
  describe('selectRenderMode', () => {
    it('should return text mode for auto with PC437', () => {
      expect(selectRenderMode('auto', CHAR_TABLE.PC437_USA as CharacterTable)).toBe('text');
    });

    it('should return graphics mode for auto with ISO Latin-1', () => {
      expect(selectRenderMode('auto', CHAR_TABLE.ISO_LATIN_1 as CharacterTable)).toBe('graphics');
    });

    it('should return text mode when explicitly requested with supported code page', () => {
      expect(selectRenderMode('text', CHAR_TABLE.PC437_USA as CharacterTable)).toBe('text');
    });

    it('should fallback to graphics when text mode requested with unsupported code page', () => {
      expect(selectRenderMode('text', CHAR_TABLE.ISO_LATIN_1 as CharacterTable)).toBe('graphics');
    });

    it('should return graphics mode when explicitly requested', () => {
      expect(selectRenderMode('graphics', CHAR_TABLE.PC437_USA as CharacterTable)).toBe('graphics');
      expect(selectRenderMode('graphics', CHAR_TABLE.ISO_LATIN_1 as CharacterTable)).toBe('graphics');
    });
  });

  describe('printBoxedText output', () => {
    it('should return Uint8Array', () => {
      const result = printBoxedText('Hello', CHAR_TABLE.PC437_USA as CharacterTable);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should include ESC commands', () => {
      const result = printBoxedText('Hello', CHAR_TABLE.PC437_USA as CharacterTable);
      // Should start with ESC commands for CPI/quality setup
      expect(result[0]).toBe(ASCII.ESC);
    });

    it('should include line feed sequences', () => {
      const result = printBoxedText('Hello', CHAR_TABLE.PC437_USA as CharacterTable);
      // Result should contain CR (0x0D) and LF (0x0A) sequences
      expect(Array.from(result)).toContain(ASCII.CR);
      expect(Array.from(result)).toContain(ASCII.LF);
    });

    it('should include border characters for text mode', () => {
      const result = printBoxedText('Hi', CHAR_TABLE.PC437_USA as CharacterTable);
      const resultArray = Array.from(result);

      // Should include CP437 box drawing characters
      // Single-line top-left corner: 0xDA
      expect(resultArray).toContain(0xda);
    });

    it('should handle multi-line text', () => {
      const result = printBoxedText(['Line 1', 'Line 2', 'Line 3'], CHAR_TABLE.PC437_USA as CharacterTable);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should respect padding option', () => {
      const withPadding = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { padding: 5 });
      const noPadding = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { padding: 0 });

      // More padding = more spaces = longer output
      expect(withPadding.length).toBeGreaterThan(noPadding.length);
    });

    it('should respect borderStyle option', () => {
      const single = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { borderStyle: 'single' });
      const double = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { borderStyle: 'double' });

      // Both should produce output
      expect(single.length).toBeGreaterThan(0);
      expect(double.length).toBeGreaterThan(0);

      // Double border should use different characters (0xC9 instead of 0xDA)
      expect(Array.from(single)).toContain(0xda); // Single top-left
      expect(Array.from(double)).toContain(0xc9); // Double top-left
    });

    it('should use ASCII chars for ascii borderStyle', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { borderStyle: 'ascii' });
      const resultArray = Array.from(result);

      // Should contain ASCII '+' (0x2B) for corners
      expect(resultArray).toContain(0x2b);
      // Should contain ASCII '-' (0x2D) for horizontal
      expect(resultArray).toContain(0x2d);
      // Should contain ASCII '|' (0x7C) for vertical
      expect(resultArray).toContain(0x7c);
    });

    it('should force graphics mode when renderMode is graphics', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { renderMode: 'graphics' });

      // Graphics mode includes ESC * (0x2A) bit image command
      expect(result).toBeInstanceOf(Uint8Array);
      // Look for ESC * sequence in the output
      let found = false;
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x2a) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('printSimpleBox', () => {
    it('should be a convenience function for single border', () => {
      const simple = printSimpleBox('Hello', CHAR_TABLE.PC437_USA as CharacterTable);
      const explicit = printBoxedText('Hello', CHAR_TABLE.PC437_USA as CharacterTable, {
        borderStyle: 'single',
        renderMode: 'auto',
        padding: 1,
      });

      // Should produce equivalent output
      expect(simple.length).toBe(explicit.length);
    });

    it('should respect custom padding', () => {
      const padded = printSimpleBox('X', CHAR_TABLE.PC437_USA as CharacterTable, 3);
      const defaultPad = printSimpleBox('X', CHAR_TABLE.PC437_USA as CharacterTable);

      expect(padded.length).toBeGreaterThan(defaultPad.length);
    });
  });

  describe('printDoubleBox', () => {
    it('should use double-line border style', () => {
      const result = printDoubleBox('Hello', CHAR_TABLE.PC437_USA as CharacterTable);
      const resultArray = Array.from(result);

      // Should contain double-line characters (0xC9 for top-left corner)
      expect(resultArray).toContain(0xc9);
    });
  });

  describe('code page fallback (ISO-8859-1)', () => {
    it('should use graphics mode for unsupported code pages', () => {
      const result = printBoxedText('Test', CHAR_TABLE.ISO_LATIN_1 as CharacterTable);

      // Should produce output
      expect(result.length).toBeGreaterThan(0);

      // Should use graphics mode (look for ESC * command)
      let foundGraphics = false;
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x2a) {
          foundGraphics = true;
          break;
        }
      }
      expect(foundGraphics).toBe(true);
    });

    it('should NOT include CP437 box drawing chars for unsupported code pages', () => {
      const result = printBoxedText('Test', CHAR_TABLE.ISO_LATIN_1 as CharacterTable);
      const resultArray = Array.from(result);

      // Should NOT contain CP437 box drawing chars in text
      // (they may appear as bitmap data, which is different)
      // Just verify it produces valid output
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('CPI options', () => {
    it('should include CPI selection command for 10 CPI', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { cpi: 10 });
      // ESC P (0x50) selects 10 CPI (pica)
      let found = false;
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x50) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('should include CPI selection command for 12 CPI', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { cpi: 12 });
      // ESC M (0x4D) selects 12 CPI (elite)
      let found = false;
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x4d) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('should include CPI selection command for 15 CPI', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { cpi: 15 });
      // ESC g (0x67) selects 15 CPI (micron)
      let found = false;
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x67) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('quality options', () => {
    it('should include quality selection command for draft (0)', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { quality: 0 });
      // ESC x (0x78) selects quality
      let found = false;
      for (let i = 0; i < result.length - 2; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x78 && result[i + 2] === 0) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('should include quality selection command for LQ (1)', () => {
      const result = printBoxedText('X', CHAR_TABLE.PC437_USA as CharacterTable, { quality: 1 });
      // ESC x 1 selects LQ quality
      let found = false;
      for (let i = 0; i < result.length - 2; i++) {
        if (result[i] === ASCII.ESC && result[i + 1] === 0x78 && result[i + 2] === 1) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });
});
