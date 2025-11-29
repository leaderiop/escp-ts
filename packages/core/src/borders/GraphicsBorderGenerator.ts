/**
 * Graphics Border Generator
 * Generates bitmap data for border lines using ESC * at 120 DPI
 * Used when code page doesn't support box-drawing characters
 */

import { BIT_IMAGE_MODE } from '../core/constants';
import type { BitImageMode } from '../core/types';
import type { GrayscaleImage } from '../graphics/BitmapConverter';

/**
 * Border graphics configuration
 * Fixed at 120 DPI for optimal quality/speed balance on LQ-2090II
 */
export const BORDER_GRAPHICS_CONFIG = {
  /** Graphics mode: 120 DPI 24-pin (mode 33) */
  MODE: BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN as BitImageMode,
  /** Horizontal DPI */
  HORIZONTAL_DPI: 120,
  /** Vertical DPI (24 pins at 180 DPI) */
  VERTICAL_DPI: 180,
  /** Bytes per column (24 pins = 3 bytes) */
  BYTES_PER_COLUMN: 3,
  /** Pins per stripe */
  PINS_PER_STRIPE: 24,
  /** Fixed line thickness in dots */
  LINE_THICKNESS: 1,
} as const;

/**
 * Bit image data ready for ESC * command
 */
export interface BitImageData {
  /** Graphics mode */
  mode: BitImageMode;
  /** Width in columns/dots */
  width: number;
  /** Raw column data (3 bytes per column for 24-pin) */
  data: Uint8Array;
}

/**
 * Corner type for box drawing
 */
export type CornerType = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/**
 * Create a horizontal line as grayscale bitmap
 * Line is drawn at the vertical center of the 24-pin stripe
 *
 * @param widthDots Width in dots at 120 DPI
 * @param thickness Line thickness (default 1)
 * @returns GrayscaleImage with the line pattern
 */
export function createHorizontalLineBitmap(widthDots: number, thickness = 1): GrayscaleImage {
  const height = BORDER_GRAPHICS_CONFIG.PINS_PER_STRIPE;
  const data = new Uint8Array(widthDots * height);

  // Draw line at vertical center
  const centerY = Math.floor(height / 2);
  const startY = centerY - Math.floor(thickness / 2);

  for (let y = startY; y < startY + thickness && y < height; y++) {
    for (let x = 0; x < widthDots; x++) {
      if (y >= 0) {
        data[y * widthDots + x] = 255; // Black pixel
      }
    }
  }

  return { width: widthDots, height, data };
}

/**
 * Create a vertical line segment as grayscale bitmap
 * Note: Vertical lines are printed as a series of horizontal stripes
 *
 * @param heightDots Height in dots (should be multiple of 24 for clean stripes)
 * @param thickness Line thickness (default 1)
 * @returns GrayscaleImage with the vertical line pattern
 */
export function createVerticalLineBitmap(heightDots: number, thickness = 1): GrayscaleImage {
  // For vertical lines, we need enough width to accommodate the line
  const width = Math.max(thickness + 2, 6); // Minimum width for visibility
  const data = new Uint8Array(width * heightDots);

  // Draw vertical line at horizontal center
  const centerX = Math.floor(width / 2);
  const startX = centerX - Math.floor(thickness / 2);

  for (let y = 0; y < heightDots; y++) {
    for (let x = startX; x < startX + thickness && x < width; x++) {
      if (x >= 0) {
        data[y * width + x] = 255; // Black pixel
      }
    }
  }

  return { width, height: heightDots, data };
}

/**
 * Create a corner bitmap (L-shaped) for box drawing
 *
 * @param corner Which corner to create
 * @param size Size in dots (square)
 * @param thickness Line thickness
 * @returns GrayscaleImage with the corner pattern
 */
export function createCornerBitmap(corner: CornerType, size = 6, thickness = 1): GrayscaleImage {
  const data = new Uint8Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let fill = false;

      switch (corner) {
        case 'topLeft':
          // Horizontal along top, vertical along left
          fill = y < thickness || x < thickness;
          break;
        case 'topRight':
          // Horizontal along top, vertical along right
          fill = y < thickness || x >= size - thickness;
          break;
        case 'bottomLeft':
          // Horizontal along bottom, vertical along left
          fill = y >= size - thickness || x < thickness;
          break;
        case 'bottomRight':
          // Horizontal along bottom, vertical along right
          fill = y >= size - thickness || x >= size - thickness;
          break;
      }

      if (fill) {
        data[y * size + x] = 255; // Black pixel
      }
    }
  }

  return { width: size, height: size, data };
}

