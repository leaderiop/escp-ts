/**
 * CardContent component - main body content area
 *
 * Supports the full box model: margin → border → padding → content
 */

import type { CardContentProps } from '../../../types';
import type { LayoutNode } from '../../../../layout/nodes';
import { baseLayout } from '../../base/baseLayout';
import { Stack } from '../../layout/Stack';

export function CardContent(props: CardContentProps): LayoutNode {
  const { margin, border, padding, gap = 5, style, children } = props;

  // Build the inner content stack
  const content = Stack({
    style: { gap },
    children,
  });

  // Apply base layout (margin, border, padding)
  return baseLayout({ margin, border, padding, style }, content);
}
