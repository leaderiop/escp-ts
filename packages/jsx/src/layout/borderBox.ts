/**
 * Border-Box Layout Utilities
 *
 * Implements border-box model where:
 * - Yoga node dimensions represent the Border Layout rectangle
 * - Margin sits outside the Yoga box
 * - Padding and Content are inside the Border box
 *
 * Layout model:
 * [MARGIN]           <- Outside Yoga box
 *    [BORDER]        <- Yoga node dimensions = Border rectangle
 *        [PADDING]   <- Inside Border box
 *            [CONTENT]
 */

import type { WidthSpec, HeightSpec, ResolvedPadding } from './nodes';
import type { BorderChars } from '../jsx/types';

// ==================== TYPES ====================

/**
 * Border thickness in dots (computed from CPI and lineSpacing)
 */
export interface BorderThickness {
  /** Top border thickness in dots (typically lineSpacing, default 60) */
  top: number;
  /** Right border thickness in dots (charWidth = 360/cpi, default 36 at 10 CPI) */
  right: number;
  /** Bottom border thickness in dots (typically lineSpacing, default 60) */
  bottom: number;
  /** Left border thickness in dots (charWidth = 360/cpi, default 36 at 10 CPI) */
  left: number;
}

/**
 * Border variant types
 */
export type BorderVariant =
  | 'single'
  | 'double'
  | 'rounded'
  | 'cp437-single'
  | 'cp437-double'
  | 'none';

/**
 * Border configuration for components
 */
export interface BorderConfig {
  /** Border style variant */
  variant: BorderVariant;
  /** Custom border characters (optional override) */
  chars?: Partial<BorderChars> | undefined;
}

/**
 * Resolved content dimensions after accounting for border
 */
export interface ResolvedContentDimensions {
  /** Content width (outer width minus horizontal borders) */
  contentWidth: WidthSpec | undefined;
  /** Content height (outer height minus vertical borders) */
  contentHeight: HeightSpec | undefined;
}

// ==================== CONSTANTS ====================

/**
 * Default dots per inch for ESC/P2 printers
 */
export const DOTS_PER_INCH = 360;

/**
 * Default line spacing in dots (1/6 inch)
 */
export const DEFAULT_LINE_SPACING = 60;

/**
 * Default CPI (characters per inch)
 */
export const DEFAULT_CPI = 10;

// ==================== FUNCTIONS ====================

/**
 * Calculate character width in dots for a given CPI
 *
 * @param cpi - Characters per inch (10, 12, 15, 17, 20)
 * @returns Character width in dots
 */
export function calculateCharWidth(cpi: number = DEFAULT_CPI): number {
  return Math.round(DOTS_PER_INCH / cpi);
}

/**
 * Calculate border thickness from style context
 *
 * Border characters are 1 character wide horizontally and 1 line tall vertically.
 *
 * @param cpi - Characters per inch (determines horizontal border thickness)
 * @param lineSpacing - Line spacing in dots (determines vertical border thickness)
 * @returns Border thickness for all four sides
 */
export function calculateBorderThickness(
  cpi: number = DEFAULT_CPI,
  lineSpacing: number = DEFAULT_LINE_SPACING
): BorderThickness {
  const charWidth = calculateCharWidth(cpi);

  return {
    top: lineSpacing,
    right: charWidth,
    bottom: lineSpacing,
    left: charWidth,
  };
}

/**
 * Get total horizontal border thickness (left + right)
 */
export function getHorizontalBorderThickness(thickness: BorderThickness): number {
  return thickness.left + thickness.right;
}

/**
 * Get total vertical border thickness (top + bottom)
 */
export function getVerticalBorderThickness(thickness: BorderThickness): number {
  return thickness.top + thickness.bottom;
}

/**
 * Calculate content dimensions from outer box dimensions
 *
 * For border-box model:
 * - Fixed numeric dimensions: subtract border thickness
 * - 'fill' / percentage: pass through (Yoga handles distribution)
 * - 'auto' / undefined: pass through (content sizes naturally)
 *
 * @param outerWidth - Outer box width (including border)
 * @param outerHeight - Outer box height (including border)
 * @param borderThickness - Border thickness for all sides
 * @returns Content dimensions after border subtraction
 */
export function resolveContentDimensions(
  outerWidth: WidthSpec | undefined,
  outerHeight: HeightSpec | undefined,
  borderThickness: BorderThickness
): ResolvedContentDimensions {
  let contentWidth: WidthSpec | undefined;
  let contentHeight: HeightSpec | undefined;

  // Calculate content width
  if (typeof outerWidth === 'number') {
    // Fixed width: subtract horizontal border thickness
    const horizontalBorder = getHorizontalBorderThickness(borderThickness);
    contentWidth = Math.max(0, outerWidth - horizontalBorder);
  } else {
    // 'auto', 'fill', percentages: pass through
    contentWidth = outerWidth;
  }

  // Calculate content height
  if (typeof outerHeight === 'number') {
    // Fixed height: subtract vertical border thickness
    const verticalBorder = getVerticalBorderThickness(borderThickness);
    contentHeight = Math.max(0, outerHeight - verticalBorder);
  } else {
    // 'auto', percentages: pass through
    contentHeight = outerHeight;
  }

  return { contentWidth, contentHeight };
}

/**
 * Calculate inner content area dimensions after both border AND padding
 *
 * This is useful for calculating the actual usable content space.
 *
 * @param outerWidth - Outer box width
 * @param outerHeight - Outer box height
 * @param borderThickness - Border thickness
 * @param padding - User-specified padding
 * @returns Dimensions of the inner content area
 */
export function resolveInnerContentDimensions(
  outerWidth: WidthSpec | undefined,
  outerHeight: HeightSpec | undefined,
  borderThickness: BorderThickness,
  padding: ResolvedPadding
): ResolvedContentDimensions {
  let contentWidth: WidthSpec | undefined;
  let contentHeight: HeightSpec | undefined;

  // Calculate content width
  if (typeof outerWidth === 'number') {
    const horizontalBorder = getHorizontalBorderThickness(borderThickness);
    const horizontalPadding = padding.left + padding.right;
    contentWidth = Math.max(0, outerWidth - horizontalBorder - horizontalPadding);
  } else {
    contentWidth = outerWidth;
  }

  // Calculate content height
  if (typeof outerHeight === 'number') {
    const verticalBorder = getVerticalBorderThickness(borderThickness);
    const verticalPadding = padding.top + padding.bottom;
    contentHeight = Math.max(0, outerHeight - verticalBorder - verticalPadding);
  } else {
    contentHeight = outerHeight;
  }

  return { contentWidth, contentHeight };
}

/**
 * Map Card/Table border prop value to BorderVariant
 *
 * @param border - Border prop value (boolean, string variant, or false)
 * @returns BorderVariant or 'none' for false
 */
export function resolveBorderVariant(
  border: boolean | 'single' | 'double' | 'ascii' | undefined
): BorderVariant {
  if (border === false) {
    return 'none';
  }
  if (border === true || border === 'single' || border === undefined) {
    return 'cp437-single';
  }
  if (border === 'double') {
    return 'cp437-double';
  }
  if (border === 'ascii') {
    return 'single'; // ASCII variant uses 'single' preset with +/-/| chars
  }
  return 'cp437-single';
}

/**
 * Check if a border variant produces visual borders
 *
 * @param variant - Border variant to check
 * @returns true if the variant renders visible borders
 */
export function hasBorder(variant: BorderVariant | undefined): boolean {
  return variant !== undefined && variant !== 'none';
}
