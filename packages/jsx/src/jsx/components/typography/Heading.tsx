/**
 * Heading component - H1-H4 style heading
 */

import type { HeadingProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

const HEADING_STYLES: Record<number, Partial<NodeStyle>> = {
  1: { bold: true, doubleWidth: true, doubleHeight: true },
  2: { bold: true, doubleWidth: true },
  3: { bold: true, underline: true },
  4: { bold: true },
};

const HEADING_UNDERLINES: Record<number, string | undefined> = {
  1: '=',
  2: '-',
  3: undefined,
  4: undefined,
};

export function Heading(props: HeadingProps): LayoutNode {
  const { level = 1, align, underline, typeface, style, children } = props;

  const levelStyle = HEADING_STYLES[level] || {};

  let underlineChar: string | undefined;
  if (underline === true) {
    underlineChar = HEADING_UNDERLINES[level];
  } else if (typeof underline === 'string') {
    underlineChar = underline;
  }

  // Merge styles: level defaults < style prop < direct typeface prop
  const mergedStyle: Partial<NodeStyle> = {
    ...levelStyle,
    ...style,
    ...(typeface !== undefined && { typeface }),
  };

  const textNode = Text({
    ...(align && { align }),
    style: mergedStyle,
    children: children ?? '',
  });

  if (underlineChar) {
    return Stack({
      children: [textNode, Line({ char: underlineChar, length: 'fill' })],
    });
  }

  return textNode;
}
