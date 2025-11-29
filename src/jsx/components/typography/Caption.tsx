/**
 * Caption component - small italic text
 */

import type { CaptionProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Text } from '../content/Text';

export function Caption(props: CaptionProps): LayoutNode {
  const { align, style, children } = props;

  return Text({
    ...(align && { align }),
    style: { italic: true, ...style },
    children: children ?? '',
  });
}
