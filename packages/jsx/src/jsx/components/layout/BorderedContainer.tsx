/**
 * BorderedContainer component - reusable bordered container with border-box model
 *
 * Implements the border-box layout model where:
 * - Outer dimensions (width/height) represent the complete visual box INCLUDING border
 * - Border thickness reduces available content area
 * - Padding is applied inside the border
 *
 * Layout model:
 * [OUTER BOX (specified width/height)]
 *    [BORDER]
 *        [PADDING]
 *            [CONTENT]
 */

import type { LayoutNode, PaddingSpec, WidthSpec, HeightSpec } from '../../../layout/nodes';
import type { BorderChars, NodeStyle, JSXChildren } from '../../types';
import { resolvePadding } from '../../../layout/nodes';
import {
  calculateBorderThickness,
  resolveContentDimensions,
  DEFAULT_CPI,
  DEFAULT_LINE_SPACING,
  type BorderVariant,
  type BorderConfig,
} from '../../../layout/borderBox';
import { Stack } from './Stack';
import { Flex } from './Flex';
import { Text } from '../content/Text';
import { Line } from '../content/Line';
import { UNICODE_BOX } from '@escp/core';

// ==================== BORDER CHARACTER PRESETS ====================

type RequiredBorderChars = Required<BorderChars>;

// ASCII presets (work on all code pages)
const SINGLE_PRESET: RequiredBorderChars = {
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
};

const DOUBLE_PRESET: RequiredBorderChars = {
  topLeft: '#',
  topRight: '#',
  bottomLeft: '#',
  bottomRight: '#',
  horizontal: '=',
  vertical: '|',
};

const ROUNDED_PRESET: RequiredBorderChars = {
  topLeft: '/',
  topRight: '\\',
  bottomLeft: '\\',
  bottomRight: '/',
  horizontal: '-',
  vertical: '|',
};

// CP437 box-drawing presets using Unicode characters for display/preview
const CP437_SINGLE_PRESET: RequiredBorderChars = {
  topLeft: UNICODE_BOX.SINGLE_TOP_LEFT,
  topRight: UNICODE_BOX.SINGLE_TOP_RIGHT,
  bottomLeft: UNICODE_BOX.SINGLE_BOTTOM_LEFT,
  bottomRight: UNICODE_BOX.SINGLE_BOTTOM_RIGHT,
  horizontal: UNICODE_BOX.SINGLE_HORIZONTAL,
  vertical: UNICODE_BOX.SINGLE_VERTICAL,
};

const CP437_DOUBLE_PRESET: RequiredBorderChars = {
  topLeft: UNICODE_BOX.DOUBLE_TOP_LEFT,
  topRight: UNICODE_BOX.DOUBLE_TOP_RIGHT,
  bottomLeft: UNICODE_BOX.DOUBLE_BOTTOM_LEFT,
  bottomRight: UNICODE_BOX.DOUBLE_BOTTOM_RIGHT,
  horizontal: UNICODE_BOX.DOUBLE_HORIZONTAL,
  vertical: UNICODE_BOX.DOUBLE_VERTICAL,
};

/**
 * Available border presets
 */
export const BORDER_PRESETS: Record<BorderVariant, RequiredBorderChars | null> = {
  single: SINGLE_PRESET,
  double: DOUBLE_PRESET,
  rounded: ROUNDED_PRESET,
  'cp437-single': CP437_SINGLE_PRESET,
  'cp437-double': CP437_DOUBLE_PRESET,
  none: null,
};

// ==================== COMPONENT PROPS ====================

/**
 * BorderedContainer component props
 */
