/**
 * Caption component - small italic text
 */

import type { CaptionProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Text } from '../content/Text';

export function Caption(props: CaptionProps): LayoutNode {
  const { align, typeface, style, children } = props;

  // Merge styles: default italic < style prop < direct typeface prop
  const mergedStyle: NodeStyle = {
    italic: true,
    ...style,
    ...(typeface !== undefined && { typeface }),
  };

  return Text({
    ...(align && { align }),
    style: mergedStyle,
    children: children ?? '',
  });
}
