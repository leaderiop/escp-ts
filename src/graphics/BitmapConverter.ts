/**
 * Bitmap Graphics Converter
 * Converts images to ESC/P2 graphics format for 24-pin printers
 */

import { BIT_IMAGE_MODE } from '../core/constants';
import type { BitImageMode, BitImageData } from '../core/types';
import { assertPositiveDimensions } from '../core/validation';

/**
 * Graphics mode information
 */
interface GraphicsModeInfo {
  pins: 8 | 24;
  horizontalDpi: number;
  bytesPerColumn: number;
  adjacentDots: boolean; // Whether adjacent dots can be printed
}

/**
 * Graphics mode specifications
 */
export const GRAPHICS_MODES: Record<BitImageMode, GraphicsModeInfo> = {
  // 8-pin modes
  [BIT_IMAGE_MODE.SINGLE_DENSITY_8PIN]: { pins: 8, horizontalDpi: 60, bytesPerColumn: 1, adjacentDots: true },
  [BIT_IMAGE_MODE.DOUBLE_DENSITY_8PIN]: { pins: 8, horizontalDpi: 120, bytesPerColumn: 1, adjacentDots: false },
  [BIT_IMAGE_MODE.HIGH_SPEED_DOUBLE_8PIN]: { pins: 8, horizontalDpi: 120, bytesPerColumn: 1, adjacentDots: true },
  [BIT_IMAGE_MODE.QUAD_DENSITY_8PIN]: { pins: 8, horizontalDpi: 240, bytesPerColumn: 1, adjacentDots: false },
  [BIT_IMAGE_MODE.CRT_I_8PIN]: { pins: 8, horizontalDpi: 72, bytesPerColumn: 1, adjacentDots: true },
  [BIT_IMAGE_MODE.CRT_II_8PIN]: { pins: 8, horizontalDpi: 90, bytesPerColumn: 1, adjacentDots: true },
  [BIT_IMAGE_MODE.PLOTTER_8PIN]: { pins: 8, horizontalDpi: 80, bytesPerColumn: 1, adjacentDots: true },

  // 24-pin modes
  [BIT_IMAGE_MODE.SINGLE_DENSITY_24PIN]: { pins: 24, horizontalDpi: 60, bytesPerColumn: 3, adjacentDots: true },
  [BIT_IMAGE_MODE.DOUBLE_DENSITY_24PIN]: { pins: 24, horizontalDpi: 120, bytesPerColumn: 3, adjacentDots: false },
  [BIT_IMAGE_MODE.HIGH_SPEED_DOUBLE_24PIN]: { pins: 24, horizontalDpi: 120, bytesPerColumn: 3, adjacentDots: true },
  [BIT_IMAGE_MODE.TRIPLE_DENSITY_24PIN]: { pins: 24, horizontalDpi: 180, bytesPerColumn: 3, adjacentDots: true },
  [BIT_IMAGE_MODE.HEX_DENSITY_24PIN]: { pins: 24, horizontalDpi: 360, bytesPerColumn: 3, adjacentDots: true },
  [BIT_IMAGE_MODE.CRT_III_24PIN]: { pins: 24, horizontalDpi: 90, bytesPerColumn: 3, adjacentDots: true },
};

/**
 * Simple grayscale image representation
 */
export interface GrayscaleImage {
  width: number;
  height: number;
  data: Uint8Array; // One byte per pixel (0 = white, 255 = black)
}

/**
 * Dithering methods
 */
export type DitheringMethod = 'none' | 'threshold' | 'ordered' | 'floydSteinberg' | 'atkinson';

/**
 * Image to bitmap conversion options
 */
export interface ConversionOptions {
  /** Target graphics mode */
  mode: BitImageMode;
  /** Dithering method */
  dithering: DitheringMethod;
  /** Threshold for binary conversion (0-255) */
  threshold: number;
  /** Scale image to fit width (in inches) */
  targetWidthInches?: number;
  /** Maximum width in columns */
  maxColumns?: number;
  /** Invert colors */
  invert: boolean;
}

/**
 * Default conversion options
 */
export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  mode: BIT_IMAGE_MODE.HEX_DENSITY_24PIN,
  dithering: 'floydSteinberg',
  threshold: 128,
  invert: false,
};

