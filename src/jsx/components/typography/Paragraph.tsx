/**
 * Paragraph component - text block with margins
 */

import type { ParagraphProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';

export function Paragraph(props: ParagraphProps): LayoutNode {
  const { align, indent, style, children } = props;

  const content =
    indent && typeof children === 'string'
      ? ' '.repeat(Math.ceil(indent / 10)) + children
      : children ?? '';

  return Stack({
    style: { margin: { top: 10, bottom: 10 }, ...style },
    children: Text({
      ...(align && { align }),
      children: content,
    }),
  });
}
