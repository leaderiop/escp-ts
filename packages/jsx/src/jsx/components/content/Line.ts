/**
 * Line component - horizontal or vertical separator line
 *
 * Supports Unicode box-drawing characters via the `variant` prop:
 * - 'single': Single-line Unicode (─ │)
 * - 'double': Double-line Unicode (═ ║)
 * - 'ascii': ASCII fallback (- |)
 */

import { createElement } from '../../createElement';
import type { LineProps, LineVariant } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { UNICODE_BOX } from '@escp/core';

type Props = Record<string, unknown>;

/**
 * Resolve line character based on direction, variant, and custom char
 * Priority: variant > char > default
 */
function resolveLineChar(
  direction: 'horizontal' | 'vertical',
  variant?: LineVariant,
  customChar?: string
): string {
  if (variant) {
    if (direction === 'horizontal') {
      switch (variant) {
        case 'single':
          return UNICODE_BOX.SINGLE_HORIZONTAL;
        case 'double':
          return UNICODE_BOX.DOUBLE_HORIZONTAL;
        case 'ascii':
          return '-';
      }
    } else {
      switch (variant) {
        case 'single':
          return UNICODE_BOX.SINGLE_VERTICAL;
        case 'double':
          return UNICODE_BOX.DOUBLE_VERTICAL;
        case 'ascii':
          return '|';
      }
    }
  }

  // Use custom char or default ASCII
  return customChar ?? (direction === 'horizontal' ? '-' : '|');
}

export function Line(props: LineProps = {}): LayoutNode {
  const { direction = 'horizontal', variant, char, ...rest } = props;

  // Resolve the line character
  const resolvedChar = resolveLineChar(direction, variant, char);

  return createElement('Line', {
    direction,
    char: resolvedChar,
    ...rest,
  } as Props) as LayoutNode;
}