/**
 * Ordered dither matrix (4x4 Bayer)
 */
const BAYER_MATRIX = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Apply threshold dithering
 */
function applyThreshold(image: GrayscaleImage, threshold: number): Uint8Array {
  const result = new Uint8Array(image.data.length);
  for (let i = 0; i < image.data.length; i++) {
    const pixel = image.data[i];
    result[i] = (pixel !== undefined && pixel < threshold) ? 255 : 0;
  }
  return result;
}

/**
 * Apply ordered (Bayer) dithering
 */
function applyOrderedDithering(image: GrayscaleImage): Uint8Array {
  const result = new Uint8Array(image.data.length);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const idx = y * image.width + x;
      const pixel = image.data[idx];
      if (pixel === undefined) continue;

      const matrixValue = BAYER_MATRIX[y % 4]?.[x % 4] ?? 0;
      const threshold = (matrixValue / 16) * 255;
      result[idx] = pixel < threshold ? 255 : 0;
    }
  }

  return result;
}

/**
 * Apply Floyd-Steinberg dithering
 */
function applyFloydSteinberg(image: GrayscaleImage): Uint8Array {
  // Work on a copy as floating point for error diffusion
  const errors = new Float32Array(image.data);
  const result = new Uint8Array(image.data.length);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const idx = y * image.width + x;
      const oldPixel = errors[idx] ?? 0;
      const newPixel = oldPixel < 128 ? 255 : 0;
      result[idx] = newPixel;

      const error = oldPixel - (newPixel === 255 ? 0 : 255);

      // Distribute error to neighbors
      if (x + 1 < image.width) {
        errors[idx + 1] = (errors[idx + 1] ?? 0) + error * (7 / 16);
      }
      if (y + 1 < image.height) {
        if (x > 0) {
          errors[idx + image.width - 1] = (errors[idx + image.width - 1] ?? 0) + error * (3 / 16);
        }
        errors[idx + image.width] = (errors[idx + image.width] ?? 0) + error * (5 / 16);
        if (x + 1 < image.width) {
          errors[idx + image.width + 1] = (errors[idx + image.width + 1] ?? 0) + error * (1 / 16);
        }
      }
    }
  }

  return result;
}

/**
 * Apply Atkinson dithering (used by original Macintosh)
 */
function applyAtkinson(image: GrayscaleImage): Uint8Array {
  const errors = new Float32Array(image.data);
  const result = new Uint8Array(image.data.length);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const idx = y * image.width + x;
      const oldPixel = errors[idx] ?? 0;
      const newPixel = oldPixel < 128 ? 255 : 0;
      result[idx] = newPixel;

      // Atkinson only distributes 6/8 of the error (sharper results)
      const error = (oldPixel - (newPixel === 255 ? 0 : 255)) / 8;

      // Distribute error (Atkinson pattern)
      if (x + 1 < image.width) errors[idx + 1] = (errors[idx + 1] ?? 0) + error;
      if (x + 2 < image.width) errors[idx + 2] = (errors[idx + 2] ?? 0) + error;
      if (y + 1 < image.height) {
        if (x > 0) errors[idx + image.width - 1] = (errors[idx + image.width - 1] ?? 0) + error;
        errors[idx + image.width] = (errors[idx + image.width] ?? 0) + error;
        if (x + 1 < image.width) errors[idx + image.width + 1] = (errors[idx + image.width + 1] ?? 0) + error;
      }
      if (y + 2 < image.height) {
        errors[idx + image.width * 2] = (errors[idx + image.width * 2] ?? 0) + error;
      }
    }
  }

  return result;
}

/**
 * Apply dithering to convert grayscale to binary
 */
export function applyDithering(
  image: GrayscaleImage,
  method: DitheringMethod,
  threshold: number = 128
): Uint8Array {
  switch (method) {
    case 'none':
    case 'threshold':
      return applyThreshold(image, threshold);
    case 'ordered':
      return applyOrderedDithering(image);
    case 'floydSteinberg':
      return applyFloydSteinberg(image);
    case 'atkinson':
      return applyAtkinson(image);
    default:
      return applyThreshold(image, threshold);
  }
}

/**
 * Scale image using nearest neighbor
 * @throws {GraphicsError} if newWidth or newHeight is not a positive integer
 */
