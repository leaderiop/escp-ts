/**
 * CardDescription component - secondary text below title
 */

import type { CardDescriptionProps } from '../../../types';
import type { LayoutNode } from '../../../../layout/nodes';
import { Text } from '../../content/Text';

export function CardDescription(props: CardDescriptionProps): LayoutNode {
  const { align, style, children } = props;

  return Text({
    ...(align && { align }),
    style: {
      italic: true,
      ...style,
    },
    ...(children !== undefined && { children }),
  });
}
