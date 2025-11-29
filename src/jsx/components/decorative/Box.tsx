/**
 * Box component - container with padding and optional border
 */

import type { BoxProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Border } from './Border';

export function Box(props: BoxProps): LayoutNode {
  const {
    padding = 10,
    border = false,
    borderVariant = 'single',
    style,
    children,
  } = props;

  const content = Stack({
    style: { padding, ...style },
    children,
  });

  if (border) {
    return Border({ variant: borderVariant, children: content });
  }

  return content;
}
