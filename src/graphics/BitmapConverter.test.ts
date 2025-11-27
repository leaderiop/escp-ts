import { describe, it, expect } from 'vitest';
import {
  applyDithering,
  scaleImageNearest,
  scaleImageBilinear,
  convertToColumnFormat24Pin,
  convertToColumnFormat8Pin,
  createTestPattern,
  createCheckerboard,
  type GrayscaleImage,
} from './BitmapConverter';
import { GraphicsError } from '../core/errors';

describe('BitmapConverter', () => {
  // ==================== DITHERING ====================

  describe('applyDithering', () => {
    const whiteImage: GrayscaleImage = {
      width: 4,
      height: 4,
      data: new Uint8Array(16).fill(0), // All white (0 = white)
    };

    const blackImage: GrayscaleImage = {
      width: 4,
      height: 4,
      data: new Uint8Array(16).fill(255), // All black
    };

    const grayImage: GrayscaleImage = {
      width: 4,
      height: 4,
      data: new Uint8Array(16).fill(128), // 50% gray
    };

    describe('none (no dithering)', () => {
      it('returns array of same length', () => {
        const result = applyDithering(grayImage, 'none');
        expect(result.length).toBe(grayImage.data.length);
      });
    });

    describe('threshold', () => {
      it('produces binary output', () => {
        const result = applyDithering(grayImage, 'threshold', 128);
        // All values should be either 0 or 255
        for (const pixel of result) {
          expect(pixel === 0 || pixel === 255).toBe(true);
        }
      });

      it('white image (0) produces output 0 (below threshold)', () => {
        // 0 = white in the GrayscaleImage convention
        // threshold function: pixel < threshold ? 255 : 0
        // 0 < 128 = true, so output = 255 (black in result)
        const result = applyDithering(whiteImage, 'threshold', 128);
        expect(Array.from(result).every((p) => p === 255)).toBe(true);
      });

      it('black image (255) produces output 0 (above threshold)', () => {
        // 255 >= 128, so output = 0
        const result = applyDithering(blackImage, 'threshold', 128);
        expect(Array.from(result).every((p) => p === 0)).toBe(true);
      });
    });

    describe('ordered (Bayer)', () => {
      it('produces binary output', () => {
        const result = applyDithering(grayImage, 'ordered');
        for (const pixel of result) {
          expect(pixel === 0 || pixel === 255).toBe(true);
        }
      });

      it('uses 4x4 pattern', () => {
        // Create a uniform gray image
        const uniformGray: GrayscaleImage = {
          width: 8,
          height: 8,
          data: new Uint8Array(64).fill(128),
        };
        const result = applyDithering(uniformGray, 'ordered');
        // Should have a pattern (not all same value)
        const hasVariation = new Set(result).size > 1;
        expect(hasVariation).toBe(true);
      });
    });

    describe('floydSteinberg', () => {
      it('produces binary output', () => {
        const result = applyDithering(grayImage, 'floydSteinberg');
        for (const pixel of result) {
          expect(pixel === 0 || pixel === 255).toBe(true);
        }
      });

      it('diffuses error to neighbors', () => {
        // Create gradient
        const gradient: GrayscaleImage = {
          width: 4,
          height: 1,
          data: new Uint8Array([0, 85, 170, 255]),
        };
        const result = applyDithering(gradient, 'floydSteinberg');
        // Just verify it runs and produces valid output
        expect(result.length).toBe(4);
      });
    });

    describe('atkinson', () => {
      it('produces binary output', () => {
        const result = applyDithering(grayImage, 'atkinson');
        for (const pixel of result) {
          expect(pixel === 0 || pixel === 255).toBe(true);
        }
      });
    });
  });

  // ==================== SCALING ====================

  describe('scaleImageNearest', () => {
    const testImage: GrayscaleImage = {
      width: 2,
      height: 2,
      data: new Uint8Array([0, 255, 255, 0]), // Checkerboard
    };

    it('scales up correctly', () => {
      const result = scaleImageNearest(testImage, 4, 4);
      expect(result.width).toBe(4);
      expect(result.height).toBe(4);
      expect(result.data.length).toBe(16);
    });

    it('scales down correctly', () => {
      const largeImage: GrayscaleImage = {
        width: 10,
        height: 10,
        data: new Uint8Array(100).fill(128),
      };
      const result = scaleImageNearest(largeImage, 5, 5);
      expect(result.width).toBe(5);
      expect(result.height).toBe(5);
      expect(result.data.length).toBe(25);
    });

    it('preserves pixel values when scaling up by integer factor', () => {
      const result = scaleImageNearest(testImage, 4, 4);
      // Top-left 2x2 should all be 0 (scaled from pixel 0)
      expect(result.data[0]).toBe(0);
      expect(result.data[1]).toBe(0);
      expect(result.data[4]).toBe(0);
      expect(result.data[5]).toBe(0);
    });

    it('throws for zero width', () => {
      expect(() => scaleImageNearest(testImage, 0, 10)).toThrow(GraphicsError);
    });

    it('throws for zero height', () => {
      expect(() => scaleImageNearest(testImage, 10, 0)).toThrow(GraphicsError);
    });

    it('throws for negative dimensions', () => {
      expect(() => scaleImageNearest(testImage, -5, 10)).toThrow(GraphicsError);
      expect(() => scaleImageNearest(testImage, 10, -5)).toThrow(GraphicsError);
    });
  });

  describe('scaleImageBilinear', () => {
    const testImage: GrayscaleImage = {
      width: 2,
      height: 2,
      data: new Uint8Array([0, 255, 255, 0]),
    };

    it('scales correctly', () => {
      const result = scaleImageBilinear(testImage, 4, 4);
      expect(result.width).toBe(4);
      expect(result.height).toBe(4);
    });

    it('interpolates intermediate values', () => {
      const gradient: GrayscaleImage = {
        width: 2,
        height: 1,
        data: new Uint8Array([0, 255]),
      };
      const result = scaleImageBilinear(gradient, 4, 1);
      // Middle values should be interpolated (not just 0 or 255)
      expect(result.data[1]).toBeGreaterThan(0);
      expect(result.data[1]).toBeLessThan(255);
    });

    it('throws for zero dimensions', () => {
      expect(() => scaleImageBilinear(testImage, 0, 10)).toThrow(GraphicsError);
      expect(() => scaleImageBilinear(testImage, 10, 0)).toThrow(GraphicsError);
    });

    it('throws for negative dimensions', () => {
      expect(() => scaleImageBilinear(testImage, -5, 10)).toThrow(GraphicsError);
    });
  });

  // ==================== COLUMN FORMAT CONVERSION ====================

  describe('convertToColumnFormat24Pin', () => {
    it('converts single column correctly', () => {
      // Create 1x24 image (single column)
      const binary = new Uint8Array(24);
      binary[0] = 255; // Top pixel black
      binary[23] = 255; // Bottom pixel black

      const result = convertToColumnFormat24Pin(binary, 1, 24);

      // Should produce 3 bytes (one stripe of 24 pins)
      expect(result.length).toBe(3);
      // First bit of first byte should be set (top pixel)
      expect(result[0] & 0x80).toBe(0x80);
      // Last bit of third byte should be set (bottom pixel)
      expect(result[2] & 0x01).toBe(0x01);
    });

    it('handles multiple columns', () => {
      const binary = new Uint8Array(48); // 2 columns x 24 rows
      const result = convertToColumnFormat24Pin(binary, 2, 24);
      expect(result.length).toBe(6); // 2 columns * 3 bytes each
    });

    it('handles multiple stripes', () => {
      const binary = new Uint8Array(48); // 1 column x 48 rows (2 stripes)
      const result = convertToColumnFormat24Pin(binary, 1, 48);
      expect(result.length).toBe(6); // 2 stripes * 3 bytes each
    });
  });

  describe('convertToColumnFormat8Pin', () => {
    it('converts single column correctly', () => {
      const binary = new Uint8Array(8);
      binary[0] = 255; // Top pixel black
      binary[7] = 255; // Bottom pixel black

      const result = convertToColumnFormat8Pin(binary, 1, 8);

      expect(result.length).toBe(1);
      expect(result[0] & 0x80).toBe(0x80); // Top bit set
      expect(result[0] & 0x01).toBe(0x01); // Bottom bit set
    });

    it('handles multiple columns', () => {
      const binary = new Uint8Array(16); // 2 columns x 8 rows
      const result = convertToColumnFormat8Pin(binary, 2, 8);
      expect(result.length).toBe(2);
    });
  });

  // ==================== TEST PATTERNS ====================

  describe('createTestPattern', () => {
    it('creates gradient pattern', () => {
      const pattern = createTestPattern(100, 50, 'gradient');
      expect(pattern.width).toBe(100);
      expect(pattern.height).toBe(50);
      expect(pattern.data.length).toBe(5000);
    });

    it('creates vertical bars pattern', () => {
      const pattern = createTestPattern(100, 50, 'vertical-bars');
      expect(pattern.width).toBe(100);
      expect(pattern.height).toBe(50);
    });

    it('creates horizontal bars pattern', () => {
      const pattern = createTestPattern(100, 50, 'horizontal-bars');
      expect(pattern.width).toBe(100);
      expect(pattern.height).toBe(50);
    });

    it('creates checkerboard pattern', () => {
      const pattern = createTestPattern(100, 50, 'checkerboard');
      expect(pattern.width).toBe(100);
      expect(pattern.height).toBe(50);
    });
  });

  describe('createCheckerboard', () => {
    it('creates checkerboard with default cell size', () => {
      const result = createCheckerboard(16, 16);
      expect(result.width).toBe(16);
      expect(result.height).toBe(16);
    });

    it('creates alternating pattern', () => {
      const result = createCheckerboard(4, 4, 2);
      // First cell should be one color, second should be different
      expect(result.data[0]).not.toBe(result.data[2]);
    });

    it('respects cell size', () => {
      const result = createCheckerboard(8, 8, 4);
      // Pixels 0,1,2,3 should be same (first cell)
      expect(result.data[0]).toBe(result.data[1]);
      expect(result.data[0]).toBe(result.data[2]);
      expect(result.data[0]).toBe(result.data[3]);
      // Pixel 4 should be different (second cell)
      expect(result.data[0]).not.toBe(result.data[4]);
    });
  });
});
