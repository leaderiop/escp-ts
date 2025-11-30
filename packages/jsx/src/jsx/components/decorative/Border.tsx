/**
 * Border component - ASCII and CP437 box drawing around content (border-box model)
 *
 * Uses the border-box layout model where:
 * - Specified width/height includes the border
 * - Border thickness reduces available content area
 */

import type { BorderProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import type { BorderConfig, BorderVariant } from '../../../layout/borderBox';
import { BorderedContainer, BORDER_PRESETS } from '../layout/BorderedContainer';

// Re-export BORDER_PRESETS for backward compatibility
export { BORDER_PRESETS };

export function Border(props: BorderProps): LayoutNode {
  const { variant = 'single', chars: customChars, style, children } = props;

  // Build border config - only include chars if defined
  const borderConfig: BorderConfig = {
    variant: variant as BorderVariant,
    ...(customChars !== undefined && { chars: customChars }),
  };

  // Extract width/height for border-box handling
  const { width, height, ...restStyle } = style || {};

  // Use BorderedContainer for border-box layout
  // Border component doesn't add any padding by default
  // Pass width/height only if defined (for exactOptionalPropertyTypes)
  return BorderedContainer({
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    border: borderConfig,
    style: restStyle,
    children,
  });
}
