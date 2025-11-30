/**
 * Tests for TextMeasurer
 *
 * These tests cover the text measurement utilities that integrate with Yoga layout:
 * - createTextMeasureFunc: Creates Yoga-compatible measure functions for text
 * - createLineMeasureFunc: Creates measure functions for line elements
 * - measureText: Utility for quick text width calculations
 * - getTextHeight: Calculate text height based on line spacing and style
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MeasureMode } from 'yoga-layout/load';
import {
  createTextMeasureFunc,
  createLineMeasureFunc,
  measureText,
  getTextHeight,
  type MeasureSize,
} from '../TextMeasurer';
import { DEFAULT_STYLE, type ResolvedStyle } from '../../nodes';
import * as CoreModule from '@escp/core';

// Mock the @escp/core module
vi.mock('@escp/core', async (importOriginal) => {
  const actual = await importOriginal<typeof CoreModule>();
  return {
    ...actual,
    calculateTextWidth: vi.fn(),
  };
});

const mockedCalculateTextWidth = vi.mocked(CoreModule.calculateTextWidth);

describe('TextMeasurer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('measureText', () => {
    it('should call calculateTextWidth with correct parameters', () => {
      mockedCalculateTextWidth.mockReturnValue(100);

      const content = 'Hello World';
      const style: ResolvedStyle = { ...DEFAULT_STYLE };
      const interCharSpace = 2;

      const result = measureText(content, style, interCharSpace);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith(
        content,
        style.cpi,
        false, // proportional is always false
        style.condensed,
        style.doubleWidth,
        interCharSpace
      );
      expect(result).toBe(100);
    });

    it('should handle different CPI values', () => {
      mockedCalculateTextWidth.mockReturnValue(72);

      const style10cpi: ResolvedStyle = { ...DEFAULT_STYLE, cpi: 10 };
      measureText('Test', style10cpi, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith('Test', 10, false, false, false, 0);

      mockedCalculateTextWidth.mockClear();
      mockedCalculateTextWidth.mockReturnValue(60);

      const style12cpi: ResolvedStyle = { ...DEFAULT_STYLE, cpi: 12 };
      measureText('Test', style12cpi, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith('Test', 12, false, false, false, 0);
    });

    it('should pass condensed mode correctly', () => {
      mockedCalculateTextWidth.mockReturnValue(60);

      const condensedStyle: ResolvedStyle = { ...DEFAULT_STYLE, condensed: true };
      measureText('Test', condensedStyle, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith(
        'Test',
        10,
        false,
        true, // condensed
        false,
        0
      );
    });

    it('should pass double-width mode correctly', () => {
      mockedCalculateTextWidth.mockReturnValue(144);

      const doubleWidthStyle: ResolvedStyle = { ...DEFAULT_STYLE, doubleWidth: true };
      measureText('Test', doubleWidthStyle, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith(
        'Test',
        10,
        false,
        false,
        true, // doubleWidth
        0
      );
    });

    it('should pass inter-character spacing correctly', () => {
      mockedCalculateTextWidth.mockReturnValue(120);

      const style: ResolvedStyle = { ...DEFAULT_STYLE };
      measureText('Test', style, 5);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith(
        'Test',
        10,
        false,
        false,
        false,
        5 // interCharSpace
      );
    });

    it('should handle empty string', () => {
      mockedCalculateTextWidth.mockReturnValue(0);

      const result = measureText('', DEFAULT_STYLE, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith('', 10, false, false, false, 0);
      expect(result).toBe(0);
    });

    it('should handle special characters', () => {
      mockedCalculateTextWidth.mockReturnValue(180);

      const content = '!@#$%^&*()_+{}|:"<>?';
      const result = measureText(content, DEFAULT_STYLE, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith(content, 10, false, false, false, 0);
      expect(result).toBe(180);
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      mockedCalculateTextWidth.mockReturnValue(36000);

      const result = measureText(longText, DEFAULT_STYLE, 0);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith(longText, 10, false, false, false, 0);
      expect(result).toBe(36000);
    });

    it('should handle combined text styles', () => {
      mockedCalculateTextWidth.mockReturnValue(86);

      const combinedStyle: ResolvedStyle = {
        ...DEFAULT_STYLE,
        cpi: 12,
        condensed: true,
        doubleWidth: true,
      };
      measureText('Test', combinedStyle, 3);

      expect(mockedCalculateTextWidth).toHaveBeenCalledWith('Test', 12, false, true, true, 3);
    });
  });

  describe('getTextHeight', () => {
    it('should return line spacing for normal text', () => {
      const style: ResolvedStyle = { ...DEFAULT_STYLE };
      const lineSpacing = 24;

      const result = getTextHeight(style, lineSpacing);

      expect(result).toBe(24);
    });

    it('should return double height for doubleHeight style', () => {
      const style: ResolvedStyle = { ...DEFAULT_STYLE, doubleHeight: true };
      const lineSpacing = 24;

      const result = getTextHeight(style, lineSpacing);

      expect(result).toBe(48);
    });

    it('should work with different line spacings', () => {
      const normalStyle: ResolvedStyle = { ...DEFAULT_STYLE };
      const doubleHeightStyle: ResolvedStyle = { ...DEFAULT_STYLE, doubleHeight: true };

      expect(getTextHeight(normalStyle, 18)).toBe(18);
      expect(getTextHeight(normalStyle, 30)).toBe(30);
      expect(getTextHeight(doubleHeightStyle, 18)).toBe(36);
      expect(getTextHeight(doubleHeightStyle, 30)).toBe(60);
    });

    it('should handle zero line spacing', () => {
      const style: ResolvedStyle = { ...DEFAULT_STYLE };

      expect(getTextHeight(style, 0)).toBe(0);
    });

    it('should handle doubleHeight with zero line spacing', () => {
      const style: ResolvedStyle = { ...DEFAULT_STYLE, doubleHeight: true };

      // 0 * 2 = 0
      expect(getTextHeight(style, 0)).toBe(0);
    });
  });

  describe('createTextMeasureFunc', () => {
    const defaultStyle: ResolvedStyle = { ...DEFAULT_STYLE };
    const lineSpacing = 24;
    const interCharSpace = 0;

    beforeEach(() => {
      // Default mock behavior
      mockedCalculateTextWidth.mockReturnValue(100);
    });

    it('should return a function', () => {
      const measureFunc = createTextMeasureFunc('Test', defaultStyle, lineSpacing, interCharSpace);

      expect(typeof measureFunc).toBe('function');
    });

    describe('MeasureMode.Undefined (no constraints)', () => {
      it('should return natural text dimensions', () => {
        mockedCalculateTextWidth.mockReturnValue(150);

        const measureFunc = createTextMeasureFunc(
          'Hello',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(
          1000, // width (unused in Undefined mode)
          MeasureMode.Undefined,
          1000, // height (unused in Undefined mode)
          MeasureMode.Undefined
        );

        expect(result.width).toBe(150);
        expect(result.height).toBe(24);
      });

      it('should calculate correct height for double-height text', () => {
        mockedCalculateTextWidth.mockReturnValue(100);
        const doubleHeightStyle: ResolvedStyle = { ...defaultStyle, doubleHeight: true };

        const measureFunc = createTextMeasureFunc(
          'Test',
          doubleHeightStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(result.height).toBe(48); // 24 * 2
      });
    });

    describe('MeasureMode.Exactly (fixed dimensions)', () => {
      it('should return exactly the specified width', () => {
        mockedCalculateTextWidth.mockReturnValue(150);

        const measureFunc = createTextMeasureFunc(
          'Hello',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(200, MeasureMode.Exactly, 0, MeasureMode.Undefined);

        expect(result.width).toBe(200); // Uses exact width, not natural width
        expect(result.height).toBe(24); // Natural height
      });

      it('should return exactly the specified height', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 50, MeasureMode.Exactly);

        expect(result.width).toBe(100); // Natural width
        expect(result.height).toBe(50); // Exact height
      });

      it('should return exactly specified dimensions for both', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(300, MeasureMode.Exactly, 60, MeasureMode.Exactly);

        expect(result.width).toBe(300);
        expect(result.height).toBe(60);
      });
    });

    describe('MeasureMode.AtMost (maximum constraints)', () => {
      it('should use natural width when it fits within constraint', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(200, MeasureMode.AtMost, 0, MeasureMode.Undefined);

        expect(result.width).toBe(100); // Natural width (100) < max (200)
      });

      it('should constrain width when natural exceeds maximum', () => {
        mockedCalculateTextWidth.mockReturnValue(300);

        const measureFunc = createTextMeasureFunc(
          'Long text',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(200, MeasureMode.AtMost, 0, MeasureMode.Undefined);

        expect(result.width).toBe(200); // Constrained to max (200) < natural (300)
      });

      it('should use natural height when it fits within constraint', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 50, MeasureMode.AtMost);

        expect(result.height).toBe(24); // Natural height (24) < max (50)
      });

      it('should constrain height when natural exceeds maximum', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 10, MeasureMode.AtMost);

        expect(result.height).toBe(10); // Constrained to max (10) < natural (24)
      });

      it('should handle AtMost for both dimensions', () => {
        mockedCalculateTextWidth.mockReturnValue(150);
        const doubleHeightStyle: ResolvedStyle = { ...defaultStyle, doubleHeight: true };

        const measureFunc = createTextMeasureFunc(
          'Test',
          doubleHeightStyle,
          lineSpacing,
          interCharSpace
        );
        // Natural: width=150, height=48
        const result = measureFunc(100, MeasureMode.AtMost, 30, MeasureMode.AtMost);

        expect(result.width).toBe(100); // Constrained
        expect(result.height).toBe(30); // Constrained
      });
    });

    describe('mixed measure modes', () => {
      it('should handle width=Exactly, height=AtMost', () => {
        mockedCalculateTextWidth.mockReturnValue(80);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(200, MeasureMode.Exactly, 100, MeasureMode.AtMost);

        expect(result.width).toBe(200); // Exactly
        expect(result.height).toBe(24); // Natural (24) < AtMost (100)
      });

      it('should handle width=AtMost, height=Exactly', () => {
        mockedCalculateTextWidth.mockReturnValue(300);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(200, MeasureMode.AtMost, 50, MeasureMode.Exactly);

        expect(result.width).toBe(200); // Constrained
        expect(result.height).toBe(50); // Exactly
      });

      it('should handle width=Undefined, height=Exactly', () => {
        mockedCalculateTextWidth.mockReturnValue(120);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 40, MeasureMode.Exactly);

        expect(result.width).toBe(120); // Natural
        expect(result.height).toBe(40); // Exactly
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        mockedCalculateTextWidth.mockReturnValue(0);

        const measureFunc = createTextMeasureFunc('', defaultStyle, lineSpacing, interCharSpace);
        const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(result.width).toBe(0);
        expect(result.height).toBe(24);
      });

      it('should handle zero constraint values', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const measureFunc = createTextMeasureFunc(
          'Test',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Exactly, 0, MeasureMode.Exactly);

        expect(result.width).toBe(0);
        expect(result.height).toBe(0);
      });

      it('should handle text with special characters', () => {
        mockedCalculateTextWidth.mockReturnValue(200);

        const measureFunc = createTextMeasureFunc(
          'Price: $99.99!',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(result.width).toBe(200);
        expect(result.height).toBe(24);
      });

      it('should handle unicode characters', () => {
        mockedCalculateTextWidth.mockReturnValue(180);

        const measureFunc = createTextMeasureFunc(
          'Hello World',
          defaultStyle,
          lineSpacing,
          interCharSpace
        );
        const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(result.width).toBe(180);
      });

      it('should use correct parameters when calling calculateTextWidth', () => {
        mockedCalculateTextWidth.mockReturnValue(100);

        const style: ResolvedStyle = {
          ...DEFAULT_STYLE,
          cpi: 15,
          condensed: true,
          doubleWidth: true,
        };

        const measureFunc = createTextMeasureFunc('Test', style, 30, 5);
        measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(mockedCalculateTextWidth).toHaveBeenCalledWith(
          'Test',
          15, // cpi from style
          false, // proportional always false
          true, // condensed from style
          true, // doubleWidth from style
          5 // interCharSpace passed to createTextMeasureFunc
        );
      });
    });
  });

  describe('createLineMeasureFunc', () => {
    const lineSpacing = 24;

    describe('horizontal lines', () => {
      it('should return fixed length when specified', () => {
        const measureFunc = createLineMeasureFunc(100, lineSpacing, 'horizontal');
        const result = measureFunc(200, MeasureMode.Undefined, 50, MeasureMode.Undefined);

        expect(result.width).toBe(100); // Fixed length
        expect(result.height).toBe(24); // Line spacing
      });

      it('should return available width when length is fill and mode is AtMost', () => {
        const measureFunc = createLineMeasureFunc('fill', lineSpacing, 'horizontal');
        const result = measureFunc(300, MeasureMode.AtMost, 50, MeasureMode.Undefined);

        expect(result.width).toBe(300); // Fills available width
        expect(result.height).toBe(24);
      });

      it('should return available width when length is fill and mode is Exactly', () => {
        const measureFunc = createLineMeasureFunc('fill', lineSpacing, 'horizontal');
        const result = measureFunc(250, MeasureMode.Exactly, 50, MeasureMode.Undefined);

        expect(result.width).toBe(250); // Fills available width
        expect(result.height).toBe(24);
      });

      it('should return zero width when length is fill and mode is Undefined', () => {
        const measureFunc = createLineMeasureFunc('fill', lineSpacing, 'horizontal');
        const result = measureFunc(200, MeasureMode.Undefined, 50, MeasureMode.Undefined);

        expect(result.width).toBe(0); // Will be filled by flex
        expect(result.height).toBe(24);
      });

      it('should return zero width when length is undefined and mode is Undefined', () => {
        const measureFunc = createLineMeasureFunc(undefined, lineSpacing, 'horizontal');
        const result = measureFunc(200, MeasureMode.Undefined, 50, MeasureMode.Undefined);

        expect(result.width).toBe(0); // Will be filled by flex
        expect(result.height).toBe(24);
      });

      it('should fill available width when length is undefined and mode is constrained', () => {
        const measureFunc = createLineMeasureFunc(undefined, lineSpacing, 'horizontal');
        const result = measureFunc(400, MeasureMode.AtMost, 50, MeasureMode.Undefined);

        expect(result.width).toBe(400); // Fills available width
        expect(result.height).toBe(24);
      });
    });

    describe('vertical lines', () => {
      it('should return fixed length when specified', () => {
        const measureFunc = createLineMeasureFunc(150, lineSpacing, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 200, MeasureMode.Undefined);

        expect(result.width).toBe(24); // Line spacing (for vertical lines)
        expect(result.height).toBe(150); // Fixed length
      });

      it('should return available height when length is fill and mode is AtMost', () => {
        const measureFunc = createLineMeasureFunc('fill', lineSpacing, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 400, MeasureMode.AtMost);

        expect(result.width).toBe(24);
        expect(result.height).toBe(400); // Fills available height
      });

      it('should return available height when length is fill and mode is Exactly', () => {
        const measureFunc = createLineMeasureFunc('fill', lineSpacing, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 350, MeasureMode.Exactly);

        expect(result.width).toBe(24);
        expect(result.height).toBe(350); // Fills available height
      });

      it('should return zero height when length is fill and mode is Undefined', () => {
        const measureFunc = createLineMeasureFunc('fill', lineSpacing, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 200, MeasureMode.Undefined);

        expect(result.width).toBe(24);
        expect(result.height).toBe(0); // Will be filled by flex
      });

      it('should return zero height when length is undefined and mode is Undefined', () => {
        const measureFunc = createLineMeasureFunc(undefined, lineSpacing, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 200, MeasureMode.Undefined);

        expect(result.width).toBe(24);
        expect(result.height).toBe(0); // Will be filled by flex
      });

      it('should fill available height when length is undefined and mode is constrained', () => {
        const measureFunc = createLineMeasureFunc(undefined, lineSpacing, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 500, MeasureMode.AtMost);

        expect(result.width).toBe(24);
        expect(result.height).toBe(500); // Fills available height
      });
    });

    describe('different line spacings', () => {
      it('should use provided line spacing for horizontal line height', () => {
        const measureFunc = createLineMeasureFunc(100, 30, 'horizontal');
        const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(result.height).toBe(30);
      });

      it('should use provided line spacing for vertical line width', () => {
        const measureFunc = createLineMeasureFunc(100, 18, 'vertical');
        const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

        expect(result.width).toBe(18);
      });
    });

    describe('edge cases', () => {
      it('should handle zero length', () => {
        const measureFunc = createLineMeasureFunc(0, lineSpacing, 'horizontal');
        const result = measureFunc(100, MeasureMode.Undefined, 50, MeasureMode.Undefined);

        expect(result.width).toBe(0);
        expect(result.height).toBe(24);
      });

      it('should handle zero line spacing for horizontal', () => {
        const measureFunc = createLineMeasureFunc(100, 0, 'horizontal');
        const result = measureFunc(100, MeasureMode.Undefined, 50, MeasureMode.Undefined);

        expect(result.width).toBe(100);
        expect(result.height).toBe(0);
      });

      it('should handle zero line spacing for vertical', () => {
        const measureFunc = createLineMeasureFunc(100, 0, 'vertical');
        const result = measureFunc(50, MeasureMode.Undefined, 100, MeasureMode.Undefined);

        expect(result.width).toBe(0);
        expect(result.height).toBe(100);
      });

      it('should handle large length values', () => {
        const measureFunc = createLineMeasureFunc(10000, lineSpacing, 'horizontal');
        const result = measureFunc(100, MeasureMode.Undefined, 50, MeasureMode.Undefined);

        expect(result.width).toBe(10000);
        expect(result.height).toBe(24);
      });
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      // Use realistic mock values for integration tests
      mockedCalculateTextWidth.mockImplementation((text: string, cpi: number) => {
        // Approximate: 360/cpi dots per character
        const baseWidth = Math.round(360 / cpi);
        return text.length * baseWidth;
      });
    });

    it('should measure text correctly at 10 CPI', () => {
      const measureFunc = createTextMeasureFunc('Hello', DEFAULT_STYLE, 24, 0);
      const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

      // 5 characters * 36 dots/char (at 10 CPI) = 180
      expect(result.width).toBe(180);
      expect(result.height).toBe(24);
    });

    it('should measure text correctly at 12 CPI', () => {
      const style12cpi: ResolvedStyle = { ...DEFAULT_STYLE, cpi: 12 };
      const measureFunc = createTextMeasureFunc('Hello', style12cpi, 24, 0);
      const result = measureFunc(0, MeasureMode.Undefined, 0, MeasureMode.Undefined);

      // 5 characters * 30 dots/char (at 12 CPI) = 150
      expect(result.width).toBe(150);
      expect(result.height).toBe(24);
    });

    it('should constrain long text within AtMost width', () => {
      const measureFunc = createTextMeasureFunc(
        'This is a very long line of text',
        DEFAULT_STYLE,
        24,
        0
      );
      const result = measureFunc(500, MeasureMode.AtMost, 0, MeasureMode.Undefined);

      // Natural width would be 32 * 36 = 1152, but constrained to 500
      expect(result.width).toBe(500);
    });
  });
});
