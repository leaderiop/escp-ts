import { describe, it, expect } from 'vitest';
import {
  calculateBorderThickness,
  calculateCharWidth,
  resolveContentDimensions,
  resolveInnerContentDimensions,
  getHorizontalBorderThickness,
  getVerticalBorderThickness,
  resolveBorderVariant,
  hasBorder,
  DOTS_PER_INCH,
  DEFAULT_LINE_SPACING,
  DEFAULT_CPI,
  type BorderThickness,
} from '../borderBox';
import { resolvePadding } from '../nodes';

describe('borderBox utilities', () => {
  describe('calculateCharWidth', () => {
    it('calculates correct character width at 10 CPI', () => {
      expect(calculateCharWidth(10)).toBe(36); // 360/10 = 36
    });

    it('calculates correct character width at 12 CPI', () => {
      expect(calculateCharWidth(12)).toBe(30); // 360/12 = 30
    });

    it('calculates correct character width at 15 CPI', () => {
      expect(calculateCharWidth(15)).toBe(24); // 360/15 = 24
    });

    it('calculates correct character width at 17 CPI', () => {
      expect(calculateCharWidth(17)).toBe(21); // 360/17 ≈ 21
    });

    it('calculates correct character width at 20 CPI', () => {
      expect(calculateCharWidth(20)).toBe(18); // 360/20 = 18
    });

    it('uses default CPI (10) when not specified', () => {
      expect(calculateCharWidth()).toBe(36);
    });
  });

  describe('calculateBorderThickness', () => {
    it('calculates correct border thickness at default values', () => {
      const thickness = calculateBorderThickness();
      expect(thickness).toEqual({
        top: 60, // DEFAULT_LINE_SPACING
        right: 36, // 360/10
        bottom: 60,
        left: 36,
      });
    });

    it('calculates correct border thickness at 12 CPI', () => {
      const thickness = calculateBorderThickness(12, 60);
      expect(thickness).toEqual({
        top: 60,
        right: 30, // 360/12
        bottom: 60,
        left: 30,
      });
    });

    it('calculates correct border thickness with custom line spacing', () => {
      const thickness = calculateBorderThickness(10, 72);
      expect(thickness).toEqual({
        top: 72,
        right: 36,
        bottom: 72,
        left: 36,
      });
    });
  });

  describe('getHorizontalBorderThickness', () => {
    it('returns sum of left and right border thickness', () => {
      const thickness: BorderThickness = { top: 60, right: 36, bottom: 60, left: 36 };
      expect(getHorizontalBorderThickness(thickness)).toBe(72);
    });

    it('handles asymmetric borders', () => {
      const thickness: BorderThickness = { top: 60, right: 40, bottom: 60, left: 30 };
      expect(getHorizontalBorderThickness(thickness)).toBe(70);
    });
  });

  describe('getVerticalBorderThickness', () => {
    it('returns sum of top and bottom border thickness', () => {
      const thickness: BorderThickness = { top: 60, right: 36, bottom: 60, left: 36 };
      expect(getVerticalBorderThickness(thickness)).toBe(120);
    });

    it('handles asymmetric borders', () => {
      const thickness: BorderThickness = { top: 50, right: 36, bottom: 70, left: 36 };
      expect(getVerticalBorderThickness(thickness)).toBe(120);
    });
  });

  describe('resolveContentDimensions', () => {
    const defaultThickness: BorderThickness = { top: 60, right: 36, bottom: 60, left: 36 };

    it('subtracts border thickness from fixed numeric width', () => {
      const result = resolveContentDimensions(500, undefined, defaultThickness);
      expect(result.contentWidth).toBe(428); // 500 - 72 = 428
      expect(result.contentHeight).toBeUndefined();
    });

    it('subtracts border thickness from fixed numeric height', () => {
      const result = resolveContentDimensions(undefined, 300, defaultThickness);
      expect(result.contentWidth).toBeUndefined();
      expect(result.contentHeight).toBe(180); // 300 - 120 = 180
    });

    it('handles both width and height', () => {
      const result = resolveContentDimensions(500, 300, defaultThickness);
      expect(result.contentWidth).toBe(428);
      expect(result.contentHeight).toBe(180);
    });

    it('passes through "auto" width', () => {
      const result = resolveContentDimensions('auto', undefined, defaultThickness);
      expect(result.contentWidth).toBe('auto');
    });

    it('passes through "fill" width', () => {
      const result = resolveContentDimensions('fill', undefined, defaultThickness);
      expect(result.contentWidth).toBe('fill');
    });

    it('passes through percentage width', () => {
      const result = resolveContentDimensions('50%', undefined, defaultThickness);
      expect(result.contentWidth).toBe('50%');
    });

    it('returns 0 when width is smaller than border thickness', () => {
      const result = resolveContentDimensions(50, undefined, defaultThickness);
      expect(result.contentWidth).toBe(0); // max(0, 50 - 72) = 0
    });

    it('returns 0 when height is smaller than border thickness', () => {
      const result = resolveContentDimensions(undefined, 100, defaultThickness);
      expect(result.contentHeight).toBe(0); // max(0, 100 - 120) = 0
    });

    it('handles undefined dimensions', () => {
      const result = resolveContentDimensions(undefined, undefined, defaultThickness);
      expect(result.contentWidth).toBeUndefined();
      expect(result.contentHeight).toBeUndefined();
    });
  });

  describe('resolveInnerContentDimensions', () => {
    const defaultThickness: BorderThickness = { top: 60, right: 36, bottom: 60, left: 36 };

    it('subtracts both border and padding from dimensions', () => {
      const padding = resolvePadding({ top: 10, right: 20, bottom: 10, left: 20 });
      const result = resolveInnerContentDimensions(500, 300, defaultThickness, padding);
      // Width: 500 - 72 (border) - 40 (padding) = 388
      expect(result.contentWidth).toBe(388);
      // Height: 300 - 120 (border) - 20 (padding) = 160
      expect(result.contentHeight).toBe(160);
    });

    it('handles uniform padding', () => {
      const padding = resolvePadding(10);
      const result = resolveInnerContentDimensions(500, 300, defaultThickness, padding);
      // Width: 500 - 72 (border) - 20 (padding) = 408
      expect(result.contentWidth).toBe(408);
      // Height: 300 - 120 (border) - 20 (padding) = 160
      expect(result.contentHeight).toBe(160);
    });

    it('passes through non-numeric dimensions', () => {
      const padding = resolvePadding(10);
      const result = resolveInnerContentDimensions('fill', 'auto', defaultThickness, padding);
      expect(result.contentWidth).toBe('fill');
      expect(result.contentHeight).toBe('auto');
    });
  });

  describe('resolveBorderVariant', () => {
    it('returns "none" for false', () => {
      expect(resolveBorderVariant(false)).toBe('none');
    });

    it('returns "cp437-single" for true', () => {
      expect(resolveBorderVariant(true)).toBe('cp437-single');
    });

    it('returns "cp437-single" for "single"', () => {
      expect(resolveBorderVariant('single')).toBe('cp437-single');
    });

    it('returns "cp437-double" for "double"', () => {
      expect(resolveBorderVariant('double')).toBe('cp437-double');
    });

    it('returns "single" (ASCII) for "ascii"', () => {
      expect(resolveBorderVariant('ascii')).toBe('single');
    });

    it('returns "cp437-single" for undefined', () => {
      expect(resolveBorderVariant(undefined)).toBe('cp437-single');
    });
  });

  describe('hasBorder', () => {
    it('returns false for undefined', () => {
      expect(hasBorder(undefined)).toBe(false);
    });

    it('returns false for "none"', () => {
      expect(hasBorder('none')).toBe(false);
    });

    it('returns true for "single"', () => {
      expect(hasBorder('single')).toBe(true);
    });

    it('returns true for "cp437-single"', () => {
      expect(hasBorder('cp437-single')).toBe(true);
    });

    it('returns true for "cp437-double"', () => {
      expect(hasBorder('cp437-double')).toBe(true);
    });

    it('returns true for "rounded"', () => {
      expect(hasBorder('rounded')).toBe(true);
    });
  });

  describe('constants', () => {
    it('exports DOTS_PER_INCH as 360', () => {
      expect(DOTS_PER_INCH).toBe(360);
    });

    it('exports DEFAULT_LINE_SPACING as 60', () => {
      expect(DEFAULT_LINE_SPACING).toBe(60);
    });

    it('exports DEFAULT_CPI as 10', () => {
      expect(DEFAULT_CPI).toBe(10);
    });
  });
});
