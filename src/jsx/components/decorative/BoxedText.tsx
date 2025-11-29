/**
 * BoxedText Component
 * Renders text with a border using CP437 box-drawing characters
 * Supports single, double, and ASCII border styles
 */

import type { LayoutNode } from '../../../layout/nodes';
import type { NodeStyle } from '../../types';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

import { CP437_BOX } from '../../../borders/BoxDrawingChars';

/**
 * Border character set for BoxedText
 */
interface BoxedBorderChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

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

// CP437 single-line border characters
const CP437_SINGLE: BoxedBorderChars = {
  topLeft: String.fromCharCode(CP437_BOX.SINGLE_TOP_LEFT),
  topRight: String.fromCharCode(CP437_BOX.SINGLE_TOP_RIGHT),
  bottomLeft: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_LEFT),
  bottomRight: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_RIGHT),
  horizontal: String.fromCharCode(CP437_BOX.SINGLE_HORIZONTAL),
  vertical: String.fromCharCode(CP437_BOX.SINGLE_VERTICAL),
};

// CP437 double-line border characters
const CP437_DOUBLE: BoxedBorderChars = {
  topLeft: String.fromCharCode(CP437_BOX.DOUBLE_TOP_LEFT),
  topRight: String.fromCharCode(CP437_BOX.DOUBLE_TOP_RIGHT),
  bottomLeft: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_LEFT),
  bottomRight: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_RIGHT),
  horizontal: String.fromCharCode(CP437_BOX.DOUBLE_HORIZONTAL),
  vertical: String.fromCharCode(CP437_BOX.DOUBLE_VERTICAL),
};

// ASCII fallback border characters
const ASCII_CHARS: BoxedBorderChars = {
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
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
  const {
    children,
    padding = 1,
    borderStyle = 'single',
    useLineDrawing = true,
    style,
  } = props;

  // Select border characters based on style and useLineDrawing flag
  let chars: BoxedBorderChars;
  if (!useLineDrawing || borderStyle === 'ascii') {
    chars = ASCII_CHARS;
  } else if (borderStyle === 'double') {
    chars = CP437_DOUBLE;
  } else {
    chars = CP437_SINGLE;
  }

  // Convert children to string
  const contentText = children !== undefined ? String(children) : '';

  // Build padding spaces
  const paddingSpaces = ' '.repeat(padding);

  return Stack({
    ...(style && { style }),
    children: [
      // Top border line: corner + horizontal line + corner
      Flex({
        children: [
          Text({ children: chars.topLeft }),
          Line({ char: chars.horizontal, length: 'fill' }),
          Text({ children: chars.topRight }),
        ],
      }),
      // Content row: vertical border + content (with padding) + vertical border
      // Use a single Stack with fill width to match border row structure
      Flex({
        children: [
          Text({ children: chars.vertical }),
          Stack({
            style: { width: 'fill' },
            children: [
              Text({ children: paddingSpaces + contentText + paddingSpaces }),
            ],
          }),
          Text({ children: chars.vertical }),
        ],
      }),
      // Bottom border line: corner + horizontal line + corner
      Flex({
        children: [
          Text({ children: chars.bottomLeft }),
          Line({ char: chars.horizontal, length: 'fill' }),
          Text({ children: chars.bottomRight }),
        ],
      }),
    ],
  });
}

export default BoxedText;
