/**
 * Box component - container with padding and optional border (border-box model)
 *
 * Uses the border-box layout model where:
 * - Specified width/height includes the border (when enabled)
 * - Border thickness reduces available content area
 * - Padding is applied inside the border
 */

import type { BoxProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import type { BorderVariant, BorderConfig } from '../../../layout/borderBox';
import { Stack } from '../layout/Stack';
import { BorderedContainer } from '../layout/BorderedContainer';

export function Box(props: BoxProps): LayoutNode {
  const { padding = 10, border = false, borderVariant = 'single', style, children } = props;

  // No border - return content directly
  if (!border) {
    return Stack({
      style: { padding, ...style },
      children,
    });
  }

  // Build border config - map to proper BorderVariant
  const variantMap: Record<string, BorderVariant> = {
    single: 'cp437-single',
    double: 'cp437-double',
    rounded: 'rounded',
  };
  const borderConfig: BorderConfig = {
    variant: variantMap[borderVariant] || 'cp437-single',
  };

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
