/**
 * Badge component - inline status indicator
 */

import type { BadgeProps, NodeStyle } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Text } from '../content/Text';

const BADGE_STYLES: Record<string, Partial<NodeStyle>> = {
  default: {},
  success: { bold: true },
  warning: { italic: true },
  error: { bold: true, doubleWidth: true },
};

export function Badge(props: BadgeProps): LayoutNode {
  const { variant = 'default', style, children } = props;
  const variantStyle = BADGE_STYLES[variant] || {};

  return Text({
    ...(style && { style: { ...variantStyle, ...style } }),
    ...(!style && Object.keys(variantStyle).length > 0 && { style: variantStyle }),
    children: `[${children}]`,
  });
}
