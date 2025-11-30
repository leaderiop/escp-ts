/**
 * baseLayout - Unified layout utility for all components
 *
 * Provides consistent margin, border, padding, and content area handling
 * following the standard CSS box model: margin → border → padding → content
 */

import type { LayoutNode, PaddingSpec, MarginSpec } from '../../../layout/nodes';
import type { NodeStyle } from '../../types';
import { BorderedContainer } from '../layout/BorderedContainer';
import { Stack } from '../layout/Stack';
import { resolveBorderVariant, type BorderConfig } from '../../../layout/borderBox';

/**
 * Options for the baseLayout utility
 */
export interface BaseLayoutOptions {
  /** Margin outside the component (applied via wrapper Stack) */
  margin?: MarginSpec | undefined;
  /** Border around the component */
  border?: boolean | 'single' | 'double' | 'ascii' | false | undefined;
  /** Padding inside the border */
  padding?: PaddingSpec | undefined;
  /** Additional style properties (excluding margin/padding which are handled separately) */
  style?: Omit<NodeStyle, 'margin' | 'padding'> | undefined;
}

/**
 * Wraps content with margin, border, and padding as specified
 *
 * Behavior:
 * - If border is specified: wrap content in BorderedContainer
 * - If only margin/padding: wrap in Stack with those properties
 * - If none specified: return content directly (no wrapper overhead)
 *
 * @param options - Layout options (margin, border, padding, style)
 * @param content - The content to wrap
 * @returns LayoutNode with appropriate wrappers applied
 */
export function baseLayout(
  options: BaseLayoutOptions,
  content: LayoutNode | LayoutNode[]
): LayoutNode {
  const { margin, border, padding, style } = options;
  const children = Array.isArray(content) ? content : [content];

  // No layout properties - return content directly
  if (!margin && !border && !padding && !style) {
    if (children.length === 1 && children[0] !== undefined) {
      return children[0];
    }
    return Stack({ children });
  }

  // Has border - use BorderedContainer
  if (border !== undefined && border !== false) {
    const variant = resolveBorderVariant(border);
    const borderConfig: BorderConfig = { variant };
    const { width, height, ...restStyle } = style || {};

    const bordered = BorderedContainer({
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
      border: borderConfig,
      padding,
      style: restStyle,
      children,
    });

    // Apply margin by wrapping in Stack
    if (margin) {
      return Stack({ style: { margin }, children: [bordered] });
    }
    return bordered;
  }

  // No border - just margin/padding via Stack
  return Stack({
    style: {
      ...(margin && { margin }),
      ...(padding && { padding }),
      ...style,
    },
    children,
  });
}
