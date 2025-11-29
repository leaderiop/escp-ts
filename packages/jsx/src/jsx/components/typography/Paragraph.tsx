/**
 * Paragraph component - text block with margins
 */

import type { ParagraphProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';

export function Paragraph(props: ParagraphProps): LayoutNode {
  const { align, indent, typeface, style, children } = props;

  const content =
    indent && typeof children === 'string'
      ? ' '.repeat(Math.ceil(indent / 10)) + children
      : (children ?? '');

  // Merge styles: default margin < style prop < direct typeface prop
  const mergedStyle: NodeStyle = {
    margin: { top: 10, bottom: 10 },
    ...style,
    ...(typeface !== undefined && { typeface }),
  };

  return Stack({
    style: mergedStyle,
    children: Text({
      ...(align && { align }),
      children: content,
    }),
  });
}
