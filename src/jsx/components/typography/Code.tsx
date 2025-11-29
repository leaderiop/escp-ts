/**
 * Code component - code block with optional border
 */

import type { CodeProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

export function Code(props: CodeProps): LayoutNode {
  const {
    inline = false,
    border = true,
    typeface = 'courier',  // Default to Courier for code
    style,
    children
  } = props;
  const content = children ?? '';

  // Merge typeface into style (typeface prop takes precedence)
  const codeStyle: NodeStyle = {
    typeface,
    ...style,
  };

  if (inline) {
    return Text({
      style: codeStyle,
      children: `\`${content}\``,
    });
  }

  if (border) {
    return Stack({
      style: codeStyle,
      children: [
        Line({ char: '-', length: 'fill' }),
        Text({ style: { padding: { left: 10 } }, children: content }),
        Line({ char: '-', length: 'fill' }),
      ],
    });
  }

  return Text({
    style: { padding: { left: 20 }, ...codeStyle },
    children: content,
  });
}
