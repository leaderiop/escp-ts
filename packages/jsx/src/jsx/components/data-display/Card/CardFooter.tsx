/**
 * CardFooter component - bottom section for actions or summary
 *
 * Supports the full box model: margin → border → padding → content
 */

import type { CardFooterProps } from '../../../types';
import type { LayoutNode } from '../../../../layout/nodes';
import { baseLayout } from '../../base/baseLayout';
import { Stack } from '../../layout/Stack';
import { Flex } from '../../layout/Flex';

export function CardFooter(props: CardFooterProps): LayoutNode {
  const {
    margin,
    border,
    padding,
    direction = 'row',
    justify = 'end',
    align = 'center',
    gap = 10,
    style,
    children,
  } = props;

  // Build the inner content (Flex for row, Stack for column)
  const content =
    direction === 'row'
      ? Flex({
          style: { justifyContent: justify, alignItems: align, gap },
          children,
        })
      : Stack({ style: { gap }, children });

  // Apply base layout (margin, border, padding)
  return baseLayout({ margin, border, padding, style }, content);
}