export function scaleImageNearest(
  image: GrayscaleImage,
  newWidth: number,
  newHeight: number
): GrayscaleImage {
  assertPositiveDimensions(newWidth, newHeight, 'scaleImageNearest');

  const result: GrayscaleImage = {
    width: newWidth,
    height: newHeight,
    data: new Uint8Array(newWidth * newHeight),
  };

  const xRatio = image.width / newWidth;
  const yRatio = image.height / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = srcY * image.width + srcX;
      const dstIdx = y * newWidth + x;
      result.data[dstIdx] = image.data[srcIdx] ?? 0;
    }
  }

  return result;
}

/**
 * Scale image using bilinear interpolation
 * @throws {GraphicsError} if newWidth or newHeight is not a positive integer
 */
export function scaleImageBilinear(
  image: GrayscaleImage,
  newWidth: number,
  newHeight: number
): GrayscaleImage {
  assertPositiveDimensions(newWidth, newHeight, 'scaleImageBilinear');

  const result: GrayscaleImage = {
    width: newWidth,
    height: newHeight,
    data: new Uint8Array(newWidth * newHeight),
  };

  const xRatio = (image.width - 1) / newWidth;
  const yRatio = (image.height - 1) / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;

      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = Math.min(x1 + 1, image.width - 1);
      const y2 = Math.min(y1 + 1, image.height - 1);

      const fx = srcX - x1;
      const fy = srcY - y1;

      const p11 = image.data[y1 * image.width + x1] ?? 0;
      const p12 = image.data[y1 * image.width + x2] ?? 0;
      const p21 = image.data[y2 * image.width + x1] ?? 0;
      const p22 = image.data[y2 * image.width + x2] ?? 0;

      const value =
        p11 * (1 - fx) * (1 - fy) +
        p12 * fx * (1 - fy) +
        p21 * (1 - fx) * fy +
        p22 * fx * fy;

      const dstIdx = y * newWidth + x;
      result.data[dstIdx] = Math.round(value);
    }
  }

  return result;
}

/**
 * Convert binary image data to ESC/P2 column format for 24-pin printers
 * Each column is 3 bytes (24 bits) representing 24 vertical pins
 */
