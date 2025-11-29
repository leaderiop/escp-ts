/**
 * Code component - code block with optional border
 */

import type { CodeProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

export function Code(props: CodeProps): LayoutNode {
  const { inline = false, border = true, style, children } = props;
  const content = children ?? '';

  if (inline) {
    return Text({
      ...(style && { style }),
      children: `\`${content}\``,
    });
  }

  if (border) {
    return Stack({
      ...(style && { style }),
      children: [
        Line({ char: '-', length: 'fill' }),
        Text({ style: { padding: { left: 10 } }, children: content }),
        Line({ char: '-', length: 'fill' }),
      ],
    });
  }

  return Text({
    style: { padding: { left: 20 }, ...style },
    children: content,
  });
}
