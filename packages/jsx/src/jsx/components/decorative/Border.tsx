/**
 * Border component - ASCII and CP437 box drawing around content
 */

import type { BorderProps, BorderChars } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

import { CP437_BOX } from '@escp/core';

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

// CP437 box-drawing presets (require CP437, CP850, or compatible code page)
const CP437_SINGLE_PRESET: RequiredBorderChars = {
  topLeft: String.fromCharCode(CP437_BOX.SINGLE_TOP_LEFT), // ┌
  topRight: String.fromCharCode(CP437_BOX.SINGLE_TOP_RIGHT), // ┐
  bottomLeft: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_LEFT), // └
  bottomRight: String.fromCharCode(CP437_BOX.SINGLE_BOTTOM_RIGHT), // ┘
  horizontal: String.fromCharCode(CP437_BOX.SINGLE_HORIZONTAL), // ─
  vertical: String.fromCharCode(CP437_BOX.SINGLE_VERTICAL), // │
};

const CP437_DOUBLE_PRESET: RequiredBorderChars = {
  topLeft: String.fromCharCode(CP437_BOX.DOUBLE_TOP_LEFT), // ╔
  topRight: String.fromCharCode(CP437_BOX.DOUBLE_TOP_RIGHT), // ╗
  bottomLeft: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_LEFT), // ╚
  bottomRight: String.fromCharCode(CP437_BOX.DOUBLE_BOTTOM_RIGHT), // ╝
  horizontal: String.fromCharCode(CP437_BOX.DOUBLE_HORIZONTAL), // ═
  vertical: String.fromCharCode(CP437_BOX.DOUBLE_VERTICAL), // ║
};

/**
 * Available border presets
 */
export const BORDER_PRESETS = {
  single: SINGLE_PRESET,
  double: DOUBLE_PRESET,
  rounded: ROUNDED_PRESET,
  'cp437-single': CP437_SINGLE_PRESET,
  'cp437-double': CP437_DOUBLE_PRESET,
} as const;

export function Border(props: BorderProps): LayoutNode {
  const { variant = 'single', chars: customChars, style, children } = props;

  // Select preset based on variant
  let preset: RequiredBorderChars;
  switch (variant) {
    case 'double':
      preset = DOUBLE_PRESET;
      break;
    case 'rounded':
      preset = ROUNDED_PRESET;
      break;
    case 'cp437-single':
      preset = CP437_SINGLE_PRESET;
      break;
    case 'cp437-double':
      preset = CP437_DOUBLE_PRESET;
      break;
    case 'single':
    default:
      preset = SINGLE_PRESET;
      break;
  }

  const chars: RequiredBorderChars = {
    topLeft: customChars?.topLeft || preset.topLeft,
    topRight: customChars?.topRight || preset.topRight,
    bottomLeft: customChars?.bottomLeft || preset.bottomLeft,
    bottomRight: customChars?.bottomRight || preset.bottomRight,
    horizontal: customChars?.horizontal || preset.horizontal,
    vertical: customChars?.vertical || preset.vertical,
  };

  return Stack({
    ...(style && { style }),
    children: [
      Flex({
        children: [
          Text({ children: chars.topLeft }),
          Line({ char: chars.horizontal, length: 'fill' }),
          Text({ children: chars.topRight }),
        ],
      }),
      Flex({
        children: [
          Text({ children: chars.vertical }),
          Stack({ style: { width: 'fill' }, children }),
          Text({ children: chars.vertical }),
        ],
      }),
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
