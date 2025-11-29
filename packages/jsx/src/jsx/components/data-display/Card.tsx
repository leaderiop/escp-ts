/**
 * Card component - grouped content container with optional border
 */

import type { CardProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Text } from '../content/Text';
import { Line } from '../content/Line';

export function Card(props: CardProps): LayoutNode {
  const { title, border = '-', style, children } = props;

  const cardChildren: LayoutNode[] = [Line({ char: border, length: 'fill' })];

  if (title) {
    cardChildren.push(Text({ style: { bold: true }, children: title }));
    cardChildren.push(Line({ char: border, length: 'fill' }));
  }

  cardChildren.push(
    Stack({
      style: { padding: { left: 10, right: 10 } },
      children,
    })
  );

  cardChildren.push(Line({ char: border, length: 'fill' }));

  return Stack({
    style: { width: 'fill', ...style },
    children: cardChildren,
  });
}
