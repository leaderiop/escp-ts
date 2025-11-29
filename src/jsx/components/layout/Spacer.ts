/**
 * Spacer component - empty space for layout purposes
 */

import { createElement } from '../../createElement';
import type { SpacerProps } from '../../types';
import type { LayoutNode } from '../../../layout/nodes';

type Props = Record<string, unknown>;

export function Spacer(props: SpacerProps = {}): LayoutNode {
  return createElement('Spacer', props as Props) as LayoutNode;
}