export function convertToColumnFormat24Pin(
  binaryImage: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  // Calculate number of stripe rows (each stripe is 24 pixels tall)
  const stripHeight = 24;
  const numStripes = Math.ceil(height / stripHeight);

  // Each stripe produces width * 3 bytes
  const totalBytes = numStripes * width * 3;
  const result = new Uint8Array(totalBytes);

  let resultIdx = 0;

  for (let stripe = 0; stripe < numStripes; stripe++) {
    const startY = stripe * stripHeight;

    for (let x = 0; x < width; x++) {
      // Build 3 bytes (24 bits) for this column
      let byte1 = 0; // Top 8 pins
      let byte2 = 0; // Middle 8 pins
      let byte3 = 0; // Bottom 8 pins

      for (let pin = 0; pin < 24; pin++) {
        const y = startY + pin;
        if (y < height) {
          const idx = y * width + x;
          const pixel = binaryImage[idx];
          if (pixel !== undefined && pixel > 0) {
            // Set the appropriate bit
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
 * Convert binary image data to ESC/P2 column format for 8-pin printers
 */
export function convertToColumnFormat8Pin(
  binaryImage: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const stripHeight = 8;
  const numStripes = Math.ceil(height / stripHeight);
  const result = new Uint8Array(numStripes * width);

  let resultIdx = 0;

  for (let stripe = 0; stripe < numStripes; stripe++) {
    const startY = stripe * stripHeight;

    for (let x = 0; x < width; x++) {
      let byte = 0;

      for (let pin = 0; pin < 8; pin++) {
        const y = startY + pin;
        if (y < height) {
          const idx = y * width + x;
          const pixel = binaryImage[idx];
          if (pixel !== undefined && pixel > 0) {
            byte |= 1 << (7 - pin);
          }
        }
      }

      result[resultIdx++] = byte;
    }
  }

  return result.slice(0, resultIdx);
}

/**
 * Convert grayscale image to ESC/P2 bit image data
 */
export function convertToBitImage(
  image: GrayscaleImage,
  options: Partial<ConversionOptions> = {}
): BitImageData {
  const opts: ConversionOptions = { ...DEFAULT_CONVERSION_OPTIONS, ...options };
  const modeInfo = GRAPHICS_MODES[opts.mode];

  if (!modeInfo) {
    throw new Error(`Unsupported graphics mode: ${opts.mode}`);
  }

  // Calculate target dimensions based on mode DPI
  let targetWidth = image.width;
  let targetHeight = image.height;

  if (opts.targetWidthInches) {
    targetWidth = Math.round(opts.targetWidthInches * modeInfo.horizontalDpi);
    const aspectRatio = image.height / image.width;
    targetHeight = Math.round(targetWidth * aspectRatio);
  }

  if (opts.maxColumns && targetWidth > opts.maxColumns) {
    const scale = opts.maxColumns / targetWidth;
    targetWidth = opts.maxColumns;
    targetHeight = Math.round(targetHeight * scale);
  }

  // Height must be multiple of pin count for proper stripe alignment
  const pinHeight = modeInfo.pins;
  targetHeight = Math.ceil(targetHeight / pinHeight) * pinHeight;

  // Scale image if needed
  let processedImage = image;
  if (targetWidth !== image.width || targetHeight !== image.height) {
    processedImage = scaleImageBilinear(image, targetWidth, targetHeight);
  }

  // Apply dithering to convert to binary
  let binaryData = applyDithering(processedImage, opts.dithering, opts.threshold);

  // Invert if requested
  if (opts.invert) {
    binaryData = binaryData.map((v) => (v > 0 ? 0 : 255));
  }

  // Convert to column format
  const columnData =
    modeInfo.pins === 24
      ? convertToColumnFormat24Pin(binaryData, targetWidth, targetHeight)
      : convertToColumnFormat8Pin(binaryData, targetWidth, targetHeight);

  return {
    mode: opts.mode,
    width: targetWidth,
    data: columnData,
  };
}

/**
 * Split image into horizontal stripes for printing
 * Returns data for each stripe row
 */
export function splitIntoStripes(
  image: GrayscaleImage,
  mode: BitImageMode,
  options: Partial<ConversionOptions> = {}
): BitImageData[] {
  const modeInfo = GRAPHICS_MODES[mode];
  if (!modeInfo) {
    throw new Error(`Unsupported graphics mode: ${mode}`);
  }

  const stripeHeight = modeInfo.pins;
  const numStripes = Math.ceil(image.height / stripeHeight);
  const stripes: BitImageData[] = [];

  for (let i = 0; i < numStripes; i++) {
    const startY = i * stripeHeight;
    const endY = Math.min(startY + stripeHeight, image.height);
    const actualHeight = endY - startY;

    // Extract stripe from image
    const stripeData = new Uint8Array(image.width * actualHeight);
    for (let y = 0; y < actualHeight; y++) {
      for (let x = 0; x < image.width; x++) {
        stripeData[y * image.width + x] = image.data[(startY + y) * image.width + x] ?? 0;
      }
    }

    const stripeImage: GrayscaleImage = {
      width: image.width,
      height: actualHeight,
      data: stripeData,
    };

    stripes.push(convertToBitImage(stripeImage, { ...options, mode }));
  }

  return stripes;
}

/**
 * Create a test pattern image (gradient)
 */
export function createTestPattern(width: number, height: number): GrayscaleImage {
  const data = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Horizontal gradient
      data[y * width + x] = Math.round((x / width) * 255);
    }
  }

  return { width, height, data };
}

/**
 * Create a checkerboard pattern
 */
export function createCheckerboard(
  width: number,
  height: number,
  cellSize: number = 8
): GrayscaleImage {
  const data = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      data[y * width + x] = (cellX + cellY) % 2 === 0 ? 0 : 255;
    }
  }

  return { width, height, data };
}

export default {
  GRAPHICS_MODES,
  DEFAULT_CONVERSION_OPTIONS,
  applyDithering,
  scaleImageNearest,
  scaleImageBilinear,
  convertToColumnFormat24Pin,
  convertToColumnFormat8Pin,
  convertToBitImage,
  splitIntoStripes,
  createTestPattern,
  createCheckerboard,
};
