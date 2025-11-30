/**
 * Card component - root container with border (border-box model)
 *
 * Uses the border-box layout model where:
 * - Specified width/height includes the border
 * - Border thickness reduces available content area
 * - Padding is applied inside the border
 */

import type { CardProps } from '../../../types';
import type { LayoutNode } from '../../../../layout/nodes';
import { resolveBorderVariant, type BorderConfig } from '../../../../layout/borderBox';
import { Stack } from '../../layout/Stack';
import { BorderedContainer } from '../../layout/BorderedContainer';

export function Card(props: CardProps): LayoutNode {
  const {
    border = 'single',
    padding = { top: 5, right: 10, bottom: 5, left: 10 },
    style,
    children,
  } = props;

  // No border - return content directly with full style
  if (border === false) {
    return Stack({
      style: { padding, ...style },
      children,
    });
  }

  // Resolve border variant
  const variant = resolveBorderVariant(border);
  const borderConfig: BorderConfig = { variant };

  // Extract width/height for border-box handling
  const { width, height, ...restStyle } = style || {};

  // Use BorderedContainer for border-box layout
  // Pass width/height only if defined (for exactOptionalPropertyTypes)
  return BorderedContainer({
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    border: borderConfig,
    padding,
    style: restStyle,
    children,
  });
}
