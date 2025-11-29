/**
 * Divider component - enhanced separator with variants
 */

import type { DividerProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';
import { Stack } from '../layout/Stack';
import { Line } from '../content/Line';

const DIVIDER_CHARS: Record<string, string> = {
  single: '-',
  double: '=',
  thick: '#',
  dashed: '.',
};

export function Divider(props: DividerProps): LayoutNode {
  const { variant = 'single', spacing = 5, style } = props;
  const char = DIVIDER_CHARS[variant] || '-';

  return Stack({
    style: { margin: { top: spacing, bottom: spacing }, ...style },
    children: Line({ char, length: 'fill' }),
  });
}
