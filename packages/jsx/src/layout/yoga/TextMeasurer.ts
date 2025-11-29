/**
 * Text Measurer for Yoga Layout Adapter
 *
 * Provides custom measure functions for text nodes that integrate with
 * Yoga's layout engine while using escp-ts's character width calculations.
 */

import { MeasureMode } from 'yoga-layout/load';
import { calculateTextWidth } from '@escp/core';
import type { ResolvedStyle } from '../nodes';

/**
 * Size result from measure function
 */
export interface MeasureSize {
  width: number;
  height: number;
}

/**
 * Create a Yoga-compatible measure function for text content
 *
 * This function creates a closure that calculates text dimensions using
 * the escp-ts character width tables, respecting CPI, condensed mode,
 * double-width, and other text style properties.
 *
 * @param content - The text string to measure
 * @param style - Resolved style with font properties
 * @param lineSpacing - Line height in dots
 * @param interCharSpace - Additional space between characters
 * @returns A Yoga measure function
 */
export function createTextMeasureFunc(
  content: string,
  style: ResolvedStyle,
  lineSpacing: number,
  interCharSpace: number
): (width: number, widthMode: MeasureMode, height: number, heightMode: MeasureMode) => MeasureSize {
  return (
    width: number,
    widthMode: MeasureMode,
    height: number,
    heightMode: MeasureMode
  ): MeasureSize => {
    // Calculate natural text width using character set widths
    const textWidth = calculateTextWidth(
      content,
      style.cpi,
      false, // proportional - keeping it simple for now
      style.condensed,
      style.doubleWidth,
      interCharSpace
    );

    // Calculate text height based on line spacing and double height mode
    const textHeight = lineSpacing * (style.doubleHeight ? 2 : 1);

    // Apply width constraints based on Yoga's measure mode
    let finalWidth = textWidth;
    if (widthMode === MeasureMode.Exactly) {
      // Yoga wants exactly this width
      finalWidth = width;
    } else if (widthMode === MeasureMode.AtMost) {
      // Yoga wants at most this width
      finalWidth = Math.min(textWidth, width);
    }
    // MeasureMode.Undefined: use natural size (no constraint)

    // Apply height constraints based on Yoga's measure mode
    let finalHeight = textHeight;
    if (heightMode === MeasureMode.Exactly) {
      finalHeight = height;
    } else if (heightMode === MeasureMode.AtMost) {
      finalHeight = Math.min(textHeight, height);
    }
    // MeasureMode.Undefined: use natural size (no constraint)

    return { width: finalWidth, height: finalHeight };
  };
}

/**
 * Create a measure function for line nodes
 *
 * Lines have a fixed height (one line) and either a fixed width
 * or fill the available space.
 *
 * @param length - Fixed length in dots, or undefined to fill available space
 * @param lineSpacing - Line height in dots
 * @param direction - 'horizontal' or 'vertical'
 * @returns A Yoga measure function
 */
export function createLineMeasureFunc(
  length: number | 'fill' | undefined,
  lineSpacing: number,
  direction: 'horizontal' | 'vertical'
): (width: number, widthMode: MeasureMode, height: number, heightMode: MeasureMode) => MeasureSize {
  return (
    width: number,
    widthMode: MeasureMode,
    height: number,
    heightMode: MeasureMode
  ): MeasureSize => {
    if (direction === 'horizontal') {
      // Horizontal line: fixed height, variable width
      let lineWidth: number;
      if (typeof length === 'number') {
        lineWidth = length;
      } else if (widthMode === MeasureMode.Undefined) {
        lineWidth = 0; // Will be filled by flex
      } else {
        lineWidth = width; // Fill available width
      }

      return { width: lineWidth, height: lineSpacing };
    } else {
      // Vertical line: fixed width, variable height
      let lineHeight: number;
      if (typeof length === 'number') {
        lineHeight = length;
      } else if (heightMode === MeasureMode.Undefined) {
        lineHeight = 0; // Will be filled by flex
      } else {
        lineHeight = height; // Fill available height
      }

      return { width: lineSpacing, height: lineHeight };
    }
  };
}

/**
 * Measure text width without creating a full measure function
 *
 * Utility function for quick text width calculation, used for
 * column width resolution in grids.
 *
 * @param content - The text string to measure
 * @param style - Resolved style with font properties
 * @param interCharSpace - Additional space between characters
 * @returns Width in dots
 */
export function measureText(content: string, style: ResolvedStyle, interCharSpace: number): number {
  return calculateTextWidth(
    content,
    style.cpi,
    false,
    style.condensed,
    style.doubleWidth,
    interCharSpace
  );
}

/**
 * Calculate text height
 *
 * @param style - Resolved style with font properties
 * @param lineSpacing - Base line height in dots
 * @returns Height in dots
 */
export function getTextHeight(style: ResolvedStyle, lineSpacing: number): number {
  return lineSpacing * (style.doubleHeight ? 2 : 1);
}
