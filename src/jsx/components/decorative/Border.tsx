/**
 * Border component - ASCII box drawing around content
 */

import type { BorderProps, BorderChars } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Flex } from '../layout/Flex';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

type RequiredBorderChars = Required<BorderChars>;

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

export function Border(props: BorderProps): LayoutNode {
  const { variant = 'single', chars: customChars, style, children } = props;

  let preset: RequiredBorderChars;
  if (variant === 'double') {
    preset = DOUBLE_PRESET;
  } else if (variant === 'rounded') {
    preset = ROUNDED_PRESET;
  } else {
    preset = SINGLE_PRESET;
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
