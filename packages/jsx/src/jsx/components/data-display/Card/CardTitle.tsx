/**
 * CardTitle component - main heading of the card
 */

import type { CardTitleProps } from '../../../types';
import type { LayoutNode } from '../../../../layout/nodes';
import { Text } from '../../content/Text';

export function CardTitle(props: CardTitleProps): LayoutNode {
  const { level = 3, align, style, children } = props;

  // Level 1-2 use doubleWidth for emphasis
  const useDoubleWidth = level <= 2;

  return Text({
    ...(align && { align }),
    style: {
      bold: true,
      ...(useDoubleWidth && { doubleWidth: true }),
      ...style,
    },
    ...(children !== undefined && { children }),
  });
}
