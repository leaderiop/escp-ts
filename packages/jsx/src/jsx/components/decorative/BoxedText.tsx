/**
 * BoxedText Component (border-box model)
 * Renders text with a border using CP437 box-drawing characters
 * Supports single, double, and ASCII border styles
 *
 * Uses the border-box layout model where:
 * - Specified width/height includes the border
 * - Border thickness reduces available content area
 */

import type { LayoutNode } from '../../../layout/nodes';
import type { NodeStyle } from '../../types';
import type { BorderVariant, BorderConfig } from '../../../layout/borderBox';
import { BorderedContainer } from '../layout/BorderedContainer';
import { Text } from '../content/Text';

import { CP437_BOX } from '@escp/core';

/**
 * BoxedText component props
 */
export interface BoxedTextProps {
  /** Text content to display in the box */
  children?: string | number;
  /** Horizontal padding inside the box (in characters, default: 1) */
  padding?: number;
  /** Border style: 'single' (CP437), 'double' (CP437), or 'ascii' */
  borderStyle?: 'single' | 'double' | 'ascii';
  /** Use CP437 line-drawing characters (default: true) */
  useLineDrawing?: boolean;
  /** Additional style overrides */
  style?: NodeStyle;
}

// CP437 single-line border characters for custom chars override
const CP437_SINGLE_CHARS = {
  topLeft: String.fromCharCode(CP437_BOX.SINGLE_TOP_LEFT),
  topRight: String.fromCharCode(CP437_BOX.SINGLE_TOP_RIGHT),
  bottomLeft: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_LEFT),
  bottomRight: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_RIGHT),
  horizontal: String.fromCharCode(CP437_BOX.SINGLE_HORIZONTAL),
  vertical: String.fromCharCode(CP437_BOX.SINGLE_VERTICAL),
};

// CP437 double-line border characters
const CP437_DOUBLE_CHARS = {
  topLeft: String.fromCharCode(CP437_BOX.DOUBLE_TOP_LEFT),
  topRight: String.fromCharCode(CP437_BOX.DOUBLE_TOP_RIGHT),
  bottomLeft: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_LEFT),
  bottomRight: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_RIGHT),
  horizontal: String.fromCharCode(CP437_BOX.DOUBLE_HORIZONTAL),
  vertical: String.fromCharCode(CP437_BOX.DOUBLE_VERTICAL),
};

/**
 * BoxedText Component
 *
 * Renders text surrounded by a border using CP437 box-drawing characters
 * or ASCII fallback characters.
 *
 * @example
 * ```tsx
 * // Simple usage with default single border
 * <BoxedText>Hello World</BoxedText>
 *
 * // Double border with padding
 * <BoxedText borderStyle="double" padding={2}>
 *   Important Notice
 * </BoxedText>
 *
 * // ASCII fallback (works on all code pages)
 * <BoxedText borderStyle="ascii" useLineDrawing={false}>
 *   Works everywhere
 * </BoxedText>
 * ```
 */
export function BoxedText(props: BoxedTextProps): LayoutNode {
  const { children, padding = 1, borderStyle = 'single', useLineDrawing = true, style } = props;

  // Determine border variant and custom chars based on props
  let variant: BorderVariant;
  let customChars: typeof CP437_SINGLE_CHARS | undefined;

  if (!useLineDrawing || borderStyle === 'ascii') {
    variant = 'single'; // ASCII preset
    customChars = undefined;
  } else if (borderStyle === 'double') {
    // CP437 double - use custom chars since BorderedContainer uses UNICODE_BOX
    variant = 'cp437-double';
    customChars = CP437_DOUBLE_CHARS;
  } else {
    // CP437 single - use custom chars since BorderedContainer uses UNICODE_BOX
    variant = 'cp437-single';
    customChars = CP437_SINGLE_CHARS;
  }

  // Build border config - only include chars if defined
  const borderConfig: BorderConfig = {
    variant,
    ...(customChars !== undefined && { chars: customChars }),
  };

  // Convert children to string
  const contentText = children !== undefined ? String(children) : '';

  // Build padding spaces (horizontal character padding)
  const paddingSpaces = ' '.repeat(padding);

  // Extract width/height for border-box handling
  const { width, height, ...restStyle } = style || {};

  // Use BorderedContainer with text content
  // Pass width/height only if defined (for exactOptionalPropertyTypes)
  return BorderedContainer({
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    border: borderConfig,
    style: restStyle,
    children: Text({ children: paddingSpaces + contentText + paddingSpaces }),
  });
}

export default BoxedText;
