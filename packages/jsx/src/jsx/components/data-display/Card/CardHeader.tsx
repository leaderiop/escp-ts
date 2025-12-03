/**
 * CardHeader component - top section containing title and description
 *
 * Supports the full box model: margin → border → padding → content
 */

import type { CardHeaderProps } from '../../../types';
import type { LayoutNode } from '../../../../layout/nodes';
import { baseLayout } from '../../base/baseLayout';
import { Stack } from '../../layout/Stack';

export function CardHeader(props: CardHeaderProps): LayoutNode {
  const { margin, border, padding, align, gap = 3, style, children } = props;

  // Build the inner content stack
  const content = Stack({
    ...(align && { align }),
    style: { gap },
    children,
  });

  // Apply base layout (margin, border, padding)
  return baseLayout({ margin, border, padding, style }, content);
}