/**
 * Convert grayscale image to ESC/P2 24-pin column format
 * Each column is 3 bytes (24 bits) representing 24 vertical pins
 *
 * @param image Grayscale image to convert
 * @returns Column data for ESC * command
 */
export function imageToColumnData24Pin(image: GrayscaleImage): Uint8Array {
  const { width, height, data } = image;
  const stripeHeight = BORDER_GRAPHICS_CONFIG.PINS_PER_STRIPE;
  const numStripes = Math.ceil(height / stripeHeight);

  // Each stripe produces width * 3 bytes
  const result = new Uint8Array(numStripes * width * 3);
  let resultIdx = 0;

  for (let stripe = 0; stripe < numStripes; stripe++) {
    const startY = stripe * stripeHeight;

    for (let x = 0; x < width; x++) {
      // Build 3 bytes (24 bits) for this column
      let byte1 = 0; // Top 8 pins (pins 0-7)
      let byte2 = 0; // Middle 8 pins (pins 8-15)
      let byte3 = 0; // Bottom 8 pins (pins 16-23)

      for (let pin = 0; pin < 24; pin++) {
        const y = startY + pin;
        if (y < height) {
          const pixel = data[y * width + x];
          if (pixel !== undefined && pixel > 127) {
            // Threshold at 128
            // Set the appropriate bit (MSB first)
            if (pin < 8) {
              byte1 |= 1 << (7 - pin);
            } else if (pin < 16) {
              byte2 |= 1 << (7 - (pin - 8));
            } else {
              byte3 |= 1 << (7 - (pin - 16));
            }
          }
        }
      }

      result[resultIdx++] = byte1;
      result[resultIdx++] = byte2;
      result[resultIdx++] = byte3;
    }
  }

  return result.slice(0, resultIdx);
}

/**
 * Convert grayscale border image to ESC/P2 bit image data
 * Uses 120 DPI 24-pin mode for borders
 *
 * @param image Grayscale image to convert
 * @returns BitImageData ready for CommandBuilder.bitImage()
 */
export function borderToBitImage(image: GrayscaleImage): BitImageData {
  return {
    mode: BORDER_GRAPHICS_CONFIG.MODE,
    width: image.width,
    data: imageToColumnData24Pin(image),
  };
}

/**
 * Create a horizontal border line ready for ESC * command
 *
 * @param widthDots Width in dots at 120 DPI
 * @returns BitImageData for the horizontal line
 */
export function createHorizontalBorderLine(widthDots: number): BitImageData {
  const image = createHorizontalLineBitmap(widthDots, BORDER_GRAPHICS_CONFIG.LINE_THICKNESS);
  return borderToBitImage(image);
}

/**
 * Create a corner ready for ESC * command
 *
 * @param corner Which corner to create
 * @param size Corner size in dots (default 6)
 * @returns BitImageData for the corner
 */
export function createBorderCorner(corner: CornerType, size = 6): BitImageData {
  const image = createCornerBitmap(corner, size, BORDER_GRAPHICS_CONFIG.LINE_THICKNESS);
  return borderToBitImage(image);
}

/**
 * Calculate the number of dots for a given character width at specified CPI
 * Used to align bitmap borders with text content
 *
 * @param chars Number of characters
 * @param cpi Characters per inch (10, 12, or 15)
 * @returns Width in dots at 120 DPI
 */
export function charsToDotsAt120DPI(chars: number, cpi: 10 | 12 | 15 = 10): number {
  // At 120 DPI: 120 dots per inch
  // At 10 CPI: 12 dots per character (120/10)
  // At 12 CPI: 10 dots per character (120/12)
  // At 15 CPI: 8 dots per character (120/15)
  const dotsPerChar = BORDER_GRAPHICS_CONFIG.HORIZONTAL_DPI / cpi;
  return Math.round(chars * dotsPerChar);
}

/**
 * Calculate line spacing for graphics mode
 * Returns the value for ESC 3 (n/180 inch)
 *
 * @returns Line spacing value for 24-pin stripe height
 */
export function getGraphicsLineSpacing(): number {
  // 24 pins at 180 DPI vertical = 24/180 inch
  // For ESC 3 n (n/180 inch), n = 24
  return 24;
}

export default {
  BORDER_GRAPHICS_CONFIG,
  createHorizontalLineBitmap,
  createVerticalLineBitmap,
  createCornerBitmap,
  imageToColumnData24Pin,
  borderToBitImage,
  createHorizontalBorderLine,
  createBorderCorner,
  charsToDotsAt120DPI,
  getGraphicsLineSpacing,
};
