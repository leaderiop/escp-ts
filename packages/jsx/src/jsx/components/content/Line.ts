/**
 * Line component - horizontal or vertical separator line
 */

import { createElement } from '../../createElement';
import type { LineProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Line(props: LineProps = {}): LayoutNode {
  return createElement('Line', props as Props) as LayoutNode;
}