export interface BorderedContainerProps {
  /** Outer box width including border (border-box model) */
  width?: WidthSpec | undefined;
  /** Outer box height including border (border-box model) */
  height?: HeightSpec | undefined;
  /** Border configuration */
  border: BorderConfig;
  /** Padding inside the border */
  padding?: PaddingSpec | undefined;
  /** Additional style properties */
  style?: Omit<NodeStyle, 'width' | 'height' | 'padding'>;
  /** Content to render inside the bordered container */
  children?: JSXChildren;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get border characters for a variant, with optional custom overrides
 */
function getBorderChars(
  variant: BorderVariant,
  customChars?: Partial<BorderChars>
): RequiredBorderChars {
  const preset = BORDER_PRESETS[variant] ?? SINGLE_PRESET;

  if (!customChars) {
    return preset;
  }

  return {
    topLeft: customChars.topLeft ?? preset.topLeft,
    topRight: customChars.topRight ?? preset.topRight,
    bottomLeft: customChars.bottomLeft ?? preset.bottomLeft,
    bottomRight: customChars.bottomRight ?? preset.bottomRight,
    horizontal: customChars.horizontal ?? preset.horizontal,
    vertical: customChars.vertical ?? preset.vertical,
  };
}

// ==================== COMPONENT ====================

/**
 * BorderedContainer - A reusable bordered container implementing border-box model
 *
 * When you specify width/height, the border is INCLUDED in that measurement.
 * Content area = specified dimensions - border thickness - padding
 *
 * @example
 * ```tsx
 * // A 500-dot wide card (border included)
 * <BorderedContainer
 *   width={500}
 *   border={{ variant: 'cp437-single' }}
 *   padding={{ top: 5, right: 10, bottom: 5, left: 10 }}
 * >
 *   Content here
 * </BorderedContainer>
 * ```
 */
export function BorderedContainer(props: BorderedContainerProps): LayoutNode {
  const { width, height, border, padding, style, children } = props;

  // Handle 'none' variant - return content without border
  if (border.variant === 'none') {
    // Build style object without undefined values for exactOptionalPropertyTypes
    const noBorderStyle: NodeStyle = { ...style };
    if (width !== undefined) noBorderStyle.width = width;
    if (height !== undefined) noBorderStyle.height = height;
    if (padding !== undefined) noBorderStyle.padding = padding;

    return Stack({
      style: noBorderStyle,
      children,
    });
  }

  // Get resolved values
  const chars = getBorderChars(border.variant, border.chars);
  const resolvedPadding = resolvePadding(padding);

  // Calculate border thickness based on CPI from style or default
  const cpi = style?.cpi ?? DEFAULT_CPI;
  const borderThickness = calculateBorderThickness(cpi, DEFAULT_LINE_SPACING);

  // Calculate content dimensions (outer - border)
  // Note: padding is applied by the content Stack, not subtracted here
  const { contentWidth, contentHeight } = resolveContentDimensions(width, height, borderThickness);

  // Build outer style without undefined values for exactOptionalPropertyTypes
  const outerStyle: NodeStyle = { ...style };
  if (width !== undefined) outerStyle.width = width;
  if (height !== undefined) outerStyle.height = height;

  // Build content style without undefined values
  // flexGrow: 1 allows content to fill available space
  // flexShrink: 1 allows content to shrink when parent is constrained
  // minWidth: 0 allows flex item to shrink below its content size
  const contentStyle: NodeStyle = {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    padding: resolvedPadding,
  };
  if (contentWidth !== undefined) contentStyle.width = contentWidth;
  if (contentHeight !== undefined) contentStyle.height = contentHeight;

  // Build the border structure
  // Structure:
  // - Outer Stack (holds specified width/height)
  //   - Top border row: corner + horizontal line + corner
  //   - Content row: vertical line + content (with padding) + vertical line
  //   - Bottom border row: corner + horizontal line + corner

  return Stack({
    style: outerStyle,
    children: [
      // Top border row
      Flex({
        children: [
          Text({ children: chars.topLeft, style: { flexShrink: 0 } }),
          Line({ char: chars.horizontal, length: 'fill' }),
          Text({ children: chars.topRight, style: { flexShrink: 0 } }),
        ],
      }),
      // Content row with vertical borders
      Flex({
        children: [
          Line({
            char: chars.vertical,
            direction: 'vertical',
            length: 'fill',
            style: { flexShrink: 0 },
          }),
          Stack({
            style: contentStyle,
            children,
          }),
          Line({
            char: chars.vertical,
            direction: 'vertical',
            length: 'fill',
            style: { flexShrink: 0 },
          }),
        ],
      }),
      // Bottom border row
      Flex({
        children: [
          Text({ children: chars.bottomLeft, style: { flexShrink: 0 } }),
          Line({ char: chars.horizontal, length: 'fill' }),
          Text({ children: chars.bottomRight, style: { flexShrink: 0 } }),
        ],
      }),
    ],
  });
}
